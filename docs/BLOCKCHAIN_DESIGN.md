# LedgerTrade Blockchain Smart Contract Design

## 1. Smart Contract Architecture

The decentralized layer is developed in Solidity `0.8.20` using OpenZeppelin standards:

| Contract | Role / Responsibility | Key Functions |
| :--- | :--- | :--- |
| `UserRegistry.sol` | Participant identity & mock KYC | `registerUser()`, `isKycApproved()`, `hasRole()` |
| `CashToken.sol` | Simulated cash balance (`sUSD`) | `requestDemoFunds()`, `mint()`, `burn()` |
| `StockToken.sol` | Tokenized equity shares (`sAAPL`, `sTSLA`, etc.) | `mint()`, `burn()`, `transferFrom()` |
| `OrderBook.sol` | On-chain order state & priority | `createOrder()`, `cancelOrder()`, `recordFill()` |
| `TradeSettlement.sol` | Atomic Delivery-versus-Payment (DvP) | `settleMatchedTrade()` |
| `AuditLog.sol` | Cryptographically chained audit trail | `recordTrade()`, `verifyRecord()`, `verifyChainIntegrity()`, `submitMerkleBatch()` |

---

## 2. Atomic Delivery-versus-Payment (DvP)

Atomic settlement guarantees that securities transfer and cash transfer occur **simultaneously in the exact same atomic transaction**:
- If the buyer possesses insufficient cash allowance, the transaction reverts.
- If the seller possesses insufficient tokenized shares, the transaction reverts.
- Neither party can be left without their asset if counter-performance fails.

```solidity
// TradeSettlement.sol snippet:
bool cashTransferred = cashToken.transferFrom(buyOrder.trader, sellOrder.trader, totalCost);
require(cashTransferred, "TradeSettlement: cash transfer failed");

StockToken stockToken = StockToken(stockAddress);
bool stockTransferred = stockToken.transferFrom(sellOrder.trader, buyOrder.trader, matchQty);
require(stockTransferred, "TradeSettlement: stock token transfer failed");
```

---

## 3. Cryptographic Audit Chaining & Merkle Roots

### Canonical Event Hash
To ensure deterministic reproducibility between on-chain contracts and off-chain audit consoles, trade events are serialized and hashed using `keccak256`:

$$\text{CanonicalHash}_i = \text{keccak256}(\text{recordId}, \text{tradeId}, \text{buyOrderId}, \text{sellOrderId}, \text{symbol}, \text{price}, \text{quantity}, \text{buyer}, \text{seller}, \text{timestamp}, \text{PreviousHash}_{i-1})$$

Where:
- Record 0 has $\text{PreviousHash}_0 = 0\text{x}00\dots00$
- Any modification to Record $k$'s price or quantity alters $\text{CanonicalHash}_k$, which immediately breaks the pointer check in Record $k+1$, rendering any tampering mathematically evident!

### Merkle Batch Verification
Auditors and regulators can anchor batches of $N$ trades on-chain using an OpenZeppelin-compatible Merkle tree:
- Root is submitted to `AuditLog.submitMerkleBatch(bytes32 merkleRoot, uint256 startId, uint256 endId)`.
- Individual trade inclusion is validated via `AuditLog.verifyProof(batchId, leaf, proof)`.
