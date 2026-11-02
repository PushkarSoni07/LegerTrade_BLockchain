# LedgerTrade: Last-Minute Viva & Presentation Quick Revision Sheet

**Project:** Blockchain-Based Stock Trading & Audit System (LedgerTrade)  
**Read this 15–30 minutes before entering your project presentation / viva room.**

---

## ⚡ 1. The 60-Second Elevator Pitch (Memorize This!)

> *"LedgerTrade is an academic stock trading and audit prototype that solves three major flaws of traditional stock markets:  
> 1. **Multi-day settlement delays (T+1/T+2)** $\to$ Solved using **Ethereum smart contracts** that execute **atomic Delivery-versus-Payment (DvP)**: stock tokens and digital cash swap simultaneously in a single transaction with zero counterparty risk.  
> 2. **Tamperable centralized databases** $\to$ Solved using an append-only **cryptographic audit log** (`keccak256` hash chaining) where altering 1 byte breaks the entire chain.  
> 3. **Slow post-facto fraud detection** $\to$ Solved using a **Python FastAPI machine learning microservice** that analyzes an 8-factor behavioral vector in real time with an **Isolation Forest** (anomaly score) and **Random Forest** (Wash Trading, Spoofing, Pump & Dump detection).  
> All 4 tiers (React frontend, Node.js matching backend, Hardhat EVM blockchain, and Python AI service) are fully integrated and verified by 33 automated tests."*

---

## ⚡ 2. The 4 Ports & Architecture Breakdown

| Tier | Technology | Port | What It Does in LedgerTrade |
| :--- | :--- | :---: | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS | **`3000`** | 11 pages; 1-click role switcher (Alice, Bob, Charles, Diana, Edward); live order book; trading terminal. |
| **Backend** | Node.js, Express, TypeScript | **`5000`** | Deterministic in-memory price-time limit order matching engine; dual-store (`db_store.json`); REST API gateway. |
| **Blockchain** | Hardhat Localhost EVM | **`8545`** | Chain ID `31337`; runs 6 Solidity 0.8.20 contracts; executes atomic DvP asset settlement; stores audit logs. |
| **AI Surveillance** | Python 3, FastAPI, Scikit-learn | **`8000`** | Extracts 8 mathematical features per trade; Isolation Forest & Random Forest models; returns anomaly risk & pattern name. |

---

## ⚡ 3. The 6 Smart Contracts (Solidity 0.8.20)

1. **`UserRegistry.sol`**: Manages user roles (`INVESTOR`, `BROKER`, `AUDITOR`, `REGULATOR`) and verified KYC statuses. Blocks unverified addresses.
2. **`CashToken.sol`**: ERC-20 token representing simulated cash currency (`sUSD`, 18 decimals). Includes demo faucet (`requestDemoFunds`).
3. **`StockToken.sol`**: ERC-20 token representing tokenized shares (`sAAPL`, `sTSLA`, `sMSFT`, `sGOOGL`). Restricts minting/burning to authorized settlers.
4. **`OrderBook.sol`**: On-chain order book maintaining open, partially filled, and cancelled order states.
5. **`TradeSettlement.sol`**: Core DvP contract with `nonReentrant` modifier. Simultaneously transfers `sUSD` from buyer to seller and stock tokens from seller to buyer.
6. **`AuditLog.sol`**: Appends immutable `keccak256` chained hashes ($\text{PrevHash}_{i-1} \to \text{CanonicalHash}_i$) and supports Merkle root batch verification.

---

## ⚡ 4. The 8 AI Surveillance Features

| # | Feature Name | Formula / Meaning | Normal Value | Anomaly Trigger |
| :-: | :--- | :--- | :---: | :---: |
| **1** | `trade_frequency_1m` | Trades by participant in last 60 seconds | $1.0 - 4.0$ | $> 12.0$ |
| **2** | `order_to_trade_ratio`| $\frac{N_{\text{orders}}}{N_{\text{trades}}}$ | $1.5 - 4.0$ | $> 10.0$ |
| **3** | `cancellation_rate` | $\frac{N_{\text{cancelled}}}{N_{\text{submitted}}}$ | $0.05 - 0.25$ | **$> 0.75$ (Spoofing)** |
| **4** | `price_deviation_pct` | $\frac{P_{\text{trade}} - \text{SMA}_{20}}{\text{SMA}_{20}} \times 100$ | $\pm 1.5\%$ | **$> +8.0\%$ (Pump & Dump)** |
| **5** | `volume_surge_ratio` | $\frac{V_{\text{trade}}}{\bar{V}_{\text{historic}}}$ | $0.5 - 2.0$ | $> 4.0$ |
| **6** | `reciprocal_trade_ratio` | Trades between same 2 traders $\div$ Total trades | $< 0.15$ | **$> 0.70$ (Wash Trading)** |
| **7** | `avg_order_duration_sec` | How long an order stayed open before cancel/fill | $15 - 180\text{ s}$ | **$< 2.0\text{ s}$ (Spoofing bait)** |
| **8** | `account_turnover_ratio`| Trade value $\div$ Total portfolio value | $0.1 - 1.5$ | $> 4.0$ |

---

## ⚡ 5. The Machine Learning Models & Results

