import prisma from '../lib/prisma';
import {
  getListingAgeInDays,
  getDaysUntilExpiry,
  shouldAutoUnlist,
  AUTO_UNLIST_MIN_AGE_DAYS,
  AUTO_UNLIST_MIN_LISTING_AGE_DAYS,
  AUTO_UNLIST_EXPIRY_THRESHOLD_DAYS,
} from '../utils/urgency';
import { runAutoExpiryUnlistingCheck } from '../services/expiryMonitor';
import { matchListings } from '../services/matchingEngine';

async function runAutoUnlistingTestSuite() {
  console.log('🧪 Starting Automatic Product Unlisting Test Suite (15-Day Threshold)...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ ${testName}${detail ? ` — ${detail}` : ''}`);
      passed++;
    } else {
      console.error(`❌ FAILED: ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // Find a test user (seller)
  let seller = await prisma.user.findFirst({ where: { email: 'rajesh@demo.com' } });
  if (!seller) {
    seller = await prisma.user.findFirst();
  }
  if (!seller) {
    console.error('❌ Could not find a seller user in database');
    process.exit(1);
  }

  // Cleanup any old test listings
  await prisma.notification.deleteMany({
    where: { title: 'Product automatically unlisted', message: { contains: 'TEST_' } },
  });
  await prisma.listing.deleteMany({
    where: { title: { startsWith: 'TEST_' } },
  });

  const now = new Date();
  const getPastDate = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000);
  const getFutureDate = (daysAhead: number) => new Date(now.getTime() + daysAhead * 86400000);

  // ── Part 1: Date & Rule Utility Unit Tests ──
  console.log('--- Part 1: Constants & Date Utility Unit Tests ---');
  assert(AUTO_UNLIST_MIN_AGE_DAYS === 15, 'AUTO_UNLIST_MIN_AGE_DAYS is 15');
  assert(AUTO_UNLIST_MIN_LISTING_AGE_DAYS === 15, 'AUTO_UNLIST_MIN_LISTING_AGE_DAYS is 15');
  assert(AUTO_UNLIST_EXPIRY_THRESHOLD_DAYS === 11, 'AUTO_UNLIST_EXPIRY_THRESHOLD_DAYS is 11');

  const age15 = getListingAgeInDays(getPastDate(15));
  assert(age15 === 15, 'getListingAgeInDays returns 15 for 15 days ago', `got ${age15}`);

  const age14 = getListingAgeInDays(getPastDate(14));
  assert(age14 === 14, 'getListingAgeInDays returns 14 for 14 days ago', `got ${age14}`);

  const exp10 = getDaysUntilExpiry(getFutureDate(10));
  assert(exp10 === 10, 'getDaysUntilExpiry returns 10 for 10 days ahead', `got ${exp10}`);

  const exp11 = getDaysUntilExpiry(getFutureDate(11));
  assert(exp11 === 11, 'getDaysUntilExpiry returns 11 for 11 days ahead', `got ${exp11}`);

  // Test shouldAutoUnlist matrix
  assert(
    shouldAutoUnlist(getPastDate(14), getFutureDate(10), 'active', true) === false,
    'shouldAutoUnlist: age 14, exp 10, active -> FALSE (age < 15)'
  );
  assert(
    shouldAutoUnlist(getPastDate(15), getFutureDate(10), 'active', true) === true,
    'shouldAutoUnlist: age 15, exp 10, active -> TRUE'
  );
  assert(
    shouldAutoUnlist(getPastDate(16), getFutureDate(10), 'active', true) === true,
    'shouldAutoUnlist: age 16, exp 10, active -> TRUE'
  );
  assert(
    shouldAutoUnlist(getPastDate(15), getFutureDate(11), 'active', true) === false,
    'shouldAutoUnlist: age 15, exp 11, active -> FALSE (exp not < 11)'
  );
  assert(
    shouldAutoUnlist(getPastDate(15), getFutureDate(5), 'sold', false) === false,
    'shouldAutoUnlist: age 15, exp 5, sold -> FALSE (not active)'
  );
  assert(
    shouldAutoUnlist(getPastDate(15), getFutureDate(5), 'expiry_unlisted', false) === false,
    'shouldAutoUnlist: age 15, exp 5, expiry_unlisted -> FALSE (already unlisted)'
  );

  // ── Part 2: 10 Required Specification End-to-End Tests ──
  console.log('\n--- Part 2: 10 Required Specification End-to-End Tests ---');

  // Test 1: age 14 days + expiry 10 days -> remain listed
  const itemTest1 = await prisma.listing.create({
    data: {
      sellerId: seller.id,
      title: 'TEST_Item Age 14 Exp 10',
      category: 'Groceries',
      quantity: 50,
      unit: 'packets',
      mrp: 50,
      pricePerUnit: 40,
      createdAt: getPastDate(14),
      expiryDate: getFutureDate(10),
      status: 'active',
      active: true,
    },
  });

  // Test 2: age 15 days + expiry 10 days -> auto-unlist + notify seller
  const itemTest2 = await prisma.listing.create({
    data: {
      sellerId: seller.id,
      title: 'TEST_Parle-G Biscuits Test 2',
      category: 'Groceries',
      quantity: 50,
      unit: 'packets',
      mrp: 20,
      pricePerUnit: 15,
      createdAt: getPastDate(15),
      expiryDate: getFutureDate(10),
      status: 'active',
      active: true,
    },
  });

  // Test 3: age 16 days + expiry 10 days -> auto-unlist
  const itemTest3 = await prisma.listing.create({
    data: {
      sellerId: seller.id,
      title: 'TEST_Item Age 16 Exp 10',
      category: 'Groceries',
      quantity: 30,
      unit: 'packets',
      mrp: 60,
      pricePerUnit: 45,
      createdAt: getPastDate(16),
      expiryDate: getFutureDate(10),
      status: 'active',
      active: true,
    },
  });

  // Test 4: age 15 days + expiry 11 days -> remain listed (daysUntilExpiry < 11)
  const itemTest4 = await prisma.listing.create({
    data: {
      sellerId: seller.id,
      title: 'TEST_Item Age 15 Exp 11',
      category: 'Groceries',
      quantity: 40,
      unit: 'kg',
      mrp: 100,
      pricePerUnit: 80,
      createdAt: getPastDate(15),
      expiryDate: getFutureDate(11),
      status: 'active',
      active: true,
    },
  });

  // Test 5: age 15 days + expiry 5 days + sold -> no action
  const itemTest5 = await prisma.listing.create({
    data: {
      sellerId: seller.id,
      title: 'TEST_Item Sold Age 15 Exp 5',
      category: 'Groceries',
      quantity: 10,
      unit: 'packets',
      mrp: 50,
      pricePerUnit: 40,
      createdAt: getPastDate(15),
      expiryDate: getFutureDate(5),
      status: 'sold',
      active: false,
    },
  });

  // Test 6: age 15 days + expiry 5 days + reserved -> preserve existing reservation-safe behaviour
  let buyer = await prisma.user.findFirst({ where: { email: 'suresh@demo.com' } });
  if (!buyer) {
    buyer = await prisma.user.findFirst({ where: { id: { not: seller.id } } });
  }

  const itemTest6 = await prisma.listing.create({
    data: {
      sellerId: seller.id,
      title: 'TEST_Item Reserved Age 15 Exp 5',
      category: 'Groceries',
      quantity: 20,
      unit: 'boxes',
      mrp: 120,
      pricePerUnit: 90,
      createdAt: getPastDate(15),
      expiryDate: getFutureDate(5),
      status: 'active',
      active: true,
    },
  });

  let resv6: any = null;
  if (buyer) {
    resv6 = await prisma.reservation.create({
      data: {
        listingId: itemTest6.id,
        buyerId: buyer.id,
        status: 'pending',
        agreedPrice: 900,
        agreedQty: 10,
        expiresAt: getFutureDate(1),
      },
    });
  }

  // Test 7 setup: already auto-unlisted listing
  const itemTest7 = await prisma.listing.create({
    data: {
      sellerId: seller.id,
      title: 'TEST_Already Auto-Unlisted Item',
      category: 'Groceries',
      quantity: 10,
      unit: 'packets',
      mrp: 50,
      pricePerUnit: 40,
      createdAt: getPastDate(20),
      expiryDate: getFutureDate(5),
      status: 'expiry_unlisted',
      active: false,
    },
  });

  // EXECUTE BACKGROUND EXPIRY MONITOR RUN 1
  console.log('\n--- Running Auto-Expiry Unlisting Check (Run 1) ---');
  const run1Result = await runAutoExpiryUnlistingCheck();
  console.log('Run 1 result:', run1Result);

  // Validate Test 1: age 14 days + expiry 10 days -> remain listed
  const resTest1 = await prisma.listing.findUnique({ where: { id: itemTest1.id } });
  assert(
    resTest1?.status === 'active' && resTest1?.active === true,
    'Test 1: age 14 days + expiry 10 days -> remained listed (age < 15)'
  );

  // Validate Test 2: age 15 days + expiry 10 days -> auto-unlist
  const resTest2 = await prisma.listing.findUnique({ where: { id: itemTest2.id } });
  assert(
    resTest2?.status === 'expiry_unlisted' && resTest2?.active === false,
    'Test 2: age 15 days + expiry 10 days -> automatically unlisted'
  );

  // Validate Test 3: age 16 days + expiry 10 days -> auto-unlist
  const resTest3 = await prisma.listing.findUnique({ where: { id: itemTest3.id } });
  assert(
    resTest3?.status === 'expiry_unlisted' && resTest3?.active === false,
    'Test 3: age 16 days + expiry 10 days -> automatically unlisted'
  );

  // Validate Test 4: age 15 days + expiry 11 days -> remain listed
  const resTest4 = await prisma.listing.findUnique({ where: { id: itemTest4.id } });
  assert(
    resTest4?.status === 'active' && resTest4?.active === true,
    'Test 4: age 15 days + expiry 11 days -> remained listed (expiry not < 11)'
  );

  // Validate Test 5: age 15 days + expiry 5 days + sold -> no action
  const resTest5 = await prisma.listing.findUnique({ where: { id: itemTest5.id } });
  assert(
    resTest5?.status === 'sold' && resTest5?.active === false,
    'Test 5: age 15 days + expiry 5 days + sold -> no action (remains sold)'
  );

  // Validate Test 6: age 15 days + expiry 5 days + reserved -> preserve existing reservation-safe behaviour
  const resTest6 = await prisma.listing.findUnique({ where: { id: itemTest6.id } });
  assert(
    resTest6?.status === 'active' && resTest6?.active === true,
    'Test 6: age 15 days + expiry 5 days + reserved -> preserved active reservation safety'
  );

  // Validate Test 7: already auto-unlisted listing -> no duplicate action or notification
  const resTest7 = await prisma.listing.findUnique({ where: { id: itemTest7.id } });
  assert(
    resTest7?.status === 'expiry_unlisted' && resTest7?.active === false,
    'Test 7: already auto-unlisted listing remains untouched'
  );
  const notifsItem7 = await prisma.notification.count({ where: { listingId: itemTest7.id } });
  assert(
    notifsItem7 === 0,
    'Test 7: No duplicate notification sent for pre-existing unlisted item'
  );

  // Validate Test 8: seller notification references 15 days, not 30 days
  const notifTest2 = await prisma.notification.findFirst({
    where: { listingId: itemTest2.id, type: 'LISTING_AUTO_UNLISTED' },
  });
  const notifHas15 = Boolean(notifTest2?.message.includes('15 days or more'));
  const notifHasNo30 = Boolean(!notifTest2?.message.includes('30 days'));
  assert(
    Boolean(notifTest2) && notifHas15 && notifHasNo30,
    'Test 8: Seller notification wording references 15 days, not 30 days',
    notifTest2?.message
  );

  // Run 2: Idempotency check for duplicate notification prevention
  console.log('\n--- Running Auto-Expiry Unlisting Check (Run 2 - Idempotency Check) ---');
  const run2Result = await runAutoExpiryUnlistingCheck();
  assert(run2Result.unlistedCount === 0, 'Test 7b: Second run unlists 0 listings (idempotency)');
  const notifCountTest2 = await prisma.notification.count({ where: { listingId: itemTest2.id } });
  assert(notifCountTest2 === 1, 'Test 7c: Exactly ONE notification created across runs');

  // Validate Test 9: marketplace query hides auto-unlisted listing
  const marketplaceListings = await prisma.listing.findMany({
    where: {
      status: 'active',
      active: true,
      title: { contains: 'TEST_Parle-G Biscuits Test 2' },
    },
  });
  assert(
    marketplaceListings.length === 0,
    'Test 9: Auto-unlisted listing is hidden from public marketplace feed'
  );

  // Also verify seller can still see it in My Listings
  const sellerListings = await prisma.listing.findMany({
    where: { sellerId: seller.id, id: itemTest2.id },
  });
  assert(
    sellerListings.length === 1 && sellerListings[0].status === 'expiry_unlisted',
    'Test 9b: Auto-unlisted listing remains visible in seller\'s My Listings'
  );

  // Validate Test 10: matching engine excludes auto-unlisted listing
  const matchResults = await matchListings({
    search: 'Parle-G Biscuits',
    lat: seller.lat || 19.076,
    lng: seller.lng || 72.877,
  });
  const matchedTest2 = matchResults.find((l: any) => l.id === itemTest2.id);
  assert(
    !matchedTest2,
    'Test 10: Auto-unlisted listing is completely excluded by matching engine'
  );

  // Clean up reservations and test listings
  if (resv6) {
    await prisma.reservation.delete({ where: { id: resv6.id } });
  }
  await prisma.notification.deleteMany({
    where: { message: { contains: 'TEST_' } },
  });
  await prisma.listing.deleteMany({
    where: { title: { startsWith: 'TEST_' } },
  });

  console.log('\n=======================================');
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('=======================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAutoUnlistingTestSuite()
  .then(() => {
    console.log('🎉 All 10/10 auto-unlisting test cases completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test suite error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
