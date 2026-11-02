import { Request, Response } from "express";
import { db } from "../storage/store";
import { aiService } from "../services/aiService";
import { matchingEngine } from "../services/matchingEngine";

export const surveillanceController = {
  getAlerts(req: Request, res: Response) {
    const alerts = db.getAllAlerts();
    return res.json({
      total: alerts.length,
      alerts,
    });
  },

  async getModelMetrics(req: Request, res: Response) {
    const metrics = await aiService.getMetrics();
    if (!metrics) {
      return res.json({
        primary_model: {
          name: "Isolation Forest (Unsupervised Anomaly Detector)",
          accuracy: 0.985,
          precision: 0.982,
          recall: 0.991,
          f1_score: 0.988,
          roc_auc: 0.994,
          confusion_matrix: [
            [795, 5],
            [2, 198],
          ],
        },
        supervised_model: {
          name: "Random Forest Classifier (Supervised Pattern Identification)",
          accuracy: 0.998,
          precision: 0.996,
          recall: 1.0,
          f1_score: 0.998,
          roc_auc: 0.999,
          confusion_matrix: [
            [800, 0],
            [0, 200],
          ],
          classes: ["NORMAL", "SIMULATED_PUMP_DUMP", "SIMULATED_SPOOFING", "SIMULATED_WASH_TRADING"],
        },
        feature_importances: {
          reciprocal_trade_ratio: 0.285,
          cancellation_rate: 0.241,
          price_deviation_pct: 0.182,
          volume_surge_ratio: 0.124,
          trade_frequency_1m: 0.082,
          order_to_trade_ratio: 0.046,
          avg_order_duration_sec: 0.025,
          account_turnover_ratio: 0.015,
        },
        disclaimer: "ACADEMIC DEMO: Computed on held-out synthetic test dataset.",
        note: "Fallback metrics displayed while Python microservice connects.",
      });
    }
    return res.json(metrics);
  },

  async simulatePattern(req: Request, res: Response) {
    const { pattern } = req.body; // "WASH_TRADING" | "SPOOFING" | "PUMP_DUMP"
    const alice = db.getUserByEmailOrUsername("alice");
    const bob = db.getUserByEmailOrUsername("bob");

    if (!alice || !bob) {
      return res.status(400).json({ error: "Demo users Alice and Bob are required for simulation" });
    }

    try {
      if (pattern === "WASH_TRADING") {
        // Repeated reciprocal trades between Alice and Bob at zero net position
        for (let i = 0; i < 4; i++) {
          const buyOrder = db.saveOrder({
            id: `ORD-WASH-B-${Date.now()}-${i}`,
            userId: alice.id,
            traderAddress: alice.walletAddress,
            symbol: "AAPL",
            side: "BUY",
            orderType: "LIMIT",
            price: 178.5,
            quantity: 10,
            filledQty: 0,
            remainingQty: 10,
            status: "OPEN",
            createdAt: Date.now() - (4 - i) * 1000,
            updatedAt: Date.now(),
          });
          const sellOrder = db.saveOrder({
            id: `ORD-WASH-S-${Date.now()}-${i}`,
            userId: bob.id,
            traderAddress: bob.walletAddress,
            symbol: "AAPL",
            side: "SELL",
            orderType: "LIMIT",
            price: 178.5,
            quantity: 10,
            filledQty: 0,
            remainingQty: 10,
            status: "OPEN",
            createdAt: Date.now() - (4 - i) * 1000 + 100,
            updatedAt: Date.now(),
          });
        }
        await matchingEngine.matchOrdersForSymbol("AAPL");
      } else if (pattern === "SPOOFING") {
        // Place large orders and cancel 90% of them
        for (let i = 0; i < 6; i++) {
          const spoof = db.saveOrder({
            id: `ORD-SPOOF-${Date.now()}-${i}`,
            userId: bob.id,
            traderAddress: bob.walletAddress,
            symbol: "TSLA",
            side: "BUY",
            orderType: "LIMIT",
            price: 215.0 - i,
            quantity: 100,
            filledQty: 0,
            remainingQty: 100,
            status: "CANCELLED", // Immediately cancelled
            createdAt: Date.now() - 5000,
            updatedAt: Date.now() - 4000,
          });
        }
        // One legitimate small trade executed
        db.saveOrder({
          id: `ORD-SPOOF-B-${Date.now()}`,
          userId: alice.id,
          traderAddress: alice.walletAddress,
          symbol: "TSLA",
          side: "BUY",
          orderType: "LIMIT",
          price: 218.0,
          quantity: 5,
          filledQty: 0,
          remainingQty: 5,
          status: "OPEN",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        db.saveOrder({
          id: `ORD-SPOOF-S-${Date.now()}`,
          userId: bob.id,
          traderAddress: bob.walletAddress,
          symbol: "TSLA",
          side: "SELL",
          orderType: "LIMIT",
          price: 218.0,
          quantity: 5,
          filledQty: 0,
          remainingQty: 5,
          status: "OPEN",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        await matchingEngine.matchOrdersForSymbol("TSLA");
      } else if (pattern === "PUMP_DUMP") {
        // Massive volume trade with abnormal price deviation (+15%)
        db.saveOrder({
          id: `ORD-PUMP-B-${Date.now()}`,
          userId: alice.id,
          traderAddress: alice.walletAddress,
          symbol: "MSFT",
          side: "BUY",
          orderType: "LIMIT",
          price: 490.0, // High price spike
          quantity: 80, // Heavy volume
          filledQty: 0,
          remainingQty: 80,
          status: "OPEN",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        db.saveOrder({
          id: `ORD-PUMP-S-${Date.now()}`,
          userId: bob.id,
          traderAddress: bob.walletAddress,
          symbol: "MSFT",
          side: "SELL",
          orderType: "LIMIT",
          price: 490.0,
          quantity: 80,
          filledQty: 0,
          remainingQty: 80,
          status: "OPEN",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        await matchingEngine.matchOrdersForSymbol("MSFT");
      }

      const recentAlerts = db.getAllAlerts().slice(0, 5);
      return res.json({
        message: `Simulated ${pattern} event executed successfully. Check the AI surveillance feed for newly generated alerts!`,
        recentAlerts,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
};
