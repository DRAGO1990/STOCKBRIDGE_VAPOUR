import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';

// Initialize Prisma client with the server database
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Geospatial & Commercial Clusters in India
// ---------------------------------------------------------------------------
const CITIES = [
  {
    name: 'Mumbai (MH)',
    lat: 19.076,
    lng: 72.877,
    areas: ['Andheri East', 'Bandra Kurla Complex', 'Lower Parel', 'Powai', 'Navi Mumbai MIDC', 'Bhiwandi Logistics Park'],
  },
  {
    name: 'Delhi NCR',
    lat: 28.613,
    lng: 77.209,
    areas: ['Connaught Place', 'Okhla Industrial Area', 'Karol Bagh', 'Gurugram Cyber Hub', 'Noida Sector 62', 'Manesar'],
  },
  {
    name: 'Bangalore (KA)',
    lat: 12.971,
    lng: 77.594,
    areas: ['Peenya Industrial Area', 'Electronic City', 'Whitefield', 'Indiranagar', 'Koramangala', 'Bommasandra'],
  },
  {
    name: 'Hyderabad (TG)',
    lat: 17.385,
    lng: 78.486,
    areas: ['Banjara Hills', 'Jubilee Hills', 'HITEC City', 'Sanathnagar Industrial Estate', 'Cherlapally', 'Madhapur'],
  },
  {
    name: 'Chennai (TN)',
    lat: 13.082,
    lng: 80.27,
    areas: ['Guindy Industrial Estate', 'Ambattur', 'T. Nagar', 'Sriperumbudur', 'Ennore Port Road'],
  },
  {
    name: 'Pune (MH)',
    lat: 18.52,
    lng: 73.856,
    areas: ['Bhosari MIDC', 'Chakan Industrial Belt', 'Hinjawadi Phase 1', 'Hadapsar', 'Pimpri-Chinchwad'],
  },
  {
    name: 'Ahmedabad (GJ)',
    lat: 23.022,
    lng: 72.571,
    areas: ['Sanand GIDC', 'Naroda Industrial Estate', 'Vatva GIDC', 'SG Highway', 'Changodar'],
  },
  {
    name: 'Kolkata (WB)',
    lat: 22.572,
    lng: 88.363,
    areas: ['Salt Lake Sector V', 'Howrah Wholesale Hub', 'Taratala Industrial Area', 'Park Street'],
  },
];

const FIRST_NAMES = [
  'Rajesh', 'Priya', 'Amit', 'Suresh', 'Neha', 'Vikram', 'Lakshmi', 'Karthik',
  'Fatima', 'Ravi', 'Ananya', 'Rohan', 'Sneha', 'Aditya', 'Pooja', 'Arjun',
  'Meera', 'Deepak', 'Swati', 'Manoj', 'Divya', 'Sanjay', 'Kavita', 'Gaurav',
  'Ritu', 'Harish', 'Aarti', 'Nitin', 'Shweta', 'Alok', 'Simran', 'Rahul'
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Desai', 'Kumar', 'Gupta', 'Singh', 'Rao', 'Reddy',
  'Khan', 'Teja', 'Iyer', 'Mehta', 'Verma', 'Joshi', 'Bose', 'Nair',
  'Chopra', 'Shah', 'Malhotra', 'Agarwal', 'Mukherjee', 'Shetty', 'Bhatia'
];

const COMPANY_SUFFIXES = [
  'Enterprises', 'Traders', 'Wholesale Hub', 'Supplies Ltd', 'Distribution Co',
  'Logistics & Trade', 'Commercials', 'Supply Chain Solutions', 'Industries',
  'Wholesale Depot', 'Imports & Exports', 'Stockists'
];

const BUSINESS_DOMAINS = [
  'Agro', 'Tech', 'Metro', 'Prime', 'Universal', 'Apex', 'Zenith', 'Sunrise',
  'National', 'Om', 'Sai', 'Evergreen', 'Rapid', 'Direct', 'Global', 'Imperial'
];

