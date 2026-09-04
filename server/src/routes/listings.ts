import fs from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { config } from '../config';
import { authMiddleware } from '../middleware/auth';
import { uploadListingImage, deleteLocalProductImage } from '../middleware/upload';
import { listingSchema, listingUpdateSchema, matchQuerySchema } from '../validators';
import { matchListings } from '../services/matchingEngine';
import { getDaysUntilExpiry, calculateUrgency } from '../utils/urgency';

const router = Router();

const formatListingResponse = (l: any) => {
  return {
    ...l,
    originalMrp: l.originalMrp ?? null,
    mrp: l.originalMrp ?? null,
  };
};

// Get all active listings (public browsing)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: any = { status: 'active', active: true };
    if (category) where.category = category as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { category: { contains: search as string } },
      ];
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true, businessName: true, rating: true, lat: true, lng: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.listing.count({ where }),
    ]);
    res.json({
      listings: listings.map(formatListingResponse),
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (err) {
    console.error('Listings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get listing by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, businessName: true, rating: true, lat: true, lng: true, address: true } },
      },
    });
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }
    res.json(formatListingResponse(listing));
  } catch (err) {
    console.error('Listing detail error:', err);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// Get my listings
router.get('/my/all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { sellerId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { reservations: true } },
      },
    });
    res.json(listings.map(formatListingResponse));
  } catch (err) {
    console.error('My listings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Create listing
router.post('/', authMiddleware, uploadListingImage, async (req: Request, res: Response) => {
  const uploadedImagePath = req.file ? `/uploads/products/${req.file.filename}` : null;
  try {
    const imageUrl = uploadedImagePath || req.body.imageUrl || null;

    if (!imageUrl) {
      if (uploadedImagePath) deleteLocalProductImage(uploadedImagePath);
      res.status(400).json({ error: 'Product image is required.' });
      return;
    }

    if (!req.body.invoiceVerificationId) {
      if (uploadedImagePath) deleteLocalProductImage(uploadedImagePath);
      res.status(400).json({ error: 'Please upload the product invoice to verify the Original MRP.' });
      return;
    }

    const payload = { ...req.body, imageUrl };
    const data = listingSchema.parse(payload);

    // Verify Invoice Verification Record (Immutable source of truth for Original MRP)
    const verification = await prisma.invoiceVerification.findUnique({
      where: { id: data.invoiceVerificationId },
    });

    if (!verification || verification.sellerId !== req.user!.userId) {
      if (uploadedImagePath) deleteLocalProductImage(uploadedImagePath);
      res.status(400).json({ error: 'Invoice verification record not found or unauthorized.' });
      return;
    }

    if (
      verification.status !== 'VERIFIED' ||
      !verification.extractedOriginalMrp ||
      verification.extractedOriginalMrp <= 0
    ) {
      if (uploadedImagePath) deleteLocalProductImage(uploadedImagePath);
      res.status(400).json({
        error: 'Please upload a valid product invoice to verify the Original MRP before listing.',
      });
      return;
    }

    const verifiedOriginalMrp = verification.extractedOriginalMrp;

    // Strict Backend Price Validation against verified Original MRP
    if (data.pricePerUnit > verifiedOriginalMrp) {
      if (uploadedImagePath) deleteLocalProductImage(uploadedImagePath);
      res.status(400).json({
        error: `Selling price (₹${data.pricePerUnit}) cannot exceed the verified Original MRP (₹${verifiedOriginalMrp}).`,
      });
      return;
    }

    // Backend is single source of truth for urgency:
    const calculatedUrgency = calculateUrgency(data.expiryDate);

    // Exclude any client-supplied mrp/originalMrp from data, bind verified value
    const { mrp: _mrp, originalMrp: _origMrp, ...safeData } = data;

    const listing = await prisma.listing.create({
      data: {
        ...safeData,
        originalMrp: verifiedOriginalMrp,
        urgency: calculatedUrgency,
        imageUrl,
        invoiceVerificationId: verification.id,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        sellerId: req.user!.userId,
      },
    });

    res.status(201).json({
      ...listing,
      originalMrp: listing.originalMrp,
      mrp: listing.originalMrp,
    });
  } catch (err: any) {
    if (uploadedImagePath) {
      deleteLocalProductImage(uploadedImagePath);
    }
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// Update listing
router.put('/:id', authMiddleware, uploadListingImage, async (req: Request, res: Response) => {
  const uploadedImagePath = req.file ? `/uploads/products/${req.file.filename}` : null;
  try {
    const id = req.params.id as string;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing || listing.sellerId !== req.user!.userId) {
      if (uploadedImagePath) {
        deleteLocalProductImage(uploadedImagePath);
      }
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const imageUrl = uploadedImagePath || req.body.imageUrl;

    const payload = { ...req.body, ...(imageUrl !== undefined && { imageUrl }) };
    const data = listingUpdateSchema.parse(payload);

    let verifiedOriginalMrp = listing.originalMrp;
    let targetVerificationId = listing.invoiceVerificationId;

    if (data.invoiceVerificationId && data.invoiceVerificationId !== listing.invoiceVerificationId) {
      const verification = await prisma.invoiceVerification.findUnique({
        where: { id: data.invoiceVerificationId },
      });
      if (
        !verification ||
        verification.sellerId !== req.user!.userId ||
        verification.status !== 'VERIFIED' ||
        !verification.extractedOriginalMrp
      ) {
        if (uploadedImagePath) deleteLocalProductImage(uploadedImagePath);
        res.status(400).json({ error: 'Invalid invoice verification provided.' });
        return;
      }
      verifiedOriginalMrp = verification.extractedOriginalMrp;
      targetVerificationId = verification.id;
    }

    const effectivePrice = data.pricePerUnit !== undefined ? data.pricePerUnit : listing.pricePerUnit;
    if (verifiedOriginalMrp && effectivePrice > verifiedOriginalMrp) {
      if (uploadedImagePath) deleteLocalProductImage(uploadedImagePath);
      res.status(400).json({
        error: `Selling price (₹${effectivePrice}) cannot exceed the verified Original MRP (₹${verifiedOriginalMrp}).`,
      });
      return;
    }

    const updatedExpiry = data.expiryDate !== undefined ? (data.expiryDate ? new Date(data.expiryDate) : null) : listing.expiryDate;
    const updatedUrgency = calculateUrgency(updatedExpiry);
    const updatedImage = imageUrl !== undefined ? imageUrl : listing.imageUrl;

    const wantsActivation = req.body.active === true || req.body.status === 'active';
    const daysRemaining = getDaysUntilExpiry(updatedExpiry);

    if (wantsActivation) {
      if (daysRemaining === null || daysRemaining < 11) {
        if (uploadedImagePath) {
          deleteLocalProductImage(uploadedImagePath);
        }
        res.status(400).json({ error: 'This product cannot be relisted because less than 11 days remain until expiry.' });
        return;
      }
    }

    let targetStatus = listing.status;
    let targetActive = listing.active;

    if (wantsActivation) {
      targetStatus = 'active';
      targetActive = true;
    } else if (listing.status === 'expiry_unlisted' || !listing.active) {
      if (data.expiryDate && daysRemaining !== null && daysRemaining >= 11) {
        targetStatus = 'active';
        targetActive = true;
      } else {
        targetStatus = listing.status;
        targetActive = false;
      }
    }

    const { mrp: _mrp, originalMrp: _origMrp, ...safeData } = data;

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...safeData,
        originalMrp: verifiedOriginalMrp,
        invoiceVerificationId: targetVerificationId,
        urgency: updatedUrgency,
        status: targetStatus,
        active: targetActive,
        imageUrl: updatedImage,
        ...(data.expiryDate !== undefined && { expiryDate: updatedExpiry }),
      },
    });
    res.json({
      ...updated,
      originalMrp: updated.originalMrp,
      mrp: updated.originalMrp,
    });
  } catch (err: any) {
    if (uploadedImagePath) {
      deleteLocalProductImage(uploadedImagePath);
    }
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('Update listing error:', err);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// Dedicated product image upload endpoint
router.post('/upload-image', authMiddleware, uploadListingImage, (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file provided' });
    return;
  }
  const imageUrl = `/uploads/products/${req.file.filename}`;
  res.json({ imageUrl });
});

// Delete/deactivate listing
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing || (listing.sellerId !== req.user!.userId && !req.user!.isAdmin)) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    await prisma.listing.update({
      where: { id },
      data: { active: false, status: 'expired' },
    });
    res.json({ message: 'Listing deactivated' });
  } catch (err) {
    console.error('Delete listing error:', err);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// Match listings
router.post('/match', async (req: Request, res: Response) => {
  try {
    const data = matchQuerySchema.parse(req.body);
    const results = await matchListings(data);
    res.json(results);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('Match error:', err);
    res.status(500).json({ error: 'Matching failed' });
  }
});

// Get categories
router.get('/meta/categories', async (_req: Request, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: 'active', active: true },
      select: { category: true },
      distinct: ['category'],
    });
    res.json(listings.map(l => l.category));
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

export default router;
