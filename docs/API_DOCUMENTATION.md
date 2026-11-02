# LedgerTrade API Documentation

Base URL: `http://localhost:5000/api`

---

## 1. Authentication & Demo Identity

### `POST /auth/login`
Authenticates a user via email and password using bcrypt hashing.
- **Request Body**:
  ```json
  {
    "email": "alice@ledgertrade.demo",
    "password": "password123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": "usr-alice",
      "username": "alice",
      "email": "alice@ledgertrade.demo",
      "role": "INVESTOR",
      "walletAddress": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      "kycStatus": "APPROVED"
    },
    "token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```

### `GET /auth/demo-users`
Retrieves pre-seeded demo accounts for quick role-aware switching.

### `POST /auth/switch-demo`
Switches active demo identity without manual login.

---

## 2. Simulated Markets

### `GET /markets`
Returns all supported simulated instruments with 24h metrics and price history.
- **Response Sample**:
  ```json
  [
    {
      "symbol": "AAPL",
      "name": "Apple Inc. (Simulated)",
      "currentPrice": 178.50,
      "change24h": 2.10,
      "change24hPercent": 1.19,
      "high24h": 182.00,
      "low24h": 175.20,
      "volume24h": 128400,
      "isSimulated": true
    }
  ]
  ```

### `GET /markets/:symbol`
Retrieves single instrument details with live order depth ladder (bids/asks).

---

## 3. Order Management & Settlement

### `POST /orders`
Places a new limit or market buy/sell order. Triggers matching engine execution.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "symbol": "AAPL",
    "side": "BUY",
    "orderType": "LIMIT",
    "price": 178.50,
    "quantity": 10
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Order placed successfully",
    "order": { ... },
    "matchedTradesCount": 1,
    "settledTrades": [ ... ]
  }
  ```

### `DELETE /orders/:id`
Cancels an open or partially filled limit order.

---

## 4. Cryptographic Audit & Tamper Detection

### `GET /audit/records`
Lists immutable trade audit records. Supports `?symbol=AAPL&tradeId=TRD-123`.

### `GET /audit/verify/:recordId`
Recomputes keccak256 canonical hash in real-time and validates against stored value and on-chain contract.
- **Response Sample**:
  ```json
  {
    "recordId": 0,
    "isTampered": false,
    "localVerification": {
      "isValid": true,
      "storedHash": "0x5d9b...",
      "recomputedHash": "0x5d9b..."
    },
    "onChainVerification": {
      "confirmedOnChain": true,
      "matchesLocal": true
    }
  }
  ```

### `GET /audit/verify-chain`
Iteratively validates that Record $i$'s `previousHash` equals Record $i-1$'s `canonicalHash` across all records.

### `POST /audit/tamper/:recordId`
Academic demonstration endpoint that intentionally modifies off-chain record price/quantity to verify that hash verification immediately fails.

### `POST /audit/restore/:recordId`
Restores tampered record back to original state.

### `GET /audit/export?format=csv|json`
Exports the audit trail to downloadable CSV or JSON.

---

## 5. AI Market Surveillance

### `GET /surveillance/alerts`
Returns real-time anomaly alerts flagged by Isolation Forest.

### `GET /surveillance/metrics`
Returns held-out test evaluation metrics (accuracy, precision, recall, F1, ROC-AUC, confusion matrix).

### `POST /surveillance/simulate`
Injects simulated manipulation patterns (`WASH_TRADING`, `SPOOFING`, `PUMP_DUMP`) for live evaluation demonstrations.
