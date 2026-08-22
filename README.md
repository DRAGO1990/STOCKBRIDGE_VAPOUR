# StockBridge 📦🔄

**B2B Dead Stock & Surplus Redistribution Platform**

StockBridge connects businesses, wholesalers, and retailers to buy, sell, and liquidate surplus inventory, closeout batches, and near-expiry goods. The platform features location-aware inventory search, an automated matching engine, real-time negotiation chat, reservation workflows, peer ratings, and an administrative control center.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Directory Structure](#-directory-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
- [Environment Configuration](#-environment-configuration)
- [Demo Accounts & Credentials](#-demo-accounts--credentials)
- [Available Scripts](#-available-scripts)
- [API Reference](#-api-reference)
- [Reservation Lifecycle & Background Jobs](#-reservation-lifecycle--background-jobs)
- [Troubleshooting & Common Questions](#-troubleshooting--common-questions)

---

## ✨ Features

- **🛒 Surplus & Dead Stock Marketplace**: Browse, search, and filter inventory by category, location/proximity, price, quantity, and expiration date.
- **🧠 Smart Matching Engine**: Matches buyer requests with available surplus inventory based on category, price thresholds, and geographic proximity (Haversine formula).
- **💬 Real-Time Messaging**: Built-in instant chat via WebSocket (Socket.io) for buyers and sellers to negotiate quantities and prices within active reservations.
- **🤝 Reservation & Deal Workflow**: Structured reservation lifecycle (`pending` ➔ `confirmed` ➔ `completed` / `cancelled`) with automated timeout expiry for unconfirmed reservations.
- **⭐ Reputation & Rating System**: Double-blind post-deal review system calculating reliable user trust scores.
- **🛡️ Admin Operations Dashboard**: User management, listing verification/moderation, platform analytics, and dispute visibility.

---

## 🛠 Tech Stack

### Frontend (`/client`)
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 8 with HMR and API proxying
- **Styling**: TailwindCSS 4, Lucide Icons, Radix UI primitives
- **State Management**: Zustand (Auth, UI states)
- **Data Fetching**: TanStack React Query + Axios
- **Real-Time Client**: Socket.io Client
- **Forms & Validation**: React Hook Form + Zod

### Backend (`/server`)
- **Runtime**: Node.js + Express 5 (TypeScript via `jiti`/`tsx`)
- **Database & ORM**: SQLite + Prisma ORM
- **Authentication**: JWT (JSON Web Tokens) with HTTP-only cookies & bcryptjs password hashing
- **Real-Time Server**: Socket.io
- **Security & Utilities**: Helmet, CORS, Morgan logger, Multer for file uploads

---

## 📐 Project Architecture

```
┌────────────────────────────────────────────────────────┐
│               Frontend (React 19 + Vite)               │
│  Port: 5173  •  Zustand  •  TanStack Query  •  Tailwind│
└───────────▲───────────────────────────────▲────────────┘
            │ HTTP API Proxy (/api)         │ WebSocket (/socket.io)
            │ (Axios)                       │ (Socket.io-client)
┌───────────▼───────────────────────────────▼────────────┐
│              Backend (Express 5 + Socket.io)           │
│  Port: 3001  •  JWT Auth  •  Matching Engine           │
└───────────────────────────▲────────────────────────────┘
                            │ Prisma ORM
┌───────────────────────────▼────────────────────────────┐
│                  Database (SQLite / dev.db)             │
│  Models: User, Listing, Reservation, Message, Rating   │
└────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```text
STOCKBRIDGE_ANTIGRAVITY/
├── .env.example              # Sample environment configuration
├── package.json              # Monorepo root scripts
│
├── client/                   # Frontend SPA application
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts        # Vite configuration & proxy settings
│   └── src/
│       ├── assets/           # Static images and icons
│       ├── components/       # Reusable UI components (ListingCard, Navbar, etc.)
│       ├── lib/              # Axios instance, socket client, utilities
│       ├── pages/            # View pages (Home, Listings, SmartMatch, Admin, etc.)
│       ├── stores/           # Zustand state stores (authStore, etc.)
│       └── types/            # TypeScript interfaces & domain models
│
└── server/                   # Backend REST API & Realtime server
    ├── package.json
    ├── prisma/
    │   ├── schema.prisma     # Prisma models and SQLite configuration
    │   └── seed.ts           # Demo seed script (Indian market data)
    └── src/
        ├── config.ts         # Environment variable configuration
        ├── index.ts          # Server entry point & reservation scheduler
        ├── socket.ts         # WebSocket event handlers
        ├── validators.ts     # Zod request validation schemas
        ├── lib/              # Prisma client singleton
        ├── middleware/       # Auth guard, admin guard, file upload
        ├── routes/           # REST API routes (auth, listings, reservations, etc.)
        └── services/         # Smart matching & business logic
```

---

## 🚀 Prerequisites

- **Node.js**: `v18.0.0` or higher (`v20+` recommended)
- **npm**: `v9.0.0` or higher

---

## ⚡ Quick Start Guide

Follow these steps to run the complete platform locally:

### 1. Clone & Enter the Repository
```bash
git clone <repository-url>
cd STOCKBRIDGE_ANTIGRAVITY
```

### 2. Configure Environment Variables
Copy `.env.example` to `server/.env` (or project root):
```bash
cp .env.example server/.env
```
*(On Windows PowerShell: `Copy-Item .env.example server/.env`)*

### 3. Install Dependencies
Install dependencies for both root, backend, and frontend:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Return to root
cd ..
```

### 4. Setup Database & Seed Initial Data
Initialize SQLite with Prisma migrations and load sample users and listings:
```bash
cd server
npx prisma db push
npm run db:seed
cd ..
```

### 5. Start Development Servers
You can run both client and server concurrently:

**Terminal 1 (Backend Server - Port 3001):**
```bash
npm run dev:server
```

**Terminal 2 (Frontend Client - Port 5173):**
```bash
npm run dev:client
```

Open your browser and visit: **`http://localhost:5173`**

---

## 🔑 Demo Accounts & Credentials

The seed data provides pre-configured accounts across multiple Indian commerce hubs (Mumbai, Delhi, Bangalore, Hyderabad) with sample active listings and message history:

> **All demo accounts use the password:** `password123`

| Role / Region | Business / Name | Email | Password |
| :--- | :--- | :--- | :--- |
| 👑 **Administrator** | StockBridge Admin | `admin@stockbridge.com` | `password123` |
| 🏢 **Seller / Wholesaler** (Mumbai) | Sharma Wholesale (Rajesh Sharma) | `rajesh@demo.com` | `password123` |
| 🏬 **Buyer / Retailer** (Mumbai) | Patel Traders (Priya Patel) | `priya@demo.com` | `password123` |
| 📦 **Seller** (Delhi) | Kumar Groceries (Suresh Kumar) | `suresh@demo.com` | `password123` |
| ✏️ **Seller** (Delhi) | Gupta Stationery (Neha Gupta) | `neha@demo.com` | `password123` |
| 💻 **Seller** (Bangalore) | Reddy Tech Hub (Karthik Reddy) | `karthik@demo.com` | `password123` |
| 🍵 **Buyer** (Hyderabad) | Khan Trading Co (Fatima Khan) | `fatima@demo.com` | `password123` |

---

## ⚙️ Environment Configuration

The server expects the following environment variables (defined in `server/.env`):

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `file:./dev.db` | SQLite database connection string |
| `JWT_SECRET` | `your-jwt-secret-change-me` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | `your-refresh-secret-change-me` | Secret for signing refresh tokens |
| `PORT` | `3001` | Express backend listening port |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin (Vite dev server) |

---

## 📜 Available Scripts

### Root Commands (`/package.json`)
- `npm run dev:server`: Starts the backend server in development mode.
- `npm run dev:client`: Starts the Vite client development server.
- `npm run build`: Builds both backend and frontend for production.
- `npm run db:seed`: Runs the database seed script.

### Backend Commands (`/server`)
- `npm run dev`: Starts the server with `node --import jiti/register src/index.ts`.
- `npm run build`: Compiles TypeScript to `dist/`.
- `npm run start`: Runs the compiled production server.
- `npm run db:push`: Synchronizes Prisma schema directly with the database.
- `npm run db:migrate`: Creates and applies database migrations.
- `npm run db:seed`: Populates the database with demo users, items, and chats.
- `npm run db:studio`: Launches Prisma Studio GUI at `http://localhost:5555`.

### Frontend Commands (`/client`)
- `npm run dev`: Starts the Vite dev server with proxy at `http://localhost:5173`.
- `npm run build`: Checks types and compiles the production bundle to `dist/`.
- `npm run preview`: Previews the built production frontend locally.

---

## 📡 API Reference

All backend endpoints are prefixed with `/api`.

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` - Create a new user / business account
- `POST /api/auth/login` - Authenticate and receive JWT tokens
- `POST /api/auth/refresh` - Refresh session access token
- `POST /api/auth/logout` - Clear authentication session
- `GET /api/auth/me` - Retrieve authenticated user profile

### 📦 Listings (`/api/listings`)
- `GET /api/listings` - List active listings with search, category, proximity filters
- `POST /api/listings` - Create a new surplus/dead stock listing *(Auth required)*
- `GET /api/listings/:id` - Fetch detailed information for a single listing
- `PUT /api/listings/:id` - Update listing details *(Owner only)*
- `DELETE /api/listings/:id` - Soft-delete / deactivate listing *(Owner or Admin)*
- `GET /api/listings/mine` - Retrieve all listings created by the current user
- `POST /api/listings/match` - Smart match listings against buyer requirements

### 🤝 Reservations (`/api/reservations`)
- `POST /api/reservations` - Reserve a listing and create negotiation room
- `GET /api/reservations` - Retrieve reservations where user is buyer or seller
- `GET /api/reservations/:id` - Fetch single reservation details with chat history
- `PATCH /api/reservations/:id/status` - Update reservation status (`confirmed`, `completed`, `cancelled`)
- `POST /api/reservations/:id/proof` - Upload proof of delivery/handover photo

### 💬 Messages (`/api/messages`)
- `GET /api/messages/:reservationId` - Fetch all messages for a reservation
- `POST /api/messages` - Send a message *(Also broadcasts via Socket.io)*

### ⭐ Ratings (`/api/ratings`)
- `POST /api/ratings` - Submit a score (1-5) and feedback for a completed transaction
- `GET /api/ratings/user/:userId` - Fetch public reviews received by a user

### 🛡️ Admin (`/api/admin`)
- `GET /api/admin/metrics` - Fetch platform KPIs, revenue, volume, and user stats
- `GET /api/admin/users` - List all users with moderation controls
- `PATCH /api/admin/users/:id/verify` - Toggle business verification badge
- `PATCH /api/admin/users/:id/status` - Suspend or reactivate user account
- `GET /api/admin/listings` - Moderation queue for all system listings

---

## ⏱ Reservation Lifecycle & Background Jobs

1. **Reservation Created**: When a buyer reserves an item, the listing status transitions to `reserved` and an expiration timestamp (`expiresAt`) is set (default: 24 hours).
2. **Real-time Discussion**: Buyer and seller discuss logistics and final price via the integrated WebSocket chat room (`reservation:<id>`).
3. **Confirmation & Fulfillment**:
   - Seller confirms ➔ Status becomes `confirmed`.
   - Buyer/Seller marks complete ➔ Status becomes `completed` and listing becomes `sold`.
   - Either party cancels ➔ Listing reverts to `active`.
4. **Automated Expiration Scheduler**:
   - A background cron-interval runs in `server/src/index.ts` every **60 seconds**.
   - Any `pending` reservation past `expiresAt` is automatically transitioned to `cancelled`, and the underlying listing is restored to `active`.

---

## ❓ Troubleshooting & Common Questions

### 1. Database errors or schema out-of-sync
If you update `prisma/schema.prisma` or experience SQLite locking:
```bash
cd server
npx prisma db push
npx prisma generate
npm run db:seed
```

### 2. Port already in use (`EADDRINUSE: 3001` or `5173`)
- Change `PORT=3001` in `server/.env` to another port (e.g. `3002`).
- Update `client/vite.config.ts` proxy targets to match the new backend port.

### 3. File upload issues
Uploaded proof images are stored locally in `server/uploads/`. Ensure the directory exists or has write permissions.

---

## 📄 License
This project is licensed under the ISC License.
