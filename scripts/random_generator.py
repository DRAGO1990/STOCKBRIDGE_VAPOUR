#!/usr/bin/env python3
"""
StockBridge Random Marketplace Data Generator (Python)
======================================================
Generates realistic random customers, buyers, sellers, surplus inventory listings,
reservations, negotiation chat threads, and peer reviews for the StockBridge platform.

Supports:
  1. API Mode (--mode api): Connects via HTTP REST API to a running StockBridge server.
  2. Direct DB Mode (--mode db): Injects data directly into the SQLite database.
  3. Stream / Live Mode (--mode stream): Continuously emits new listings & transactions.

Usage:
  python scripts/random_generator.py --help
  python scripts/random_generator.py --mode api --users 10 --listings 25
  python scripts/random_generator.py --mode db --users 20 --listings 50
  python scripts/random_generator.py --mode stream --interval 5
"""

import argparse
import datetime
import json
import os
import random
import sqlite3
import sys
import time
import urllib.error
import urllib.request
import uuid

# ---------------------------------------------------------------------------
# Data Pools: Commercial Hubs & Geospatial Clusters in India
# ---------------------------------------------------------------------------
CITIES = [
    {
        "name": "Mumbai (MH)",
        "lat": 19.0760,
        "lng": 72.8777,
        "areas": ["Andheri East", "Bandra Kurla Complex", "Lower Parel", "Powai", "Navi Mumbai MIDC", "Thane West", "Bhiwandi Logistics Park"],
    },
    {
        "name": "Delhi NCR",
        "lat": 28.6139,
        "lng": 77.2090,
        "areas": ["Connaught Place", "Okhla Industrial Area", "Karol Bagh", "Gurugram Cyber Hub", "Noida Sector 62", "Manesar Industrial Zone"],
    },
    {
        "name": "Bangalore (KA)",
        "lat": 12.9716,
        "lng": 77.5946,
        "areas": ["Peenya Industrial Area", "Electronic City", "Whitefield", "Indiranagar", "Koramangala", "Bommasandra Industrial Area"],
    },
    {
        "name": "Hyderabad (TG)",
        "lat": 17.3850,
        "lng": 78.4867,
        "areas": ["Banjara Hills", "Jubilee Hills", "HITEC City", "Sanathnagar Industrial Estate", "Cherlapally", "Madhapur"],
    },
    {
        "name": "Chennai (TN)",
        "lat": 13.0827,
        "lng": 80.2707,
        "areas": ["Guindy Industrial Estate", "Ambattur", "T. Nagar", "Sriperumbudur", "Ennore Port Road"],
    },
    {
        "name": "Pune (MH)",
        "lat": 18.5204,
        "lng": 73.8567,
        "areas": ["Bhosari MIDC", "Chakan Industrial Belt", "Hinjawadi Phase 1", "Hadapsar", "Pimpri-Chinchwad"],
    },
    {
        "name": "Ahmedabad (GJ)",
        "lat": 23.0225,
        "lng": 72.5714,
        "areas": ["Sanand GIDC", "Naroda Industrial Estate", "Vatva GIDC", "SG Highway", "Changodar"],
    },
    {
        "name": "Kolkata (WB)",
        "lat": 22.5726,
        "lng": 88.3639,
        "areas": ["Salt Lake Sector V", "Howrah Wholesale Hub", "Taratala Industrial Area", "Park Street", "Rajarhat"],
    },
]

FIRST_NAMES = [
    "Rajesh", "Priya", "Amit", "Suresh", "Neha", "Vikram", "Lakshmi", "Karthik",
    "Fatima", "Ravi", "Ananya", "Rohan", "Sneha", "Aditya", "Pooja", "Arjun",
    "Meera", "Deepak", "Swati", "Manoj", "Divya", "Sanjay", "Kavita", "Gaurav",
    "Ritu", "Harish", "Aarti", "Nitin", "Shweta", "Alok", "Simran", "Rahul"
]

LAST_NAMES = [
    "Sharma", "Patel", "Desai", "Kumar", "Gupta", "Singh", "Rao", "Reddy",
    "Khan", "Teja", "Iyer", "Mehta", "Verma", "Joshi", "Bose", "Nair",
    "Chopra", "Shah", "Malhotra", "Agarwal", "Mukherjee", "Shetty", "Bhatia"
]

