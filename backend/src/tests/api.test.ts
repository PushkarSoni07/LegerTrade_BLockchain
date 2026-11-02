import app from "../app";
import { seedInitialData } from "../seed/seedData";
import { db } from "../storage/store";
import { auditService } from "../services/auditService";
import { matchingEngine } from "../services/matchingEngine";

async function runBackendTests() {
  console.log("==================================================");
  console.log("Running LedgerTrade Backend Integration Test Suite");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  √ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  X FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Seed data check
  await seedInitialData();
  const users = db.getAllUsers();
  assert(users.length >= 5, "Database initialized with demo users (Alice, Bob, Charles, Diana, Edward)");

  const alice = db.getUserByEmailOrUsername("alice");
  assert(alice !== undefined && alice.role === "INVESTOR", "Alice exists with role INVESTOR");

  const diana = db.getUserByEmailOrUsername("diana");
  assert(diana !== undefined && diana.role === "AUDITOR", "Diana exists with role AUDITOR");

  // 2. Portfolio check
  const alicePort = db.getPortfolio("usr-alice");
  assert(alicePort !== undefined && alicePort.cashBalance > 0, "Alice portfolio has simulated cash balance");

  // 3. Markets check
  const markets = db.getAllMarkets();
  assert(markets.length >= 4, "Simulated market instruments (AAPL, TSLA, MSFT, GOOGL) available");

  // 4. Order creation and matching
  const testSymbol = "AAPL";
  const buyOrder = db.saveOrder({
    id: `ORD-TEST-B-${Date.now()}`,
    userId: "usr-alice",
    traderAddress: alice!.walletAddress,
    symbol: testSymbol,
    side: "BUY",
    orderType: "LIMIT",
    price: 1800.0,
    quantity: 5,
    filledQty: 0,
    remainingQty: 5,
    status: "OPEN",
    createdAt: Date.now() - 1000,
    updatedAt: Date.now(),
  });

  const sellOrder = db.saveOrder({
    id: `ORD-TEST-S-${Date.now()}`,
    userId: "usr-bob",
    traderAddress: db.getUserByEmailOrUsername("bob")!.walletAddress,
    symbol: testSymbol,
    side: "SELL",
    orderType: "LIMIT",
    price: 1800.0,
    quantity: 5,
    filledQty: 0,
    remainingQty: 5,
    status: "OPEN",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const matched = await matchingEngine.matchOrdersForSymbol(testSymbol);
  assert(matched.length >= 1, "Matching engine executed trade between crossing limit orders");

  const filledBuy = db.getOrderById(buyOrder.id);
  const filledSell = db.getOrderById(sellOrder.id);
  assert(filledBuy?.status === "FILLED" && filledSell?.status === "FILLED", "Matched orders updated to FILLED status");

  // 5. Audit trail integrity and cryptographic hash verification
  const auditRecords = db.getAllAuditRecords();
  assert(auditRecords.length > 0, "Audit ledger recorded settled trades");

  const latestRecord = auditRecords[auditRecords.length - 1];
  const verifyRes = auditService.verifyRecord(latestRecord.recordId);
  assert(verifyRes.isValid === true, "Cryptographic keccak256 hash matches canonical trade parameters");

  const chainRes = auditService.verifyChainIntegrity();
  assert(chainRes.isIntact === true, "Sequential audit chain is cryptographically intact");

  // 6. Tamper detection verification
  console.log("  Testing deliberate local record tampering...");
  auditService.simulateRecordTampering(latestRecord.recordId, 999.0);
  const tamperedCheck = auditService.verifyRecord(latestRecord.recordId);
  assert(tamperedCheck.isValid === false, "Deliberate tampering successfully detected! Hash mismatch flagged.");

  const brokenChain = auditService.verifyChainIntegrity();
  assert(brokenChain.isIntact === false, "Chain integrity check successfully flagged broken chain at tampered record");

  // Restore record
  auditService.restoreRecord(latestRecord.recordId);
  const restoredCheck = auditService.verifyRecord(latestRecord.recordId);
  assert(restoredCheck.isValid === true, "Restored record re-validates successfully");

  console.log("==================================================");
  console.log(`Backend Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runBackendTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
