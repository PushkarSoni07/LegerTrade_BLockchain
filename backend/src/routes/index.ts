import { Router } from "express";
import { authController } from "../controllers/authController";
import { marketController } from "../controllers/marketController";
import { orderController } from "../controllers/orderController";
import { tradeController } from "../controllers/tradeController";
import { portfolioController } from "../controllers/portfolioController";
import { blockchainController } from "../controllers/blockchainController";
import { auditController } from "../controllers/auditController";
import { surveillanceController } from "../controllers/surveillanceController";
import { authMiddleware, requireRole } from "../middleware/auth";

const apiRouter = Router();

// Authentication & Demo Accounts
apiRouter.post("/auth/register", authController.register);
apiRouter.post("/auth/login", authController.login);
apiRouter.get("/auth/demo-users", authController.getDemoUsers);
apiRouter.post("/auth/switch-demo", authController.switchDemoAccount);
apiRouter.get("/auth/profile", authMiddleware, authController.getProfile);

// Simulated Markets
apiRouter.get("/markets", marketController.getAllInstruments);
apiRouter.get("/markets/:symbol", marketController.getInstrumentDetails);

// Orders
apiRouter.post("/orders", authMiddleware, orderController.placeOrder);
apiRouter.delete("/orders/:id", authMiddleware, orderController.cancelOrder);
apiRouter.get("/orders", authMiddleware, orderController.getOrders);

// Trades
apiRouter.get("/trades", authMiddleware, tradeController.getTrades);
apiRouter.get("/trades/:id", authMiddleware, tradeController.getTradeById);

// Portfolio & Faucet
apiRouter.get("/portfolio", authMiddleware, portfolioController.getPortfolio);
apiRouter.post("/portfolio/faucet", authMiddleware, portfolioController.requestDemoFaucet);

// Blockchain Explorer
apiRouter.get("/blockchain/status", blockchainController.getStatus);
apiRouter.get("/blockchain/transactions", blockchainController.getTransactions);

// Cryptographic Audit & Tamper-Evident Ledger
apiRouter.get("/audit/records", auditController.getRecords);
apiRouter.get("/audit/verify/:recordId", auditController.verifyRecord);
apiRouter.get("/audit/verify-chain", auditController.verifyChain);
apiRouter.get("/audit/merkle", auditController.getMerkleCheckpoint);
apiRouter.post("/audit/tamper/:recordId", auditController.tamperRecord);
apiRouter.post("/audit/restore/:recordId", auditController.restoreRecord);
apiRouter.get("/audit/export", auditController.exportAuditReport);

// AI Surveillance
apiRouter.get("/surveillance/alerts", surveillanceController.getAlerts);
apiRouter.get("/surveillance/metrics", surveillanceController.getModelMetrics);
apiRouter.post("/surveillance/simulate", surveillanceController.simulatePattern);

export default apiRouter;
