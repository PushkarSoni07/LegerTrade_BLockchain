"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.resolve(__dirname, "../../data");
const STORE_FILE = path_1.default.join(DATA_DIR, "db_store.json");
class InMemoryDataStore {
    state = {
        users: {},
        orders: {},
        trades: {},
        portfolios: {},
        auditRecords: {},
        alerts: {},
        markets: {},
    };
    constructor() {
        this.ensureDataDir();
        this.loadFromDisk();
    }
    ensureDataDir() {
        if (!fs_1.default.existsSync(DATA_DIR)) {
            fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
        }
    }
    saveToDisk() {
        try {
            fs_1.default.writeFileSync(STORE_FILE, JSON.stringify(this.state, null, 2));
        }
        catch (err) {
            console.error("Failed persisting store to disk:", err);
        }
    }
    loadFromDisk() {
        try {
            if (fs_1.default.existsSync(STORE_FILE)) {
                const raw = fs_1.default.readFileSync(STORE_FILE, "utf-8");
                this.state = JSON.parse(raw);
                console.log("[DataStore] Loaded existing persistent data store from disk.");
            }
        }
        catch (err) {
            console.warn("[DataStore] Could not load existing store, starting fresh:", err);
        }
    }
    // Users
    getUserById(id) {
        return this.state.users[id];
    }
    getUserByEmailOrUsername(identifier) {
        return Object.values(this.state.users).find((u) => u.email.toLowerCase() === identifier.toLowerCase() || u.username.toLowerCase() === identifier.toLowerCase());
    }
    getUserByWallet(wallet) {
        return Object.values(this.state.users).find((u) => u.walletAddress.toLowerCase() === wallet.toLowerCase());
    }
    getAllUsers() {
        return Object.values(this.state.users);
    }
    saveUser(user) {
        this.state.users[user.id] = user;
        this.saveToDisk();
        return user;
    }
    // Orders
    getOrderById(id) {
        return this.state.orders[id];
    }
    getAllOrders() {
        return Object.values(this.state.orders).sort((a, b) => b.createdAt - a.createdAt);
    }
    getOrdersByUser(userId) {
        return Object.values(this.state.orders)
            .filter((o) => o.userId === userId)
            .sort((a, b) => b.createdAt - a.createdAt);
    }
    getOrdersBySymbol(symbol) {
        return Object.values(this.state.orders)
            .filter((o) => o.symbol === symbol)
            .sort((a, b) => b.createdAt - a.createdAt);
    }
    saveOrder(order) {
        this.state.orders[order.id] = order;
        this.saveToDisk();
        return order;
    }
    // Trades
    getTradeById(id) {
        return this.state.trades[id];
    }
    getAllTrades() {
        return Object.values(this.state.trades).sort((a, b) => b.timestamp - a.timestamp);
    }
    getTradesByUser(userId) {
        return Object.values(this.state.trades)
            .filter((t) => t.buyerUserId === userId || t.sellerUserId === userId)
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    saveTrade(trade) {
        this.state.trades[trade.id] = trade;
        this.saveToDisk();
        return trade;
    }
    // Portfolios
    getPortfolio(userId) {
        return this.state.portfolios[userId];
    }
    savePortfolio(portfolio) {
        this.state.portfolios[portfolio.userId] = portfolio;
        this.saveToDisk();
        return portfolio;
    }
    // Audit Records
    getAuditRecord(recordId) {
        return this.state.auditRecords[recordId.toString()];
    }
    getAllAuditRecords() {
        return Object.values(this.state.auditRecords).sort((a, b) => a.recordId - b.recordId);
    }
    saveAuditRecord(record) {
        this.state.auditRecords[record.recordId.toString()] = record;
        this.saveToDisk();
        return record;
    }
    // Anomaly Alerts
    getAlertById(id) {
        return this.state.alerts[id];
    }
    getAllAlerts() {
        return Object.values(this.state.alerts).sort((a, b) => b.timestamp - a.timestamp);
    }
    saveAlert(alert) {
        this.state.alerts[alert.id] = alert;
        this.saveToDisk();
        return alert;
    }
    // Markets
    getMarket(symbol) {
        return this.state.markets[symbol];
    }
    getAllMarkets() {
        return Object.values(this.state.markets);
    }
    saveMarket(instrument) {
        this.state.markets[instrument.symbol] = instrument;
        this.saveToDisk();
        return instrument;
    }
    // Reset demo state
    resetAll() {
        this.state = {
            users: {},
            orders: {},
            trades: {},
            portfolios: {},
            auditRecords: {},
            alerts: {},
            markets: {},
        };
        if (fs_1.default.existsSync(STORE_FILE)) {
            fs_1.default.unlinkSync(STORE_FILE);
        }
    }
}
exports.db = new InMemoryDataStore();
