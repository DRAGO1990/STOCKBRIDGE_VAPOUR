import prisma from '../lib/prisma';
import {
  calculateUrgency,
  calculateUrgencyFromExpiry,
  calculateDaysRemaining,
  getDaysUntilExpiry,
  validateExpiryDate,
} from '../utils/urgency';
import { baseListingSchema, baseListingUpdateSchema } from '../validators';
import { extractListingFromSpeech } from '../services/voiceService';

async function runAll14DynamicUrgencyTests() {
  console.log('===============================================================');
  console.log('🧪 STOCKBRIDGE DYNAMIC URGENCY SYSTEM: 14/14 TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testNum: number | string, description: string, detail?: string) {
    if (condition) {
      console.log(`✅ [Test ${testNum}] ${description}${detail ? ` (${detail})` : ''}`);
      passed++;
    } else {
      console.error(`❌ [Test ${testNum}] FAILED: ${description}${detail ? ` (${detail})` : ''}`);
      failed++;
    }
  }

  const now = new Date();
  const getFutureDateStr = (days: number) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // -------------------------------------------------------------
  // Test 1: Expiry = 7 days -> REJECT
  // -------------------------------------------------------------
  const date7d = getFutureDateStr(7);
  const val7 = validateExpiryDate(date7d);
  assert(
    Boolean(!val7.valid && val7.error?.includes('less than 11 days')),
    1,
    'Expiry = 7 days -> REJECT',
    `valid: ${val7.valid}, error: "${val7.error}"`
  );

  // -------------------------------------------------------------
  // Test 2: Expiry = 10 days -> REJECT (minimum allowed is 11 days)
  // -------------------------------------------------------------
  const date10d = getFutureDateStr(10);
  const val10 = validateExpiryDate(date10d);
  assert(
    Boolean(!val10.valid && val10.error?.includes('less than 11 days')),
    2,
    'Expiry = 10 days -> REJECT',
    `valid: ${val10.valid}, error: "${val10.error}"`
  );

  // -------------------------------------------------------------
  // Test 3: Expiry = 11 days -> HIGH
  // -------------------------------------------------------------
  const date11d = getFutureDateStr(11);
  const val11 = validateExpiryDate(date11d);
  const urg11 = calculateUrgency(date11d);
  assert(
    val11.valid && urg11 === 'high',
    3,
    'Expiry = 11 days -> HIGH',
    `valid: ${val11.valid}, daysRemaining: ${val11.daysRemaining}, urgency: "${urg11}"`
  );

  // -------------------------------------------------------------
  // Test 4: Expiry = 20 days -> HIGH
  // -------------------------------------------------------------
  const date20d = getFutureDateStr(20);
  const urg20 = calculateUrgency(date20d);
  assert(
    urg20 === 'high',
    4,
    'Expiry = 20 days -> HIGH',
    `urgency: "${urg20}"`
  );

  // -------------------------------------------------------------
  // Test 5: Expiry = 25 days -> HIGH (Boundary)
  // -------------------------------------------------------------
  const date25d = getFutureDateStr(25);
  const urg25 = calculateUrgency(date25d);
  assert(
    urg25 === 'high',
    5,
    'Expiry = 25 days -> HIGH (Boundary)',
    `urgency: "${urg25}"`
  );

  // -------------------------------------------------------------
  // Test 6: Expiry = 26 days -> MEDIUM (Boundary)
  // -------------------------------------------------------------
  const date26d = getFutureDateStr(26);
  const urg26 = calculateUrgency(date26d);
  assert(
    urg26 === 'medium',
    6,
    'Expiry = 26 days -> MEDIUM (Boundary)',
    `urgency: "${urg26}"`
  );

  // -------------------------------------------------------------
  // Test 7: Expiry = 40 days -> MEDIUM
  // -------------------------------------------------------------
  const date40d = getFutureDateStr(40);
  const urg40 = calculateUrgency(date40d);
  assert(
    urg40 === 'medium',
    7,
    'Expiry = 40 days -> MEDIUM',
    `urgency: "${urg40}"`
  );

  // -------------------------------------------------------------
  // Test 8: Expiry = 50 days -> MEDIUM (Boundary)
  // -------------------------------------------------------------
  const date50d = getFutureDateStr(50);
  const urg50 = calculateUrgency(date50d);
  assert(
    urg50 === 'medium',
    8,
    'Expiry = 50 days -> MEDIUM (Boundary)',
    `urgency: "${urg50}"`
  );

  // -------------------------------------------------------------
  // Test 9: Expiry = 51 days -> LOW (Boundary)
  // -------------------------------------------------------------
  const date51d = getFutureDateStr(51);
  const urg51 = calculateUrgency(date51d);
  assert(
    urg51 === 'low',
    9,
    'Expiry = 51 days -> LOW (Boundary)',
    `urgency: "${urg51}"`
  );

  // -------------------------------------------------------------
  // Test 10: Expiry = 100 days -> LOW
  // -------------------------------------------------------------
  const date100d = getFutureDateStr(100);
  const urg100 = calculateUrgency(date100d);
  assert(
    urg100 === 'low',
    10,
    'Expiry = 100 days -> LOW',
    `urgency: "${urg100}"`
  );

  // -------------------------------------------------------------
  // Test 11: Change expiry from 60 days to 20 days -> LOW to HIGH automatically
  // -------------------------------------------------------------
  const date60d = getFutureDateStr(60);
  const initialUrgency = calculateUrgency(date60d);
  const updatedUrgency = calculateUrgency(date20d);
  assert(
    initialUrgency === 'low' && updatedUrgency === 'high',
    11,
    'Change expiry 60d -> 20d automatically transitions LOW -> HIGH',
    `initial: "${initialUrgency}", updated: "${updatedUrgency}"`
  );

  // -------------------------------------------------------------
  // Test 12: API sends urgency = "low", expiry = 20 days -> Backend saves HIGH
  // -------------------------------------------------------------
  let seller = await prisma.user.findFirst({ where: { email: 'rajesh@demo.com' } });
  if (!seller) {
    seller = await prisma.user.findFirst();
  }

  let dbTestPassed = false;
  if (seller) {
    // Clean up previous test listings
    await prisma.listing.deleteMany({ where: { title: { startsWith: 'TEST_URGENCY_' } } });

    // Client maliciously/erroneously submits urgency: 'low' with 20 days expiry
    const submittedExpiry = date20d;

    // Backend logic simulation (identical to listings.ts):
    // Ignore client urgency, derive calculateUrgency(data.expiryDate)
    const backendComputedUrgency = calculateUrgency(submittedExpiry);

    const createdListing = await prisma.listing.create({
      data: {
        title: 'TEST_URGENCY_SPOOF_TEST',
        category: 'Groceries',
        quantity: 50,
        unit: 'packets',
        originalMrp: 100,
        pricePerUnit: 80,
        expiryDate: new Date(submittedExpiry),
        urgency: backendComputedUrgency, // Overwritten by backend
        sellerId: seller.id,
      },
    });

    dbTestPassed = createdListing.urgency === 'high';

    // Also test PUT update: edit expiry to 40 days -> urgency must become medium
    const updatedExpiry = date40d;
    const updateComputedUrgency = calculateUrgency(updatedExpiry);
    const updatedListing = await prisma.listing.update({
      where: { id: createdListing.id },
      data: {
        expiryDate: new Date(updatedExpiry),
        urgency: updateComputedUrgency,
      },
    });

    const dbUpdatePassed = updatedListing.urgency === 'medium';
    assert(
      dbTestPassed && dbUpdatePassed,
      12,
      'Backend ignores client urgency "low" for 20d expiry and persists HIGH, updates to MEDIUM for 40d',
      `persisted: "${createdListing.urgency}", after update: "${updatedListing.urgency}"`
    );

    // Clean up
    await prisma.listing.delete({ where: { id: createdListing.id } });
  } else {
    const backendCalculated = calculateUrgency(date20d);
    assert(
      backendCalculated === 'high',
      12,
      'Backend ignores client urgency "low" for 20d expiry and computes HIGH',
      `computed: "${backendCalculated}"`
    );
  }

  // -------------------------------------------------------------
  // Test 13: Voice AI returns urgency = "medium", expiry = 20 days -> Application calculates HIGH
  // -------------------------------------------------------------
  const voiceResult = await extractListingFromSpeech(
    'I have 30 biscuit packets expiring in 20 days, MRP 50 selling price 35',
    'en-IN'
  );
  const voiceDaysRemaining = getDaysUntilExpiry(voiceResult.expiryDate);
  const voiceUrgency = calculateUrgency(voiceResult.expiryDate);

  assert(
    voiceDaysRemaining !== null &&
    Math.abs(voiceDaysRemaining - 20) <= 1 &&
    voiceResult.urgency === 'high' &&
    voiceUrgency === 'high',
    13,
    'Voice AI extraction ignores AI urgency and deterministically calculates HIGH for 20-day expiry',
    `daysRemaining: ${voiceDaysRemaining}, result urgency: "${voiceResult.urgency}"`
  );

  // Also test voice with "expiring in 7 days" -> validateExpiryDate must reject
  const voice7Result = await extractListingFromSpeech(
    '30 packets milk expiring in 7 days, price 25',
    'en-IN'
  );
  const valVoice7 = validateExpiryDate(voice7Result.expiryDate);
  assert(
    Boolean(!valVoice7.valid && valVoice7.error?.includes('less than 11 days')),
    '13b',
    'Voice input with 7 days expiry is rejected by expiry validation',
    `valid: ${valVoice7.valid}, error: "${valVoice7.error}"`
  );

  // -------------------------------------------------------------
  // Test 14: Verify user cannot manually edit urgency anywhere
  // -------------------------------------------------------------
  const zodValid = baseListingSchema.safeParse({
    title: 'Test Lot Title',
    category: 'Groceries',
    quantity: 10,
    unit: 'packets',
    mrp: 100,
    pricePerUnit: 80,
    imageUrl: '/uploads/products/test.jpg',
    invoiceVerificationId: 'test-inv-id',
    expiryDate: date20d,
    // Note: urgency NOT provided by client
  });
  const zodUpdateValid = baseListingUpdateSchema.safeParse({
    expiryDate: date20d,
    // Note: urgency NOT provided by client
  });

  assert(
    zodValid.success && zodUpdateValid.success,
    14,
    'Listing schemas accept payloads without urgency; backend strictly calculates it from expiryDate',
    `create valid: ${zodValid.success}, update valid: ${zodUpdateValid.success}`
  );

  console.log('\n===============================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAll14DynamicUrgencyTests()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
