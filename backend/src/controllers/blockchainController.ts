import { Request, Response } from "express";
import { blockchainService } from "../services/blockchainService";
import { db } from "../storage/store";

export const blockchainController = {
  async getStatus(req: Request, res: Response) {
    const status = await blockchainService.getStatus();
    return res.json(status);
  },

  getTransactions(req: Request, res: Response) {
    const trades = db.getAllTrades();
    const transactions = trades.map((t) => ({
      txHash: t.txHash,
      blockNumber: t.blockNumber,
      timestamp: t.timestamp,
      tradeId: t.id,
      symbol: t.symbol,
      price: t.price,
      quantity: t.quantity,
      totalCost: t.totalCost,
      buyer: t.buyerAddress,
      seller: t.sellerAddress,
      canonicalHash: t.canonicalHash,
      isSettledOnChain: t.isSettledOnChain,
    }));

    return res.json({
      total: transactions.length,
      transactions,
    });
  },
};
