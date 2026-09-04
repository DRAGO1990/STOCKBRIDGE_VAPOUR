# StockBridge 📦🔄

> **Hyperlocal B2B Dead Stock & Surplus Inventory Liquidation Engine**  
> *Transforming stranded wholesale stock into immediate working capital in under 24 hours.*

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express 5](https://img.shields.io/badge/Backend-Express_5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/ORM-Prisma_5-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS 4](https://img.shields.io/badge/Styles-Tailwind_4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## 📌 Executive Summary

Every year, Indian wholesalers, distributors, and kirana stores lose over **₹2.4 Lakh Crore ($30B+)** in dead inventory, slow-moving items, and near-expiry goods. Traditional supply chains provide no local outlet for quick liquidation, forcing merchants to write off stock or dump products into landfill streams.

**StockBridge** is a hyperlocal B2B secondary exchange that connects manufacturers, distributors, and neighborhood retailers. Using **voice-first listing in 4 Indian languages**, **geo-proximity discovery within 2–50 km**, and a **zero-advance 24-hour reservation window**, StockBridge allows sellers to unlock cash flow while giving retail buyers 30%–70% gross margins.

---

## 🚀 Core Highlights & Features

### 1. 🎙️ Multilingual Voice-to-Listing
- **Zero-Typing Creation**: Merchants tap the mic and speak naturally in **Hindi/Hinglish, English, Kannada, or Punjabi**.
- **Instant AI Extraction**: Automatically parses title, category, lot quantity, unit price (₹), units (*packets, boxes, bags, quintals*), expiry date, and urgency level.
- **Zero-Downtime Fallback**: Built-in regex extraction guarantees uninterrupted listing creation even during network interruptions.

### 2. 🧾 AI Invoice OCR & Mandatory MRP Protection
- **No More Fake Discounts**: Sellers upload wholesale tax invoices or purchase bills. **Gemini Vision OCR** extracts supplier name, invoice date, line items, and original retail MRP.
- **Mandatory Price Safeguards**: Listings strictly enforce `pricePerUnit <= originalMrp` to guarantee that listed markdowns reflect authentic commercial discounts.
- **Verified Invoice Badge**: Authenticated lots display a green verified badge on marketplace cards, boosting buyer confidence and trade velocity.

### 3. 📊 Smart Inventory & Dead-Stock Predictor
- **Store-Level Inventory Analytics**: Merchants track warehouse batches with purchase costs, selling prices, minimum thresholds, and expiry timelines.
- **LWMA Sales Velocity Forecasting**: Uses Linear Weighted Moving Average on daily sales logs to forecast exact days until stockout and calculate dead-stock risk before critical urgency thresholds.
- **One-Click Liquidation**: At-risk inventory includes a direct "Liquidate Surplus on StockBridge" button that pre-fills lot specifications for instant listing creation.

### 4. 📍 Hyperlocal Discovery & Proximity Filter
- **Zero Long-Haul Friction**: Search nearby lots within **2 km, 5 km, 15 km, or 50 km** using GPS warehouse coordinates.
- **City Hub Selector**: Instant city switching across major wholesale corridors (*Hyderabad, Mumbai, Bengaluru, Delhi NCR, Pune, Chennai*).
- **Fast Local Logistics**: Products move via local tempo, auto, or direct pickup within hours instead of multi-day freight.

### 5. ⏱️ 24-Hour Zero-Advance Reservation Guarantee
- **Risk-Free Booking**: Retailers can lock an entire lot or partial volume for 24 hours **without paying any advance deposit**.
- **Direct Trade Chat**: Real-time messaging opens between buyer and seller to agree on physical handover time and payment method.
- **Auto-Release Timer**: If the trade is not completed within 24 hours, the stock lot automatically returns to the live marketplace.

### 6. 🛡️ Dynamic Urgency & Expiry Auto-Unlisting
- **Automated Urgency Tiers**: Lots dynamically transition across urgency levels (11–25 days: `HIGH`, 26–50 days: `MEDIUM`, > 50 days: `LOW`).
- **Auto-Unlist Safety Guard**: Stock with less than 11 days of shelf life is automatically marked `expiry_unlisted` and hidden from public search, protecting buyers from receiving unsellable merchandise.

### 7. 📸 Proof-Verified Handover & Product Photos
- **Real Product Photos**: Sellers upload actual lot images (WebP/PNG/JPEG) for buyer transparency.
- **Physical Inspection Safeguard**: Upon meeting at the warehouse or storefront, the buyer physically inspects the lot.
- **Handover Proof Upload**: Upload an inspection photo and confirm delivery before marking the reservation completed.

### 8. 🔔 Real-Time Notification Center
- **Instant Trade Alerts**: WebSockets push instant notifications for new reservations, accepted trades, chat messages, and dead-stock inventory warnings with an unread badge counter in the top navigation.

### 9. ⭐️ Double-Blind Merchant Trust Score
- **Unbiased Peer Reviews**: Both buyer and seller submit 1-to-5 star ratings and reviews.
- **Simultaneous Release**: Reviews are kept hidden until both parties have submitted, preventing retaliatory scores.

### 10. 🛡️ Admin Command Center & Merchant KYC
- **Merchant KYC Verification**: Admins review GSTIN and business credentials with 1-click verification or rejection.
- **Merchant Dossier Inspection**: Detailed operational oversight of verified merchants, active lots, dispute history, and transaction logs.
- **Platform Health Monitoring**: Live metrics on gross merchandise value (GMV), active listings, and completion rates.

---

## 🎨 Design System: Stitch UI

StockBridge is built with the custom **Stitch UI** design language:
- **Matte Charcoal Foundation**: Primary background `#131313`, card surfaces `#1c1b1b`, inset containers `#2a2a2a`, and subtle borders `#3d4947`.
- **Accents**: Primary Stitch Teal `#6bd8cb` (with `#003732` on-primary), Warning Amber `#f6b351`, and Alert Rose `#ffb4ab`.
- **Typography**: **Sora** for headlines, valuations, and quantitative metrics; **Work Sans** for clean labels, navigation, and body copy.
- **Micro-Animations**: Framer Motion smooth transitions (`0.25s` ease-outs) designed for clarity and speed without intrusive popups.

---

## 📂 Project Architecture

StockBridge is organized as a unified monorepo:

```
STOCKBRIDGE_ANTIGRAVITY/
├── client/                     # React 19 Frontend
│   ├── src/
│   │   ├── components/         # Stitch UI components (Navbar, NotificationCenter, InvoiceUploadModal, ListingCard)
│   │   ├── pages/              # LandingPage, MarketplacePage, HowItWorksPage, ListingDetailPage,
│   │   │                       # CreateListingPage, MyListingsPage, InventoryPage, ReservationsPage, AdminDashboardPage
│   │   ├── stores/             # Zustand persistent client state (authStore)
│   │   ├── lib/                # Axios API client & Socket.IO instance
│   │   └── types/              # TypeScript models & API interfaces
│   ├── index.html              # HTML shell with Sora & Work Sans Google Fonts
│   └── package.json            # Frontend dependencies (React 19, Tailwind v4, Framer Motion)
│
├── server/                     # Node.js & Express Backend
│   ├── src/
│   │   ├── routes/             # REST endpoints (auth, listings, invoices, inventory, notifications, chat, admin)
│   │   ├── services/           # Matching engine, Gemini invoice OCR, inventory predictor, expiry monitor
│   │   ├── validators.ts       # Strict Zod schema validation
│   │   └── index.ts            # Express server initialization & Socket.IO mounting
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (User, Listing, InvoiceVerification, InventoryBatch, Notification, etc.)
│   │   └── seed.ts             # Realistic Indian wholesale demo seed data
│   └── package.json            # Backend dependencies (Express 5, Prisma, Zod, Socket.IO, Multer)
│
├── README.md                   # Master project guide (this document)
├── PITCH.md                    # Business pitch deck & investor presentation
├── TECHNOLOGY_ARCHITECTURE.md  # Detailed technical specifications & system design
└── ENDPOINTS_AND_FEATURES.md   # API route inventory & feature status
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### 1. Clone & Setup Backend
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Initialize database schema & run migrations
npx prisma db push

# Seed realistic demo merchants & stock lots
npm run seed

# Start backend server (runs on http://localhost:5000)
npm run dev
```

### 2. Setup Frontend Client
```bash
# In a new terminal window, navigate to client directory
cd client

# Install frontend dependencies
npm install

# Start development server (runs on http://localhost:5173 or 5174)
npm run dev
```

Open your browser and navigate to:
**`http://localhost:5173`** (or the port shown in your terminal).

---

## 🔑 Demo Accounts & Test Credentials

All demo accounts share the password: **`password123`**

| Role | Business Name | Email | Focus Area |
| :--- | :--- | :--- | :--- |
| **Seller** | Khan Trading Co | `seller@demo.com` | Wholesaler (FMCG, Groceries, Oil) |
| **Buyer** | Rajesh General Store | `buyer@demo.com` | Neighborhood Kirana Retailer |
| **Super Admin** | Platform Admin | `admin@demo.com` | Oversight, Verification & Moderation |

---

## 📡 Core API Summary

| Endpoint | Method | Description | Auth Required |
| :--- | :---: | :--- | :---: |
| `/api/auth/login` | `POST` | Merchant login & JWT issuance | No |
| `/api/auth/register` | `POST` | Register new business account | No |
| `/api/listings` | `GET` | Browse active stock with proximity filter | No |
| `/api/listings/:id` | `GET` | Fetch single lot specifications & merchant details | No |
| `/api/listings` | `POST` | Create new stock lot with mandatory MRP & Invoice | Yes |
| `/api/listings/upload-image` | `POST` | Upload product photo image | Yes |
| `/api/listings/:id` | `PUT` | Update price, quantity, or urgency for existing lot | Yes (Owner) |
| `/api/listings/:id` | `DELETE`| Deactivate stock lot | Yes (Owner/Admin) |
| `/api/invoices/verify` | `POST` | Gemini Vision OCR extraction of wholesale invoices | Yes |
| `/api/inventory` | `GET` | Store inventory batches with LWMA velocity & risk | Yes |
| `/api/inventory` | `POST` | Track new warehouse inventory batch | Yes |
| `/api/inventory/:id/log` | `POST` | Log daily sales units to update predictive velocity | Yes |
| `/api/notifications` | `GET` | Fetch real-time in-app user notifications | Yes |
| `/api/reservations` | `POST` | Create 24h zero-advance holding reservation | Yes |
| `/api/reservations/my/buying` | `GET` | Fetch user's buying reservations | Yes |
| `/api/admin/stats` | `GET` | Platform KPI cards & active GMV | Yes (Admin) |
| `/api/admin/users/:id/verify` | `POST` | Approve/Reject merchant KYC verification | Yes (Admin) |

*Full endpoint catalog available in [ENDPOINTS_AND_FEATURES.md](file:///d:/STOCKBRIDGE_ANTIGRAVITY/ENDPOINTS_AND_FEATURES.md).*

---

## 📄 Documentation Links
- 📊 **[PITCH.md](file:///d:/STOCKBRIDGE_ANTIGRAVITY/PITCH.md)** — Investment thesis, market sizing, competitive advantage & business model.
- 🏗️ **[TECHNOLOGY_ARCHITECTURE.md](file:///d:/STOCKBRIDGE_ANTIGRAVITY/TECHNOLOGY_ARCHITECTURE.md)** — Deep technical breakdown of system architecture, data models, and algorithms.

---

**StockBridge** • Empowering local commerce through smart, liquid inventory.
