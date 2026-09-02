# StockBridge — API Endpoints & Feature Specifications

This document catalogs all implemented endpoints, active services, and planned/extended API endpoints designed to power the Stitch B2B surplus exchange platform.

---

## 1. Authentication & Merchant Identity (`/api/auth`)

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | ✅ **Active** | Create a new merchant account with business name, address, and coordinates. |
| `POST` | `/api/auth/login` | ✅ **Active** | Authenticate merchant and return JWT tokens (Access + Refresh). |
| `POST` | `/api/auth/refresh` | ✅ **Active** | Exchange valid refresh token for a new access token. |
| `GET` | `/api/auth/me` | ✅ **Active** | Retrieve authenticated merchant profile, trust metrics, and coordinates. |
| `PUT` | `/api/auth/profile` | ✅ **Active** | Update merchant business name, contact info, physical address, and GPS lat/lng. |
| `POST` | `/api/auth/kyc/upload` | ⏳ *Planned* | Upload GSTIN certificate, Trade License, and KYC proof for verified badge. |

---

## 2. Surplus Listings & Discovery (`/api/listings`)

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/listings` | ✅ **Active** | Search and browse active surplus lots with pagination, category, keyword, and location radius filters. |
| `GET` | `/api/listings/:id` | ✅ **Active** | Get full details of a specific inventory lot including seller rating, batch quantity, unit price, and expiry. |
| `POST` | `/api/listings` | ✅ **Active** | Create a new surplus lot (title, category, quantity, unit, pricePerUnit, expiryDate, urgency). |
| `DELETE` | `/api/listings/:id` | ✅ **Active** | Deactivate an owned surplus listing. |
| `GET` | `/api/listings/my/all` | ✅ **Active** | Fetch all lots created by the authenticated merchant with status counts. |
| `GET` | `/api/listings/meta/categories` | ✅ **Active** | Fetch list of standard surplus inventory categories and active lot counts. |
| `POST` | `/api/listings/match` | ✅ **Active** | Multi-token algorithm calculating optimal proximity, category, and budget liquidation matches. |
| `POST` | `/api/listings/voice-parse` | ✅ **Active** | Process raw audio transcript and extract structured inventory fields via AI. |
| `GET` | `/api/listings/meta/trending-nearby` | ⏳ *Planned* | Aggregate top searched inventory categories within a 10km radius of the user. |

---

## 3. Reservations & Orders (`/api/reservations`)

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reservations` | ✅ **Active** | Create a 24-hour holding reservation on a lot (zero advance payment required). |
| `GET` | `/api/reservations/my/buying` | ✅ **Active** | Fetch all inventory reservations placed by the user. |
| `GET` | `/api/reservations/my/selling` | ✅ **Active** | Fetch all inventory reservations placed on the user's listings. |
| `POST` | `/api/reservations/:id/confirm` | ✅ **Active** | Seller approves and locks the reservation for pickup/delivery. |
| `POST` | `/api/reservations/:id/complete` | ✅ **Active** | Mark trade handover as completed (supports optional proof photo upload). |
| `POST` | `/api/reservations/:id/cancel` | ✅ **Active** | Cancel reservation and restore original inventory volume to the marketplace. |

---

## 4. Real-Time Negotiation Chat (`/api/messages` & WebSockets)

| Method / Event | Endpoint / Channel | Status | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/messages/reservation/:resId` | ✅ **Active** | Fetch historical message thread for a specific trade reservation. |
| `GET` | `/api/messages/unread/count` | ✅ **Active** | Get total count of unread messages across all active trades. |
| `WS Event` | `join-reservation` | ✅ **Active** | Join real-time socket room for instant negotiation and updates. |
| `WS Event` | `send-message` | ✅ **Active** | Dispatch message payload to counterparty in real time. |
| `WS Event` | `new-message` | ✅ **Active** | Receive broadcasted message in chat window. |

---

## 5. Trust & Ratings (`/api/ratings`)

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ratings` | ✅ **Active** | Submit 1–5 star rating and feedback comment after completing a trade. |
| `GET` | `/api/ratings/user/:userId` | ✅ **Active** | Retrieve trust score history and counterparty reviews for a merchant. |

---

## 6. Administrative Command Center (`/api/admin`)

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | ✅ **Active** | Platform KPIs: Total users, active lots, reservations, completed trades. |
| `GET` | `/api/admin/users` | ✅ **Active** | List all registered merchant accounts with status and transaction volumes. |
| `GET` | `/api/admin/listings` | ✅ **Active** | List all platform inventory lots with status flags. |
| `POST` | `/api/admin/users/:id/toggle` | ✅ **Active** | Suspend or reactivate a merchant account. |
| `POST` | `/api/admin/listings/:id/toggle` | ✅ **Active** | Moderate, expire, or re-activate a surplus lot. |
| `GET` | `/api/admin/merchants/:id` | ⏳ *Planned* | Detailed merchant dossier (KYC status, bank linkage, dispute history). |
| `POST` | `/api/admin/merchants/:id/verify` | ⏳ *Planned* | Approve or revoke merchant verification checkmark. |

---

## 7. AI & Voice Pipeline (`/api/ai`)

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/voice-extract` | ✅ **Active** | Web Speech / Audio stream -> LLM structured extraction (Hindi, Hinglish, Kannada, Punjabi, English). |
| `POST` | `/api/ai/smart-pricing` | ⏳ *Planned* | Recommend optimal liquidation discount based on expiry urgency and category demand. |
