"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const marketController_1 = require("../controllers/marketController");
const orderController_1 = require("../controllers/orderController");
const tradeController_1 = require("../controllers/tradeController");
const portfolioController_1 = require("../controllers/portfolioController");
const blockchainController_1 = require("../controllers/blockchainController");
const auditController_1 = require("../controllers/auditController");
const surveillanceController_1 = require("../controllers/surveillanceController");
const auth_1 = require("../middleware/auth");
const apiRouter = (0, express_1.Router)();
// Authentication & Demo Accounts
apiRouter.post("/auth/register", authController_1.authController.register);
apiRouter.post("/auth/login", authController_1.authController.login);
apiRouter.get("/auth/demo-users", authController_1.authController.getDemoUsers);
apiRouter.post("/auth/switch-demo", authController_1.authController.switchDemoAccount);
apiRouter.get("/auth/profile", auth_1.authMiddleware, authController_1.authController.getProfile);
// Simulated Markets
apiRouter.get("/markets", marketController_1.marketController.getAllInstruments);
apiRouter.get("/markets/:symbol", marketController_1.marketController.getInstrumentDetails);
// Orders
apiRouter.post("/orders", auth_1.authMiddleware, orderController_1.orderController.placeOrder);
apiRouter.delete("/orders/:id", auth_1.authMiddleware, orderController_1.orderController.cancelOrder);
apiRouter.get("/orders", auth_1.authMiddleware, orderController_1.orderController.getOrders);
// Trades
apiRouter.get("/trades", auth_1.authMiddleware, tradeController_1.tradeController.getTrades);
apiRouter.get("/trades/:id", auth_1.authMiddleware, tradeController_1.tradeController.getTradeById);
// Portfolio & Faucet
apiRouter.get("/portfolio", auth_1.authMiddleware, portfolioController_1.portfolioController.getPortfolio);
apiRouter.post("/portfolio/faucet", auth_1.authMiddleware, portfolioController_1.portfolioController.requestDemoFaucet);
// Blockchain Explorer
apiRouter.get("/blockchain/status", blockchainController_1.blockchainController.getStatus);
apiRouter.get("/blockchain/transactions", blockchainController_1.blockchainController.getTransactions);
// Cryptographic Audit & Tamper-Evident Ledger
apiRouter.get("/audit/records", auditController_1.auditController.getRecords);
apiRouter.get("/audit/verify/:recordId", auditController_1.auditController.verifyRecord);
apiRouter.get("/audit/verify-chain", auditController_1.auditController.verifyChain);
apiRouter.get("/audit/merkle", auditController_1.auditController.getMerkleCheckpoint);
apiRouter.post("/audit/tamper/:recordId", auditController_1.auditController.tamperRecord);
apiRouter.post("/audit/restore/:recordId", auditController_1.auditController.restoreRecord);
apiRouter.get("/audit/export", auditController_1.auditController.exportAuditReport);
// AI Surveillance
apiRouter.get("/surveillance/alerts", surveillanceController_1.surveillanceController.getAlerts);
apiRouter.get("/surveillance/metrics", surveillanceController_1.surveillanceController.getModelMetrics);
apiRouter.post("/surveillance/simulate", surveillanceController_1.surveillanceController.simulatePattern);
exports.default = apiRouter;
