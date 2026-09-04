import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { uploadInvoiceImage, deleteLocalInvoiceImage, invoicesUploadDir } from '../middleware/upload';
import { analyzeInvoiceAndExtractMrp, InvoiceCandidate } from '../services/invoiceService';

const router = Router();

/**
 * POST /api/invoices/verify
 * Uploads an invoice image and extracts the Original MRP using AI.
 * Returns a verification token/record that must be referenced when creating the listing.
 */
router.post('/verify', authMiddleware, uploadInvoiceImage, async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Please upload the product invoice to verify the Original MRP.' });
    return;
  }

  const invoiceFilePath = path.resolve(invoicesUploadDir, req.file.filename);
  const relativeInvoicePath = `/uploads/invoices/${req.file.filename}`;

  try {
    const productName = req.body.productName ? String(req.body.productName).trim() : undefined;
    const category = req.body.category ? String(req.body.category).trim() : undefined;

    // Run AI invoice extraction
    const analysis = await analyzeInvoiceAndExtractMrp(invoiceFilePath, productName, category);

    // Save verification record to database (immutable source of truth)
    const verification = await prisma.invoiceVerification.create({
      data: {
        sellerId: req.user!.userId,
        invoiceImagePath: relativeInvoicePath,
        productName: productName || null,
        extractedOriginalMrp: analysis.originalMrp,
        matchedInvoiceItem: analysis.matchedProduct,
        candidates: analysis.candidates.length > 0 ? JSON.stringify(analysis.candidates) : null,
        confidence: analysis.confidence,
        status: analysis.status,
        rawAiResponse: analysis.rawAiResponse || null,
      },
    });

    let userMessage = '';
    switch (analysis.status) {
      case 'VERIFIED':
        userMessage = `Original MRP verified: ₹${analysis.originalMrp}`;
        break;
      case 'MULTIPLE_MATCHES':
        userMessage = 'We found multiple possible invoice items. Select the product you are listing.';
        break;
      case 'MRP_NOT_FOUND':
        userMessage = 'Original MRP could not be verified from this invoice. Please upload a clearer invoice containing this product.';
        break;
      case 'INVALID_INVOICE':
      default:
        userMessage = 'Original MRP could not be verified from this invoice. Please upload a clearer invoice containing this product.';
        break;
    }

    res.status(200).json({
      verificationId: verification.id,
      status: verification.status,
      originalMrp: verification.extractedOriginalMrp,
      matchedProduct: verification.matchedInvoiceItem,
      candidates: analysis.candidates,
      confidence: verification.confidence,
      reason: analysis.reason,
      message: userMessage,
    });
  } catch (err: any) {
    deleteLocalInvoiceImage(relativeInvoicePath);
    console.error('[Invoices] Invoice verification error:', err);
    res.status(500).json({ error: 'Failed to process invoice verification' });
  }
});

/**
 * POST /api/invoices/select-candidate
 * When multiple products exist in the invoice, seller selects the matching product line.
 * Seller CANNOT modify the extracted MRP value.
 */
router.post('/select-candidate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { verificationId, candidateIndex, selectedProduct } = req.body;
    if (!verificationId) {
      res.status(400).json({ error: 'Verification ID is required' });
      return;
    }

    const verification = await prisma.invoiceVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification || verification.sellerId !== req.user!.userId) {
      res.status(403).json({ error: 'Invoice verification not found or unauthorized' });
      return;
    }

    if (!verification.candidates) {
      res.status(400).json({ error: 'No candidates available for this verification' });
      return;
    }

    const candidates: InvoiceCandidate[] = JSON.parse(verification.candidates);
    let chosen: InvoiceCandidate | undefined;

    if (typeof candidateIndex === 'number' && candidateIndex >= 0 && candidateIndex < candidates.length) {
      chosen = candidates[candidateIndex];
    } else if (selectedProduct) {
      chosen = candidates.find((c) => c.product.toLowerCase() === String(selectedProduct).toLowerCase());
    }

    if (!chosen || chosen.originalMrp <= 0) {
      res.status(400).json({ error: 'Invalid candidate selection' });
      return;
    }

    // Update verification record to VERIFIED with chosen item and its non-editable MRP
    const updated = await prisma.invoiceVerification.update({
      where: { id: verificationId },
      data: {
        status: 'VERIFIED',
        extractedOriginalMrp: chosen.originalMrp,
        matchedInvoiceItem: chosen.product,
      },
    });

    res.json({
      verificationId: updated.id,
      status: updated.status,
      originalMrp: updated.extractedOriginalMrp,
      matchedProduct: updated.matchedInvoiceItem,
      message: `Original MRP verified: ₹${updated.extractedOriginalMrp}`,
    });
  } catch (err: any) {
    console.error('[Invoices] Candidate selection error:', err);
    res.status(500).json({ error: 'Failed to select candidate from invoice' });
  }
});

/**
 * GET /api/invoices/:id
 * Retrieves the verification status (authenticated to seller or admin only).
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const verification = await prisma.invoiceVerification.findUnique({
      where: { id },
    });

    if (!verification) {
      res.status(404).json({ error: 'Verification not found' });
      return;
    }

    if (verification.sellerId !== req.user!.userId && !req.user!.isAdmin) {
      res.status(403).json({ error: 'Not authorized to view this invoice verification' });
      return;
    }

    const candidates = verification.candidates ? JSON.parse(verification.candidates) : [];

    res.json({
      verificationId: verification.id,
      status: verification.status,
      originalMrp: verification.extractedOriginalMrp,
      matchedProduct: verification.matchedInvoiceItem,
      candidates,
      confidence: verification.confidence,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch invoice verification' });
  }
});

export default router;