const SURPLUS_CATALOG = [
  {
    category: 'Groceries',
    titles: [
      'Premium Royal Basmati Rice 25kg Bags',
      'Refined Sunflower Cooking Oil 5L Cans',
      'Organic Toor Dal 1kg Sealed Packs',
      'Whole Wheat Chakki Atta 10kg Bags',
      'White Crystal Refined Sugar 50kg Sacks',
      'Pure Cow Ghee 1L Tin Packets',
      'Assam Gold CTC Black Tea 5kg Master Bag',
      'Iodized Table Salt 1kg Poly Packs',
      'Red Chilli Powder Stemless 500g Packs',
      'Premium Cashew Nuts W320 10kg Vacuum Box'
    ],
    units: ['bags', 'cans', 'packets', 'sacks', 'tins', 'boxes'],
    minPrice: 150,
    maxPrice: 4500,
    minQty: 20,
    maxQty: 500,
    expiryDays: [15, 120] as [number, number],
  },
  {
    category: 'Electronics',
    titles: [
      'Braided Nylon USB-C Fast Charging Cables 1.5m',
      'Magnetic Wireless Power Bank 10000mAh',
      'Smart Bluetooth 5.3 TWS Earbuds with ANC',
      'Heavy Duty Surge Protector Power Strips 6-Way',
      'Adjustable LED Desk Lamps 12W with Dimmer',
      '1080p FHD USB Webcams with Stereo Mic',
      'CAT6 Ethernet Patch Cables 5m Bulk Pack',
      'Multi-Port 65W GaN Laptop Chargers',
      'Universal Travel Adapter with PD 30W',
      'HDMI 2.1 Ultra High Speed Cables 2m'
    ],
    units: ['pieces', 'packs', 'boxes'],
    minPrice: 120,
    maxPrice: 2200,
    minQty: 30,
    maxQty: 800,
    expiryDays: [90, 365] as [number, number],
  },
  {
    category: 'Packaging',
    titles: [
      '3-Ply Corrugated Shipping Boxes 12x10x8 inch',
      '5-Ply Heavy Duty Export Master Cartons 18x14x12 inch',
      'Air Bubble Cushioning Wrap Roll 100m x 1m',
      'Transparent BOPP Packaging Tape Rolls 65m x 2inch',
      'Cast Stretch Film Pallet Wrap Rolls 23 Micron',
      'Self-Adhesive Courier Tamper Evident Bags 10x12',
      'Eco-Friendly Honeycomb Paper Wrap Rolls 50m',
      'Thermal Barcode Label Rolls 50x25mm (1000 labels)',
      'Heavy Duty PP Strapping Rolls 12mm',
      'Moisture Absorbing Silica Gel Pouches 5g (Pack of 500)'
    ],
    units: ['pieces', 'rolls', 'cartons', 'packs'],
    minPrice: 15,
    maxPrice: 1800,
    minQty: 50,
    maxQty: 2500,
    expiryDays: [180, 730] as [number, number],
  },
  {
    category: 'Stationery',
    titles: [
      'Copier Grade A4 Copier Paper 75 GSM (500 sheets/ream)',
      'Retractable Gel Ink Ball Pens Blue (Pack of 50)',
      'Hardcover Ruled Executive Notebooks 200 Pages',
      'Heavy Duty Desktop Staplers + 5000 Pin Box',
      'Dry Erase Magnetic Whiteboard Markers Assorted (Pack of 12)',
      'Laser Toner Cartridges Compatible with HP LaserJet',
      'Permanent Chisel Tip Markers Black (Pack of 20)',
      'Self-Stick Note Pads 3x3 Yellow (12 Pads/Pack)',
      'Document Expanding File Folders 12 Pockets',
      'Thermal POS Billing Rolls 80mm x 50m'
    ],
    units: ['reams', 'packs', 'pieces', 'boxes'],
    minPrice: 45,
    maxPrice: 850,
    minQty: 40,
    maxQty: 1200,
    expiryDays: [180, 500] as [number, number],
  },
  {
    category: 'Cleaning',
    titles: [
      'Commercial Grade Disinfectant Floor Cleaner 5L Can',
      'Liquid Hand Soap Antibacterial Refill 5L Canister',
      'Bleach Based Multi-Surface Sanitizer Spray 500ml',
      'Industrial Microfiber Cleaning Cloths 40x40cm (Pack of 20)',
      'Commercial Wet & Dry Dust Mop with Telescopic Handle',
      'High Pressure Spray Bottles Heavy Duty 1L',
      'Concentrated Glass & Mirror Cleaner 5L Jug',
      'Heavy Duty Rubber Nitrile Safety Gloves (Pack of 50)',
      'Automatic Hand Sanitizer Wall Dispenser 1000ml',
      'Garbage Bags Heavy Duty Biodegradable 30x37 inch (Pack of 100)'
    ],
    units: ['cans', 'bottles', 'packs', 'pieces', 'jugs'],
    minPrice: 85,
    maxPrice: 950,
    minQty: 25,
    maxQty: 600,
    expiryDays: [60, 360] as [number, number],
  },
  {
    category: 'Textiles',
    titles: [
      'Industrial 100% Cotton Drill Overalls / Boiler Suits Navy',
      'Reusable 3-Ply Cotton Face Masks with Nose Clip (Pack of 100)',
      'Reflective High-Visibility Safety Vests Fluorescent Yellow',
      'Non-Woven Disposable Bouffant Hair Caps (Pack of 500)',
      'Microfiber Bath Towels Institutional Grade 70x140cm',
      'Waterproof Heavy Duty PVC Aprons Industrial',
      'Cotton Canvas Tote Bags Plain Natural for Printing',
      'Heat Resistant Leather Welding Gloves Pair',
      'Cleanroom Anti-Static Lab Coats White Unisex',
      'Thermal Fleece Winter Work Blankets Institutional'
    ],
    units: ['pieces', 'packs', 'pairs'],
    minPrice: 120,
    maxPrice: 1600,
    minQty: 30,
    maxQty: 900,
    expiryDays: [120, 600] as [number, number],
  },
  {
    category: 'Food & Beverages',
    titles: [
      'Organic Green Tea Pyramid Bags (Box of 100)',
      'Instant Coffee Granules Premium Blend 500g Jar',
      'Real Alphonso Mango Pulp Cans 850g',
      'Dark Chocolate Compound Slabs for Baking 1kg',
      'Assorted Fruit Juices Tetra Packs 200ml (Pack of 24)',
      'Roasted Salted Almonds Vacuum Pack 1kg',
      'Tomato Ketchup Commercial Dispenser Pack 5kg',
      'Mineral Water Bottles 500ml (Crate of 24)',
      'Eggless Mayonnaise Institutional Bucket 10kg',
      'Energy Drinks 250ml Aluminum Cans (Tray of 24)'
    ],
    units: ['boxes', 'jars', 'cans', 'packs', 'crates', 'buckets'],
    minPrice: 180,
    maxPrice: 2400,
    minQty: 20,
    maxQty: 450,
    expiryDays: [10, 90] as [number, number],
  },
];

