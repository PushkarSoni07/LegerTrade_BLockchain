"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portfolioController = void 0;
const store_1 = require("../storage/store");
const marketService_1 = require("../services/marketService");
exports.portfolioController = {
    getPortfolio(req, res) {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: "Unauthorized" });
        const portfolio = store_1.db.getPortfolio(user.id);
        if (!portfolio) {
            return res.status(404).json({ error: "Portfolio not found" });
        }
        const detailedHoldings = [];
        let totalStockValue = 0;
        for (const [symbol, qty] of Object.entries(portfolio.holdings)) {
            if (qty <= 0)
                continue;
            const market = marketService_1.marketService.getInstrument(symbol);
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
    requestDemoFaucet(req, res) {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: "Unauthorized" });
        const portfolio = store_1.db.getPortfolio(user.id);
        if (!portfolio) {
            return res.status(404).json({ error: "Portfolio not found" });
        }
        const requestedAmount = 10000.0; // $10,000 sUSD
        portfolio.cashBalance = +(portfolio.cashBalance + requestedAmount).toFixed(2);
        portfolio.updatedAt = new Date().toISOString();
        store_1.db.savePortfolio(portfolio);
        return res.json({
            message: `Claimed $${requestedAmount.toLocaleString()} simulated USD from academic faucet`,
            newCashBalance: portfolio.cashBalance,
        });
    },
};
