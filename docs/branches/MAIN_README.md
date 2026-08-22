# 🏛️ StockBridge — Main Branch Documentation (Core Platform)

> **Branch:** `main`  
> **Focus:** Core B2B Surplus Marketplace, Proximity Matching Engine, Real-time Negotiation & Trade Workflows

---

## 📖 Overview

The `main` branch contains the foundational production architecture of **StockBridge**. It delivers a high-performance, hyper-local B2B platform connecting manufacturers, distributors, wholesalers, and retail merchants to trade surplus inventory, dead stock, and near-expiry goods.

---

## 🌟 Key Features in `main`

### 1. Surplus Inventory Catalog & Hyper-Local Search
- **Category Taxonomy**: 8 B2B categories (*Groceries, Dairy & Beverages, Prepared Food & Bakery, Packaging, Stationery, Electronics, Textiles, Hardware*).
- **Proximity Filtering**: Filter batches within **5 km, 15 km, 30 km, 50 km, or 100+ km** using GPS coordinates.
- **Dynamic Lot Pricing**: Tiered per-unit rates, minimum order quantities (MOQs), and total lot valuations.

### 2. Smart Matchmaking Engine (Algorithmic Scoring)
Matches buyer requirements with available inventory lots using a multi-factor weighted scoring matrix:
$$\text{Score} = (0.30 \times \text{Distance}) + (0.25 \times \text{Discount}) + (0.15 \times \text{Expiry}) + (0.15 \times \text{Urgency}) + (0.15 \times \text{Trust})$$

- **Haversine Distance**: Computes exact geodesic distance between buyer and seller warehouse coordinates.
- **Expiry Urgency**: Prioritizes near-expiry perishables to prevent commercial waste.
- **Merchant Trust**: Ranks verified businesses and high-reputation sellers higher.

### 3. Real-Time Deal Negotiation (WebSocket Chat)
- Powered by **Socket.io** with room-based isolation per reservation.
- Live typing indicators, message history, read receipts, and price/quantity amendment agreements inside the chat view.

### 4. Structured Reservation & Trade Workflow
- **State Machine**: `pending` $\rightarrow$ `confirmed` $\rightarrow$ `completed` / `cancelled`.
- **Auto-Expiry Guard**: Unconfirmed reservations automatically expire after a configurable timeout (e.g. 30 minutes), releasing locked quantities back to the open market.
- **Delivery Proof**: Photo proof attachments for pickup and delivery verification.

### 5. Double-Blind Peer Review & Reputation System
- Both buyer and seller submit ratings (1 to 5 stars) with qualitative feedback after deal completion.
- Prevents retaliatory scoring and builds verified merchant trust badges.

### 6. Admin Control & Operations Center
- Platform metrics: Total Gross Merchandise Value (GMV), active listings, completed trades, and user growth.
- Verification workflows for new business accounts, listing moderation, and dispute arbitration.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, TailwindCSS 4, Zustand, TanStack Query, Axios, Lucide React.
- **Backend**: Node.js, Express 5, Prisma ORM, SQLite / PostgreSQL, Socket.io, JWT Authentication, bcryptjs.
