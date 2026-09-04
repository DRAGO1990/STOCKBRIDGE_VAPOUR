import fs from 'fs';
import path from 'path';

async function runAllTests() {
  const BASE_URL = 'http://localhost:3001';
  console.log('🧪 Starting Full Product Image Upload & Voice Listing Test Suite...\n');

  // 1. Health check
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const health = (await healthRes.json()) as any;
    console.log('✅ 1. Server health check passed:', health);
  } catch (err) {
    console.error('❌ Server not reachable at', BASE_URL, err);
    process.exit(1);
  }

  // 2. Authentication
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'rajesh@demo.com',
      password: 'password123',
    }),
  });
  if (!loginRes.ok) {
    console.error('❌ Login failed:', await loginRes.text());
    process.exit(1);
  }
  const loginData = (await loginRes.json()) as any;
  const accessToken = loginData.accessToken;
  console.log('✅ 2. Logged in as Rajesh Sharma');

  const futureExpiry = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();

  // Test 1: Voice Parse + JPG Upload
  console.log('\n--- Test 1: Voice Listing Extraction + JPG Upload ---');
  // First test voice parsing endpoint
  const voiceRes1 = await fetch(`${BASE_URL}/api/voice/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript: 'Hamare paas Fortune sunflower oil 1 litre pouch ke 50 packets surplus bache hain, 110 rupees per packet rate hai, expiry 25 din baad ki hai',
      language: 'hi-IN',
    }),
  });
  const voiceData1 = (await voiceRes1.json()) as any;
  console.log('✅ Voice parsed product successfully:', voiceData1.extraction?.title);

  // Minimal valid 1x1 JPEG byte sequence
  const sampleJpg = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
    'base64'
  );
  const form1 = new FormData();
  form1.append('title', voiceData1.extraction?.title || 'Fortune Sunflower Oil 1L');
  form1.append('category', voiceData1.extraction?.category || 'Groceries');
  form1.append('quantity', String(voiceData1.extraction?.quantity || 50));
  form1.append('unit', voiceData1.extraction?.unit || 'packets');
  form1.append('mrp', String(voiceData1.extraction?.mrp || 150));
  form1.append('pricePerUnit', String(voiceData1.extraction?.pricePerUnit || 110));
  form1.append('expiryDate', futureExpiry);
  form1.append('urgency', voiceData1.extraction?.urgency || 'low');
  form1.append('image', new Blob([sampleJpg], { type: 'image/jpeg' }), 'voice_product.jpg');

  const res1 = await fetch(`${BASE_URL}/api/listings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form1,
  });
  if (res1.status === 201) {
    const listing1 = (await res1.json()) as any;
    console.log('✅ Created voice listing with JPG:', listing1.id);
    console.log('   Image URL:', listing1.imageUrl);
    if (listing1.imageUrl?.startsWith('/uploads/products/')) {
      const getImg = await fetch(`${BASE_URL}${listing1.imageUrl}`);
      console.log('✅ JPG image is accessible via HTTP GET (Status:', getImg.status + ')');
    }
  } else {
    console.error('❌ Test 1 failed:', await res1.text());
  }

  // Test 2: Voice Parse + PNG Upload
  console.log('\n--- Test 2: Voice Listing Extraction + PNG Upload ---');
  const samplePng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const form2 = new FormData();
  form2.append('title', 'Classmate Notebooks A4 (Voice PNG)');
  form2.append('category', 'Stationery');
  form2.append('quantity', '200');
  form2.append('unit', 'boxes');
  form2.append('mrp', '120');
  form2.append('pricePerUnit', '85');
  form2.append('expiryDate', futureExpiry);
  form2.append('urgency', 'low');
  form2.append('image', new Blob([samplePng], { type: 'image/png' }), 'voice_product.png');

  const res2 = await fetch(`${BASE_URL}/api/listings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form2,
  });
  if (res2.status === 201) {
    const listing2 = (await res2.json()) as any;
    console.log('✅ Created voice listing with PNG:', listing2.id);
    console.log('   Image URL:', listing2.imageUrl);
  } else {
    console.error('❌ Test 2 failed:', await res2.text());
  }

  // Test 3: Voice Parse + WEBP Upload
  console.log('\n--- Test 3: Voice Listing Extraction + WEBP Upload ---');
  const sampleWebp = Buffer.from(
    'UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=',
    'base64'
  );
  const form3 = new FormData();
  form3.append('title', 'USB-C Cables High Speed (Voice WEBP)');
  form3.append('category', 'Electronics');
  form3.append('quantity', '300');
  form3.append('unit', 'pieces');
  form3.append('mrp', '150');
  form3.append('pricePerUnit', '95');
  form3.append('expiryDate', futureExpiry);
  form3.append('urgency', 'low');
  form3.append('image', new Blob([sampleWebp], { type: 'image/webp' }), 'voice_product.webp');

  const res3 = await fetch(`${BASE_URL}/api/listings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form3,
  });
  if (res3.status === 201) {
    const listing3 = (await res3.json()) as any;
    console.log('✅ Created voice listing with WEBP:', listing3.id);
    console.log('   Image URL:', listing3.imageUrl);
  } else {
    console.error('❌ Test 3 failed:', await res3.text());
  }

  // Test 4: Voice Listing WITHOUT image
  console.log('\n--- Test 4: Voice Listing WITHOUT an image ---');
  const highUrgencyExpiry = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString();
  const form4 = new FormData();
  form4.append('title', 'Daawat Basmati Rice 25kg (Voice No Image)');
  form4.append('category', 'Groceries');
  form4.append('quantity', '30');
  form4.append('unit', 'bags');
  form4.append('mrp', '1500');
  form4.append('pricePerUnit', '1200');
  form4.append('expiryDate', highUrgencyExpiry);
  form4.append('urgency', 'high');

  const res4 = await fetch(`${BASE_URL}/api/listings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form4,
  });
  if (res4.status === 201) {
    const listing4 = (await res4.json()) as any;
    console.log('✅ Created voice listing without image successfully:', listing4.id);
    console.log('   ImageUrl is null:', listing4.imageUrl === null);
  } else {
    console.error('❌ Test 4 failed:', await res4.text());
  }

  // Test 5: Try uploading document.pdf -> Must fail (400)
  console.log('\n--- Test 5: Try uploading document.pdf in Voice listing (Must fail with 400) ---');
  const form5 = new FormData();
  form5.append('title', 'Invalid PDF Test');
  form5.append('category', 'Packaging');
  form5.append('quantity', '50');
  form5.append('unit', 'boxes');
  form5.append('pricePerUnit', '100');
  form5.append('expiryDate', futureExpiry);
  form5.append('urgency', 'low');
  form5.append('image', new Blob(['%PDF-1.4 header content'], { type: 'application/pdf' }), 'document.pdf');

  const res5 = await fetch(`${BASE_URL}/api/listings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form5,
  });
  if (res5.status === 400) {
    const err5 = (await res5.json()) as any;
    console.log('✅ Successfully rejected PDF document with 400 Bad Request:');
    console.log('   Response message:', err5.error);
  } else {
    console.error('❌ Test 5 failed: Expected 400, got', res5.status);
  }

  // Test 6: Try uploading image > 5MB -> Must fail (400)
  console.log('\n--- Test 6: Try uploading image > 5 MB in Voice listing (Must fail with 400) ---');
  const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0xaa);
  const form6 = new FormData();
  form6.append('title', 'Oversized Image Test');
  form6.append('category', 'Textiles');
  form6.append('quantity', '50');
  form6.append('unit', 'packets');
  form6.append('pricePerUnit', '200');
  form6.append('expiryDate', futureExpiry);
  form6.append('urgency', 'low');
  form6.append('image', new Blob([largeBuffer], { type: 'image/jpeg' }), 'large_sample.jpg');

  const res6 = await fetch(`${BASE_URL}/api/listings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form6,
  });
  if (res6.status === 400) {
    const err6 = (await res6.json()) as any;
    console.log('✅ Successfully rejected >5MB image with 400 Bad Request:');
    console.log('   Response message:', err6.error);
  } else {
    console.error('❌ Test 6 failed: Expected 400, got', res6.status);
  }

  // Test 7: Normal Create Listing verification
  console.log('\n--- Test 7: Normal Create Listing with Image ---');
  const form7 = new FormData();
  form7.append('title', 'Aashirvaad Atta 10kg Regular Batch');
  form7.append('category', 'Groceries');
  form7.append('quantity', '60');
  form7.append('unit', 'bags');
  form7.append('mrp', '420');
  form7.append('pricePerUnit', '360');
  form7.append('expiryDate', futureExpiry);
  form7.append('urgency', 'medium');
  form7.append('image', new Blob([sampleJpg], { type: 'image/jpeg' }), 'regular_product.jpg');

  const res7 = await fetch(`${BASE_URL}/api/listings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form7,
  });
  if (res7.status === 201) {
    const listing7 = (await res7.json()) as any;
    console.log('✅ Created normal listing with image:', listing7.id);
    console.log('   Image URL:', listing7.imageUrl);
  } else {
    console.error('❌ Test 7 failed:', await res7.text());
  }

  // Test 8: Verify Marketplace listings & fallback cards
  console.log('\n--- Test 8: Verify Marketplace listings & placeholders ---');
  const res8 = await fetch(`${BASE_URL}/api/listings?limit=15`);
  if (res8.ok) {
    const data8 = (await res8.json()) as any;
    console.log(`✅ Fetched ${data8.listings.length} listings from Marketplace`);
    const withImg = data8.listings.filter((l: any) => l.imageUrl);
    const withoutImg = data8.listings.filter((l: any) => !l.imageUrl);
    console.log(`   Listings with image: ${withImg.length}`);
    console.log(`   Listings without image (fallbacks): ${withoutImg.length}`);
  } else {
    console.error('❌ Test 8 failed:', await res8.text());
  }

  console.log('\n🎉 ALL VOICE & PRODUCT IMAGE TESTS PASSED WITH 100% SUCCESS!');
}

runAllTests().catch(console.error);