- **Primary Model (Unsupervised):** **Isolation Forest** (`n_estimators=150, contamination=0.20, max_samples=256`).
  - Isolates abnormal points with short random decision tree paths.
  - Held-out test metrics: **F1-Score: 0.968**, **ROC-AUC: 0.985**.
- **Supervised Model:** **Random Forest Classifier** (`n_estimators=120, max_depth=10, class_weight='balanced'`).
  - Classifies pattern into: `NORMAL`, `SIMULATED_WASH_TRADING`, `SIMULATED_SPOOFING`, `SIMULATED_PUMP_DUMP`.
  - Held-out test metrics: **Accuracy: 99.8%**, **Precision: 98.2%**, **Recall: 99.1%**, **F1-Score: 0.988**.
- **Dataset:** 4,000 reproducible synthetic samples (80% train, 20% held-out test).

---

## ⚡ 6. On-Chain vs. Off-Chain (The #1 Faculty Question!)

- **Why is matching off-chain?**  
  High-frequency sorting and matching in Solidity loops is too slow, causes latency, and consumes huge gas fees. Modern decentralized exchanges (like dYdX) match off-chain in Node.js/C++ and settle on-chain.
- **Why is settlement on-chain?**  
  Asset transfers (`sUSD` and stock tokens) must be decentralized and atomic so neither party can default.
- **Why is AI off-chain?**  
  Floating-point vector math and Scikit-learn models cannot run inside EVM smart contracts.

---

## ⚡ 7. Live Demo Checklist (In 5 Minutes)

1. **Open `http://localhost:3000`** $\to$ Point to top navbar identity: **Alice (Investor)**.
2. **Markets & Holdings:** Show Alice has ₹4,50,000 cash and 50 AAPL shares.
3. **Submit Buy Order:** Alice submits Buy Limit order for **5 AAPL @ ₹1,800**. Order enters Bid book.
4. **Switch Identity:** Switch navbar dropdown to **Bob (Investor)**.
5. **Submit Sell Order:** Bob submits Sell Limit order for **5 AAPL @ ₹1,800**.
6. **Show Matching & DvP:** Trade matches instantly! 5 AAPL tokens move Bob $\to$ Alice; ₹9,000 moves Alice $\to$ Bob.
7. **Blockchain Explorer:** Show transaction hash (`txHash`), block height, and gas on `localhost:8545`.
8. **Audit Console:** Click **Verify Hash** $\to$ green match. Click **Verify Full Chain** $\to$ unbroken.
9. **Tamper Simulation (The Highlight!):** Click **Simulate Tamper** on Record #0 (price edits to ₹9,999).
   - Re-verify $\to$ **TAMPER DETECTED: Hash Mismatch! Chain Broken!**
   - Click **Restore** $\to$ integrity restored.
10. **AI Surveillance:** Show metrics cards. Click **Simulate Wash Trading** $\to$ real-time red alert banner with risk score $>0.85$!

---

## ⚡ 8. Top 10 Tough Questions & Quick Answers

1. **Q: Why blockchain instead of SQL?**  
   *A:* In SQL, any root administrator can edit records with an `UPDATE` query. On Ethereum, there is no `UPDATE` command for confirmed transactions. It is mathematically immutable.
2. **Q: What is Delivery-versus-Payment (DvP)?**  
   *A:* Simultaneous transfer of cash and securities in a single atomic transaction. If either party lacks balance, the entire transaction reverts.
3. **Q: How does `keccak256` hashing prove tampering?**  
   *A:* Changing even 1 rupee in trade data alters its hash completely (avalanche effect), breaking the `previousHash` pointer stored in the next record.
4. **Q: What is Isolation Forest?**  
   *A:* An unsupervised tree algorithm that isolates anomalies rather than profiling normal data. Anomalies require fewer random cuts (short path length).
5. **Q: What is Wash Trading?**  
   *A:* Collusive trading between the same accounts with zero change in actual ownership, caught by a high `reciprocal_trade_ratio`.
6. **Q: What is Spoofing?**  
   *A:* Submitting large fake orders to move prices and cancelling them before execution, caught by high `cancellation_rate` ($>75\%$) and short order duration ($<2\text{s}$).
7. **Q: What is Hardhat?**  
   *A:* An Ethereum development suite that compiles our Solidity contracts, runs 13 unit tests, and hosts our local EVM node on port 8545.
8. **Q: What happens if the AI service goes offline?**  
   *A:* Blockchain trade settlement continues unaffected. Our backend also has a built-in heuristic rule-based fallback engine to keep flagging high-risk trades.
9. **Q: Is real money involved?**  
   *A:* No. LedgerTrade is strictly an educational prototype using simulated tokens (`sUSD`, `sAAPL`) and synthetic market feeds.
10. **Q: What are the main limitations?**  
    *A:* Simulated assets rather than live exchange connection, single-process matching engine, and synthetic training distribution.

---

## ⚡ 9. Killer Closing Line for Presentation

> *"In conclusion, LedgerTrade proves that future financial exchanges do not need to choose between execution speed and trust: off-chain matching provides high throughput, Ethereum smart contracts eliminate settlement risk, cryptographic hash chaining guarantees unalterable audits, and real-time machine learning protects investors from market manipulation. Thank you!"*
