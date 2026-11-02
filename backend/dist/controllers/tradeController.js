"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tradeController = void 0;
const store_1 = require("../storage/store");
exports.tradeController = {
    getTrades(req, res) {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: "Unauthorized" });
        if (["BROKER", "AUDITOR", "REGULATOR"].includes(user.role)) {
            return res.json(store_1.db.getAllTrades());
        }
        return res.json(store_1.db.getTradesByUser(user.id));
    },
    getTradeById(req, res) {
        const { id } = req.params;
        const trade = store_1.db.getTradeById(id);
        if (!trade) {
            return res.status(404).json({ error: "Trade not found" });
        }
        return res.json(trade);
    },
};