COMPANY_SUFFIXES = [
    "Enterprises", "Traders", "Wholesale Hub", "Supplies Ltd", "Distribution Co",
    "Logistics & Trade", "Commercials", "Supply Chain Solutions", "Industries",
    "Wholesale Depot", "Imports & Exports", "Stockists"
]

BUSINESS_DOMAINS = [
    "Agro", "Tech", "Metro", "Prime", "Universal", "Apex", "Zenith", "Sunrise",
    "National", "Om", "Sai", "Evergreen", "Rapid", "Direct", "Global", "Imperial"
]

# ---------------------------------------------------------------------------
# Catalog of Realistic Surplus Inventory Lots
# ---------------------------------------------------------------------------
SURPLUS_CATALOG = [
    # Groceries
    {
        "category": "Groceries",
        "titles": [
            "Premium Royal Basmati Rice 25kg Bags",
            "Refined Sunflower Cooking Oil 5L Cans",
            "Organic Toor Dal 1kg Sealed Packs",
            "Whole Wheat Chakki Atta 10kg Bags",
            "White Crystal Refined Sugar 50kg Sacks",
            "Pure Cow Ghee 1L Tin Packets",
            "Assam Gold CTC Black Tea 5kg Master Bag",
            "Iodized Table Salt 1kg Poly Packs",
            "Red Chilli Powder Stemless 500g Packs",
            "Premium Cashew Nuts W320 10kg Vacuum Box"
        ],
        "units": ["bags", "cans", "packets", "sacks", "tins", "boxes"],
        "price_range": (150, 4500),
        "qty_range": (20, 500),
        "expiry_days": (15, 120),
    },
    # Electronics
    {
        "category": "Electronics",
        "titles": [
            "Braided Nylon USB-C Fast Charging Cables 1.5m",
            "Magnetic Wireless Power Bank 10000mAh",
            "Smart Bluetooth 5.3 TWS Earbuds with ANC",
            "Heavy Duty Surge Protector Power Strips 6-Way",
            "Adjustable LED Desk Lamps 12W with Dimmer",
            "1080p FHD USB Webcams with Stereo Mic",
            "CAT6 Ethernet Patch Cables 5m Bulk Pack",
            "Multi-Port 65W GaN Laptop Chargers",
            "Universal Travel Adapter with PD 30W",
            "HDMI 2.1 Ultra High Speed Cables 2m"
        ],
        "units": ["pieces", "packs", "boxes"],
        "price_range": (120, 2200),
        "qty_range": (30, 800),
        "expiry_days": (90, 365),
    },
    # Packaging
    {
        "category": "Packaging",
        "titles": [
            "3-Ply Corrugated Shipping Boxes 12x10x8 inch",
            "5-Ply Heavy Duty Export Master Cartons 18x14x12 inch",
            "Air Bubble Cushioning Wrap Roll 100m x 1m",
            "Transparent BOPP Packaging Tape Rolls 65m x 2inch",
            "Cast Stretch Film Pallet Wrap Rolls 23 Micron",
            "Self-Adhesive Courier Tamper Evident Bags 10x12",
            "Eco-Friendly Honeycomb Paper Wrap Rolls 50m",
            "Thermal Barcode Label Rolls 50x25mm (1000 labels)",
            "Heavy Duty PP Strapping Rolls 12mm",
            "Moisture Absorbing Silica Gel Pouches 5g (Pack of 500)"
        ],
        "units": ["pieces", "rolls", "cartons", "packs"],
        "price_range": (15, 1800),
        "qty_range": (50, 2500),
        "expiry_days": (180, 730),
    },
    # Stationery
    {
        "category": "Stationery",
        "titles": [
            "Copier Grade A4 Copier Paper 75 GSM (500 sheets/ream)",
            "Retractable Gel Ink Ball Pens Blue (Pack of 50)",
            "Hardcover Ruled Executive Notebooks 200 Pages",
            "Heavy Duty Desktop Staplers + 5000 Pin Box",
            "Dry Erase Magnetic Whiteboard Markers Assorted (Pack of 12)",
            "Laser Toner Cartridges Compatible with HP LaserJet",
            "Permanent Chisel Tip Markers Black (Pack of 20)",
            "Self-Stick Note Pads 3x3 Yellow (12 Pads/Pack)",
            "Document Expanding File Folders 12 Pockets",
            "Thermal POS Billing Rolls 80mm x 50m"
        ],
        "units": ["reams", "packs", "pieces", "boxes"],
        "price_range": (45, 850),
        "qty_range": (40, 1200),
        "expiry_days": (180, 500),
    },
    # Cleaning & Industrial
    {
        "category": "Cleaning",
        "titles": [
            "Commercial Grade Disinfectant Floor Cleaner 5L Can",
            "Liquid Hand Soap Antibacterial Refill 5L Canister",
            "Bleach Based Multi-Surface Sanitizer Spray 500ml",
            "Industrial Microfiber Cleaning Cloths 40x40cm (Pack of 20)",
            "Commercial Wet & Dry Dust Mop with Telescopic Handle",
            "High Pressure Spray Bottles Heavy Duty 1L",
            "Concentrated Glass & Mirror Cleaner 5L Jug",
            "Heavy Duty Rubber Nitrile Safety Gloves (Pack of 50)",
            "Automatic Hand Sanitizer Wall Dispenser 1000ml",
            "Garbage Bags Heavy Duty Biodegradable 30x37 inch (Pack of 100)"
        ],
        "units": ["cans", "bottles", "packs", "pieces", "jugs"],
        "price_range": (85, 950),
        "qty_range": (25, 600),
        "expiry_days": (60, 360),
    },
    # Textiles & PPE
    {
        "category": "Textiles",
        "titles": [
            "Industrial 100% Cotton Drill Overalls / Boiler Suits Navy",
            "Reusable 3-Ply Cotton Face Masks with Nose Clip (Pack of 100)",
            "Reflective High-Visibility Safety Vests Fluorescent Yellow",
            "Non-Woven Disposable Bouffant Hair Caps (Pack of 500)",
            "Microfiber Bath Towels Institutional Grade 70x140cm",
            "Waterproof Heavy Duty PVC Aprons Industrial",
            "Cotton Canvas Tote Bags Plain Natural for Printing",
            "Heat Resistant Leather Welding Gloves Pair",
            "Cleanroom Anti-Static Lab Coats White Unisex",
            "Thermal Fleece Winter Work Blankets Institutional"
        ],
        "units": ["pieces", "packs", "pairs"],
        "price_range": (120, 1600),
        "qty_range": (30, 900),
        "expiry_days": (120, 600),
    },
    # Food & Beverages
    {
        "category": "Food & Beverages",
        "titles": [
            "Organic Green Tea Pyramid Bags (Box of 100)",
            "Instant Coffee Granules Premium Blend 500g Jar",
            "Real Alphonso Mango Pulp Cans 850g",
            "Dark Chocolate Compound Slabs for Baking 1kg",
            "Assorted Fruit Juices Tetra Packs 200ml (Pack of 24)",
            "Roasted Salted Almonds Vacuum Pack 1kg",
            "Tomato Ketchup Commercial Dispenser Pack 5kg",
            "Mineral Water Bottles 500ml (Crate of 24)",
            "Eggless Mayonnaise Institutional Bucket 10kg",
            "Energy Drinks 250ml Aluminum Cans (Tray of 24)"
        ],
        "units": ["boxes", "jars", "cans", "packs", "crates", "buckets"],
        "price_range": (180, 2400),
        "qty_range": (20, 450),
        "expiry_days": (10, 90),
    },
]

