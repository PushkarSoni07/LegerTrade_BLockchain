# LedgerTrade System Architecture

## 1. High-Level Architecture Overview

LedgerTrade is an academic, simulated fintech prototype designed for a B.Tech Data Science capstone. It demonstrates three core pillars:
1. **Decentralized Delivery-versus-Payment (DvP) Settlement** via Ethereum smart contracts.
2. **Cryptographic Tamper-Evident Audit Logging** with sequential keccak256 chaining and Merkle tree checkpoints.
3. **Real-Time AI Market Surveillance** utilizing an unsupervised Isolation Forest and multi-class supervised Random Forest.

```mermaid
graph TD
    subgraph Client Layer
        UI[React + Vite + Tailwind CSS Frontend<br/>Port 3000]
        MM[MetaMask Wallet / Local Signer]
    end

    subgraph Application & Gateway Layer
        API[Node.js + Express + TypeScript Backend<br/>Port 5000]
        ME[Deterministic Price-Time Matching Engine]
        STORE[(In-Memory / File-Backed DB + MongoDB Dual-Store)]
    end

    subgraph Blockchain Layer
        EVM[Hardhat Localhost EVM<br/>Port 8545 / Chain ID 31337]
        UR[UserRegistry.sol]
        OB[OrderBook.sol]
        TS[TradeSettlement.sol - DvP]
        AL[AuditLog.sol - Chained keccak256]
        ST[StockToken.sol - sAAPL, sTSLA, sMSFT, sGOOGL]
        CT[CashToken.sol - sUSD]
    end

    subgraph AI Surveillance Layer
        FASTAPI[Python 3 FastAPI Microservice<br/>Port 8000]
        ISO[Isolation Forest Anomaly Detector]
        RF[Random Forest Pattern Identifier]
        FEAT[8-Factor Feature Extraction Engine]
    end

    UI -->|REST / JSON| API
    MM -->|Signed Transactions| EVM
    API -->|ethers.js RPC| EVM
    API -->|Internal Events| ME
    API -->|CRUD Operations| STORE
    API -->|Feature Vectors / HTTP| FASTAPI

    FASTAPI --> FEAT
    FEAT --> ISO
    FEAT --> RF

    TS -->|Atomic Transfers| ST
    TS -->|Atomic Transfers| CT
    TS -->|Verify KYC| UR
    TS -->|Update Status| OB
    TS -->|Record Immutable Chained Hash| AL
```

---

## 2. Vertical Slice Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor Trader as Investor (Alice / Bob)
    participant UI as React Frontend
    participant API as Node.js Backend
    participant ME as Matching Engine
    participant EVM as TradeSettlement Contract
    participant AL as AuditLog Contract
    participant ML as Python FastAPI ML

    Trader->>UI: Submit Limit Order (e.g. BUY 10 AAPL @ $178.50)
    UI->>API: POST /api/orders { symbol, side, type, price, qty }
    API->>API: Solvency & Mock KYC Validation
    API->>ME: Place Order & Check Order Book for Crosses
    ME->>ME: Identify Deterministic Counter-Order
    ME->>EVM: settleMatchedTrade(buyId, sellId, matchPrice, matchQty)
    Note over EVM: Independent on-chain validation of prices, balances, and nonces
    EVM->>EVM: Atomic DvP: Transfer sUSD & sAAPL simultaneously
    EVM->>AL: recordTrade(tradeId, buyId, sellId, price, qty, buyer, seller)
    Note over AL: Chained keccak256 hash linking to previous record
    EVM-->>ME: TradeSettled Receipt (txHash, canonicalHash, recordId)
    ME->>API: Persist Trade & Update Portfolios
    API->>ML: POST /predict (8-Factor Feature Vector)
    Note over ML: Isolation Forest scoring + Random Forest pattern classification
    ML-->>API: { is_anomaly, risk_score, severity, top_features }
    API->>UI: Return Confirmed Trade & Broadcast Surveillance Alert
```

---

## 3. Trust Boundaries & Academic Disclaimers

### Order Matching Trust Boundary
Smart contracts do not spontaneously execute background daemons or loops. Therefore, order matching occurs through an explicit transaction triggered either by the matching engine backend or a participating broker. However, the `TradeSettlement.sol` smart contract enforces **zero-trust execution**: it independently re-validates participant KYC, order states, price boundaries, token allowances, and delivery conditions before moving any assets.

### Synthetic Market Data Scope
All instruments (AAPL, TSLA, MSFT, GOOGL), cash balances (sUSD), and equity tokens (sAAPL, sTSLA) are **100% simulated prototype assets**. The system connects to no real-world exchanges, securities brokers, or banking networks.
