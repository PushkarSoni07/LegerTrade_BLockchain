import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { db } from "../storage/store";

export const tradeController = {
  getTrades(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (["BROKER", "AUDITOR", "REGULATOR"].includes(user.role)) {
      return res.json(db.getAllTrades());
    }
    return res.json(db.getTradesByUser(user.id));
  },

  getTradeById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const trade = db.getTradeById(id);
    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }
    return res.json(trade);
  },
};
