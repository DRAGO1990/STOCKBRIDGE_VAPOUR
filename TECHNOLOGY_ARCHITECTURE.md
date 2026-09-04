# StockBridge — Technology Architecture & System Design 🏗️

> **Comprehensive Technical Specification for the Hyperlocal B2B Liquidation Engine**

---

## 1. 📐 High-Level System Architecture

StockBridge follows a clean, decoupled client-server architecture designed for high availability, low latency, and ease of deployment.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                  │
│   React 19 SPA • Vite • Tailwind v4 • Stitch UI Tokens • Framer Motion  │
│   Zustand (State) • Web Speech API (Voice STT) • Socket.IO Client       │
│   Smart Inventory Predictor • Invoice OCR Modal • Live Notification Bar │
└────────────────────┬───────────────────────────────▲────────────────────┘
                     │ HTTPS (REST)                  │ WebSockets (WSS)
                     ▼                               │
┌────────────────────────────────────────────────────┴────────────────────┐
│                           BACKEND SERVICES                              │
│   Node.js 20+ • Express 5 • TypeScript • Socket.IO Server Engine        │
│                                                                         │
│   ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │
│   │  Auth & KYC      │  │ Matching Engine  │  │ Voice Extraction AI │  │
│   │  JWT, Bcrypt, KYC│  │ Haversine Search │  │ Gemini & Regex Fall │  │
│   └──────────────────┘  └──────────────────┘  └─────────────────────┘  │
│   ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │
│   │ Invoice OCR (AI) │  │ Inventory Engine │  │ Expiry Monitor      │  │
│   │ Gemini Vision 1.5│  │ LWMA Velocity    │  │ Auto-Unlist Daemon  │  │
│   └──────────────────┘  └──────────────────┘  └─────────────────────┘  │
│   ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │
│   │ Listing Pipeline │  │ 24h Reservation  │  │ Double-Blind Rating │  │
│   │ Mandatory MRP/Zod│  │ State Machine    │  │ Trust Ledger        │  │
│   └──────────────────┘  └──────────────────┘  └─────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Prisma ORM 5
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            PERSISTENCE LAYER                            │
│   Relational Database (SQLite for Dev / PostgreSQL for Production)      │
│   Tables: User • Listing • InvoiceVerification • InventoryBatch •       │
│           DailyInventoryLog • Reservation • Message • Rating • Notif    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 💻 Frontend Technical Stack

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **React 19** | Latest concurrent rendering and functional component architecture. |
| **Build Tool** | **Vite 8** | Sub-second HMR (Hot Module Replacement) and optimized tree-shaken production bundles. |
| **Styling** | **Tailwind CSS v4** | Pure CSS-in-utility styling configured with custom design tokens. |
| **Design System** | **Stitch UI** | Deep charcoal theme (`#131313`, `#1c1b1b`, `#2a2a2a`, `#3d4947`, `#6bd8cb`). |
| **Typography** | **Google Fonts** | **Sora** (Headlines & Numbers) + **Work Sans** (Labels & Body Text). |
| **State Store** | **Zustand** | Lightweight, reactive state management with localStorage persistence (`authStore`). |
| **Animation** | **Framer Motion** | Micro-interactions, page route transitions, and interactive visual equalizers. |
| **Icons** | **Lucide React** | Feather-light SVG icons unified across all screens. |
| **HTTP Client** | **Axios** | Interceptor-configured REST client injecting JWT bearer tokens automatically. |

### Design System Tokens (`index.css`):
```css
:root {
  --color-background: #131313;
  --color-surface-card: #1c1b1b;
  --color-surface-container: #2a2a2a;
  --color-border-subtle: #3d4947;
  --color-primary-teal: #6bd8cb;
  --color-on-primary: #003732;
  --color-warning-amber: #f6b351;
  --color-alert-rose: #ffb4ab;
}
```

---

## 3. ⚙️ Backend Technical Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Runtime** | **Node.js (LTS 20+)** | Asynchronous, non-blocking I/O ideal for real-time order negotiation. |
| **Framework** | **Express 5** | High-throughput HTTP routing and modern middleware chain. |
| **Language** | **TypeScript 5** | Strict type safety spanning shared API requests, responses, and DB schemas. |
| **Database ORM** | **Prisma 5** | Type-safe query building, auto-generated migrations, and relational joins. |
| **Validation** | **Zod** | Runtime schema enforcement for API payloads preventing malformed data. |
| **Vision AI** | **Gemini 1.5 Flash** | Multimodal OCR and structured line-item extraction for wholesale tax invoices. |
| **Real-time** | **Socket.IO 4** | Bidirectional low-latency messaging rooms and instant trade notification dispatch. |
| **File Storage** | **Multer** | Multipart stream parsing for product photos and invoice documents with disk storage. |
| **Security** | **JWT + Bcrypt.js** | Stateless authentication tokens and salted password hashing (10 rounds). |