CHAT_DIALOGUES = [
    [
        "Hello! We saw your surplus listing and we have immediate demand. Are these ready for same-day dispatch?",
        "Yes, absolutely. The lot is palletized and ready at our warehouse. When can your carrier pick up?",
        "We can schedule transport for tomorrow morning. Could you provide a 5% volume concession if we take the full quantity?",
        "Agreed! I'll confirm the reservation at the discounted rate now. Please inspect the lot upon arrival.",
        "Perfect. Thank you for the quick turnaround!"
    ],
    [
        "Hi, is the batch verified with test certificates / batch test reports?",
        "Yes, all COA and manufacturing batch sheets are intact with verified expiry dates.",
        "Excellent. We are confirming the reservation for 50 units. We will initiate local pickup.",
        "Confirmed on our end. Warehouse gate pass details have been generated."
    ],
    [
        "Greetings! We have a stockout at our retail branches and need this urgently.",
        "We can load your truck today before 6 PM. All goods are packed in export grade cartons.",
        "Awesome! Reserving now. Sending our logistics coordinator's contact.",
        "Looking forward to completing this trade smoothly."
    ]
]

REVIEW_COMMENTS = [
    "Seamless liquidation process! Stock was exactly as specified and dispatch was on schedule.",
    "Very reliable counterparty. Quality was spotless and pricing offered great margin.",
    "Fast communication and transparent batch documentation. Highly recommended trade partner!",
    "Saved us from a major stockout situation. Warehouse pickup was orderly and swift.",
    "Great surplus markdown discount. Will definitely do repeat business with this seller."
]

