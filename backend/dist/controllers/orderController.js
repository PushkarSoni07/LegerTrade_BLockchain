"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = void 0;
const store_1 = require("../storage/store");
const matchingEngine_1 = require("../services/matchingEngine");
const marketService_1 = require("../services/marketService");
exports.orderController = {
    async placeOrder(req, res) {
        try {
            const user = req.user;
            if (!user)
                return res.status(401).json({ error: "Unauthorized" });
            if (user.kycStatus !== "APPROVED") {
                return res.status(403).json({ error: "Trader mock KYC must be APPROVED to place orders" });
            }
            const { symbol, side, orderType, price, quantity } = req.body;
            if (!symbol || !side || !orderType || !quantity) {
                return res.status(400).json({ error: "Missing required order fields: symbol, side, orderType, quantity" });
            }
            const orderSide = side.toUpperCase();
            const oType = orderType.toUpperCase();
            const numQty = Number(quantity);
            let numPrice = Number(price);
            if (numQty <= 0) {
                return res.status(400).json({ error: "Quantity must be greater than zero" });
            }
            const market = marketService_1.marketService.getInstrument(symbol);
            if (!market) {
                return res.status(400).json({ error: `Symbol '${symbol}' is not a recognized simulated instrument` });
            }
            if (oType === "MARKET") {
                numPrice = market.currentPrice;
            }
            else if (numPrice <= 0) {
                return res.status(400).json({ error: "Limit price must be greater than zero" });
            }
            const portfolio = store_1.db.getPortfolio(user.id);
            if (!portfolio) {
                return res.status(400).json({ error: "User portfolio not initialized" });
            }
            // Pre-trade solvency validation
            const estimatedTotal = numPrice * numQty;
            if (orderSide === "BUY") {
                if (portfolio.cashBalance < estimatedTotal) {
                    return res.status(400).json({
                        error: `Insufficient simulated cash. Required: $${estimatedTotal.toFixed(2)}, Available: $${portfolio.cashBalance.toFixed(2)}`,
                    });
                }
            }
            else if (orderSide === "SELL") {
                const availableShares = portfolio.holdings[symbol.toUpperCase()] || 0;
                if (availableShares < numQty) {
                    return res.status(400).json({
                        error: `Insufficient simulated shares of ${symbol}. Required: ${numQty}, Available: ${availableShares}`,
                    });
                }
            }
            const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const newOrder = {
                id: orderId,
                onChainOrderId: Math.floor(Math.random() * 100000),
                userId: user.id,
                traderAddress: user.walletAddress,
                symbol: symbol.toUpperCase(),
                side: orderSide,
                orderType: oType,
                price: numPrice,
                quantity: numQty,
                filledQty: 0,
                remainingQty: numQty,
                status: "OPEN",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            store_1.db.saveOrder(newOrder);
            // Trigger matching engine
            const matchedTrades = await matchingEngine_1.matchingEngine.matchOrdersForSymbol(symbol.toUpperCase());
            // Reload order state after match
            const updatedOrder = store_1.db.getOrderById(orderId) || newOrder;
            return res.status(201).json({
                message: "Order placed successfully",
                order: updatedOrder,
                matchedTradesCount: matchedTrades.length,
                settledTrades: matchedTrades,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
    async cancelOrder(req, res) {
        try {
            const user = req.user;
            if (!user)
                return res.status(401).json({ error: "Unauthorized" });
            const { id } = req.params;
            const order = store_1.db.getOrderById(id);
            if (!order) {
                return res.status(404).json({ error: "Order not found" });
            }
            if (order.userId !== user.id && user.role !== "BROKER" && user.role !== "REGULATOR") {
                return res.status(403).json({ error: "Cannot cancel another trader's order" });
            }
            if (order.status !== "OPEN" && order.status !== "PARTIALLY_FILLED") {
                return res.status(400).json({ error: `Cannot cancel order with status: ${order.status}` });
            }
            order.status = "CANCELLED";
            order.updatedAt = Date.now();
            store_1.db.saveOrder(order);
            return res.json({ message: "Order cancelled successfully", order });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
    getOrders(req, res) {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: "Unauthorized" });
        // Privileged roles can see global orders; investors see their own
        if (["BROKER", "AUDITOR", "REGULATOR"].includes(user.role)) {
            return res.json(store_1.db.getAllOrders());
        }
        return res.json(store_1.db.getOrdersByUser(user.id));
    },
};
