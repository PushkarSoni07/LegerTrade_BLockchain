import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { db } from "../storage/store";
import { matchingEngine } from "../services/matchingEngine";
import { Order, OrderSide, OrderType } from "../types";
import { marketService } from "../services/marketService";

export const orderController = {
  async placeOrder(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      if (user.kycStatus !== "APPROVED") {
        return res.status(403).json({ error: "Trader mock KYC must be APPROVED to place orders" });
      }

      const { symbol, side, orderType, price, quantity } = req.body;

      if (!symbol || !side || !orderType || !quantity) {
        return res.status(400).json({ error: "Missing required order fields: symbol, side, orderType, quantity" });
      }

      const orderSide = side.toUpperCase() as OrderSide;
      const oType = orderType.toUpperCase() as OrderType;
      const numQty = Number(quantity);
      let numPrice = Number(price);

      if (numQty <= 0) {
        return res.status(400).json({ error: "Quantity must be greater than zero" });
      }

      const market = marketService.getInstrument(symbol);
      if (!market) {
        return res.status(400).json({ error: `Symbol '${symbol}' is not a recognized simulated instrument` });
      }

      if (oType === "MARKET") {
        numPrice = market.currentPrice;
      } else if (numPrice <= 0) {
        return res.status(400).json({ error: "Limit price must be greater than zero" });
      }

      const portfolio = db.getPortfolio(user.id);
      if (!portfolio) {
        return res.status(400).json({ error: "User portfolio not initialized" });
      }

      // Pre-trade solvency validation
      const estimatedTotal = numPrice * numQty;
      if (orderSide === "BUY") {
        if (portfolio.cashBalance < estimatedTotal) {
          return res.status(400).json({
            error: `Insufficient simulated cash. Required: ₹${estimatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}, Available: ₹${portfolio.cashBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          });
        }
      } else if (orderSide === "SELL") {
        const availableShares = portfolio.holdings[symbol.toUpperCase()] || 0;
        if (availableShares < numQty) {
          return res.status(400).json({
            error: `Insufficient simulated shares of ${symbol}. Required: ${numQty}, Available: ${availableShares}`,
          });
        }
      }

      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newOrder: Order = {
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

      db.saveOrder(newOrder);

      // Trigger matching engine
      const matchedTrades = await matchingEngine.matchOrdersForSymbol(symbol.toUpperCase());

      // Reload order state after match
      const updatedOrder = db.getOrderById(orderId) || newOrder;

      return res.status(201).json({
        message: "Order placed successfully",
        order: updatedOrder,
        matchedTradesCount: matchedTrades.length,
        settledTrades: matchedTrades,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async cancelOrder(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;
      const order = db.getOrderById(id);
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
      db.saveOrder(order);

      return res.json({ message: "Order cancelled successfully", order });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  getOrders(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Privileged roles can see global orders; investors see their own
    if (["BROKER", "AUDITOR", "REGULATOR"].includes(user.role)) {
      return res.json(db.getAllOrders());
    }
    return res.json(db.getOrdersByUser(user.id));
  },
};