# ---------------------------------------------------------------------------
# Generator Core Functions
# ---------------------------------------------------------------------------

def generate_random_user(index: int, total: int):
    """Creates realistic user profile metadata."""
    city_info = random.choice(CITIES)
    area = random.choice(city_info["areas"])
    first_name = random.choice(FIRST_NAMES)
    last_name = random.choice(LAST_NAMES)
    full_name = f"{first_name} {last_name}"
    
    business_domain = random.choice(BUSINESS_DOMAINS)
    business_suffix = random.choice(COMPANY_SUFFIXES)
    business_name = f"{last_name} {business_domain} {business_suffix}"
    
    # Generate unique email
    clean_first = first_name.lower()
    clean_last = last_name.lower()
    rand_suffix = random.randint(100, 9999)
    email = f"{clean_first}.{clean_last}{rand_suffix}@stockbridge-demo.in"
    phone = f"98{random.randint(10000000, 99999999)}"
    
    # Slight jitter around city coordinates
    lat_jitter = (random.random() - 0.5) * 0.08
    lng_jitter = (random.random() - 0.5) * 0.08
    lat = round(city_info["lat"] + lat_jitter, 5)
    lng = round(city_info["lng"] + lng_jitter, 5)
    address = f"{area}, {city_info['name']}"
    
    rating = round(random.uniform(3.8, 5.0), 1)
    verified = random.choice([True, True, True, False])  # 75% verified
    
    return {
        "name": full_name,
        "email": email,
        "password": "password123",
        "phone": phone,
        "businessName": business_name,
        "lat": lat,
        "lng": lng,
        "address": address,
        "rating": rating,
        "verified": verified,
        "cityName": city_info["name"],
    }


def generate_random_listing(seller_id: str):
    """Creates realistic surplus lot listing metadata."""
    category_data = random.choice(SURPLUS_CATALOG)
    title = random.choice(category_data["titles"])
    unit = random.choice(category_data["units"])
    
    min_price, max_price = category_data["price_range"]
    price_per_unit = round(random.uniform(min_price, max_price), 2)
    
    min_qty, max_qty = category_data["qty_range"]
    quantity = float(random.randint(min_qty, max_qty))
    
    urgency = random.choices(["low", "medium", "high"], weights=[40, 35, 25])[0]
    
    # Expiry date
    if urgency == "high":
        days_to_exp = random.randint(10, 15)
    else:
        min_exp, max_exp = category_data["expiry_days"]
        days_to_exp = random.randint(min_exp, max_exp)
    expiry_date = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=days_to_exp)).isoformat()
    
    return {
        "sellerId": seller_id,
        "title": title,
        "category": category_data["category"],
        "quantity": quantity,
        "unit": unit,
        "pricePerUnit": price_per_unit,
        "urgency": urgency,
        "expiryDate": expiry_date,
        "status": "active",
        "active": True
    }


# ---------------------------------------------------------------------------
# Execution Mode 1: HTTP REST API Connector
# ---------------------------------------------------------------------------
class ApiConnector:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")

    def _post(self, endpoint: str, data: dict, token: str = None):
        url = f"{self.base_url}{endpoint}"
        payload = json.dumps(data).encode("utf-8")
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = response.read().decode("utf-8")
                return json.loads(res_body) if res_body else {}
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8")
            raise Exception(f"HTTP {e.code} on {endpoint}: {err_msg}")
        except urllib.error.URLError as e:
            raise Exception(f"Network error connecting to {url}: {e.reason}")

    def _get(self, endpoint: str, token: str = None):
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        req = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))

    def check_connection(self):
        try:
            req = urllib.request.Request(f"{self.base_url}/listings/meta/categories")
            with urllib.request.urlopen(req, timeout=5) as res:
                return res.status == 200
        except Exception:
            return False

    def create_user(self, user_meta: dict):
        res = self._post("/auth/register", user_meta)
        user_obj = res.get("user", {})
        token = res.get("accessToken")
        return {
            "id": user_obj.get("id"),
            "name": user_obj.get("name"),
            "email": user_obj.get("email"),
            "businessName": user_obj.get("businessName"),
            "token": token,
            "meta": user_meta
        }

    def create_listing(self, user: dict, listing_meta: dict):
        return self._post("/listings", listing_meta, token=user["token"])

    def create_reservation(self, buyer: dict, listing_id: str, price: float, qty: float):
        data = {
            "listingId": listing_id,
            "agreedPrice": price,
            "agreedQty": qty
        }
        return self._post("/reservations", data, token=buyer["token"])

    def send_message(self, user: dict, reservation_id: str, text: str):
        data = {
            "reservationId": reservation_id,
            "text": text
        }
        return self._post("/messages", data, token=user["token"])


