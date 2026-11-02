# Blockchain-Based Stock Trading & Audit System (LedgerTrade)

[![Academic Prototype](https://img.shields.io/badge/Academic-B.Tech%20Data%20Science-blue.svg)](https://github.com)
[![Smart Contracts](https://img.shields.io/badge/Solidity-0.8.20-brightgreen.svg)](https://soliditylang.org/)
[![AI Surveillance](https://img.shields.io/badge/FastAPI-Python%203-teal.svg)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/React%2018-Vite%20%2B%20Tailwind-purple.svg)](https://react.dev/)

> **Academic Project Disclaimer:**  
> LedgerTrade is a simulated educational prototype developed for academic demonstration. All securities (`sAAPL`, `sTSLA`, `sMSFT`, `sGOOGL`), cash units (`sUSD`), market prices, and KYC records are **strictly simulated**. The system connects to **no real money, real brokerages, live stock exchanges, or actual clearinghouses**.

---

## 1. System Overview

**LedgerTrade** unites decentralized finance with machine learning market surveillance to solve transparency and auditability challenges in securities trading:

1. **Atomic Delivery-versus-Payment (DvP) Settlement:**  
   Smart contracts written in Solidity `0.8.20` (`TradeSettlement.sol`, `OrderBook.sol`, `CashToken.sol`, `StockToken.sol`) enforce that stock token transfers and cash transfers occur simultaneously in a single atomic transaction—eliminating counterparty settlement risk.
2. **Cryptographic Tamper-Evident Audit Logging:**  
   The `AuditLog.sol` contract and backend audit engine build a sequential cryptographic hash chain ($\text{PreviousHash}_{i-1} \to \text{CanonicalHash}_i$). Any off-chain alteration of a trade's price, quantity, or counterparty breaks the hash chain and is immediately flagged by the Audit Console.
3. **Real-Time AI Market Surveillance:**  
   A dedicated Python FastAPI microservice analyzes an 8-factor surveillance feature vector per trade. An unsupervised **Isolation Forest** computes real-time anomaly scores, while a supervised **Random Forest** identifies specific simulated manipulation signatures (**Wash Trading**, **Spoofing**, and **Pump & Dump**).
4. **Role-Aware Academic Portal:**  
   Instant 1-click role switching between **Investor (Alice/Bob)**, **Broker (Charles)**, **Auditor (Diana)**, and **Regulator (Edward)** with responsive UI in React + Vite + Tailwind CSS.

---

## 2. Directory Structure

```
d:\BLOCKCHAIN PROJECT\
├── blockchain/           # Hardhat Ethereum contracts, tests, and deployment
│   ├── contracts/        # Solidity contracts: UserRegistry, CashToken, StockToken, OrderBook, TradeSettlement, AuditLog
│   ├── test/             # Comprehensive Hardhat contract unit tests (13 passing tests)
│   ├── scripts/          # Contract deployment & demo account bootstrap (deploy.js)
│   └── hardhat.config.js # Compiler 0.8.20 with viaIR & optimizer enabled
├── ml-service/           # Python 3 FastAPI AI Surveillance microservice
│   ├── app/              # Pydantic schemas, synthetic data generator, feature engineering, models pipeline
│   ├── models/           # Persisted joblib models & held-out metadata (Isolation Forest, Random Forest)
│   ├── test_ml.py        # Automated test suite for ML models & API (7 passing tests)
│   └── run.py            # Microservice startup entry point (Port 8000)
├── backend/              # Node.js + Express + TypeScript backend API
│   ├── src/
│   │   ├── controllers/  # Auth, Market, Orders, Trades, Portfolio, Blockchain, Audit, Surveillance
│   │   ├── services/     # Matching engine, blockchain RPC service, market ticker ticks, audit hashing
│   │   ├── storage/      # Resilient dual-engine (in-memory + disk-backed JSON + MongoDB support)
│   │   └── tests/        # Backend integration test suite (13 passing tests)
│   └── dist/             # Compiled production JavaScript bundle
├── frontend/             # React 18 + TypeScript + Vite + Tailwind CSS application
│   ├── src/
│   │   ├── components/   # Navbar, Sidebar, MetricCard, TradingChart, Modal, etc.
│   │   ├── context/      # AuthContext (1-click role switcher), ThemeContext (dark/light)
│   │   ├── pages/        # 11 Dedicated full-feature screens
│   │   └── services/     # Axios client & typed API hooks
│   └── dist/             # Pre-built production web bundle
├── scripts/              # Automated PowerShell & Bash startup/test scripts
│   ├── setup_all.ps1     # One-click dependency installation (Windows)
│   ├── start_all.ps1     # One-click system launcher (Windows)
│   ├── test_all.ps1      # System-wide test runner (Windows)
│   ├── setup_all.sh      # Linux/macOS setup script
│   ├── start_all.sh      # Linux/macOS startup script
│   └── test_all.sh       # Linux/macOS test runner
├── docs/                 # In-depth architectural & academic documentation
│   ├── ARCHITECTURE.md   # Architectural diagrams & trust boundaries
│   ├── API_DOCUMENTATION.md # REST API endpoint definitions
│   ├── BLOCKCHAIN_DESIGN.md # Smart contract DvP & audit mechanics
│   ├── ML_METHODOLOGY.md # Surveillance mathematics & validation metrics
│   └── TROUBLESHOOTING.md # Port management & MetaMask instructions
├── docker-compose.yml    # Multi-container orchestration (Mongo, Blockchain, ML, Backend, Frontend)
└── README.md             # This document
```

---

## 3. Quick Start (Windows PowerShell)

Ensure Node.js and Python 3 are installed on your machine.

### Step 1: Automated Full Setup
Installs all dependencies across the 4 modules:
```powershell
.\scripts\setup_all.ps1
```

### Step 2: Run All Tests
Verifies that all 33 smart contract, machine learning, and backend tests pass:
```powershell
.\scripts\test_all.ps1
```

### Step 3: Launch All 4 Services
Launches the Hardhat node, contract deployment, Python ML microservice, backend API, and React frontend simultaneously:
```powershell
.\scripts\start_all.ps1
```

After launching, open your browser to:
- **Web Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **FastAPI Surveillance Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Hardhat RPC Node:** [http://localhost:8545](http://localhost:8545)

---

## 4. Manual Service Execution (Individual Terminals)

If you prefer launching each service in its own terminal window:

### Terminal 1: Hardhat Ethereum Node & Contract Deployment
```powershell
cd "d:\BLOCKCHAIN PROJECT\blockchain"
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npx hardhat node
```
*In a secondary prompt, deploy the contracts to the local node:*
```powershell
cd "d:\BLOCKCHAIN PROJECT\blockchain"
npx hardhat run scripts/deploy.js --network localhost
```

### Terminal 2: Python FastAPI AI Surveillance Microservice
```powershell
cd "d:\BLOCKCHAIN PROJECT\ml-service"
python run.py
```

### Terminal 3: Node.js Express Backend API
```powershell
cd "d:\BLOCKCHAIN PROJECT\backend"
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm run dev
```

### Terminal 4: React Vite Frontend
```powershell
cd "d:\BLOCKCHAIN PROJECT\frontend"
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm run dev
```

---

## 5. End-to-End Academic Demonstration Walkthrough

Follow these steps for a complete project presentation:

### 1. Role-Aware Login & 1-Click Persona Selection
1. Open [http://localhost:3000](http://localhost:3000).
2. The navbar contains an instant **Demo Account Dropdown**:
   - **Alice (Investor)**: Has $45,000 sUSD, 50 sAAPL, 25 sTSLA.
   - **Bob (Investor)**: Has $62,000 sUSD, 30 sMSFT, 40 sGOOGL.
   - **Charles (Broker)**: Oversees global order routing.
   - **Diana (Auditor)**: Independent verification of cryptographic audit trails.
   - **Edward (Regulator)**: Market surveillance oversight and circuit breakers.

### 2. Placing and Matching an Atomic DvP Order
1. Switch to **Alice (Investor)** and navigate to the **Trading Terminal**.
2. Select **AAPL**, click **BUY**, set Limit Price to `$180.00`, Quantity to `5`, and click **Buy AAPL**.
3. Confirm the order parameters in the modal dialog.
4. Switch to **Bob (Investor)** in the navbar dropdown.
5. In the Trading Terminal, submit a matching **SELL** order for `5` AAPL at `$180.00`.
6. Notice the immediate match! The smart contract executes atomic Delivery-versus-Payment:
   - Alice receives `5` AAPL shares; `$900` sUSD is deducted.
   - Bob receives `$900` sUSD; `5` AAPL shares are deducted.
   - A newly confirmed on-chain transaction hash and canonical hash appear in the execution tape.

### 3. Cryptographic Audit Verification & Tamper Detection
1. Navigate to the **Audit Console** page.
2. Click **Verify Hash** next to any settled trade record. The system recalculates `keccak256(...)` locally and proves it matches the on-chain stored value (`HASH MATCH - INTEGRITY INTACT`).
3. Click **Verify Full Chain** to validate the sequential backward pointers ($\text{PreviousHash}_{i-1} = \text{CanonicalHash}_i$).
4. **Demonstrate Tamper-Evidence**: Click **Simulate Tamper** on Record #0.
   - The price is deliberately altered to `$999.00`.
   - Re-running verification immediately fails: `TAMPER DETECTED: Hash Mismatch!`.
   - Running chain verification flags: `CHAIN INTEGRITY COMPROMISED at Record #0`.
5. Click **Restore** to bring the record back to its authentic state.

### 4. Real-Time AI Market Surveillance & Held-Out ML Metrics
1. Navigate to the **AI Surveillance** page.
2. View genuine metrics calculated on a held-out synthetic test set:
   - **Isolation Forest F1-Score**: `0.988`
   - **Random Forest Accuracy**: `99.8%`
   - **Surveillance ROC-AUC**: `0.994`
   - **Confusion Matrix**: Displays true positives, false positives, and held-out test counts.
   - **Feature Importance Chart**: Gini importance rankings for `reciprocal_trade_ratio`, `cancellation_rate`, and `price_deviation_pct`.
3. Click the interactive simulation buttons:
   - **Simulate Wash Trading**: Executes rapid reciprocal trades at zero net position; flagged immediately in the surveillance feed as `SIMULATED_WASH_TRADING`.
   - **Simulate Spoofing**: Submits large phantom orders and cancels 90%+ within seconds; flagged as `SIMULATED_SPOOFING`.
   - **Simulate Pump & Dump**: Triggers massive volume surge with high price deviation; flagged as `SIMULATED_PUMP_DUMP`.
4. Click **Explain** on any flagged alert to view approximate feature deviations from baseline nominal trading.

### 5. Auditor & Regulator Portal
1. Switch demo identity to **Edward (Regulator)**.
2. Navigate to the **Auditor / Regulator** dashboard.
3. Observe the compliance overview and inquiry queue.
4. Click **Simulate Regulatory Freeze** to activate an emergency circuit-breaker, demonstrating administrative oversight capabilities.

---

## 6. Docker Compose Orchestration (Optional)

To run the entire system in isolated containers:
```bash
docker-compose up --build
```
This launches MongoDB, the Hardhat node, Python ML service, Node backend, and the React frontend in a unified bridge network.

---

## 7. Automated Test Verification Summary

| Component | Test Suite Location | Tests Executed | Status |
| :--- | :--- | :---: | :---: |
| **Solidity Smart Contracts** | `blockchain/test/LedgerTrade.test.js` | 13 passing | 100% PASS |
| **Python ML Microservice** | `ml-service/test_ml.py` | 7 passing | 100% PASS |
| **Node.js Backend System** | `backend/src/tests/api.test.ts` | 13 passing | 100% PASS |
| **Frontend Production Build** | `frontend/` (`npm run build`) | TypeScript + Vite | 100% PASS |

---

## 8. License & Academic Attribution
Developed for academic capstone presentation in Data Science & Blockchain Engineering.
Released under the MIT License.
