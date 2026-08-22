# 🎲 StockBridge — Random Generator Branch Documentation

> **Branch:** `random-generator`  
> **Focus:** High-Fidelity Synthetic Data Generation, Commercial Counterparty Simulation & Marketplace Load Testing

---

## 📖 Overview

The `random-generator` branch houses the simulation engine for StockBridge. It provides automated generation of realistic commercial counterparties, multi-category surplus lots, live transaction negotiations, and peer feedback across India's largest economic clusters.

---

## 🌟 Key Features in `random-generator`

### 1. Multi-Cluster Indian Geographic Distribution
Generates businesses with authentic GPS coordinates, business names, addresses, and trade profiles across 8 major commercial hubs:
- **Mumbai MMR** (Bhiwandi, APMC Vashi, Andheri MIDC, Crawford Market)
- **Delhi NCR** (Khari Baoli, Okhla Industrial Area, Chandni Chowk, Gurgaon Udyog Vihar)
- **Bangalore** (Yeshwanthpur APMC, Peenya Industrial Area, Whitefield)
- **Hyderabad** (Kattedan Industrial Area, Begum Bazaar, Sanathnagar)
- **Chennai** (Koyambedu, Ambattur, George Town)
- **Pune** (Marketyard, Bhosari MIDC, Hadapsar)
- **Ahmedabad** (Kalupur, Naroda GIDC, Changodar)
- **Kolkata** (Posta Bazar, Burrabazar, Taratala)

### 2. Deep Domain Taxonomy & Realistic Pricing
- Generates categorized batches with authentic Indian trade units (`bags/bori`, `boxes/peti`, `packets`, `cans/tins`, `reams`, `litres`, `kg`, `pieces`).
- Generates realistic MRPs, distress liquidation rates (30% to 75% discounts), MOQs, batch codes, and perishable expiration dates.

### 3. Execution Modes
1. **Direct Database Injection (TypeScript / tsx)**:
   ```bash
   npm run generate
   # Or with parameters:
   npx tsx server/src/scripts/random_generator.ts --users=25 --listings=60 --reservations=15
   ```
2. **Python Standalone Mode (`scripts/random_generator.py`)**:
   - Zero external `pip` dependencies.
   - DB Mode: `python scripts/random_generator.py --mode db --users 20 --listings 40`
   - REST API Simulation Mode: `python scripts/random_generator.py --mode api --url http://localhost:3001/api`
   - Continuous Stream Mode: `python scripts/random_generator.py --mode stream --interval 5`

---

## 🔑 Demo Account Credentials

All generated random merchants are initialized with standardized test credentials:
- **Email**: printed in terminal output (e.g. `anand.sharma82@stockbridge-demo.in`)
- **Password**: `password123`
