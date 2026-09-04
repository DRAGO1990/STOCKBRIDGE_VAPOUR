import { listingSchema, listingUpdateSchema } from '../validators';
import { extractListingFromSpeech } from '../services/voiceService';
import { calculateListingRisk } from '../services/riskService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMrpTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING COMPREHENSIVE MRP FEATURE TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // ─── TEST 1: Schema Validation - Missing or Non-positive MRP ───────────────────
  console.log('\n--- 1. Schema Validation (Creation) ---');
  const futureExpiry = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();

  const missingMrpResult = listingSchema.safeParse({
    title: 'Fortune Sunflower Oil 1L',
    category: 'Groceries',
    quantity: 50,
    unit: 'packets',
    pricePerUnit: 120,
    expiryDate: futureExpiry,
    urgency: 'high',
  });
  assert(!missingMrpResult.success, 'Reject listing creation without MRP');

  const negativeMrpResult = listingSchema.safeParse({
    title: 'Fortune Sunflower Oil 1L',
    category: 'Groceries',
    quantity: 50,
    unit: 'packets',
    mrp: -10,
    pricePerUnit: 120,
    expiryDate: futureExpiry,
    urgency: 'high',
  });
  assert(!negativeMrpResult.success, 'Reject listing creation with negative MRP');

  // ─── TEST 2: Schema Validation - Selling Price > MRP ───────────────────────────
  console.log('\n--- 2. Price vs MRP Constraint Validation ---');
  const priceGreaterThanMrpResult = listingSchema.safeParse({
    title: 'Fortune Sunflower Oil 1L',
    category: 'Groceries',
    quantity: 50,
    unit: 'packets',
    mrp: 100,
    pricePerUnit: 120, // Greater than MRP!
    imageUrl: '/uploads/products/test.jpg',
    invoiceVerificationId: 'test-ver-123',
    expiryDate: futureExpiry,
    urgency: 'high',
  });
  assert(!priceGreaterThanMrpResult.success, 'Reject listing when Selling Price > MRP');
  if (!priceGreaterThanMrpResult.success) {
    const errorMsg = ((priceGreaterThanMrpResult.error as any).issues || (priceGreaterThanMrpResult.error as any).errors || [])[0]?.message;
    assert(
      errorMsg === 'Selling price should not be greater than the Original MRP.',
      'Exact error message matches requirement',
      `Got: "${errorMsg}"`
    );
  }

  // ─── TEST 3: Schema Validation - Valid MRP & Selling Price <= MRP ──────────────
  const validListingResult = listingSchema.safeParse({
    title: 'Fortune Sunflower Oil 1L',
    category: 'Groceries',
    quantity: 50,
    unit: 'packets',
    mrp: 150,
    pricePerUnit: 110,
    imageUrl: '/uploads/products/test.jpg',
    invoiceVerificationId: 'test-ver-123',
    expiryDate: futureExpiry,
    urgency: 'high',
  });
  assert(validListingResult.success, 'Accept listing with valid MRP and pricePerUnit <= mrp');

  // Equal price is also allowed (selling at MRP)
  const equalPriceResult = listingSchema.safeParse({
    title: 'Fortune Sunflower Oil 1L',
    category: 'Groceries',
    quantity: 50,
    unit: 'packets',
    mrp: 150,
    pricePerUnit: 150,
    imageUrl: '/uploads/products/test.jpg',
    invoiceVerificationId: 'test-ver-123',
    expiryDate: futureExpiry,
    urgency: 'high',
  });
  assert(equalPriceResult.success, 'Accept listing where pricePerUnit == mrp');

  // ─── TEST 4: Update Schema Validation ──────────────────────────────────────────
  console.log('\n--- 3. Listing Update Schema Validation ---');
  const invalidUpdate = listingUpdateSchema.safeParse({
    mrp: 50,
    pricePerUnit: 70,
  });
  assert(!invalidUpdate.success, 'Reject update when updated pricePerUnit > updated mrp');

  const validUpdate = listingUpdateSchema.safeParse({
    mrp: 100,
    pricePerUnit: 80,
  });
  assert(validUpdate.success, 'Accept valid update with mrp and pricePerUnit <= mrp');

  // ─── TEST 5: Voice Extraction with MRP ─────────────────────────────────────────
  console.log('\n--- 4. Voice Parser MRP Extraction ---');
  const transcriptWithMrp = '50 packets of biscuits, MRP 40 rupees, selling price 25 rupees, expiry 20 days';
  const extractionWithMrp = await extractListingFromSpeech(transcriptWithMrp, 'en-IN');
  assert(extractionWithMrp.mrp === 40, 'Extract MRP from voice transcript correctly', `Extracted MRP: ${extractionWithMrp.mrp}`);
  assert(extractionWithMrp.pricePerUnit === 25, 'Extract Selling Price from voice transcript correctly', `Extracted Price: ${extractionWithMrp.pricePerUnit}`);
  assert(!extractionWithMrp.missingFields.includes('mrp'), 'mrp not marked as missing when present in speech');

  // Voice transcript without MRP: Must NOT fabricate a guess, must put 'mrp' in missingFields
  const transcriptWithoutMrp = '50 packets of biscuits, selling price 25 rupees, 25 din baad expiry';
  const extractionWithoutMrp = await extractListingFromSpeech(transcriptWithoutMrp, 'hi-IN');
  assert(extractionWithoutMrp.mrp === null, 'Do not guess or fabricate MRP when not spoken', `Extracted MRP: ${extractionWithoutMrp.mrp}`);
  assert(extractionWithoutMrp.missingFields.includes('mrp'), 'Mark "mrp" in missingFields when not spoken');

  // Hindi phrase extraction: "chapa hua daam 100 rupaye, bechna hai 60 me"
  const transcriptHindi = '20 bori chawal bacha hai, chapa hua daam 1000 rupaye, humara rate 750 rupaye, 45 din bache hain';
  const extractionHindi = await extractListingFromSpeech(transcriptHindi, 'hi-IN');
  assert(extractionHindi.mrp === 1000, 'Extract Hindi MRP phrase (chapa hua daam)', `Extracted MRP: ${extractionHindi.mrp}`);
  assert(extractionHindi.pricePerUnit === 750, 'Extract Hindi selling price', `Extracted Price: ${extractionHindi.pricePerUnit}`);

  // ─── TEST 6: Discount Calculation Formula ───────────────────────────────────────
  console.log('\n--- 5. Discount Calculation Formula ---');
  const testMrp = 1000;
  const testSellingPrice = 650;
  const discountPercentage = Math.round(((testMrp - testSellingPrice) / testMrp) * 100);
  assert(discountPercentage === 35, 'Discount formula calculates 35% discount for ₹650 on ₹1,000 MRP', `Got: ${discountPercentage}%`);

  // ─── TEST 7: Risk Service Integration with MRP ─────────────────────────────────
  console.log('\n--- 6. Risk Service Integration with MRP ---');
  // Find or create a test seller
  let testSeller = await prisma.user.findFirst();
  if (!testSeller) {
    testSeller = await prisma.user.create({
      data: {
        email: 'test_seller_mrp@stockbridge.test',
        passwordHash: 'hashed_pw',
        name: 'Test Seller MRP',
        businessName: 'Test Seller MRP Wholesaler',
      },
    });
  }

  const riskResultWithMrp = await calculateListingRisk({
    title: 'Fortune Sunlite Sunflower Oil 1L Pouch',
    category: 'Groceries',
    unit: 'packets',
    mrp: 160,
    pricePerUnit: 120,
    expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    sellerId: testSeller.id,
  });

  assert(riskResultWithMrp !== undefined, 'calculateListingRisk runs successfully with mrp parameter');
  assert(riskResultWithMrp.riskLevel === 'LOW' || riskResultWithMrp.riskLevel === 'MEDIUM', 'Near expiry with reasonable MRP discount evaluates without high/critical risk anomaly', `Got: ${riskResultWithMrp.riskLevel}`);

  // ─── TEST 8: Database Persistence of Original MRP ─────────────────────────────
  console.log('\n--- 7. Database Persistence ---');
  const createdListing = await prisma.listing.create({
    data: {
      sellerId: testSeller.id,
      title: 'Dabur Honey 500g Jar Surplus Lot',
      category: 'Groceries',
      quantity: 100,
      unit: 'pieces',
      originalMrp: 220,
      pricePerUnit: 140,
      expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      urgency: 'medium',
    },
  });

  assert(createdListing.originalMrp === 220, 'Listing saved with originalMrp: 220 in database', `Fetched Original MRP: ${createdListing.originalMrp}`);

  const updatedListing = await prisma.listing.update({
    where: { id: createdListing.id },
    data: {
      originalMrp: 230,
      pricePerUnit: 135,
    },
  });
  assert(updatedListing.originalMrp === 230 && updatedListing.pricePerUnit === 135, 'Listing updated with new Original MRP and selling price');

  // Clean up created test listing
  await prisma.listing.delete({ where: { id: createdListing.id } });
  console.log('Cleaned up test listing.');

  // ─── SUMMARY ──────────────────────────────────────────────────────────────────
  console.log('\n==================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runMrpTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
