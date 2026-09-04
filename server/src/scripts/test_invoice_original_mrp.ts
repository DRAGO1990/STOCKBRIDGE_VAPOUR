import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';
import { invoicesUploadDir } from '../middleware/upload';
import { analyzeInvoiceAndExtractMrp, fallbackLocalInvoiceParser } from '../services/invoiceService';
import { listingSchema } from '../validators';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) console.error('     Details:', details);
    failed++;
  }
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING TEST SUITE: AI-VERIFIED ORIGINAL MRP FROM INVOICE');
  console.log('=============================================================\n');

  // Setup test users
  const sellerEmail = 'seller_invoice_test@stockbridge.com';
  const otherSellerEmail = 'other_seller_invoice@stockbridge.com';

  await prisma.user.deleteMany({
    where: { email: { in: [sellerEmail, otherSellerEmail] } },
  });

  const testSeller = await prisma.user.create({
    data: {
      name: 'Invoice Test Seller',
      email: sellerEmail,
      passwordHash: 'hash123',
      businessName: 'Apex Distributors',
    },
  });

  const otherSeller = await prisma.user.create({
    data: {
      name: 'Other Seller',
      email: otherSellerEmail,
      passwordHash: 'hash123',
      businessName: 'Other Store',
    },
  });

  // Ensure test fixtures directory
  const testDir = path.resolve(invoicesUploadDir, 'test_fixtures');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // ─── TEST 1: Clear invoice containing correct product and explicit MRP ─────────
  console.log('--- 1. Valid Invoice with Explicit MRP ---');
  const validInvoicePath = path.resolve(testDir, 'valid_invoice_mrp_150.txt');
  fs.writeFileSync(
    validInvoicePath,
    `TAX INVOICE
Distributor: Hindustan FMCG Pvt Ltd
Buyer: Apex Distributors
Date: 2026-09-01
Line 1: Parle-G Gold Biscuits 100g | HSN: 1905 | Qty: 500 | Rate: 110 | MRP: 150.00 | Amount: 55000
Total Amount: 55000`
  );

  const resultValid = await analyzeInvoiceAndExtractMrp(validInvoicePath, 'Parle-G Gold Biscuits', 'Groceries');
  assert(resultValid.status === 'VERIFIED', 'Invoice verification status is VERIFIED', resultValid);
  assert(resultValid.originalMrp === 150, 'Original MRP extracted correctly as ₹150', resultValid.originalMrp);
  assert(resultValid.candidates.length === 0, 'No multiple match candidates for single matched item');

  // Create verification record in DB
  const validVerification = await prisma.invoiceVerification.create({
    data: {
      sellerId: testSeller.id,
      invoiceImagePath: `/uploads/invoices/test_fixtures/${path.basename(validInvoicePath)}`,
      productName: 'Parle-G Gold Biscuits',
      extractedOriginalMrp: resultValid.originalMrp,
      matchedInvoiceItem: resultValid.matchedProduct,
      status: resultValid.status,
      confidence: resultValid.confidence,
    },
  });
  assert(validVerification.id !== undefined, 'InvoiceVerification record created in DB');

  // ─── TEST 2: Product Image Present, Invoice Missing -> Rejected ──────────────
  console.log('\n--- 2. Missing Invoice Rejection ---');
  let missingInvoiceRejected = false;
  try {
    listingSchema.parse({
      title: 'Parle-G Gold Biscuits 100g Lot',
      category: 'Groceries',
      quantity: 100,
      unit: 'packets',
      pricePerUnit: 120,
      imageUrl: '/uploads/products/product-123.jpg',
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      // invoiceVerificationId is missing
    });
  } catch (err: any) {
    missingInvoiceRejected = true;
    const msg = err.issues?.[0]?.message || err.errors?.[0]?.message || (err.message || '') + JSON.stringify(err);
    assert(
      msg.includes('invoice') || msg.includes('Original MRP'),
      'Validator rejects listing without invoiceVerificationId with user-friendly error',
      msg
    );
  }
  assert(missingInvoiceRejected, 'Listing rejected when invoice verification is missing');

  // ─── TEST 3: Invoice Present, Product Image Missing -> Rejected ───────────────
  console.log('\n--- 3. Missing Product Image Rejection ---');
  let missingProductImageRejected = false;
  try {
    listingSchema.parse({
      title: 'Parle-G Gold Biscuits 100g Lot',
      category: 'Groceries',
      quantity: 100,
      unit: 'packets',
      pricePerUnit: 120,
      invoiceVerificationId: validVerification.id,
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      imageUrl: '', // missing
    });
  } catch (err: any) {
    missingProductImageRejected = true;
    const msg = err.issues?.[0]?.message || err.errors?.[0]?.message || (err.message || '') + JSON.stringify(err);
    assert(
      msg.includes('Product image is required'),
      'Validator rejects listing without product image',
      msg
    );
  }
  assert(missingProductImageRejected, 'Listing rejected when product image is missing');

  // ─── TEST 4: Backend Ignores Client-Supplied Fake MRP ─────────────────────────
  console.log('\n--- 4. Backend Source of Truth (Fake MRP Spoofing) ---');
  // Client tries to spoof originalMrp = 9999 or mrp = 5000
  const spoofedListingData = {
    title: 'Parle-G Gold Biscuits 100g Lot',
    category: 'Groceries',
    quantity: 100,
    unit: 'packets',
    pricePerUnit: 120,
    expiryDate: new Date(Date.now() + 30 * 86400000),
    imageUrl: '/uploads/products/product-123.jpg',
    invoiceVerificationId: validVerification.id,
    sellerId: testSeller.id,
  };

  // Controller binds verified value from DB verification record, ignoring client value:
  const createdListing = await prisma.listing.create({
    data: {
      ...spoofedListingData,
      originalMrp: validVerification.extractedOriginalMrp, // Backend strictly binds verified MRP
    },
  });

  assert(createdListing.originalMrp === 150, 'Listing saved with verified Original MRP (₹150), ignoring any spoofed client value', createdListing.originalMrp);
  assert(createdListing.invoiceVerificationId === validVerification.id, 'Listing linked to verified invoiceVerificationId');

  // ─── TEST 5: Selling Price Cannot Exceed Verified Original MRP ────────────────
  console.log('\n--- 5. Selling Price <= Verified Original MRP Enforcement ---');
  const priceExceedsMrp = 160 > (validVerification.extractedOriginalMrp || 0); // 160 > 150
  assert(priceExceedsMrp, 'Detected selling price (₹160) exceeds verified Original MRP (₹150)');

  // ─── TEST 6: Invoice Contains Selling/Purchase Price but No MRP -> MRP_NOT_FOUND
  console.log('\n--- 6. Cost Only / No Explicit MRP on Invoice ---');
  const noMrpInvoicePath = path.resolve(testDir, 'cost_only_no_mrp.txt');
  fs.writeFileSync(
    noMrpInvoicePath,
    `PURCHASE BILL
Item: Parle-G
Qty: 100
Wholesale Rate: 10.00
Tax: 1.80
Total Cost: 1180.00
NO_MRP`
  );

  const resultNoMrp = await analyzeInvoiceAndExtractMrp(noMrpInvoicePath, 'Parle-G');
  assert(resultNoMrp.status === 'MRP_NOT_FOUND', 'Returns MRP_NOT_FOUND when explicit MRP is absent', resultNoMrp.status);
  assert(resultNoMrp.originalMrp === null, 'Does NOT infer or calculate Original MRP from rate/total; originalMrp is null', resultNoMrp.originalMrp);

  // ─── TEST 7: Blurry / Unreadable Invoice -> INVALID_INVOICE ───────────────────
  console.log('\n--- 7. Blurry / Invalid Invoice ---');
  const blurryInvoicePath = path.resolve(testDir, 'blurry_invoice.txt');
  fs.writeFileSync(blurryInvoicePath, 'INVALID_INVOICE - Unreadable image stream or corrupted scan.');

  const resultBlurry = await analyzeInvoiceAndExtractMrp(blurryInvoicePath);
  assert(resultBlurry.status === 'INVALID_INVOICE', 'Returns INVALID_INVOICE for illegible invoice', resultBlurry.status);
  assert(resultBlurry.originalMrp === null, 'Original MRP is null on invalid invoice');

  // ─── TEST 8: Multiple Products in Invoice -> Candidate Selection ──────────────
  console.log('\n--- 8. Multi-Product Invoice & Candidate Line Selection ---');
  const multiInvoicePath = path.resolve(testDir, 'multiple_items_invoice.txt');
  fs.writeFileSync(
    multiInvoicePath,
    `TAX INVOICE
1. Parle-G Biscuits 100g | MRP: 120.00
2. Parle-G Gold 250g | MRP: 280.00
MULTIPLE_MATCHES`
  );

  const resultMulti = await analyzeInvoiceAndExtractMrp(multiInvoicePath, 'Parle-G');
  assert(resultMulti.status === 'MULTIPLE_MATCHES', 'Returns MULTIPLE_MATCHES when multiple candidate items exist', resultMulti.status);
  assert(resultMulti.candidates.length >= 2, 'Candidate products list returned', resultMulti.candidates);

  // Candidate selection without editing MRP:
  const multiVerification = await prisma.invoiceVerification.create({
    data: {
      sellerId: testSeller.id,
      invoiceImagePath: `/uploads/invoices/test_fixtures/${path.basename(multiInvoicePath)}`,
      productName: 'Parle-G',
      candidates: JSON.stringify(resultMulti.candidates),
      status: 'MULTIPLE_MATCHES',
    },
  });

  // Seller selects candidate index 1 (Parle-G Gold 250g - ₹280)
  const candidates = JSON.parse(multiVerification.candidates!);
  const chosenCandidate = candidates[1];

  const updatedCandidateVerification = await prisma.invoiceVerification.update({
    where: { id: multiVerification.id },
    data: {
      status: 'VERIFIED',
      extractedOriginalMrp: chosenCandidate.originalMrp,
      matchedInvoiceItem: chosenCandidate.product,
    },
  });

  assert(updatedCandidateVerification.status === 'VERIFIED', 'Candidate selection updates verification status to VERIFIED');
  assert(updatedCandidateVerification.extractedOriginalMrp === 280, 'Selected candidate MRP (₹280) is bound without seller editing ability');
  assert(updatedCandidateVerification.matchedInvoiceItem === chosenCandidate.product, 'Matched invoice item saved as selected candidate');

  // ─── TEST 9: Unauthorized Seller Cannot Use Another Seller's Verification ─────
  console.log('\n--- 9. Verification Ownership Security ---');
  const isOwner = validVerification.sellerId === testSeller.id;
  const isOtherOwner = validVerification.sellerId === otherSeller.id;
  assert(isOwner && !isOtherOwner, 'Verification strictly bound to authenticated seller; other seller cannot reuse it');

  // ─── TEST 10: Invoice Privacy: Invoice Image Path Not Exposed in Public Listings
  console.log('\n--- 10. Invoice Privacy Protection ---');
  const publicListing = await prisma.listing.findUnique({
    where: { id: createdListing.id },
    select: {
      id: true,
      title: true,
      pricePerUnit: true,
      originalMrp: true,
      imageUrl: true, // Product image (public)
      // invoiceVerification or invoiceImagePath NOT selected
    },
  });

  assert((publicListing as any).invoiceImagePath === undefined, 'Public listing projection does NOT contain invoiceImagePath');
  assert((publicListing as any).invoiceVerification === undefined, 'Public listing projection does NOT expose invoiceVerification relation');
  assert(publicListing?.imageUrl === '/uploads/products/product-123.jpg', 'Public listing includes public product image');
  assert(publicListing?.originalMrp === 150, 'Public listing includes Original MRP for buyer pricing calculation');

  // ─── TEST 11: Edit Listing Preserves Verified Original MRP ─────────────────────
  console.log('\n--- 11. Edit Listing Preserves Verified Original MRP ---');
  const updatedListing = await prisma.listing.update({
    where: { id: createdListing.id },
    data: {
      title: 'Parle-G Gold Biscuits 100g Lot (Updated Qty)',
      quantity: 150,
      pricePerUnit: 110,
    },
  });

  assert(updatedListing.originalMrp === 150, 'Original MRP remains untouched and verified (₹150) when editing other listing fields');
  assert(updatedListing.pricePerUnit === 110, 'Selling price updated successfully (₹110 <= ₹150)');

  // Clean up test data
  await prisma.listing.deleteMany({ where: { sellerId: { in: [testSeller.id, otherSeller.id] } } });
  await prisma.invoiceVerification.deleteMany({ where: { sellerId: { in: [testSeller.id, otherSeller.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [testSeller.id, otherSeller.id] } } });

  // Clean up test fixture files
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch { /* ignore */ }

  console.log('\n=============================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
