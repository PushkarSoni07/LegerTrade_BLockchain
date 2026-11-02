import { db } from "../storage/store";
import { Order, Trade, AuditRecordModel } from "../types";
import { blockchainService } from "./blockchainService";
import { auditService } from "./auditService";
import { aiService } from "./aiService";
import { ethers } from "ethers";

export class MatchingEngine {
  /**
   * Evaluates active orders and executes matches adhering strictly to price-time priority.
   */
  public async matchOrdersForSymbol(symbol: string): Promise<Trade[]> {
    const executedTrades: Trade[] = [];
    const openOrders = db.getOrdersBySymbol(symbol).filter(
      (o) => o.status === "OPEN" || o.status === "PARTIALLY_FILLED"
    );

    const buyOrders = openOrders
      .filter((o) => o.side === "BUY")
      .sort((a, b) => {
        // Price descending (highest bid first); if equal, earlier timestamp first
        if (b.price !== a.price) return b.price - a.price;
        return a.createdAt - b.createdAt;
      });

    const sellOrders = openOrders
      .filter((o) => o.side === "SELL")
      .sort((a, b) => {
        // Price ascending (lowest ask first); if equal, earlier timestamp first
        if (a.price !== b.price) return a.price - b.price;
        return a.createdAt - b.createdAt;
      });

    for (const buy of buyOrders) {
      if (buy.remainingQty <= 0) continue;

      for (const sell of sellOrders) {
        if (sell.remainingQty <= 0) continue;
        // Prevent same user self-matching if they are the only participant
        if (buy.userId === sell.userId) continue;

        // Price eligibility check
        let canMatch = false;
        let matchPrice = sell.price; // Passive order determines price in price-time priority

        if (buy.orderType === "MARKET" || sell.orderType === "MARKET") {
          canMatch = true;
          matchPrice = sell.orderType === "LIMIT" ? sell.price : buy.price;
        } else if (buy.price >= sell.price) {
          canMatch = true;
          // Match at earlier order's limit price
          matchPrice = buy.createdAt < sell.createdAt ? buy.price : sell.price;
        }

        if (canMatch) {
          const matchQty = Math.min(buy.remainingQty, sell.remainingQty);
          if (matchQty <= 0) continue;

          const trade = await this.executeAtomicSettlement(buy, sell, matchPrice, matchQty);
          executedTrades.push(trade);

          // If buy order is completely filled, break to next buy
          if (buy.remainingQty <= 0) break;
        }
      }
    }

    return executedTrades;
  }

  private async executeAtomicSettlement(
    buy: Order,
    sell: Order,
    matchPrice: number,
    matchQty: number
  ): Promise<Trade> {
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

    db.saveOrder(buy);
    db.saveOrder(sell);

    // 2. Perform Delivery-versus-Payment (DvP) on portfolios
    this.updatePortfolios(buy.userId, sell.userId, buy.symbol, matchQty, totalCost, matchPrice);

    // 3. Attempt On-Chain Settlement via Smart Contract
    const onChainResult = await blockchainService.settleTradeOnChain({
      buyOrderId: buy.onChainOrderId ?? 0,
      sellOrderId: sell.onChainOrderId ?? 1,
      matchPrice,
      matchQty,
      symbol: buy.symbol,
    });

    const tradeId = `TRD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // 4. Retrieve chained audit record details
    const allRecords = db.getAllAuditRecords();
    const prevRecord = allRecords.length > 0 ? allRecords[allRecords.length - 1] : null;
    const prevHash = prevRecord ? prevRecord.canonicalHash : ethers.ZeroHash;
    const recordId = allRecords.length;

    const canonicalHash = auditService.computeCanonicalHash({
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
    const trade: Trade = {
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
      isSettledOnChain: blockchainService.isConnected,
    };
    db.saveTrade(trade);

    // 6. Record Audit Log Entry
    const auditRecord: AuditRecordModel = {
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
      onChainVerified: blockchainService.isConnected,
      isTampered: false,
    };
    db.saveAuditRecord(auditRecord);

    // 7. Trigger AI Surveillance Analysis
    aiService.analyzeTrade(trade).catch((err) => {
      console.warn("[MatchingEngine] Background AI analysis error:", err);
    });

    return trade;
  }

  private updatePortfolios(
    buyerUserId: string,
    sellerUserId: string,
    symbol: string,
    quantity: number,
    totalCost: number,
    price: number
  ) {
    // Buyer
    const buyerPort = db.getPortfolio(buyerUserId);
    if (buyerPort) {
      buyerPort.cashBalance = Math.max(0, +(buyerPort.cashBalance - totalCost).toFixed(2));
      const currShares = buyerPort.holdings[symbol] || 0;
      const currAvg = buyerPort.averageCosts[symbol] || price;
      // Weighted average cost
      const newAvg = currShares + quantity > 0 ? (currShares * currAvg + totalCost) / (currShares + quantity) : price;
      buyerPort.holdings[symbol] = +(currShares + quantity).toFixed(4);
      buyerPort.averageCosts[symbol] = +newAvg.toFixed(2);
      buyerPort.updatedAt = new Date().toISOString();
      db.savePortfolio(buyerPort);
    }

    // Seller
    const sellerPort = db.getPortfolio(sellerUserId);
    if (sellerPort) {
      sellerPort.cashBalance = +(sellerPort.cashBalance + totalCost).toFixed(2);
      const currShares = sellerPort.holdings[symbol] || 0;
      sellerPort.holdings[symbol] = Math.max(0, +(currShares - quantity).toFixed(4));
      sellerPort.updatedAt = new Date().toISOString();
      db.savePortfolio(sellerPort);
    }
  }
}

export const matchingEngine = new MatchingEngine();
