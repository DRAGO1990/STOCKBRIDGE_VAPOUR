# StockBridge — API Endpoints & Feature Specifications

This document catalogs all implemented endpoints, active services, and planned/extended API endpoints designed to power the StockBridge B2B surplus exchange platform.

---

## 1. Authentication & Merchant Identity (`/api/auth`)

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | ✅ **Active** | Create a new merchant account with business name, address, coordinates, and default KYC status. |
| `POST` | `/api/auth/login` | ✅ **Active** | Authenticate merchant and return JWT tokens (Access + Refresh). |
| `POST` | `/api/auth/refresh` | ✅ **Active** | Exchange valid refresh token for a new access token. |
| `GET` | `/api/auth/me` | ✅ **Active** | Retrieve authenticated merchant profile, trust metrics, coordinates, and KYC badge status. |
| `PUT` | `/api/auth/profile` | ✅ **Active** | Update merchant business name, contact info, physical address, and GPS lat/lng. |
| `POST` | `/api/auth/kyc/upload` | ✅ **Active** | Upload GSTIN certificate, Trade License, or KYC proof for admin review. |

---

## 2. Surplus Listings & Discovery (`/api/listings`)

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/listings` | ✅ **Active** | Search and browse active surplus lots with pagination, category, keyword, and location radius filters. Excludes auto-unlisted expiring stock (< 11 days). |
| `GET` | `/api/listings/:id` | ✅ **Active** | Get full details of a specific inventory lot including seller rating, batch quantity, unit price, MRP, verified invoice badge, and expiry. |
| `POST` | `/api/listings` | ✅ **Active** | Create a new surplus lot with mandatory `originalMrp` and linked `invoiceVerificationId`. Enforces `pricePerUnit <= originalMrp`. |
| `PUT` | `/api/listings/:id` | ✅ **Active** | Update lot price, quantity, or urgency for owned listing. |
| `DELETE` | `/api/listings/:id` | ✅ **Active** | Deactivate an owned surplus listing. |
| `GET` | `/api/listings/my/all` | ✅ **Active** | Fetch all lots created by the authenticated merchant with status counts. |
| `GET` | `/api/listings/meta/categories` | ✅ **Active** | Fetch list of standard surplus inventory categories and active lot counts. |
| `POST` | `/api/listings/match` | ✅ **Active** | Multi-token algorithm calculating optimal proximity, category, and budget liquidation matches. |
| `POST` | `/api/listings/voice-parse` | ✅ **Active** | Process raw audio transcript and extract structured inventory fields via Gemini Flash AI with regex fallback. |
| `POST` | `/api/listings/upload-image` | ✅ **Active** | Upload product lot photos (Multer, WebP/PNG/JPEG, max 5MB) stored in `/uploads/products/`. |
| `GET` | `/api/listings/meta/trending-nearby` | ⏳ *Planned* | Aggregate top searched inventory categories within a 10km radius of the user. |

---

## 3. AI Invoice OCR & Price Verification (`/api/invoices`)

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/invoices/verify` | ✅ **Active** | Upload wholesale invoice/tax bill photo. Analyzes with Gemini Vision OCR to extract supplier, invoice number, line items, MRP, and wholesale purchase rates to verify authentic discounts. |
| `GET` | `/api/invoices/:id` | ✅ **Active** | Retrieve verification status, extracted item lines, and confidence metrics for a verified invoice. |

---