# ---------------------------------------------------------------------------
# Execution Mode 2: Direct SQLite Database Connector
# ---------------------------------------------------------------------------
def run_direct_db_generation(db_path: str, user_count: int, listing_count: int, reservation_count: int):
    print(f"\n📁 Connecting directly to SQLite database: {db_path}")
    if not os.path.exists(db_path):
        print(f"❌ Error: Database file not found at {db_path}")
        print("Tip: Run 'npm --prefix server run db:push' or 'npm run dev:server' first.")
        sys.exit(1)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Pre-calculated bcrypt hash for 'password123'
    default_hash = "$2a$12$4LpW7f3iG5a9x7n0mY8vteY8a7N/Zg7j5tQ4oG3V2l8D7E6F5G4Ha"
    
    created_users = []
    print(f"👥 Generating {user_count} random customers (buyers & sellers)...")
    for i in range(user_count):
        u = generate_random_user(i, user_count)
        user_id = str(uuid.uuid4())
        created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        cursor.execute(
            """
            INSERT INTO User (id, name, phone, email, passwordHash, businessName, lat, lng, address, rating, verified, isAdmin, active, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?)
            """,
            (user_id, u["name"], u["phone"], u["email"], default_hash, u["businessName"], u["lat"], u["lng"], u["address"], u["rating"], 1 if u["verified"] else 0, created_at)
        )
        created_users.append({**u, "id": user_id})
        print(f"  ✓ [{u['cityName']}] {u['name']} ({u['businessName']})")

    created_listings = []
    print(f"\n📦 Generating {listing_count} surplus inventory lots...")
    for i in range(listing_count):
        seller = random.choice(created_users)
        listing = generate_random_listing(seller["id"])
        listing_id = str(uuid.uuid4())
        created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        updated_at = created_at
        
        cursor.execute(
            """
            INSERT INTO Listing (id, sellerId, title, category, quantity, unit, pricePerUnit, expiryDate, urgency, status, active, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, ?)
            """,
            (listing_id, seller["id"], listing["title"], listing["category"], listing["quantity"], listing["unit"], listing["pricePerUnit"], listing["expiryDate"], listing["urgency"], created_at, updated_at)
        )
        created_listings.append({**listing, "id": listing_id, "seller": seller})
        print(f"  ✓ [{listing['category']}] ₹{listing['pricePerUnit']}/{listing['unit']} - {listing['title']} (Qty: {listing['quantity']})")

    print(f"\n🤝 Generating {reservation_count} active negotiations, chat threads & transactions...")
    for i in range(reservation_count):
        listing = random.choice(created_listings)
        eligible_buyers = [u for u in created_users if u["id"] != listing["seller"]["id"]]
        if not eligible_buyers:
            continue
        buyer = random.choice(eligible_buyers)
        
        res_id = str(uuid.uuid4())
        status = random.choice(["pending", "confirmed", "completed"])
        discount = random.uniform(0.85, 0.98)
        agreed_price = round(listing["pricePerUnit"] * discount, 2)
        agreed_qty = round(listing["quantity"] * random.uniform(0.2, 1.0))
        now_dt = datetime.datetime.now(datetime.timezone.utc)
        expires_at = (now_dt + datetime.timedelta(days=2)).isoformat()
        created_at = now_dt.isoformat()
        
        cursor.execute(
            """
            INSERT INTO Reservation (id, listingId, buyerId, status, agreedPrice, agreedQty, proofPhoto, expiresAt, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
            """,
            (res_id, listing["id"], buyer["id"], status, agreed_price, agreed_qty, expires_at, created_at, created_at)
        )
        
        # Simulate chat dialogue
        dialogue = random.choice(CHAT_DIALOGUES)
        for idx, line in enumerate(dialogue):
            sender_id = buyer["id"] if idx % 2 == 0 else listing["seller"]["id"]
            msg_id = str(uuid.uuid4())
            msg_time = (now_dt + datetime.timedelta(minutes=idx * 3)).isoformat()
            cursor.execute(
                """
                INSERT INTO Message (id, reservationId, senderId, text, read, createdAt)
                VALUES (?, ?, ?, ?, 1, ?)
                """,
                (msg_id, res_id, sender_id, line, msg_time)
            )

        # Rating for completed reservations
        if status == "completed":
            rating_id = str(uuid.uuid4())
            cursor.execute(
                """
                INSERT INTO Rating (id, fromUserId, toUserId, reservationId, score, comment, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (rating_id, buyer["id"], listing["seller"]["id"], res_id, random.randint(4, 5), random.choice(REVIEW_COMMENTS), created_at)
            )

        print(f"  ✓ Transaction #{i+1}: {buyer['name']} ➔ {listing['seller']['name']} [{status.upper()}] (₹{agreed_price} x {agreed_qty} {listing['unit']})")

    conn.commit()
    conn.close()
    print(f"\n🎉 Direct database generation complete! Injected {user_count} users, {listing_count} listings, and {reservation_count} active deals.")


# ---------------------------------------------------------------------------
# CLI Command Dispatcher
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="StockBridge Random Generator: Populates live & realistic buyers, sellers, surplus listings & deals."
    )
    parser.add_argument("--mode", choices=["api", "db", "stream"], default="db", help="Generation mode: 'api' (HTTP server), 'db' (Direct SQLite), 'stream' (continuous)")
    parser.add_argument("--url", default="http://localhost:3001/api", help="StockBridge server API URL (for api mode)")
    parser.add_argument("--db", default=os.path.join(os.path.dirname(__file__), "..", "server", "prisma", "dev.db"), help="Path to dev.db SQLite database")
    parser.add_argument("--users", type=int, default=12, help="Number of random users (buyers/sellers) to create")
    parser.add_argument("--listings", type=int, default=24, help="Number of surplus listings to create")
    parser.add_argument("--reservations", type=int, default=6, help="Number of reservations / trade negotiations to create")
    parser.add_argument("--interval", type=int, default=5, help="Interval in seconds for stream/continuous mode")

    args = parser.parse_args()

    print("=" * 70)
    print("🚀 STOCKBRIDGE RANDOM DATA GENERATOR")
    print("   Empowering high-velocity surplus liquidation & realistic B2B simulation")
    print("=" * 70)

    if args.mode == "db":
        db_path = os.path.abspath(args.db)
        run_direct_db_generation(db_path, args.users, args.listings, args.reservations)
    
    elif args.mode == "api":
        connector = ApiConnector(args.url)
        print(f"\n🌐 Connecting to StockBridge API at {args.url}...")
        if not connector.check_connection():
            print(f"❌ Could not reach StockBridge API at {args.url}.")
            print("   Make sure the server is running: `npm run dev:server` or `npm --prefix server run dev`")
            print("   Or switch to direct database mode: `python scripts/random_generator.py --mode db`")
            sys.exit(1)

        print("✅ Server reached successfully. Generating entities via API endpoints...")
        created_users = []
        for i in range(args.users):
            u_meta = generate_random_user(i, args.users)
            try:
                user = connector.create_user(u_meta)
                created_users.append(user)
                print(f"  ✓ Registered [{u_meta['cityName']}] {user['name']} ({user['businessName']})")
            except Exception as e:
                print(f"  ⚠ User creation skipped: {e}")

        created_listings = []
        for i in range(args.listings):
            if not created_users:
                break
            seller = random.choice(created_users)
            listing_meta = generate_random_listing(seller["id"])
            try:
                res = connector.create_listing(seller, listing_meta)
                created_listings.append({**listing_meta, "id": res.get("id"), "seller": seller})
                print(f"  ✓ Listed: [{listing_meta['category']}] {listing_meta['title']} by {seller['name']}")
            except Exception as e:
                print(f"  ⚠ Listing skipped: {e}")

        print(f"\n🎉 API generation complete! Generated {len(created_users)} users and {len(created_listings)} listings.")

    elif args.mode == "stream":
        print(f"\n⚡ Starting Continuous Simulation Stream (Every {args.interval}s)...")
        print("   Press Ctrl+C to stop.\n")
        db_path = os.path.abspath(args.db)
        round_num = 1
        try:
            while True:
                print(f"\n--- [Simulation Event #{round_num}] ---")
                run_direct_db_generation(db_path, user_count=2, listing_count=3, reservation_count=1)
                round_num += 1
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\n🛑 Stream stopped by user.")


if __name__ == "__main__":
    main()
