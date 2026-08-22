import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean
  await prisma.rating.deleteMany();
  await prisma.message.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('password123', 12);

  // Geographic clusters (Indian cities for rupee pricing)
  // Cluster 1: Mumbai area (19.07°N, 72.87°E)
  // Cluster 2: Delhi area (28.61°N, 77.20°E)
  // Cluster 3: Bangalore area (12.97°N, 77.59°E)
  // Cluster 4: Hyderabad area (17.38°N, 78.47°E)

  const users = await Promise.all([
    // Cluster 1 — Mumbai
    prisma.user.create({ data: { name: 'Rajesh Sharma', email: 'rajesh@demo.com', passwordHash: hash, businessName: 'Sharma Wholesale', phone: '9876543210', lat: 19.076, lng: 72.877, address: 'Andheri West, Mumbai', rating: 4.5, verified: true } }),
    prisma.user.create({ data: { name: 'Priya Patel', email: 'priya@demo.com', passwordHash: hash, businessName: 'Patel Traders', phone: '9876543211', lat: 19.060, lng: 72.850, address: 'Bandra, Mumbai', rating: 4.2, verified: true } }),
    prisma.user.create({ data: { name: 'Amit Desai', email: 'amit@demo.com', passwordHash: hash, businessName: 'Desai Electronics', phone: '9876543212', lat: 19.090, lng: 72.900, address: 'Powai, Mumbai', rating: 3.8, verified: true } }),
    // Cluster 2 — Delhi
    prisma.user.create({ data: { name: 'Suresh Kumar', email: 'suresh@demo.com', passwordHash: hash, businessName: 'Kumar Groceries', phone: '9876543213', lat: 28.613, lng: 77.209, address: 'Connaught Place, Delhi', rating: 4.7, verified: true } }),
    prisma.user.create({ data: { name: 'Neha Gupta', email: 'neha@demo.com', passwordHash: hash, businessName: 'Gupta Stationery', phone: '9876543214', lat: 28.630, lng: 77.220, address: 'Karol Bagh, Delhi', rating: 4.0, verified: true } }),
    prisma.user.create({ data: { name: 'Vikram Singh', email: 'vikram@demo.com', passwordHash: hash, businessName: 'Singh Supplies', phone: '9876543215', lat: 28.600, lng: 77.190, address: 'Nehru Place, Delhi', rating: 3.5 } }),
    // Cluster 3 — Bangalore
    prisma.user.create({ data: { name: 'Lakshmi Rao', email: 'lakshmi@demo.com', passwordHash: hash, businessName: 'Rao Fresh Foods', phone: '9876543216', lat: 12.971, lng: 77.594, address: 'MG Road, Bangalore', rating: 4.8, verified: true } }),
    prisma.user.create({ data: { name: 'Karthik Reddy', email: 'karthik@demo.com', passwordHash: hash, businessName: 'Reddy Tech Hub', phone: '9876543217', lat: 12.980, lng: 77.610, address: 'Indiranagar, Bangalore', rating: 4.1 } }),
    // Cluster 4 — Hyderabad
    prisma.user.create({ data: { name: 'Fatima Khan', email: 'fatima@demo.com', passwordHash: hash, businessName: 'Khan Trading Co', phone: '9876543218', lat: 17.385, lng: 78.486, address: 'Banjara Hills, Hyderabad', rating: 4.4, verified: true } }),
    prisma.user.create({ data: { name: 'Ravi Teja', email: 'ravi@demo.com', passwordHash: hash, businessName: 'Teja Wholesale', phone: '9876543219', lat: 17.400, lng: 78.500, address: 'Jubilee Hills, Hyderabad', rating: 3.9 } }),
    // Admin user
    prisma.user.create({ data: { name: 'Admin', email: 'admin@stockbridge.com', passwordHash: hash, businessName: 'StockBridge Admin', phone: '9999999999', lat: 19.076, lng: 72.877, address: 'Mumbai', isAdmin: true, verified: true, rating: 5.0 } }),
  ]);

  const [rajesh, priya, amit, suresh, neha, vikram, lakshmi, karthik, fatima, ravi] = users;

  const now = new Date();
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  // Create 20 listings across categories
  const listings = await Promise.all([
    // Groceries
    prisma.listing.create({ data: { sellerId: rajesh.id, title: 'Basmati Rice Premium 25kg bags', category: 'Groceries', quantity: 50, unit: 'bags', pricePerUnit: 1200, urgency: 'medium', expiryDate: daysFromNow(90) } }),
    prisma.listing.create({ data: { sellerId: suresh.id, title: 'Toor Dal 1kg packets', category: 'Groceries', quantity: 200, unit: 'packets', pricePerUnit: 145, urgency: 'high', expiryDate: daysFromNow(5) } }),
    prisma.listing.create({ data: { sellerId: lakshmi.id, title: 'Fresh Coconut Oil 1L bottles', category: 'Groceries', quantity: 100, unit: 'bottles', pricePerUnit: 220, urgency: 'medium', expiryDate: daysFromNow(30) } }),
    prisma.listing.create({ data: { sellerId: fatima.id, title: 'Atta Flour 10kg bags', category: 'Groceries', quantity: 80, unit: 'bags', pricePerUnit: 380, urgency: 'low', expiryDate: daysFromNow(60) } }),
    prisma.listing.create({ data: { sellerId: priya.id, title: 'Cooking Oil Sunflower 5L cans', category: 'Groceries', quantity: 60, unit: 'cans', pricePerUnit: 650, urgency: 'high', expiryDate: daysFromNow(3) } }),

    // Stationery
    prisma.listing.create({ data: { sellerId: neha.id, title: 'A4 Copy Paper 500 sheets ream', category: 'Stationery', quantity: 500, unit: 'reams', pricePerUnit: 180, urgency: 'low' } }),
    prisma.listing.create({ data: { sellerId: vikram.id, title: 'Ball Pens Blue Pack of 20', category: 'Stationery', quantity: 300, unit: 'packs', pricePerUnit: 85, urgency: 'medium' } }),
    prisma.listing.create({ data: { sellerId: rajesh.id, title: 'Spiral Notebooks 200 pages', category: 'Stationery', quantity: 400, unit: 'pieces', pricePerUnit: 65, urgency: 'low' } }),
    prisma.listing.create({ data: { sellerId: fatima.id, title: 'Printer Ink Cartridges HP Compatible', category: 'Stationery', quantity: 50, unit: 'pieces', pricePerUnit: 450, urgency: 'medium' } }),

    // Electronics
    prisma.listing.create({ data: { sellerId: amit.id, title: 'USB-C Charging Cables 1m', category: 'Electronics', quantity: 200, unit: 'pieces', pricePerUnit: 120, urgency: 'low' } }),
    prisma.listing.create({ data: { sellerId: karthik.id, title: 'Bluetooth Earbuds TWS', category: 'Electronics', quantity: 50, unit: 'pieces', pricePerUnit: 850, urgency: 'medium' } }),
    prisma.listing.create({ data: { sellerId: ravi.id, title: 'LED Desk Lamps Adjustable', category: 'Electronics', quantity: 30, unit: 'pieces', pricePerUnit: 550, urgency: 'high', expiryDate: daysFromNow(7) } }),
    prisma.listing.create({ data: { sellerId: amit.id, title: 'Power Bank 10000mAh', category: 'Electronics', quantity: 100, unit: 'pieces', pricePerUnit: 750, urgency: 'low' } }),

    // Packaging
    prisma.listing.create({ data: { sellerId: suresh.id, title: 'Corrugated Boxes 12x10x8 inch', category: 'Packaging', quantity: 1000, unit: 'pieces', pricePerUnit: 25, urgency: 'low' } }),
    prisma.listing.create({ data: { sellerId: priya.id, title: 'Bubble Wrap Roll 100m', category: 'Packaging', quantity: 20, unit: 'rolls', pricePerUnit: 900, urgency: 'medium' } }),

    // Cleaning
    prisma.listing.create({ data: { sellerId: lakshmi.id, title: 'Floor Cleaner 5L Cans', category: 'Cleaning', quantity: 40, unit: 'cans', pricePerUnit: 280, urgency: 'low', expiryDate: daysFromNow(180) } }),
    prisma.listing.create({ data: { sellerId: vikram.id, title: 'Hand Sanitizer 500ml bottles', category: 'Cleaning', quantity: 150, unit: 'bottles', pricePerUnit: 95, urgency: 'high', expiryDate: daysFromNow(10) } }),

    // Textiles
    prisma.listing.create({ data: { sellerId: fatima.id, title: 'Cotton Face Masks Pack of 50', category: 'Textiles', quantity: 200, unit: 'packs', pricePerUnit: 350, urgency: 'medium' } }),
    prisma.listing.create({ data: { sellerId: ravi.id, title: 'Industrial Aprons Heavy Duty', category: 'Textiles', quantity: 100, unit: 'pieces', pricePerUnit: 200, urgency: 'low' } }),

    // Food & Beverages
    prisma.listing.create({ data: { sellerId: suresh.id, title: 'Green Tea Bags Box of 100', category: 'Food & Beverages', quantity: 60, unit: 'boxes', pricePerUnit: 320, urgency: 'medium', expiryDate: daysFromNow(120) } }),
  ]);

  // Create reservations
  const reservations = await Promise.all([
    // Confirmed reservation
    prisma.reservation.create({
      data: { listingId: listings[0].id, buyerId: priya.id, status: 'confirmed', agreedPrice: 1150, agreedQty: 10 },
    }),
    // Completed reservation
    prisma.reservation.create({
      data: { listingId: listings[5].id, buyerId: suresh.id, status: 'completed', agreedPrice: 175, agreedQty: 100 },
    }),
    // Pending reservation
    prisma.reservation.create({
      data: {
        listingId: listings[9].id, buyerId: lakshmi.id, status: 'pending', agreedPrice: 110, agreedQty: 50,
        expiresAt: daysFromNow(1),
      },
    }),
    // Another completed
    prisma.reservation.create({
      data: { listingId: listings[10].id, buyerId: fatima.id, status: 'completed', agreedPrice: 800, agreedQty: 5 },
    }),
  ]);

  // Update listing statuses for reserved/sold listings
  await prisma.listing.update({ where: { id: listings[0].id }, data: { status: 'reserved' } });
  await prisma.listing.update({ where: { id: listings[5].id }, data: { status: 'sold' } });
  await prisma.listing.update({ where: { id: listings[9].id }, data: { status: 'reserved' } });
  await prisma.listing.update({ where: { id: listings[10].id }, data: { status: 'sold' } });

  // Create messages for confirmed reservation
  await prisma.message.createMany({
    data: [
      { reservationId: reservations[0].id, senderId: priya.id, text: 'Hi, I\'d like to buy 10 bags of Basmati Rice. Can you do 1150 per bag?', read: true },
      { reservationId: reservations[0].id, senderId: rajesh.id, text: 'Yes, 1150 works for 10+ bags. When do you need delivery?', read: true },
      { reservationId: reservations[0].id, senderId: priya.id, text: 'Can you deliver by Thursday?', read: false },
    ],
  });

  // Create ratings for completed reservations
  await prisma.rating.create({
    data: { fromUserId: suresh.id, toUserId: neha.id, reservationId: reservations[1].id, score: 5, comment: 'Excellent quality paper, fast delivery!' },
  });
  await prisma.rating.create({
    data: { fromUserId: neha.id, toUserId: suresh.id, reservationId: reservations[1].id, score: 4, comment: 'Good buyer, prompt payment.' },
  });
  await prisma.rating.create({
    data: { fromUserId: fatima.id, toUserId: karthik.id, reservationId: reservations[3].id, score: 4, comment: 'Good product but slightly delayed.' },
  });

  console.log('✅ Seeded:');
  console.log(`   ${users.length} users (admin: admin@stockbridge.com / password123)`);
  console.log(`   ${listings.length} listings`);
  console.log(`   ${reservations.length} reservations`);
  console.log('   3 ratings');
  console.log('   3 messages');
  console.log('\n📧 All demo users use password: password123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
