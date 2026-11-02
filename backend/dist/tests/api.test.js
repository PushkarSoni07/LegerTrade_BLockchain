"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const seedData_1 = require("../seed/seedData");
const store_1 = require("../storage/store");
const auditService_1 = require("../services/auditService");
const matchingEngine_1 = require("../services/matchingEngine");
async function runBackendTests() {
    console.log("==================================================");
    console.log("Running LedgerTrade Backend Integration Test Suite");
    console.log("==================================================");
    let passed = 0;
    let failed = 0;
    function assert(condition, testName) {
        if (condition) {
            console.log(`  √ PASS: ${testName}`);
            passed++;
        }
        else {
            console.error(`  X FAIL: ${testName}`);
            failed++;
        }
    }
    // 1. Seed data check
    await (0, seedData_1.seedInitialData)();
    const users = store_1.db.getAllUsers();
    assert(users.length >= 5, "Database initialized with demo users (Alice, Bob, Charles, Diana, Edward)");
    const alice = store_1.db.getUserByEmailOrUsername("alice");
    assert(alice !== undefined && alice.role === "INVESTOR", "Alice exists with role INVESTOR");
    const diana = store_1.db.getUserByEmailOrUsername("diana");
    assert(diana !== undefined && diana.role === "AUDITOR", "Diana exists with role AUDITOR");
    // 2. Portfolio check
    const alicePort = store_1.db.getPortfolio("usr-alice");
    assert(alicePort !== undefined && alicePort.cashBalance > 0, "Alice portfolio has simulated cash balance");
    // 3. Markets check
    const markets = store_1.db.getAllMarkets();
    assert(markets.length >= 4, "Simulated market instruments (AAPL, TSLA, MSFT, GOOGL) available");
    // 4. Order creation and matching
    const testSymbol = "AAPL";
    const buyOrder = store_1.db.saveOrder({
        id: `ORD-TEST-B-${Date.now()}`,
        userId: "usr-alice",
        traderAddress: alice.walletAddress,
        symbol: testSymbol,
        side: "BUY",
        orderType: "LIMIT",
        price: 180.0,
        quantity: 5,
        filledQty: 0,
        remainingQty: 5,
        status: "OPEN",
        createdAt: Date.now() - 1000,
        updatedAt: Date.now(),
    });
    const sellOrder = store_1.db.saveOrder({
        id: `ORD-TEST-S-${Date.now()}`,
        userId: "usr-bob",
        traderAddress: store_1.db.getUserByEmailOrUsername("bob").walletAddress,
        symbol: testSymbol,
        side: "SELL",
        orderType: "LIMIT",
        price: 180.0,
        quantity: 5,
        filledQty: 0,
        remainingQty: 5,
        status: "OPEN",
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });
    const matched = await matchingEngine_1.matchingEngine.matchOrdersForSymbol(testSymbol);
    assert(matched.length >= 1, "Matching engine executed trade between crossing limit orders");
    const filledBuy = store_1.db.getOrderById(buyOrder.id);
    const filledSell = store_1.db.getOrderById(sellOrder.id);
    assert(filledBuy?.status === "FILLED" && filledSell?.status === "FILLED", "Matched orders updated to FILLED status");
    // 5. Audit trail integrity and cryptographic hash verification
    const auditRecords = store_1.db.getAllAuditRecords();
    assert(auditRecords.length > 0, "Audit ledger recorded settled trades");
    const latestRecord = auditRecords[auditRecords.length - 1];
    const verifyRes = auditService_1.auditService.verifyRecord(latestRecord.recordId);
    assert(verifyRes.isValid === true, "Cryptographic keccak256 hash matches canonical trade parameters");
    const chainRes = auditService_1.auditService.verifyChainIntegrity();
    assert(chainRes.isIntact === true, "Sequential audit chain is cryptographically intact");
    // 6. Tamper detection verification
    console.log("  Testing deliberate local record tampering...");
    auditService_1.auditService.simulateRecordTampering(latestRecord.recordId, 999.0);
    const tamperedCheck = auditService_1.auditService.verifyRecord(latestRecord.recordId);
    assert(tamperedCheck.isValid === false, "Deliberate tampering successfully detected! Hash mismatch flagged.");
    const brokenChain = auditService_1.auditService.verifyChainIntegrity();
    assert(brokenChain.isIntact === false, "Chain integrity check successfully flagged broken chain at tampered record");
    // Restore record
    auditService_1.auditService.restoreRecord(latestRecord.recordId);
    const restoredCheck = auditService_1.auditService.verifyRecord(latestRecord.recordId);
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