---

## 4. 🗄️ Database Schema & Data Models

Managed via **Prisma ORM** (`server/prisma/schema.prisma`):

```mermaid
erDiagram
    USER ||--o{ LISTING : "owns"
    USER ||--o{ RESERVATION : "reserves as buyer"
    USER ||--o{ INVENTORY_BATCH : "tracks store stock"
    USER ||--o{ INVOICE_VERIFICATION : "uploads bills"
    USER ||--o{ NOTIFICATION : "receives"
    LISTING ||--o| INVOICE_VERIFICATION : "verified by"
    LISTING ||--o{ RESERVATION : "booked under"
    INVENTORY_BATCH ||--o{ DAILY_INVENTORY_LOG : "records daily sales"
    RESERVATION ||--o{ MESSAGE : "contains negotiation"
    RESERVATION ||--o{ RATING : "yields peer review"

    USER {
        string id PK
        string email UK
        string password
        string name
        string businessName
        string address
        float lat
        float lng
        boolean isVerified
        string kycStatus
        string kycDocumentUrl
        boolean isAdmin
        float rating
        datetime createdAt
    }

    LISTING {
        string id PK
        string sellerId FK
        string invoiceVerificationId FK
        string title
        string category
        float quantity
        string unit
        float pricePerUnit
        float originalMrp
        datetime expiryDate
        string urgency
        string status
        string imageUrl
        datetime createdAt
    }

    INVOICE_VERIFICATION {
        string id PK
        string merchantId FK
        string invoiceNumber
        string supplierName
        datetime invoiceDate
        json extractedData
        string rawOcrText
        float confidence
        datetime verifiedAt
        datetime createdAt
    }

    INVENTORY_BATCH {
        string id PK
        string merchantId FK
        string productName
        string category
        float currentStock
        string unit
        float costPrice
        float originalMrp
        float sellingPrice
        datetime expiryDate
        float minThreshold
        datetime createdAt
    }

    DAILY_INVENTORY_LOG {
        string id PK
        string batchId FK
        datetime date
        float unitsSold
        float spoilage
        string notes
        datetime createdAt
    }

    RESERVATION {
        string id PK
        string listingId FK
        string buyerId FK
        float agreedPrice
        float agreedQty
        string status
        datetime expiresAt
        string proofImage
        datetime completedAt
        datetime createdAt
    }

    MESSAGE {
        string id PK
        string reservationId FK
        string senderId FK
        string text
        datetime createdAt
    }

    RATING {
        string id PK
        string reservationId FK
        string raterId FK
        string ratedId FK
        int score
        string comment
        datetime createdAt
    }

    NOTIFICATION {
        string id PK
        string userId FK
        string title
        string message
        string type
        boolean isRead
        string linkUrl
        datetime createdAt
    }
```

---

## 5. 📍 Proximity Matchmaking Engine

The proximity engine computes physical geodesic distance between two merchants using the **Haversine Formula**:

$$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$

