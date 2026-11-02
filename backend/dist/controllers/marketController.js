"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketController = void 0;
const marketService_1 = require("../services/marketService");
const store_1 = require("../storage/store");
exports.marketController = {
    getAllInstruments(req, res) {
        const list = marketService_1.marketService.getAllInstruments();
        return res.json(list);
    },
    getInstrumentDetails(req, res) {
        const { symbol } = req.params;
        const item = marketService_1.marketService.getInstrument(symbol);
        if (!item) {
            return res.status(404).json({ error: `Simulated instrument '${symbol}' not found` });
        }
        // Calculate aggregated order book depth for this symbol
        const orders = store_1.db.getOrdersBySymbol(symbol.toUpperCase()).filter((o) => o.status === "OPEN" || o.status === "PARTIALLY_FILLED");
        const bids = orders
            .filter((o) => o.side === "BUY")
            .map((o) => ({ price: o.price, quantity: o.remainingQty }))
            .sort((a, b) => b.price - a.price)
            .slice(0, 10);
        const asks = orders
            .filter((o) => o.side === "SELL")
            .map((o) => ({ price: o.price, quantity: o.remainingQty }))
            .sort((a, b) => a.price - b.price)
            .slice(0, 10);
        // If depth is shallow, provide simulated market maker depth brackets
        const currentPrice = item.currentPrice;
        if (bids.length === 0) {
            bids.push({ price: +(currentPrice * 0.998).toFixed(2), quantity: 50 }, { price: +(currentPrice * 0.995).toFixed(2), quantity: 120 }, { price: +(currentPrice * 0.990).toFixed(2), quantity: 300 });
        }
        if (asks.length === 0) {
            asks.push({ price: +(currentPrice * 1.002).toFixed(2), quantity: 45 }, { price: +(currentPrice * 1.005).toFixed(2), quantity: 110 }, { price: +(currentPrice * 1.010).toFixed(2), quantity: 280 });
        }
        return res.json({
            instrument: item,
            depth: {
                bids,
                asks,
                spread: +(asks[0].price - bids[0].price).toFixed(2),
            },
            disclaimer: "ACADEMIC SIMULATION: Synthetic prices generated for educational trading terminal.",
        });
    },
};
