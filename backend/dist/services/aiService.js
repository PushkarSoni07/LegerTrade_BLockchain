"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AISurveillanceService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const store_1 = require("../storage/store");
class AISurveillanceService {
    baseUrl;
    constructor() {
        this.baseUrl = env_1.ENV.ML_SERVICE_URL;
    }
    async checkHealth() {
        try {
            const resp = await axios_1.default.get(`${this.baseUrl}/health`, { timeout: 3000 });
            return { status: "online", online: true, details: resp.data };
        }
        catch (err) {
            return { status: "offline", online: false, details: { message: "FastAPI ML service offline" } };
        }
    }
    async getMetrics() {
        try {
            const resp = await axios_1.default.get(`${this.baseUrl}/model/metrics`, { timeout: 4000 });
            return resp.data;
        }
        catch (err) {
            console.warn("[AIService] Failed fetching metrics from FastAPI, returning cached/fallback metrics.");
            return null;
        }
    }
    async getModelInfo() {
        try {
            const resp = await axios_1.default.get(`${this.baseUrl}/model/info`, { timeout: 4000 });
            return resp.data;
        }
        catch (err) {
            return {
                primary_model: "Isolation Forest (Unsupervised)",
                supervised_model: "Random Forest Classifier",
                status: "OFFLINE",
            };
        }
    }
    /**
     * Constructs the 8 mathematical surveillance features for a settled trade.
     */
    extractTradeFeatures(trade) {
        const allUserOrders = store_1.db.getAllOrders().filter((o) => o.userId === trade.buyerUserId || o.userId === trade.sellerUserId);
        const userTrades = store_1.db.getAllTrades().filter((t) => t.buyerUserId === trade.buyerUserId || t.sellerUserId === trade.buyerUserId);
        const now = Math.floor(Date.now() / 1000);
        const oneMinAgo = now - 60;
        // 1. Trade frequency in 1 min
        const recentTrades = userTrades.filter((t) => t.timestamp >= oneMinAgo);
        const trade_frequency_1m = Math.max(1.0, recentTrades.length);
        // 2. Order to trade ratio
        const orderCount = Math.max(1, allUserOrders.length);
        const tradeCount = Math.max(1, userTrades.length);
        const order_to_trade_ratio = +(orderCount / tradeCount).toFixed(2);
        // 3. Cancellation rate
        const cancelledOrders = allUserOrders.filter((o) => o.status === "CANCELLED").length;
        const cancellation_rate = +(cancelledOrders / orderCount).toFixed(2);
        // 4. Price deviation from market average
        const market = store_1.db.getMarket(trade.symbol);
        const currentMktPrice = market ? market.currentPrice : trade.price;
        const price_deviation_pct = +(((trade.price - currentMktPrice) / currentMktPrice) * 100).toFixed(2);
        // 5. Volume surge ratio
        const avgTradeSize = 10.0;
        const volume_surge_ratio = +(trade.quantity / avgTradeSize).toFixed(2);
        // 6. Reciprocal trade ratio
        const reciprocalCount = userTrades.filter((t) => (t.buyerUserId === trade.buyerUserId && t.sellerUserId === trade.sellerUserId) ||
            (t.buyerUserId === trade.sellerUserId && t.sellerUserId === trade.buyerUserId)).length;
        const reciprocal_trade_ratio = +(reciprocalCount / tradeCount).toFixed(2);
        // 7. Average order duration
        const completedOrders = allUserOrders.filter((o) => o.status === "FILLED" || o.status === "CANCELLED");
        const avg_order_duration_sec = completedOrders.length > 0
            ? +(completedOrders.reduce((acc, o) => acc + (o.updatedAt - o.createdAt), 0) / (completedOrders.length * 1000)).toFixed(1)
            : 65.0;
        // 8. Account turnover ratio
        const portfolio = store_1.db.getPortfolio(trade.buyerUserId);
        const portVal = portfolio ? Math.max(1000, portfolio.totalPortfolioValue) : 50000;
        const account_turnover_ratio = +(trade.totalCost / portVal).toFixed(2);
        return {
            trade_frequency_1m,
            order_to_trade_ratio,
            cancellation_rate,
            price_deviation_pct,
            volume_surge_ratio,
            reciprocal_trade_ratio,
            avg_order_duration_sec: Math.max(0.5, avg_order_duration_sec),
            account_turnover_ratio,
        };
    }
    /**
     * Evaluates trade surveillance risk and persists alert if abnormal.
     */
    async analyzeTrade(trade) {
        const features = this.extractTradeFeatures(trade);
        let isAnomaly = false;
        let riskScore = 0.15;
        let severity = "LOW";
        let patternType = "NORMAL";
        let topFeatures = [];
        try {
            const resp = await axios_1.default.post(`${this.baseUrl}/predict`, {
                trade_id: trade.id,
                symbol: trade.symbol,
                buyer_address: trade.buyerAddress,
                seller_address: trade.sellerAddress,
                price: trade.price,
                quantity: trade.quantity,
                timestamp: trade.timestamp,
                ...features,
            }, { timeout: 4000 });
            const data = resp.data;
            isAnomaly = data.is_anomaly;
            riskScore = data.risk_score;
            severity = data.severity;
            patternType = data.predicted_pattern;
            topFeatures = data.top_features;
        }
        catch (err) {
            console.warn("[AIService] FastAPI offline, using heuristic fallback evaluation:", err?.message || err);
            // Heuristic fallback
            if (features.reciprocal_trade_ratio > 0.65) {
                isAnomaly = true;
                riskScore = 0.85;
                severity = "HIGH";
                patternType = "SIMULATED_WASH_TRADING";
            }
            else if (features.cancellation_rate > 0.70) {
                isAnomaly = true;
                riskScore = 0.82;
                severity = "HIGH";
                patternType = "SIMULATED_SPOOFING";
            }
            else if (Math.abs(features.price_deviation_pct) > 5.0 && features.volume_surge_ratio > 3.0) {
                isAnomaly = true;
                riskScore = 0.90;
                severity = "CRITICAL";
                patternType = "SIMULATED_PUMP_DUMP";
            }
        }
        const alert = {
            id: `ALT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            tradeId: trade.id,
            symbol: trade.symbol,
            timestamp: Math.floor(Date.now() / 1000),
            riskScore,
            severity,
            patternType,
            isAnomaly,
            topFeatures,
            participantAddresses: [trade.buyerAddress, trade.sellerAddress],
            disclaimer: "SIMULATION_ONLY: Generated by academic AI surveillance engine.",
            reviewStatus: isAnomaly ? "FLAGGED" : "REVIEWED",
        };
        store_1.db.saveAlert(alert);
        return alert;
    }
}
exports.AISurveillanceService = AISurveillanceService;
exports.aiService = new AISurveillanceService();
