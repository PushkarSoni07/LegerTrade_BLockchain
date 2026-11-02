import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { db } from "../storage/store";
import { marketService } from "../services/marketService";
import { Holding } from "../types";

export const portfolioController = {
  getPortfolio(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const portfolio = db.getPortfolio(user.id);
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const detailedHoldings: Holding[] = [];
    let totalStockValue = 0;

    for (const [symbol, qty] of Object.entries(portfolio.holdings)) {
      if (qty <= 0) continue;
      const market = marketService.getInstrument(symbol);
      const currentPrice = market ? market.currentPrice : 100.0;
      const currentValue = +(qty * currentPrice).toFixed(2);
      const avgCost = portfolio.averageCosts[symbol] || currentPrice;
      const costBasis = +(qty * avgCost).toFixed(2);
      const unrealizedPnL = +(currentValue - costBasis).toFixed(2);
      const unrealizedPnLPercent = costBasis > 0 ? +((unrealizedPnL / costBasis) * 100).toFixed(2) : 0;

      totalStockValue += currentValue;
      detailedHoldings.push({
        symbol,
        quantity: qty,
        averageBuyPrice: avgCost,
        currentPrice,
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercent,
      });
    }

    const totalPortfolioValue = +(portfolio.cashBalance + totalStockValue).toFixed(2);

    return res.json({
      portfolio: {
        userId: user.id,
        walletAddress: user.walletAddress,
        cashBalance: portfolio.cashBalance,
        totalPortfolioValue,
        totalStockValue: +totalStockValue.toFixed(2),
        realizedPnL: portfolio.realizedPnL,
        updatedAt: portfolio.updatedAt,
      },
      holdings: detailedHoldings,
      disclaimer: "SIMULATED_PORTFOLIO: All cash balances and share holdings are purely simulated.",
    });
  },

  requestDemoFaucet(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const portfolio = db.getPortfolio(user.id);
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const requestedAmount = 100000.0; // ₹1,00,000 INR demo funds
    portfolio.cashBalance = +(portfolio.cashBalance + requestedAmount).toFixed(2);
    portfolio.updatedAt = new Date().toISOString();
    db.savePortfolio(portfolio);

    return res.json({
      message: `Added ₹${requestedAmount.toLocaleString("en-IN")} simulated demo funds from academic faucet`,
      newCashBalance: portfolio.cashBalance,
    });
  },
};
