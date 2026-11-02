"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedInitialData = seedInitialData;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const store_1 = require("../storage/store");
const marketService_1 = require("../services/marketService");
const auditService_1 = require("../services/auditService");
const contracts_1 = require("../config/contracts");
async function seedInitialData() {
    const existingUsers = store_1.db.getAllUsers();
    if (existingUsers.length > 0) {
        console.log("[Seed] Data store already contains seed users. Skipping bootstrap.");
        return;
    }
    console.log("[Seed] Bootstrapping demo accounts, portfolios, markets, and audit history...");
    const deployed = (0, contracts_1.getDeployedAddresses)();
    const demoAccounts = deployed.demoAccounts;
    const defaultPasswordHash = await bcryptjs_1.default.hash("password123", 10);
    const demoUsers = [
        {
            id: "usr-alice",
            username: "alice",
            email: "alice@ledgertrade.demo",
            passwordHash: defaultPasswordHash,
            role: "INVESTOR",
            walletAddress: demoAccounts.investorAlice || "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            kycStatus: "APPROVED",
            createdAt: new Date().toISOString(),
        },
        {
            id: "usr-bob",
            username: "bob",
            email: "bob@ledgertrade.demo",
            passwordHash: defaultPasswordHash,
            role: "INVESTOR",
            walletAddress: demoAccounts.investorBob || "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
            kycStatus: "APPROVED",
            createdAt: new Date().toISOString(),
        },
        {
            id: "usr-charles",
            username: "charles",
            email: "charles@ledgertrade.demo",
            passwordHash: defaultPasswordHash,
            role: "BROKER",
            walletAddress: demoAccounts.broker || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            kycStatus: "APPROVED",
            createdAt: new Date().toISOString(),
        },
        {
            id: "usr-diana",
            username: "diana",
            email: "diana@ledgertrade.demo",
            passwordHash: defaultPasswordHash,
            role: "AUDITOR",
            walletAddress: demoAccounts.auditor || "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
            kycStatus: "APPROVED",
            createdAt: new Date().toISOString(),
        },
        {
            id: "usr-edward",
            username: "edward",
            email: "edward@ledgertrade.demo",
            passwordHash: defaultPasswordHash,
            role: "REGULATOR",
            walletAddress: demoAccounts.regulator || "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
            kycStatus: "APPROVED",
            createdAt: new Date().toISOString(),
        },
    ];
    for (const u of demoUsers) {
        store_1.db.saveUser(u);
    }
    // Seed Alice portfolio
    store_1.db.savePortfolio({
        userId: "usr-alice",
        walletAddress: demoUsers[0].walletAddress,
        cashBalance: 45000.0,
        holdings: { AAPL: 50, TSLA: 25 },
        averageCosts: { AAPL: 172.0, TSLA: 210.0 },
        realizedPnL: 340.0,
        totalPortfolioValue: 45000 + 50 * 178 + 25 * 218,
        updatedAt: new Date().toISOString(),
    });
    // Seed Bob portfolio
    store_1.db.savePortfolio({
        userId: "usr-bob",
        walletAddress: demoUsers[1].walletAddress,
        cashBalance: 62000.0,
        holdings: { MSFT: 30, GOOGL: 40 },
        averageCosts: { MSFT: 418.0, GOOGL: 164.0 },
        realizedPnL: -120.0,
        totalPortfolioValue: 62000 + 30 * 422 + 40 * 168,
        updatedAt: new Date().toISOString(),
    });
    // Ensure markets are initialized
    marketService_1.marketService.getAllInstruments();
    // Seed initial chained audit log records
    const sampleTrades = [
        { symbol: "AAPL", price: 176.5, qty: 10, buyer: demoUsers[0].walletAddress, seller: demoUsers[1].walletAddress },
        { symbol: "TSLA", price: 215.0, qty: 5, buyer: demoUsers[1].walletAddress, seller: demoUsers[0].walletAddress },
        { symbol: "MSFT", price: 420.0, qty: 8, buyer: demoUsers[0].walletAddress, seller: demoUsers[1].walletAddress },
    ];
    let prevHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const now = Math.floor(Date.now() / 1000);
    sampleTrades.forEach((t, i) => {
        const tradeId = `TRD-SEED-00${i + 1}`;
        const timestamp = now - (3 - i) * 3600;
        const canonicalHash = auditService_1.auditService.computeCanonicalHash({
            recordId: i,
            tradeId,
            buyOrderId: i * 2 + 1,
            sellOrderId: i * 2 + 2,
            symbol: t.symbol,
            price: t.price,
            quantity: t.qty,
            buyer: t.buyer,
            seller: t.seller,
            timestamp,
            previousHash: prevHash,
        });
        store_1.db.saveAuditRecord({
            recordId: i,
            tradeId,
            buyOrderId: `ORD-B-${i}`,
            sellOrderId: `ORD-S-${i}`,
            symbol: t.symbol,
            price: t.price,
            quantity: t.qty,
            buyerAddress: t.buyer,
            sellerAddress: t.seller,
            timestamp,
            previousHash: prevHash,
            canonicalHash,
            txHash: `0x7a3f8b9c${i}0123456789abcdef0123456789abcdef0123456789abcdef0123456789a`,
            blockNumber: 1042 + i,
            onChainVerified: true,
            isTampered: false,
        });
        store_1.db.saveTrade({
            id: tradeId,
            buyOrderId: `ORD-B-${i}`,
            sellOrderId: `ORD-S-${i}`,
            symbol: t.symbol,
            price: t.price,
            quantity: t.qty,
            totalCost: t.price * t.qty,
            buyerAddress: t.buyer,
            sellerAddress: t.seller,
            buyerUserId: "usr-alice",
            sellerUserId: "usr-bob",
            timestamp,
            txHash: `0x7a3f8b9c${i}0123456789abcdef0123456789abcdef0123456789abcdef0123456789a`,
            blockNumber: 1042 + i,
            auditRecordId: i,
            canonicalHash,
            isSettledOnChain: true,
        });
        prevHash = canonicalHash;
    });
    console.log("[Seed] Demo accounts and initial audit log bootstrapped successfully.");
}
if (require.main === module) {
    seedInitialData().then(() => {
        console.log("Seeding complete.");
        process.exit(0);
    });
}
