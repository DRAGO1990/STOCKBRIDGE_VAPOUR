# 🎲 StockBridge Random Data Generator

A dedicated toolset on the `random-generator` branch for creating realistic B2B marketplace activity on StockBridge. It generates:
- **Commercial Counterparties**: Authenticated buyers, sellers, distributors, and wholesalers situated across major regional clusters (Mumbai, Delhi NCR, Bangalore, Hyderabad, Chennai, Pune, Ahmedabad, Kolkata).
- **Surplus Inventory Lots**: Categorized surplus listings across Groceries, Electronics, Packaging, Stationery, Cleaning, Textiles, and Food & Beverages with realistic quantities, units, tiered pricing, and near-expiry deadlines.
- **Active Negotiations & Transactions**: Pending, confirmed, and completed reservations with negotiation dialogues and peer ratings.

---

## 🚀 Quick Start

### 1. Fast TypeScript / Node.js Generator (No extra setup needed)
Run directly from the root workspace:

```bash
# Generate 12 customers, 24 surplus listings, and 6 active deals
npm run generate

# Or pass custom counts
npx tsx server/src/scripts/random_generator.ts --users=20 --listings=50 --reservations=10
```

---

### 2. Python Generator (`scripts/random_generator.py`)
Pure Python standard library script (zero `pip` dependencies needed).

#### A. Direct Database Injection (Fastest, no server required)
```bash
python scripts/random_generator.py --mode db --users 15 --listings 30 --reservations 8
```

#### B. Live REST API Mode (Connects to running StockBridge backend)
1. Start the server in one terminal:
   ```bash
   npm run dev:server
   ```
2. Run the generator to simulate real network requests and user signups:
   ```bash
   python scripts/random_generator.py --mode api --url http://localhost:3001/api --users 10 --listings 20
   ```

#### C. Continuous Simulation Stream (For live demo / real-time activity)
Periodically emits new users, listings, and deals every N seconds to keep the marketplace dynamic during presentations:
```bash
python scripts/random_generator.py --mode stream --interval 5
```

---

## 🔑 Test Account Credentials
All generated random customer accounts are configured with the standard demo password:
- **Email**: printed in console logs (e.g. `rohan.desai241@stockbridge-demo.in`)
- **Password**: `password123`