## 4. Smart Inventory & Dead-Stock Predictor (`/api/inventory`)

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/inventory` | ✅ **Active** | Fetch all store inventory batches with calculated sales velocity (LWMA), projected stockout date, dead-stock risk level, and value at risk. |
| `POST` | `/api/inventory` | ✅ **Active** | Create a tracked warehouse inventory batch (productName, category, currentStock, unit, costPrice, originalMrp, sellingPrice, expiryDate). |
| `GET` | `/api/inventory/summary` | ✅ **Active** | Store-level KPI metrics: Total Active Batches, Value at Risk (₹), High/Critical Risk Count, Healthy Batches Count. |
| `POST` | `/api/inventory/:id/log` | ✅ **Active** | Record daily sales units and spoilage to recalibrate sales velocity algorithms. |
| `GET` | `/api/inventory/:id/history` | ✅ **Active** | Retrieve historical sales logs and velocity trends for a specific batch. |
| `DELETE` | `/api/inventory/:id` | ✅ **Active** | Archive/remove an inventory tracking batch. |

---

## 5. Reservations & Orders (`/api/reservations`)

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reservations` | ✅ **Active** | Create a 24-hour holding reservation on a lot (zero advance payment required). |
| `GET` | `/api/reservations/my/buying` | ✅ **Active** | Fetch all inventory reservations placed by the user. |
| `GET` | `/api/reservations/my/selling` | ✅ **Active** | Fetch all inventory reservations placed on the user's listings. |
| `POST` | `/api/reservations/:id/confirm` | ✅ **Active** | Seller approves and locks the reservation for pickup/delivery. |
| `POST` | `/api/reservations/:id/complete` | ✅ **Active** | Mark trade handover as completed (supports optional proof photo upload). |
| `POST` | `/api/reservations/:id/cancel` | ✅ **Active** | Cancel reservation and restore original inventory volume to the marketplace. |

---

## 6. Real-Time Negotiation Chat (`/api/messages` & WebSockets)

| Method / Event | Endpoint / Channel | Status | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/messages/reservation/:resId` | ✅ **Active** | Fetch historical message thread for a specific trade reservation. |
| `GET` | `/api/messages/unread/count` | ✅ **Active** | Get total count of unread messages across all active trades. |
| `WS Event` | `join-reservation` | ✅ **Active** | Join real-time socket room for instant negotiation and updates. |
| `WS Event` | `send-message` | ✅ **Active** | Dispatch message payload to counterparty in real time. |
| `WS Event` | `new-message` | ✅ **Active** | Receive broadcasted message in chat window. |

---

## 7. In-App Real-Time Notification Center (`/api/notifications`)

| Method / Event | Endpoint / Channel | Status | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | ✅ **Active** | Fetch paginated user notifications with unread count. |
| `PATCH` | `/api/notifications/:id/read` | ✅ **Active** | Mark a specific notification as read. |
| `PATCH` | `/api/notifications/read-all` | ✅ **Active** | Mark all user notifications as read. |
| `WS Event` | `notification:new` | ✅ **Active** | Real-time push notification delivered to active merchant session. |

---

## 8. Trust & Ratings (`/api/ratings`)

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ratings` | ✅ **Active** | Submit 1–5 star rating and feedback comment after completing a trade. |
| `GET` | `/api/ratings/user/:userId` | ✅ **Active** | Retrieve double-blind trust score history and counterparty reviews for a merchant. |

---

## 9. Administrative Command Center (`/api/admin`)

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | ✅ **Active** | Platform KPIs: Total users, active lots, reservations, completed trades, active GMV. |
| `GET` | `/api/admin/users` | ✅ **Active** | List all registered merchant accounts with status, KYC state, and transaction volumes. |
| `GET` | `/api/admin/listings` | ✅ **Active** | List all platform inventory lots with status flags. |
| `POST` | `/api/admin/users/:id/toggle` | ✅ **Active** | Suspend or reactivate a merchant account. |
| `POST` | `/api/admin/users/:id/verify` | ✅ **Active** | Approve or reject merchant KYC verification checkmark. |
| `POST` | `/api/admin/listings/:id/toggle` | ✅ **Active** | Moderate, expire, or re-activate a surplus lot. |

---

## 10. AI & Voice Pipeline (`/api/ai` / `/api/listings/voice-parse`)

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/listings/voice-parse` | ✅ **Active** | Web Speech / Audio stream -> LLM structured extraction (Hindi, Hinglish, Kannada, Punjabi, English) with resilient regex fallback. |
| `POST` | `/api/ai/smart-pricing` | ⏳ *Planned* | Recommend optimal liquidation discount based on expiry urgency, current market velocity, and category demand. |

