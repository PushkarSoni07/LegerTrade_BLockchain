"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainController = void 0;
const blockchainService_1 = require("../services/blockchainService");
const store_1 = require("../storage/store");
exports.blockchainController = {
    async getStatus(req, res) {
        const status = await blockchainService_1.blockchainService.getStatus();
        return res.json(status);
    },
    getTransactions(req, res) {
        const trades = store_1.db.getAllTrades();
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
