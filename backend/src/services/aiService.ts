import axios from "axios";
import { ENV } from "../config/env";
import { db } from "../storage/store";
import { AnomalyAlert, Trade, Order } from "../types";

export interface AIModelMetrics {
  primary_model: {
    name: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix: number[][];
  };
  supervised_model: {
    name: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix: number[][];
    classes: string[];
  };
  feature_importances: Record<string, number>;
  disclaimer: string;
  samples_total: number;
  train_samples: number;
  test_samples: number;
  trained_at: string;
}

export class AISurveillanceService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = ENV.ML_SERVICE_URL;
  }

  public async checkHealth(): Promise<{ status: string; online: boolean; details?: any }> {
    try {
      const resp = await axios.get(`${this.baseUrl}/health`, { timeout: 3000 });
      return { status: "online", online: true, details: resp.data };
    } catch (err: any) {
      return { status: "offline", online: false, details: { message: "FastAPI ML service offline" } };
    }
  }

  public async getMetrics(): Promise<AIModelMetrics | null> {
    try {
      const resp = await axios.get(`${this.baseUrl}/model/metrics`, { timeout: 4000 });
      return resp.data;
    } catch (err) {
      console.warn("[AIService] Failed fetching metrics from FastAPI, returning cached/fallback metrics.");
      return null;
    }
  }

  public async getModelInfo(): Promise<any> {
    try {
      const resp = await axios.get(`${this.baseUrl}/model/info`, { timeout: 4000 });
      return resp.data;
    } catch (err) {
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
  public extractTradeFeatures(trade: Trade): Record<string, number> {
    const allUserOrders = db.getAllOrders().filter(
      (o) => o.userId === trade.buyerUserId || o.userId === trade.sellerUserId
    );
    const userTrades = db.getAllTrades().filter(
      (t) => t.buyerUserId === trade.buyerUserId || t.sellerUserId === trade.buyerUserId
    );

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
    const market = db.getMarket(trade.symbol);
    const currentMktPrice = market ? market.currentPrice : trade.price;
    const price_deviation_pct = +(((trade.price - currentMktPrice) / currentMktPrice) * 100).toFixed(2);

    // 5. Volume surge ratio
    const avgTradeSize = 10.0;
    const volume_surge_ratio = +(trade.quantity / avgTradeSize).toFixed(2);

    // 6. Reciprocal trade ratio
    const reciprocalCount = userTrades.filter(
      (t) =>
        (t.buyerUserId === trade.buyerUserId && t.sellerUserId === trade.sellerUserId) ||
        (t.buyerUserId === trade.sellerUserId && t.sellerUserId === trade.buyerUserId)
    ).length;
    const reciprocal_trade_ratio = +(reciprocalCount / tradeCount).toFixed(2);

    // 7. Average order duration
    const completedOrders = allUserOrders.filter((o) => o.status === "FILLED" || o.status === "CANCELLED");
    const avg_order_duration_sec =
      completedOrders.length > 0
        ? +(completedOrders.reduce((acc, o) => acc + (o.updatedAt - o.createdAt), 0) / (completedOrders.length * 1000)).toFixed(1)
        : 65.0;

    // 8. Account turnover ratio
    const portfolio = db.getPortfolio(trade.buyerUserId);
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
  public async analyzeTrade(trade: Trade): Promise<AnomalyAlert> {
    const features = this.extractTradeFeatures(trade);

    let isAnomaly = false;
    let riskScore = 0.15;
    let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let patternType: "NORMAL" | "SIMULATED_WASH_TRADING" | "SIMULATED_SPOOFING" | "SIMULATED_PUMP_DUMP" = "NORMAL";
    let topFeatures: any[] = [];

    try {
      const resp = await axios.post(
        `${this.baseUrl}/predict`,
        {
          trade_id: trade.id,
          symbol: trade.symbol,
          buyer_address: trade.buyerAddress,
          seller_address: trade.sellerAddress,
          price: trade.price,
          quantity: trade.quantity,
          timestamp: trade.timestamp,
          ...features,
        },
        { timeout: 4000 }
      );

      const data = resp.data;
      isAnomaly = data.is_anomaly;
      riskScore = data.risk_score;
      severity = data.severity;
      patternType = data.predicted_pattern;
      topFeatures = data.top_features;
    } catch (err: any) {
      console.warn("[AIService] FastAPI offline, using heuristic fallback evaluation:", err?.message || err);
      // Heuristic fallback
      if (features.reciprocal_trade_ratio > 0.65) {
        isAnomaly = true;
        riskScore = 0.85;
        severity = "HIGH";
        patternType = "SIMULATED_WASH_TRADING";
      } else if (features.cancellation_rate > 0.70) {
        isAnomaly = true;
        riskScore = 0.82;
        severity = "HIGH";
        patternType = "SIMULATED_SPOOFING";
      } else if (Math.abs(features.price_deviation_pct) > 5.0 && features.volume_surge_ratio > 3.0) {
        isAnomaly = true;
        riskScore = 0.90;
        severity = "CRITICAL";
        patternType = "SIMULATED_PUMP_DUMP";
      }
    }

    const alert: AnomalyAlert = {
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

    db.saveAlert(alert);
    return alert;
  }
}

export const aiService = new AISurveillanceService();