const CHAT_DIALOGUES = [
  [
    'Hello! We saw your surplus listing and we have immediate demand. Are these ready for same-day dispatch?',
    'Yes, absolutely. The lot is palletized and ready at our warehouse. When can your carrier pick up?',
    'We can schedule transport for tomorrow morning. Could you provide a 5% volume concession if we take the full quantity?',
    'Agreed! I will confirm the reservation at the discounted rate now. Please inspect the lot upon arrival.',
    'Perfect. Thank you for the quick turnaround!'
  ],
  [
    'Hi, is the batch verified with test certificates / batch test reports?',
    'Yes, all COA and manufacturing batch sheets are intact with verified expiry dates.',
    'Excellent. We are confirming the reservation for 50 units. We will initiate local pickup.',
    'Confirmed on our end. Warehouse gate pass details have been generated.'
  ],
  [
    'Greetings! We have a stockout at our retail branches and need this urgently.',
    'We can load your truck today before 6 PM. All goods are packed in export grade cartons.',
    'Awesome! Reserving now. Sending our logistics coordinator contact.',
    'Looking forward to completing this trade smoothly.'
  ]
];

const REVIEW_COMMENTS = [
  'Seamless liquidation process! Stock was exactly as specified and dispatch was on schedule.',
  'Very reliable counterparty. Quality was spotless and pricing offered great margin.',
  'Fast communication and transparent batch documentation. Highly recommended trade partner!',
  'Saved us from a major stockout situation. Warehouse pickup was orderly and swift.',
  'Great surplus markdown discount. Will definitely do repeat business with this seller.'
];

function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

