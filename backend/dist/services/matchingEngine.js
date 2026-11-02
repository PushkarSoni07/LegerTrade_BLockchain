"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchingEngine = exports.MatchingEngine = void 0;
const store_1 = require("../storage/store");
const blockchainService_1 = require("./blockchainService");
const auditService_1 = require("./auditService");
const aiService_1 = require("./aiService");
const ethers_1 = require("ethers");
class MatchingEngine {
    /**
     * Evaluates active orders and executes matches adhering strictly to price-time priority.
     */
    async matchOrdersForSymbol(symbol) {
        const executedTrades = [];
        const openOrders = store_1.db.getOrdersBySymbol(symbol).filter((o) => o.status === "OPEN" || o.status === "PARTIALLY_FILLED");
        const buyOrders = openOrders
            .filter((o) => o.side === "BUY")
            .sort((a, b) => {
            // Price descending (highest bid first); if equal, earlier timestamp first
            if (b.price !== a.price)
                return b.price - a.price;
            return a.createdAt - b.createdAt;
        });
        const sellOrders = openOrders
            .filter((o) => o.side === "SELL")
            .sort((a, b) => {
            // Price ascending (lowest ask first); if equal, earlier timestamp first
            if (a.price !== b.price)
                return a.price - b.price;
            return a.createdAt - b.createdAt;
        });
        for (const buy of buyOrders) {
            if (buy.remainingQty <= 0)
                continue;
            for (const sell of sellOrders) {
                if (sell.remainingQty <= 0)
                    continue;
                // Prevent same user self-matching if they are the only participant
                if (buy.userId === sell.userId)
                    continue;
                // Price eligibility check
                let canMatch = false;
                let matchPrice = sell.price; // Passive order determines price in price-time priority
                if (buy.orderType === "MARKET" || sell.orderType === "MARKET") {
                    canMatch = true;
                    matchPrice = sell.orderType === "LIMIT" ? sell.price : buy.price;
                }
                else if (buy.price >= sell.price) {
                    canMatch = true;
                    // Match at earlier order's limit price
                    matchPrice = buy.createdAt < sell.createdAt ? buy.price : sell.price;
                }
                if (canMatch) {
                    const matchQty = Math.min(buy.remainingQty, sell.remainingQty);
                    if (matchQty <= 0)
                        continue;
                    const trade = await this.executeAtomicSettlement(buy, sell, matchPrice, matchQty);
                    executedTrades.push(trade);
                    // If buy order is completely filled, break to next buy
                    if (buy.remainingQty <= 0)
                        break;
                }
            }
        }
        return executedTrades;
    }
    async executeAtomicSettlement(buy, sell, matchPrice, matchQty) {
        const totalCost = +(matchPrice * matchQty).toFixed(2);
        const now = Math.floor(Date.now() / 1000);
        // 1. Update order remaining and filled quantities
        buy.filledQty += matchQty;
        buy.remainingQty -= matchQty;
        buy.status = buy.remainingQty <= 0.0001 ? "FILLED" : "PARTIALLY_FILLED";
        buy.updatedAt = Date.now();
        sell.filledQty += matchQty;
        sell.remainingQty -= matchQty;
        sell.status = sell.remainingQty <= 0.0001 ? "FILLED" : "PARTIALLY_FILLED";
        sell.updatedAt = Date.now();
        store_1.db.saveOrder(buy);
        store_1.db.saveOrder(sell);
        // 2. Perform Delivery-versus-Payment (DvP) on portfolios
        this.updatePortfolios(buy.userId, sell.userId, buy.symbol, matchQty, totalCost, matchPrice);
        // 3. Attempt On-Chain Settlement via Smart Contract
        const onChainResult = await blockchainService_1.blockchainService.settleTradeOnChain({
            buyOrderId: buy.onChainOrderId ?? 0,
            sellOrderId: sell.onChainOrderId ?? 1,
            matchPrice,
            matchQty,
            symbol: buy.symbol,
        });
        const tradeId = `TRD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        // 4. Retrieve chained audit record details
        const allRecords = store_1.db.getAllAuditRecords();
        const prevRecord = allRecords.length > 0 ? allRecords[allRecords.length - 1] : null;
        const prevHash = prevRecord ? prevRecord.canonicalHash : ethers_1.ethers.ZeroHash;
        const recordId = allRecords.length;
        const canonicalHash = auditService_1.auditService.computeCanonicalHash({
            recordId,
            tradeId,
            buyOrderId: buy.id,
            sellOrderId: sell.id,
            symbol: buy.symbol,
            price: matchPrice,
            quantity: matchQty,
            buyer: buy.traderAddress,
            seller: sell.traderAddress,
            timestamp: now,
            previousHash: prevHash,
        });
        // 5. Save Trade
        const trade = {
            id: tradeId,
            buyOrderId: buy.id,
            sellOrderId: sell.id,
            symbol: buy.symbol,
            price: matchPrice,
            quantity: matchQty,
            totalCost,
            buyerAddress: buy.traderAddress,
            sellerAddress: sell.traderAddress,
            buyerUserId: buy.userId,
            sellerUserId: sell.userId,
            timestamp: now,
            txHash: onChainResult.txHash,
            blockNumber: onChainResult.blockNumber,
            auditRecordId: recordId,
            canonicalHash,
            isSettledOnChain: blockchainService_1.blockchainService.isConnected,
        };
        store_1.db.saveTrade(trade);
        // 6. Record Audit Log Entry
        const auditRecord = {
            recordId,
            tradeId,
            buyOrderId: buy.id,
            sellOrderId: sell.id,
            symbol: buy.symbol,
            price: matchPrice,
            quantity: matchQty,
            buyerAddress: buy.traderAddress,
            sellerAddress: sell.traderAddress,
            timestamp: now,
            previousHash: prevHash,
            canonicalHash,
            txHash: onChainResult.txHash,
            blockNumber: onChainResult.blockNumber,
            onChainVerified: blockchainService_1.blockchainService.isConnected,
            isTampered: false,
        };
        store_1.db.saveAuditRecord(auditRecord);
        // 7. Trigger AI Surveillance Analysis
        aiService_1.aiService.analyzeTrade(trade).catch((err) => {
            console.warn("[MatchingEngine] Background AI analysis error:", err);
        });
        return trade;
    }
    updatePortfolios(buyerUserId, sellerUserId, symbol, quantity, totalCost, price) {
        // Buyer
        const buyerPort = store_1.db.getPortfolio(buyerUserId);
        if (buyerPort) {
            buyerPort.cashBalance = Math.max(0, +(buyerPort.cashBalance - totalCost).toFixed(2));
            const currShares = buyerPort.holdings[symbol] || 0;
            const currAvg = buyerPort.averageCosts[symbol] || price;
            // Weighted average cost
            const newAvg = currShares + quantity > 0 ? (currShares * currAvg + totalCost) / (currShares + quantity) : price;
            buyerPort.holdings[symbol] = +(currShares + quantity).toFixed(4);
            buyerPort.averageCosts[symbol] = +newAvg.toFixed(2);
            buyerPort.updatedAt = new Date().toISOString();
            store_1.db.savePortfolio(buyerPort);
        }
        // Seller
        const sellerPort = store_1.db.getPortfolio(sellerUserId);
        if (sellerPort) {
            sellerPort.cashBalance = +(sellerPort.cashBalance + totalCost).toFixed(2);
            const currShares = sellerPort.holdings[symbol] || 0;
            sellerPort.holdings[symbol] = Math.max(0, +(currShares - quantity).toFixed(4));
            sellerPort.updatedAt = new Date().toISOString();
            store_1.db.savePortfolio(sellerPort);
        }
    }
}
exports.MatchingEngine = MatchingEngine;
exports.matchingEngine = new MatchingEngine();