Where:
- $R = 6371\text{ km}$ (Earth's mean radius)
- $\phi_1, \phi_2$ are latitudes in radians
- $\Delta \lambda = \lambda_2 - \lambda_1$ is difference in longitude

### Multi-Factor Match Score Algorithm:
When matching a buyer's request against available stock, a composite match score ($0\% \text{ to } 100\%$) is calculated:

$$\text{Score} = (0.30 \times S_{\text{distance}}) + (0.25 \times S_{\text{discount}}) + (0.15 \times S_{\text{expiry}}) + (0.15 \times S_{\text{urgency}}) + (0.15 \times S_{\text{trust}})$$

1. **Distance Factor ($30\%$)**: Penalizes lots beyond 15 km; rewards same-neighborhood (< 3 km) stock.
2. **Discount Factor ($25\%$)**: Evaluates wholesale markdown percentage compared to standard market benchmark.
3. **Expiry Window ($15\%$)**: Prioritizes lots with 10–30 days remaining to accelerate food and perishable rescue.
4. **Urgency Weight ($15\%$)**: Distressed inventory with active clearance flags receives immediate promotion.
5. **Seller Trust ($15\%$)**: Verified merchants with $\ge 4.5$ stars receive priority placement.

---

## 6. 🎙️ Multilingual AI Voice-to-Listing Pipeline

```
[Merchant Spoken Voice]
          │
          ▼
┌────────────────────────────────────────────────────────┐
│  Web Speech API (Browser STT Engine)                   │
│  Streams live speech in hi-IN, en-IN, kn-IN, pa-IN     │
└─────────────────────────┬──────────────────────────────┘
                          │ Raw Multi-lingual Transcript
                          ▼
┌────────────────────────────────────────────────────────┐
│  Backend Parsing Pipeline (/api/voice/parse)           │
│                                                        │
│  Primary: Gemini Flash Structured LLM Extraction       │
│  Fallback: Regex Token & Unit Normalizer               │
└─────────────────────────┬──────────────────────────────┘
                          │ Structured JSON
                          ▼
┌────────────────────────────────────────────────────────┐
│  Normalized Listing Entity                             │
│  • title: "Fortune Sunflower Oil"                      │
│  • category: "Groceries"                               │
│  • quantity: 50, unit: "packets"                       │
│  • pricePerUnit: 110, expiryDate: "2026-11-20"         │
│  • urgency: "medium", confidence: 0.92                 │
└────────────────────────────────────────────────────────┘
```

### Dialect & Term Normalization
Regional Indian wholesale units are automatically normalized into canonical database quantities:
- *"Bori"* / *"Katte"* $\rightarrow$ `bags`
- *"Peti"* / *"Dabba"* $\rightarrow$ `boxes`
- *"Darjan"* $\rightarrow$ `pieces` ($\times 12$)
- *"Quintal"* $\rightarrow$ `kg` ($\times 100$)

---

## 7. ⏱️ 24-Hour Holding Window State Machine

Reservations implement a time-locked state machine preventing inventory hoarding:

```mermaid
stateDiagram-v2
    [*] --> PENDING : Buyer Reserves (Zero Advance)
    
    PENDING --> ACCEPTED : Seller Accepts Terms
    PENDING --> REJECTED : Seller Declines
    PENDING --> EXPIRED : 24h Timer Expires (Stock Released)
    
    ACCEPTED --> COMPLETED : Inspection & Proof Uploaded
    ACCEPTED --> CANCELLED : Mutual Agreement / Dispute
    
    COMPLETED --> [*] : Double-Blind Ratings Unlocked
    EXPIRED --> [*] : Lot Re-enters Marketplace
    REJECTED --> [*] : Lot Re-enters Marketplace
```

1. **Locking**: When a buyer clicks "Reserve Stock", available lot quantity is decremented immediately, and `expiresAt` is set to $T + 24\text{ hours}$.
2. **Channel Opening**: A dedicated WebSocket negotiation room is instantiated for the buyer and seller.
3. **Auto-Reversion**: If the reservation remains unfulfilled past 24 hours, background scheduling transitions the status to `EXPIRED` and returns the stock quantity to the active market pool.

---

## 8. 📊 Smart Inventory & LWMA Sales Velocity Prediction Engine

To prevent dead stock before it happens, the inventory prediction service (`server/src/services/inventoryPredictionService.ts`) implements a **Linear Weighted Moving Average (LWMA)** across recorded daily sales:

$$\text{Velocity} = \frac{\sum_{i=1}^{n} w_i \cdot S_i}{\sum_{i=1}^{n} w_i}$$

Where:
- $S_i$ is the sales volume on day $i$
- $w_i = i$ assigns higher weight to recent daily transactions ($w_n > w_{n-1} > \dots > w_1$)
- If fewer than 2 sales logs exist, the engine defaults to a conservative fallback baseline: $\text{FallbackVelocity} = \max(0.5, \frac{\text{CurrentStock}}{30})$.

### Days to Stockout & Dead-Stock Risk Classification:
$$\text{DaysToStockout} = \frac{\text{CurrentStock}}{\text{Velocity}}$$
$$\text{DaysToExpiry} = \frac{\text{ExpiryDate} - \text{Today}}{86,400,000\text{ ms}}$$

| Risk Tier | Condition | Actionable Recommendation |
| :--- | :--- | :--- |
| **CRITICAL** | $\text{DaysToStockout} > \text{DaysToExpiry}$ and $\text{DaysToExpiry} \le 25$ | High dead-stock risk. Immediate 1-click liquidation recommended on StockBridge. |
| **HIGH_RISK** | $\text{DaysToStockout} > \text{DaysToExpiry}$ and $\text{DaysToExpiry} \le 45$ | Stockout will not occur before expiry; liquidate surplus quantity. |
| **MODERATE** | $\text{DaysToStockout} > 0.8 \times \text{DaysToExpiry}$ | Monitor velocity; consider promotional markdown. |
| **HEALTHY** | $\text{DaysToStockout} \le 0.8 \times \text{DaysToExpiry}$ | Stock will safely sell out well before expiry. |

---

## 9. 🧾 AI Invoice OCR & Mandatory MRP Enforcement

StockBridge eliminates counterfeit discounts and predatory markups by binding surplus lots to authenticated wholesale tax bills:

```
[Merchant Tax Invoice / Bill Photo]
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  Multipart File Upload via Multer (/api/invoices/verify)│
│  Validated format: PNG, JPEG, WebP (Max 5MB)           │
└────────────────────────┬───────────────────────────────┘
                         │ Binary Buffer
                         ▼
┌────────────────────────────────────────────────────────┐
│  Gemini 1.5 Flash Vision Multimodal Extraction         │
│  Prompt-engineered schema extraction:                  │
│  • supplierName, invoiceNumber, invoiceDate            │
│  • lineItems[]: { productName, quantity, unit,         │
│                   unitPrice, originalMrp, total }       │
│  • overallConfidence (0.00 – 1.00)                     │
└────────────────────────┬───────────────────────────────┘
                         │ Structured Verification Record
                         ▼
┌────────────────────────────────────────────────────────┐
│  Prisma InvoiceVerification Table                      │
│  Listing requires invoiceVerificationId & originalMrp  │
│  Zod Check: pricePerUnit <= originalMrp (Strict)       │
│  UI: Green "Verified Invoice" Badge on Listing Card    │
└────────────────────────────────────────────────────────┘
```

---

## 10. 🛡️ Dynamic Urgency Engine & Expiry Auto-Unlisting Daemon

Surplus inventory shelf life is protected by automated lifecycle rules:

1. **Dynamic Urgency Calculation**:
   $$\text{DaysRemaining} = \left\lfloor \frac{\text{ExpiryDate} - \text{Now}}{86,400,000} \right\rfloor$$
   - $\text{DaysRemaining} \in [11, 25] \implies \text{HIGH Urgency}$
   - $\text{DaysRemaining} \in [26, 50] \implies \text{MEDIUM Urgency}$
   - $\text{DaysRemaining} > 50 \implies \text{LOW Urgency}$

2. **Automated Expiry Unlisting Daemon (`server/src/services/expiryMonitor.ts`)**:
   - Runs periodically in the background.
   - Any active listing where $\text{DaysRemaining} < 11$ is automatically transitioned to status `expiry_unlisted`.
   - Hidden from public marketplace search and queries to guarantee retail buyers never receive distressed goods incapable of neighborhood turnaround.

---

## 11. 🔒 Security & Data Integrity

- **Stateless Authentication**: Cryptographically signed JSON Web Tokens (`HMAC-SHA256`) with configurable expiration.
- **Password Security**: Passwords salted and hashed with `bcryptjs` (work factor: 10).
- **Double-Blind Reviews**: Rating records contain a `released` flag. The system only exposes scores on a seller or buyer profile when both counterparties have submitted their review, preventing retaliatory bias.
- **SQL Injection Prevention**: Prisma ORM executes parameterized queries for all database interactions.
- **Input Sanitization**: Zod schemas validate and strip unexpected payload attributes across all mutating routes (`POST`, `PUT`, `PATCH`).
- **File Validation**: Multer storage filters enforce mime-type integrity and reject files exceeding 5MB.

---

## 12. 🚀 Deployment & DevOps Setup

- **Frontend Build**: Vite compiles to optimized static assets in `/client/dist/`. Can be hosted on Vercel, Netlify, or AWS CloudFront/S3.
- **Backend Build**: TypeScript compiled via `tsc` to `/server/dist/`. Can run in any Node.js container (AWS ECS, Render, Fly.io, or DigitalOcean Droplet).
- **Environment Variables**:
  - `DATABASE_URL`: Connection string for SQLite (`file:./dev.db`) or PostgreSQL (`postgresql://...`).
  - `JWT_SECRET`: Secret key for token signing.
  - `PORT`: Default `5000`.
  - `GEMINI_API_KEY`: Key for enhanced AI voice parsing and invoice OCR.

---

**StockBridge Architecture Team** • *Built for speed, reliability, and hyperlocal scale.*