// ---------------------------------------------------------------------------
// Main Generator Execution
// ---------------------------------------------------------------------------
async function generate(userCount = 12, listingCount = 24, reservationCount = 6) {
  console.log('='.repeat(70));
  console.log('🚀 STOCKBRIDGE RANDOM MARKETPLACE GENERATOR');
  console.log('   Generating realistic customers, inventory & active trade flow');
  console.log('='.repeat(70));

  const passwordHash = await bcrypt.hash('password123', 10);
  const createdUsers: any[] = [];

  console.log(`\n👥 Generating ${userCount} commercial customers (buyers & sellers)...`);
  for (let i = 0; i < userCount; i++) {
    const city = sample(CITIES);
    const area = sample(city.areas);
    const firstName = sample(FIRST_NAMES);
    const lastName = sample(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const domain = sample(BUSINESS_DOMAINS);
    const suffix = sample(COMPANY_SUFFIXES);
    const businessName = `${lastName} ${domain} ${suffix}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randInt(100, 9999)}@stockbridge-demo.in`;
    const phone = `98${randInt(10000000, 99999999)}`;
    const lat = parseFloat((city.lat + (Math.random() - 0.5) * 0.08).toFixed(5));
    const lng = parseFloat((city.lng + (Math.random() - 0.5) * 0.08).toFixed(5));
    const address = `${area}, ${city.name}`;
    const rating = randFloat(3.8, 5.0, 1);
    const verified = Math.random() > 0.25;

    const user = await prisma.user.create({
      data: {
        name: fullName,
        email,
        phone,
        passwordHash,
        businessName,
        lat,
        lng,
        address,
        rating,
        verified,
        isAdmin: false,
        active: true,
      },
    });

    createdUsers.push({ ...user, cityName: city.name });
    console.log(`  ✓ [${city.name}] ${fullName} (${businessName})`);
  }

  console.log(`\n📦 Generating ${listingCount} surplus inventory lots...`);
  const createdListings: any[] = [];
  const urgencies = ['low', 'medium', 'high'] as const;

  for (let i = 0; i < listingCount; i++) {
    const seller = sample(createdUsers);
    const catData = sample(SURPLUS_CATALOG);
    const title = sample(catData.titles);
    const unit = sample(catData.units);
    const pricePerUnit = randFloat(catData.minPrice, catData.maxPrice);
    const quantity = randInt(catData.minQty, catData.maxQty);
    const urgency = sample([...urgencies]);
    const expDays = urgency === 'high'
      ? randInt(10, 15)
      : randInt(catData.expiryDays[0], catData.expiryDays[1]);
    const expiryDate = new Date(Date.now() + expDays * 24 * 60 * 60 * 1000);

    const listing = await prisma.listing.create({
      data: {
        sellerId: seller.id,
        title,
        category: catData.category,
        quantity,
        unit,
        pricePerUnit,
        urgency,
        expiryDate,
        status: 'active',
        active: true,
      },
    });

    createdListings.push({ ...listing, seller });
    console.log(`  ✓ [${catData.category}] ₹${pricePerUnit}/${unit} - ${title} (Qty: ${quantity})`);
  }

  console.log(`\n🤝 Generating ${reservationCount} active negotiations & transactions...`);
  const statuses = ['pending', 'confirmed', 'completed'] as const;

  for (let i = 0; i < reservationCount; i++) {
    const listing = sample(createdListings);
    const eligibleBuyers = createdUsers.filter((u) => u.id !== listing.seller.id);
    if (!eligibleBuyers.length) continue;
    const buyer = sample(eligibleBuyers);

    const status = sample([...statuses]);
    const discount = randFloat(0.85, 0.98);
    const agreedPrice = parseFloat((listing.pricePerUnit * discount).toFixed(2));
    const agreedQty = Math.round(listing.quantity * randFloat(0.2, 1.0));
    const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    const reservation = await prisma.reservation.create({
      data: {
        listingId: listing.id,
        buyerId: buyer.id,
        status,
        agreedPrice,
        agreedQty,
        expiresAt,
      },
    });

    // Messages
    const dialogue = sample(CHAT_DIALOGUES);
    for (let mIdx = 0; mIdx < dialogue.length; mIdx++) {
      const senderId = mIdx % 2 === 0 ? buyer.id : listing.seller.id;
      await prisma.message.create({
        data: {
          reservationId: reservation.id,
          senderId,
          text: dialogue[mIdx],
          read: true,
          createdAt: new Date(Date.now() - (dialogue.length - mIdx) * 5 * 60 * 1000),
        },
      });
    }

    // Rating if completed
    if (status === 'completed') {
      await prisma.rating.create({
        data: {
          fromUserId: buyer.id,
          toUserId: listing.seller.id,
          reservationId: reservation.id,
          score: randInt(4, 5),
          comment: sample(REVIEW_COMMENTS),
        },
      });
    }

    console.log(`  ✓ Deal #${i + 1}: ${buyer.name} ➔ ${listing.seller.name} [${status.toUpperCase()}] (₹${agreedPrice} x ${agreedQty} ${listing.unit})`);
  }

  console.log(`\n🎉 Random data generation successfully completed!`);
  console.log(`✨ Total Users: ${createdUsers.length} | Total Listings: ${createdListings.length} | Active Deals: ${reservationCount}`);
  console.log(`💡 Password for all generated test accounts is: password123\n`);
}

// Read CLI arguments
const args = process.argv.slice(2);
const userCount = parseInt(args.find((a) => a.startsWith('--users='))?.split('=')[1] || '12', 10);
const listingCount = parseInt(args.find((a) => a.startsWith('--listings='))?.split('=')[1] || '24', 10);
const resCount = parseInt(args.find((a) => a.startsWith('--reservations='))?.split('=')[1] || '6', 10);

generate(userCount, listingCount, resCount)
  .catch((e) => {
    console.error('Generation failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
