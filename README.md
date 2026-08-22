# StockBridge 📦🔄

**Hyper-Local B2B Dead Stock & Surplus Inventory Redistribution Platform**

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express 5](https://img.shields.io/badge/Backend-Express_5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/ORM-Prisma_5-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini_3.6_Flash-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS 4](https://img.shields.io/badge/Styles-Tailwind_4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

StockBridge connects manufacturers, wholesalers, distributors, and retail merchants to liquidate surplus inventory, closeout batches, and near-expiry goods. The platform integrates **geospatial proximity matchmaking, real-time WebSocket negotiation, double-blind peer trust ratings, synthetic marketplace generation, and a multilingual voice-to-listing engine with regional audio voiceovers**.

---

## 📑 Table of Contents

- [🌟 Platform Overview](#-platform-overview)
- [🌿 Branch Architecture & Ecosystem](#-branch-architecture--ecosystem)
- [✨ Core Capabilities](#-core-capabilities)
  - [1. Surplus Marketplace & Proximity Search](#1-surplus-marketplace--proximity-search)
  - [2. Smart Matchmaking Algorithm](#2-smart-matchmaking-algorithm)
  - [3. Multilingual AI Voice-to-Listing Pipeline](#3-multilingual-ai-voice-to-listing-pipeline)
  - [4. AI Native Voiceover Summary Synthesizer](#4-ai-native-voiceover-summary-synthesizer)
  - [5. Real-Time Deal Negotiation & WebSocket Chat](#5-real-time-deal-negotiation--websocket-chat)
  - [6. Escrow-Style Reservation State Machine](#6-escrow-style-reservation-state-machine)
  - [7. Double-Blind Peer Review & Trust Ratings](#7-double-blind-peer-review--trust-ratings)
  - [8. Administrative Operations & Analytics Center](#8-administrative-operations--analytics-center)
- [🛠 Tech Stack & Architecture](#-tech-stack--architecture)
- [📁 Monorepo Directory Structure](#-monorepo-directory-structure)
- [🚀 Quick Start Guide](#-quick-start-guide)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [🔑 Demo Accounts & Credentials](#-demo-accounts--credentials)
- [📜 Available Scripts & Simulation](#-available-scripts--simulation)
- [📡 API Reference](#-api-reference)
- [📄 Branch Documentation Index](#-branch-documentation-index)

---

## 🌟 Platform Overview

Every year, Indian supply chains lose billions of dollars due to dead stock, overproduction, seasonal clearance gluts, and near-expiry goods dumped into waste streams. StockBridge resolves this by creating a **frictionless, hyper-local liquidation network** that converts trapped inventory into cash flow while offering buyers 30%–75% margins on verified goods.

---

## 🌿 Branch Architecture & Ecosystem

The StockBridge repository is structured into 3 specialized branches:

```
STOCKBRIDGE_ANTIGRAVITY (Repository)
│
├── 🏛️ main                ─── Core production platform, proximity search, real-time negotiation chat,
│                              escrow reservations, trust scoring & admin analytics dashboard.
│
├── 🎲 random-generator    ─── High-fidelity synthetic data engine, commercial counterparty generator,
│                              APMC mandi/industrial estate clusters, and continuous simulator stream.
│
└── 🎙️ ai-features          ─── Multilingual Speech-to-Listing Engine (Gemini 3.6 Flash), 10 regional Indian
                               languages, dynamic match scoring, smart urgency/expiry, and AI Voiceover Audio.
```

- **[Main Branch Documentation](file:///d:/STOCKBRIDGE_ANTIGRAVITY/docs/branches/MAIN_README.md)** | **[Main Pitch](file:///d:/STOCKBRIDGE_ANTIGRAVITY/docs/branches/MAIN_PITCH.md)**
- **[Random Generator Documentation](file:///d:/STOCKBRIDGE_ANTIGRAVITY/docs/branches/RANDOM_GENERATOR_README.md)** | **[Random Generator Pitch](file:///d:/STOCKBRIDGE_ANTIGRAVITY/docs/branches/RANDOM_GENERATOR_PITCH.md)**
- **[AI Features Documentation](file:///d:/STOCKBRIDGE_ANTIGRAVITY/docs/branches/AI_FEATURES_README.md)** | **[AI Features Pitch](file:///d:/STOCKBRIDGE_ANTIGRAVITY/docs/branches/AI_FEATURES_PITCH.md)**

---

## ✨ Core Capabilities

### 1. Surplus Marketplace & Proximity Search
- **Taxonomy**: Groceries, Dairy & Beverages, Prepared Food & Bakery, Packaging, Stationery, Electronics, Textiles, Hardware.
- **Geospatial Range**: Search within 5 km, 15 km, 30 km, 50 km, or 100+ km using GPS coordinates to eliminate long-haul logistics.
- **Rich Inventory Cards**: Display unit pricing, total lot valuations, minimum order quantities (MOQs), and urgency indicators.

### 2. Smart Matchmaking Algorithm
Calculates an automated **0% to 100% Match Score** pairing buyer requirements with active inventory:

$$\text{Match Score} = (0.30 \times \text{Distance}) + (0.25 \times \text{Discount}) + (0.15 \times \text{Expiry}) + (0.15 \times \text{Urgency}) + (0.15 \times \text{Trust})$$

- **Distance (30%)**: Uses the Haversine geodesic formula between buyer and seller warehouse coordinates.
- **Discount (25%)**: Rewards deeper liquidation discounts relative to original market rates.
- **Expiry Window (15%)**: Prioritizes near-expiry perishables to prevent commercial food waste.
- **Urgency (15%)**: Escalates distressed liquidation lots.
- **Seller Trust (15%)**: Boosts verified merchants with 4.5+ star peer ratings.

### 3. Multilingual AI Voice-to-Listing Pipeline
- **Zero-Typing Creation**: Merchants tap the microphone and speak naturally in **Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, Punjabi, or English**.
- **Gemini 3.6 Flash Extraction**: Extracts structured product titles, categories, units, quantities, per-unit prices, expiry dates, and urgency levels.
- **Dialect & Unit Normalization**: Maps regional terms (*"bori"*, *"katte"*, *"peti"*, *"darjan"*, *"pauchi"*) into standard metric/imperial units.
- **Dynamic Confidence Scoring**: Calculates live match percentages between **45% and 98% Match** based on spoken detail completeness.
- **Zero-Downtime Fallback**: Local regex extractors guarantee uninterrupted listing extraction even during network outages.

### 4. AI Native Voiceover Summary Synthesizer
- **Spoken Confirmation**: Generates a natural, conversational audio summary in the merchant's chosen regional language before publishing.
- **10 Indian Languages**: Native script rendering ensures genuine regional pronunciation.
- **Player Controls**: Play, Pause, Resume, Stop, and Speed controls (`1.0x` / `1.25x`) with live animated audio equalizer waves.
- **Clean Commercial Narration**: Speaks essential listing parameters (Product, Quantity, Unit, Price, Total Valuation, Expiry Date, Urgency) while keeping internal notes clean.

### 5. Real-Time Deal Negotiation & WebSocket Chat
- Encrypted, room-based instant messaging powered by **Socket.io**.
- In-chat deal terms adjustment, live counterparty typing indicators, read receipts, and system event notifications.

### 6. Escrow-Style Reservation State Machine
- **Lifecycle**: `pending` $\rightarrow$ `confirmed` $\rightarrow$ `completed` / `cancelled`.
- **Auto-Release Safety**: Automated background timeout releases unconfirmed reserved stock back to the public catalog.
- **Proof Attachments**: Delivery and warehouse pickup photo uploads for audit trails.

### 7. Double-Blind Peer Review & Trust Ratings
- 1 to 5 star rating system with qualitative feedback submitted by both counterparties post-deal.
- Eliminates retaliatory bias and generates transparent merchant trust badges.

### 8. Administrative Operations & Analytics Center
- Real-time Gross Merchandise Value (GMV), active batch counts, trade completion rates, and user registration analytics.
- Listing moderation, merchant verification, dispute arbitration, and audit logs.

---

## 🛠 Tech Stack & Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React 19 + Vite 8)                      │
│   • TailwindCSS 4 • Zustand Store • TanStack Query • Socket.io Client │
│   • Web Speech API (STT & Multilingual Audio Synthesis) • Lucide Icons │
└───────────────────▲────────────────────────────────▲───────────────────┘
                    │                                │
                    │ HTTP REST API Proxy            │ WebSocket Events
                    │ (/api via Axios)               │ (/socket.io)
                    ▼                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND ENGINE (Node.js & Express 5)                 │
│   • Google Gemini 3.6 Flash SDK   • Smart Matchmaking Engine (Haversine)│
│   • JWT Auth (HTTP-Only Cookies)  • Multi-Tier Rule-Based Fallback      │
│   • Socket.io Server              • Multer File Upload Handler          │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
                                    │ Prisma ORM (Type-Safe Client)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA STORAGE (SQLite / PostgreSQL)              │
│   • User • Listing • Reservation • Message • Rating • Analytics        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Monorepo Directory Structure

```text
STOCKBRIDGE_ANTIGRAVITY/
├── .env.example                       # Reference environment variables
├── package.json                       # Root monorepo scripts & dependencies
├── PITCH.md                           # Master Executive Pitch & Architecture
├── README.md                          # Master Project Documentation
│
├── client/                            # Frontend Single Page Application
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts                 # Vite config & API reverse proxy
│   └── src/
│       ├── components/                # UI Components (VoiceListingPanel, Navbar, etc.)
│       ├── lib/                       # Axios instance, socket client, speech utils
│       ├── pages/                     # Pages (CreateListing, SmartMatch, Admin, etc.)
│       ├── stores/                    # Zustand stores (authStore)
│       └── types/                     # TypeScript interfaces
│
├── server/                            # Backend REST API & Realtime Server
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma              # Database schema definitions
│   │   └── seed.ts                    # Canonical database seeder
│   └── src/
│       ├── config.ts                  # Centralized configuration & Gemini keys
│       ├── index.ts                   # Express server & Socket.io entrypoint
│       ├── routes/                    # API Routes (auth, listings, voice, chat, etc.)
│       ├── services/                  # Business Logic (voiceService, matchEngine)
│       └── validators.ts              # Zod validation schemas
│
├── docs/                              # Detailed Documentation
│   └── branches/
│       ├── MAIN_README.md             # Main branch technical guide
│       ├── MAIN_PITCH.md              # Main branch pitch
│       ├── RANDOM_GENERATOR_README.md # Random generator guide
│       ├── RANDOM_GENERATOR_PITCH.md  # Random generator pitch
│       ├── AI_FEATURES_README.md      # AI features technical guide
│       └── AI_FEATURES_PITCH.md       # AI features pitch
│
└── scripts/                           # Simulation & Utility Scripts
    ├── README.md                      # Script usage reference
    └── random_generator.py            # Python synthetic data generator
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **npm**: `v9.0.0` or higher
- **Python**: `3.9+` (optional, for standalone simulator script)

### 1. Clone & Install Dependencies
```bash
# Install root, client, and server dependencies
npm install
npm run postinstall
```

### 2. Configure Environment Variables
Copy `.env.example` to root, `server/`, and `client/`:
```bash
# Windows PowerShell
copy .env.example .env
copy .env.example server\.env
```

### 3. Initialize Database
```bash
npm run db:push
npm run db:seed
```

### 4. Start Full Development Server
```bash
# Runs both Frontend (Vite :5173) and Backend (Express :3001) concurrently
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## ⚙️ Environment Configuration

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3001` | Backend HTTP & WebSocket server port |
| `CLIENT_URL` | `http://localhost:5173` | Frontend application URL for CORS |
| `DATABASE_URL` | `file:./dev.db` | SQLite database connection string |
| `JWT_SECRET` | `stockbridge_dev_secret_jwt` | Secret key for signing JWT tokens |
| `GEMINI_API_KEY` | *(Optional)* | Google Gemini API Key for AI voice parsing |
| `GEMINI_MODEL` | `gemini-3.6-flash` | Gemini model for structured inventory extraction |

---

## 🔑 Demo Accounts & Credentials

| Role | Email | Password | Coordinates / Cluster |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@stockbridge.com` | `admin123` | Mumbai MMR (`19.0760, 72.8777`) |
| **Wholesaler (Seller)** | `seller@stockbridge.com` | `seller123` | Bhiwandi Logistics Hub (`19.2967, 73.0631`) |
| **Retailer (Buyer)** | `buyer@stockbridge.com` | `buyer123` | Andheri Commercial Zone (`19.1197, 72.8468`) |

---

## 📜 Available Scripts & Simulation

```bash
# Start full application (Frontend + Backend)
npm run dev

# Start frontend only
npm run dev:client

# Start backend only
npm run dev:server

# Build production bundles
npm run build

# Generate synthetic marketplace data (TypeScript)
npm run generate

# Run Python standalone simulator
python scripts/random_generator.py --mode stream --interval 5
```

---

## 📡 API Reference

### 🎙️ AI Voice Endpoints
- `POST /api/voice/parse`: Parses raw voice transcript into structured listing fields.
- `POST /api/voice/voiceover`: Generates a natural regional spoken confirmation script in 10 native Indian languages.

### 📦 Surplus Listing Endpoints
- `GET /api/listings`: Paginated catalog with category, proximity, search, and urgency filters.
- `POST /api/listings`: Create a new surplus batch listing.
- `GET /api/listings/:id`: Fetch listing details with seller trust metrics.
- `PUT /api/listings/:id`: Update listing price, quantity, or status.
- `DELETE /api/listings/:id`: Soft delete / archive listing.

### 🧠 Smart Match Endpoints
- `POST /api/matches`: Multi-factor algorithmic ranking of inventory matching buyer criteria.

### 🤝 Reservation & Chat Endpoints
- `POST /api/reservations`: Initiate a new stock reservation.
- `PUT /api/reservations/:id/confirm`: Seller confirms trade reservation.
- `PUT /api/reservations/:id/complete`: Finalize deal and release escrow locks.
- `GET /api/messages/thread/:reservationId`: Retrieve chat conversation history.

---

## 📄 Branch Documentation Index

| Branch Name | Primary Functionality | Documentation Link | Pitch Document |
| :--- | :--- | :--- | :--- |
| **`main`** | Core B2B Marketplace & Escrow | [MAIN_README.md](file:///d:/STOCKBRIDGE_ANTIGRAVITY/docs/branches/MAIN_README.md) | [MAIN_PITCH.md](file:///d:/STOCKBRIDGE_ANTIGRAVITY/docs/branches/MAIN_PITCH.md) |
| **`random-generator`** | Synthetic Trade Simulator | [RANDOM_GENERATOR_README.md](file:///d:/STOCKBRIDGE_ANTIGRAVITY/docs/branches/RANDOM_GENERATOR_README.md) | [RANDOM_GENERATOR_PITCH.md](file:///d:/STOCKBRIDGE_ANTIGRAVITY/docs/branches/RANDOM_GENERATOR_PITCH.md) |
| **`ai-features`** | Multilingual Voice AI Engine | [AI_FEATURES_README.md](file:///d:/STOCKBRIDGE_ANTIGRAVITY/docs/branches/AI_FEATURES_README.md) | [AI_FEATURES_PITCH.md](file:///d:/STOCKBRIDGE_ANTIGRAVITY/docs/branches/AI_FEATURES_PITCH.md) |
