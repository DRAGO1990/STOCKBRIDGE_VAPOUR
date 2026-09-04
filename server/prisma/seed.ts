import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { resolveProductImage } from '../src/lib/productImages';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding multi-location StockBridge database...');

  // Clean existing tables in reverse relational order
  await prisma.rating.deleteMany();
  await prisma.message.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('password123', 10);

  // ---------------------------------------------------------------------------
  // 1. Core Platform & Multi-Location Demo Users (1 Seller + 1 Buyer per Hub)
  // ---------------------------------------------------------------------------
  const userDefinitions = [
    // Admin
    {
      name: 'Admin',
      email: 'admin@stockbridge.com',
      businessName: 'StockBridge Operations',
      phone: '9999999999',
      lat: 19.076,
      lng: 72.877,
      address: 'Bandra Kurla Complex, Mumbai (MH)',
      rating: 5.0,
      verified: true,
      verificationStatus: 'verified',
      idDocumentType: 'PAN',
      idDocumentNumber: '••••••8899',
      isAdmin: true,
    },
    // Mumbai (MH)
    {
      name: 'Rajesh Sharma',
      email: 'seller.mumbai@demo.com',
      businessName: 'Sharma Wholesale Depot',
      phone: '9820112233',
      lat: 19.1136,
      lng: 72.8697,
      address: 'Andheri East, Mumbai (MH)',
      rating: 4.8,
      verified: true,
      verificationStatus: 'verified',
      idDocumentType: 'PAN',
      idDocumentNumber: '••••••1234',
    },
    {
      name: 'Priya Patel',
      email: 'buyer.mumbai@demo.com',
      businessName: 'Patel Retail Traders',
      phone: '9820223344',
      lat: 19.0596,
      lng: 72.8295,
      address: 'Bandra West, Mumbai (MH)',
      rating: 4.6,
      verified: true,
      verificationStatus: 'verified',
      idDocumentType: 'Aadhaar',
      idDocumentNumber: '•••• •••• 9821',
    },
    // Delhi NCR
    {
      name: 'Suresh Kumar',
      email: 'seller.delhi@demo.com',
      businessName: 'Kumar Agro & FMCG Hub',
      phone: '9811122334',
      lat: 28.6315,
      lng: 77.2167,
      address: 'Connaught Place, Delhi NCR',
      rating: 4.7,
      verified: true,
      verificationStatus: 'verified',
      idDocumentType: 'PAN',
      idDocumentNumber: '••••••4321',
    },
    {
      name: 'Neha Gupta',
      email: 'buyer.delhi@demo.com',
      businessName: 'Gupta Mart Supplies',
      phone: '9811223345',
      lat: 28.6517,
      lng: 77.1906,
      address: 'Karol Bagh, Delhi NCR',
      rating: 4.3,
      verified: true,
      verificationStatus: 'verified',
      idDocumentType: 'Aadhaar',
      idDocumentNumber: '•••• •••• 5543',
    },
    // Bengaluru (KA)
    {
      name: 'Lakshmi Rao',
      email: 'seller.bengaluru@demo.com',
      businessName: 'Rao Fresh & Provisions',
      phone: '9844112233',
      lat: 13.0285,
      lng: 77.5195,
      address: 'Peenya Industrial Area, Bengaluru (KA)',
      rating: 4.9,
      verified: true,
      verificationStatus: 'verified',
      idDocumentType: 'PAN',
      idDocumentNumber: '••••••6789',
    },
    {
      name: 'Karthik Reddy',
      email: 'buyer.bengaluru@demo.com',
      businessName: 'Reddy Tech & Electronics',
      phone: '9844223344',
      lat: 12.9784,
      lng: 77.6408,
      address: 'Indiranagar, Bengaluru (KA)',
      rating: 4.4,
      verified: true,
      verificationStatus: 'verified',
      idDocumentType: 'Aadhaar',
      idDocumentNumber: '•••• •••• 1122',
    },
    // Hyderabad (TG)
    {
      name: 'Fatima Khan',
      email: 'seller.hyderabad@demo.com',
      businessName: 'Deccan Wholesale Traders',
      phone: '9849112233',
      lat: 17.4156,
      lng: 78.4487,
      address: 'Banjara Hills, Hyderabad (TG)',
      rating: 4.8,
      verified: true,
      verificationStatus: 'verified',
      idDocumentType: 'PAN',
      idDocumentNumber: '••••••9988',
    },
    {
      name: 'Ravi Teja',
      email: 'buyer.hyderabad@demo.com',
      businessName: 'Teja Commercial Depot',
      phone: '9849223344',
      lat: 17.4435,
      lng: 78.3772,
      address: 'HITEC City, Hyderabad (TG)',
      rating: 4.2,
      verified: true,
      verificationStatus: 'under_review',
      idDocumentType: 'Aadhaar',
      idDocumentNumber: '•••• •••• 7766',
    },
    // Pune (MH)
    {
      name: 'Vikram Joshi',
      email: 'seller.pune@demo.com',
      businessName: 'Maratha Industrial Supplies',
      phone: '9822112233',
      lat: 18.6279,
      lng: 73.8488,
      address: 'Bhosari MIDC, Pune (MH)',
      rating: 4.6,
      verified: true,
      verificationStatus: 'verified',
      idDocumentType: 'PAN',
      idDocumentNumber: '••••••3344',
    },
    {
      name: 'Swati Deshmukh',
      email: 'buyer.pune@demo.com',
      businessName: 'Deshmukh Supermart',
      phone: '9822223344',
      lat: 18.5913,
      lng: 73.7389,
      address: 'Hinjawadi Phase 1, Pune (MH)',
      rating: 4.5,
      verified: true,
      verificationStatus: 'verified',
      idDocumentType: 'Aadhaar',
      idDocumentNumber: '•••• •••• 4455',
    },
    // Chennai (TN)
    {
      name: 'K. Ramanathan',
      email: 'seller.chennai@demo.com',
      businessName: 'Coromandel Trade Link',
      phone: '9840112233',
      lat: 13.0067,
      lng: 80.2025,
      address: 'Guindy Industrial Estate, Chennai (TN)',
      rating: 4.7,
      verified: true,
      verificationStatus: 'verified',
      idDocumentType: 'PAN',
      idDocumentNumber: '••••••5566',
    },
    {
      name: 'Ananya Sundaram',
      email: 'buyer.chennai@demo.com',
      businessName: 'Sundaram General Stores',
      phone: '9840223344',
      lat: 13.1143,
      lng: 80.1548,
      address: 'Ambattur, Chennai (TN)',
      rating: 4.4,
      verified: true,
      verificationStatus: 'verified',
      idDocumentType: 'Aadhaar',
      idDocumentNumber: '•••• •••• 9900',
    },
    // Legacy demo accounts for backward compatibility
    {
      name: 'Rajesh Sharma',
      email: 'rajesh@demo.com',
      businessName: 'Sharma Wholesale Depot',
      phone: '9876543210',
      lat: 19.1136,
      lng: 72.8697,
      address: 'Andheri West, Mumbai (MH)',
      rating: 4.5,
      verified: true,
      verificationStatus: 'verified',
      idDocumentType: 'PAN',
      idDocumentNumber: '••••••1234',
    },
    {
      name: 'Suresh Kumar',
      email: 'suresh@demo.com',
      businessName: 'Kumar Groceries',
      phone: '9876543213',
      lat: 28.6315,
      lng: 77.2167,
      address: 'Connaught Place, Delhi NCR',
      rating: 4.7,
      verified: true,
      verificationStatus: 'verified',
      idDocumentType: 'PAN',
      idDocumentNumber: '••••••4321',
    },
    {
      name: 'Lakshmi Rao',
      email: 'lakshmi@demo.com',
      businessName: 'Rao Fresh Foods',
      phone: '9876543216',
      lat: 12.9756,
      lng: 77.6094,
      address: 'MG Road, Bengaluru (KA)',
      rating: 4.8,
      verified: true,
      verificationStatus: 'verified',
      idDocumentType: 'PAN',
      idDocumentNumber: '••••••6789',
    },
  ];

  const userMap: Record<string, any> = {};
  for (const def of userDefinitions) {
    const user = await prisma.user.create({
      data: {
        ...def,
        passwordHash: hash,
        active: true,
      },
    });
    userMap[def.email] = user;
  }

  const now = new Date();
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  // ---------------------------------------------------------------------------
  // 2. Realistic Multi-Location Surplus Stock
  // ---------------------------------------------------------------------------
  const rawListings = [
    // --- Mumbai Hub Listings ---
    {
      sellerEmail: 'seller.mumbai@demo.com',
      title: 'India Gate Premium Basmati Rice 25kg Bags',
      category: 'Groceries',
      quantity: 60,
      unit: 'bags',
      pricePerUnit: 1450,
      urgency: 'medium',
      expiryDate: daysFromNow(45),
    },
    {
      sellerEmail: 'seller.mumbai@demo.com',
      title: 'Fortune Refined Sunflower Oil 5L Cans',
      category: 'Groceries',
      quantity: 120,
      unit: 'cans',
      pricePerUnit: 580,
      urgency: 'high',
      expiryDate: daysFromNow(12),
    },
    {
      sellerEmail: 'seller.mumbai@demo.com',
      title: 'Braided Fast-Charging USB-C Cables 1.5m',
      category: 'Electronics',
      quantity: 350,
      unit: 'pieces',
      pricePerUnit: 140,
      urgency: 'low',
      expiryDate: daysFromNow(180),
    },
    {
      sellerEmail: 'seller.mumbai@demo.com',
      title: '3-Ply Corrugated Shipping Boxes 14x12x10 inch',
      category: 'Packaging',
      quantity: 800,
      unit: 'pieces',
      pricePerUnit: 28,
      urgency: 'low',
      expiryDate: daysFromNow(365),
    },

    // --- Delhi NCR Hub Listings ---
    {
      sellerEmail: 'seller.delhi@demo.com',
      title: 'Aashirvaad Shudh Chakki Atta 10kg Bags',
      category: 'Groceries',
      quantity: 90,
      unit: 'bags',
      pricePerUnit: 395,
      urgency: 'medium',
      expiryDate: daysFromNow(35),
    },
    {
      sellerEmail: 'seller.delhi@demo.com',
      title: 'JK Copier A4 Paper 75 GSM (500 Sheets/Ream)',
      category: 'Stationery',
      quantity: 400,
      unit: 'reams',
      pricePerUnit: 190,
      urgency: 'low',
      expiryDate: daysFromNow(240),
    },
    {
      sellerEmail: 'seller.delhi@demo.com',
      title: 'Britannia Good Day Biscuits Master Cartons (72 packs)',
      category: 'Food & Beverages',
      quantity: 50,
      unit: 'boxes',
      pricePerUnit: 720,
      urgency: 'high',
      expiryDate: daysFromNow(14),
    },
    {
      sellerEmail: 'seller.delhi@demo.com',
      title: 'Industrial Heavy Duty Disinfectant Floor Cleaner 5L',
      category: 'Cleaning',
      quantity: 75,
      unit: 'cans',
      pricePerUnit: 290,
      urgency: 'medium',
      expiryDate: daysFromNow(90),
    },

    // --- Bengaluru Hub Listings ---
    {
      sellerEmail: 'seller.bengaluru@demo.com',
      title: 'Organic Unpolished Toor Dal 1kg Sealed Packs',
      category: 'Groceries',
      quantity: 250,
      unit: 'packets',
      pricePerUnit: 155,
      urgency: 'high',
      expiryDate: daysFromNow(13),
    },
    {
      sellerEmail: 'seller.bengaluru@demo.com',
      title: 'Adjustable 12W LED Desk Lamps with USB Port',
      category: 'Electronics',
      quantity: 65,
      unit: 'pieces',
      pricePerUnit: 620,
      urgency: 'low',
      expiryDate: daysFromNow(120),
    },
    {
      sellerEmail: 'seller.bengaluru@demo.com',
      title: 'Executive Hardcover Ruled Notebooks 200 Pages',
      category: 'Stationery',
      quantity: 300,
      unit: 'pieces',
      pricePerUnit: 75,
      urgency: 'medium',
      expiryDate: daysFromNow(150),
    },
    {
      sellerEmail: 'seller.bengaluru@demo.com',
      title: 'Bluetooth 5.3 Wireless Earbuds with ENC',
      category: 'Electronics',
      quantity: 110,
      unit: 'pieces',
      pricePerUnit: 799,
      urgency: 'low',
      expiryDate: daysFromNow(200),
    },

    // --- Hyderabad Hub Listings ---
    {
      sellerEmail: 'seller.hyderabad@demo.com',
      title: 'Pure Desi Ghee 1L Sealed Tin Containers',
      category: 'Groceries',
      quantity: 85,
      unit: 'tins',
      pricePerUnit: 640,
      urgency: 'medium',
      expiryDate: daysFromNow(40),
    },
    {
      sellerEmail: 'seller.hyderabad@demo.com',
      title: 'Assam Strong CTC Black Tea 5kg Bulk Sacks',
      category: 'Food & Beverages',
      quantity: 45,
      unit: 'sacks',
      pricePerUnit: 1250,
      urgency: 'low',
      expiryDate: daysFromNow(90),
    },
    {
      sellerEmail: 'seller.hyderabad@demo.com',
      title: 'Air Bubble Wrap Roll 100m x 1m Heavy Grade',
      category: 'Packaging',
      quantity: 30,
      unit: 'rolls',
      pricePerUnit: 950,
      urgency: 'medium',
      expiryDate: daysFromNow(300),
    },
    {
      sellerEmail: 'seller.hyderabad@demo.com',
      title: '10000mAh Dual-Port Power Bank with Fast Charge',
      category: 'Electronics',
      quantity: 80,
      unit: 'pieces',
      pricePerUnit: 699,
      urgency: 'high',
      expiryDate: daysFromNow(15),
    },

    // --- Pune Hub Listings ---
    {
      sellerEmail: 'seller.pune@demo.com',
      title: 'Fluorescent Reflective High-Visibility Safety Vests',
      category: 'Textiles',
      quantity: 200,
      unit: 'pieces',
      pricePerUnit: 160,
      urgency: 'low',
      expiryDate: daysFromNow(365),
    },
    {
      sellerEmail: 'seller.pune@demo.com',
      title: 'Industrial Heavy Duty PVC Work Aprons Waterproof',
      category: 'Textiles',
      quantity: 150,
      unit: 'pieces',
      pricePerUnit: 220,
      urgency: 'medium',
      expiryDate: daysFromNow(240),
    },
    {
      sellerEmail: 'seller.pune@demo.com',
      title: 'Instant Granule Coffee Jar 500g Commercial',
      category: 'Food & Beverages',
      quantity: 90,
      unit: 'jars',
      pricePerUnit: 480,
      urgency: 'high',
      expiryDate: daysFromNow(11),
    },
    {
      sellerEmail: 'seller.pune@demo.com',
      title: 'Self-Adhesive Transparent BOPP Packing Tape 65m Rolls',
      category: 'Packaging',
      quantity: 500,
      unit: 'rolls',
      pricePerUnit: 35,
      urgency: 'low',
      expiryDate: daysFromNow(365),
    },

    // --- Chennai Hub Listings ---
    {
      sellerEmail: 'seller.chennai@demo.com',
      title: 'Commercial Antibacterial Hand Sanitizer 5L Canister',
      category: 'Cleaning',
      quantity: 70,
      unit: 'cans',
      pricePerUnit: 380,
      urgency: 'high',
      expiryDate: daysFromNow(12),
    },
    {
      sellerEmail: 'seller.chennai@demo.com',
      title: 'Blue Ballpoint Writing Pens (Pack of 50)',
      category: 'Stationery',
      quantity: 250,
      unit: 'packs',
      pricePerUnit: 140,
      urgency: 'low',
      expiryDate: daysFromNow(300),
    },
    {
      sellerEmail: 'seller.chennai@demo.com',
      title: '3-Ply Surgical Grade Protective Face Masks (Box of 100)',
      category: 'Textiles',
      quantity: 300,
      unit: 'boxes',
      pricePerUnit: 180,
      urgency: 'medium',
      expiryDate: daysFromNow(180),
    },
    {
      sellerEmail: 'seller.chennai@demo.com',
      title: 'Refined White Crystal Sugar 50kg Sacks',
      category: 'Groceries',
      quantity: 40,
      unit: 'sacks',
      pricePerUnit: 1980,
      urgency: 'low',
      expiryDate: daysFromNow(90),
    },
  ];

  const createdListings: any[] = [];
  for (const item of rawListings) {
    const seller = userMap[item.sellerEmail];
    if (!seller) continue;
    const imageUrl = resolveProductImage(item.title, item.category);

    const listing = await prisma.listing.create({
      data: {
        sellerId: seller.id,
        title: item.title,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        pricePerUnit: item.pricePerUnit,
        urgency: item.urgency,
        expiryDate: item.expiryDate,
        imageUrl,
        status: 'active',
        active: true,
      },
    });
    createdListings.push({ ...listing, seller });
  }

  // ---------------------------------------------------------------------------
  // 3. Active Cross-Location Reservations, Messages & Ratings
  // ---------------------------------------------------------------------------
  // Deal 1: Mumbai (Confirmed)
  const res1 = await prisma.reservation.create({
    data: {
      listingId: createdListings[0].id,
      buyerId: userMap['buyer.mumbai@demo.com'].id,
      status: 'confirmed',
      agreedPrice: 1400,
      agreedQty: 20,
    },
  });
  await prisma.listing.update({ where: { id: createdListings[0].id }, data: { status: 'reserved' } });

  await prisma.message.createMany({
    data: [
      { reservationId: res1.id, senderId: userMap['buyer.mumbai@demo.com'].id, text: 'Namaste Rajesh ji, can we pick up 20 bags tomorrow morning?', read: true },
      { reservationId: res1.id, senderId: userMap['seller.mumbai@demo.com'].id, text: 'Yes Priya ji, the lot is kept ready at our Andheri warehouse.', read: true },
      { reservationId: res1.id, senderId: userMap['buyer.mumbai@demo.com'].id, text: 'Perfect, sending transport driver with gate pass.', read: false },
    ],
  });

  // Deal 2: Delhi (Completed + Rated)
  const res2 = await prisma.reservation.create({
    data: {
      listingId: createdListings[5].id, // JK Copier Paper
      buyerId: userMap['buyer.delhi@demo.com'].id,
      status: 'completed',
      agreedPrice: 180,
      agreedQty: 100,
    },
  });
  await prisma.listing.update({ where: { id: createdListings[5].id }, data: { status: 'sold' } });

  await prisma.rating.create({
    data: {
      fromUserId: userMap['buyer.delhi@demo.com'].id,
      toUserId: userMap['seller.delhi@demo.com'].id,
      reservationId: res2.id,
      score: 5,
      comment: 'Top quality copier reams. Clean dispatch and accurate invoice.',
    },
  });

  // Deal 3: Bengaluru (Pending)
  await prisma.reservation.create({
    data: {
      listingId: createdListings[8].id, // Toor Dal
      buyerId: userMap['buyer.bengaluru@demo.com'].id,
      status: 'pending',
      agreedPrice: 150,
      agreedQty: 50,
      expiresAt: daysFromNow(2),
    },
  });

  console.log(`✅ Seeded successfully:`);
  console.log(`   👥 Users: ${Object.keys(userMap).length} (6 cities: Mumbai, Delhi, Bengaluru, Hyderabad, Pune, Chennai)`);
  console.log(`   📦 Listings: ${createdListings.length} with deterministic image URLs`);
  console.log(`   🤝 Active Deals & Reviews generated`);
  console.log(`   🔑 Default password for all demo accounts: password123\n`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
