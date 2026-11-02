import fs from "fs";
import path from "path";
import { User, Order, Trade, Portfolio, AuditRecordModel, AnomalyAlert, MarketInstrument } from "../types";

const DATA_DIR = path.resolve(__dirname, "../../data");
const STORE_FILE = path.join(DATA_DIR, "db_store.json");

interface StoreState {
  users: Record<string, User>;
  orders: Record<string, Order>;
  trades: Record<string, Trade>;
  portfolios: Record<string, Portfolio>;
  auditRecords: Record<string, AuditRecordModel>;
  alerts: Record<string, AnomalyAlert>;
  markets: Record<string, MarketInstrument>;
}

class InMemoryDataStore {
  private state: StoreState = {
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

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private saveToDisk() {
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.state, null, 2));
    } catch (err) {
      console.error("Failed persisting store to disk:", err);
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, "utf-8");
        this.state = JSON.parse(raw);
        console.log("[DataStore] Loaded existing persistent data store from disk.");
      }
    } catch (err) {
      console.warn("[DataStore] Could not load existing store, starting fresh:", err);
    }
  }

  // Users
  getUserById(id: string): User | undefined {
    return this.state.users[id];
  }

  getUserByEmailOrUsername(identifier: string): User | undefined {
    return Object.values(this.state.users).find(
      (u) => u.email.toLowerCase() === identifier.toLowerCase() || u.username.toLowerCase() === identifier.toLowerCase()
    );
  }

  getUserByWallet(wallet: string): User | undefined {
    return Object.values(this.state.users).find(
      (u) => u.walletAddress.toLowerCase() === wallet.toLowerCase()
    );
  }

  getAllUsers(): User[] {
    return Object.values(this.state.users);
  }

  saveUser(user: User): User {
    this.state.users[user.id] = user;
    this.saveToDisk();
    return user;
  }

  // Orders
  getOrderById(id: string): Order | undefined {
    return this.state.orders[id];
  }

  getAllOrders(): Order[] {
    return Object.values(this.state.orders).sort((a, b) => b.createdAt - a.createdAt);
  }

  getOrdersByUser(userId: string): Order[] {
    return Object.values(this.state.orders)
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getOrdersBySymbol(symbol: string): Order[] {
    return Object.values(this.state.orders)
      .filter((o) => o.symbol === symbol)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  saveOrder(order: Order): Order {
    this.state.orders[order.id] = order;
    this.saveToDisk();
    return order;
  }

  // Trades
  getTradeById(id: string): Trade | undefined {
    return this.state.trades[id];
  }

  getAllTrades(): Trade[] {
    return Object.values(this.state.trades).sort((a, b) => b.timestamp - a.timestamp);
  }

  getTradesByUser(userId: string): Trade[] {
    return Object.values(this.state.trades)
      .filter((t) => t.buyerUserId === userId || t.sellerUserId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  saveTrade(trade: Trade): Trade {
    this.state.trades[trade.id] = trade;
    this.saveToDisk();
    return trade;
  }

  // Portfolios
  getPortfolio(userId: string): Portfolio | undefined {
    return this.state.portfolios[userId];
  }

  savePortfolio(portfolio: Portfolio): Portfolio {
    this.state.portfolios[portfolio.userId] = portfolio;
    this.saveToDisk();
    return portfolio;
  }

  // Audit Records
  getAuditRecord(recordId: number): AuditRecordModel | undefined {
    return this.state.auditRecords[recordId.toString()];
  }

  getAllAuditRecords(): AuditRecordModel[] {
    return Object.values(this.state.auditRecords).sort((a, b) => a.recordId - b.recordId);
  }

  saveAuditRecord(record: AuditRecordModel): AuditRecordModel {
    this.state.auditRecords[record.recordId.toString()] = record;
    this.saveToDisk();
    return record;
  }

  // Anomaly Alerts
  getAlertById(id: string): AnomalyAlert | undefined {
    return this.state.alerts[id];
  }

  getAllAlerts(): AnomalyAlert[] {
    return Object.values(this.state.alerts).sort((a, b) => b.timestamp - a.timestamp);
  }

  saveAlert(alert: AnomalyAlert): AnomalyAlert {
    this.state.alerts[alert.id] = alert;
    this.saveToDisk();
    return alert;
  }

  // Markets
  getMarket(symbol: string): MarketInstrument | undefined {
    return this.state.markets[symbol];
  }

  getAllMarkets(): MarketInstrument[] {
    return Object.values(this.state.markets);
  }

  saveMarket(instrument: MarketInstrument): MarketInstrument {
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
    if (fs.existsSync(STORE_FILE)) {
      fs.unlinkSync(STORE_FILE);
    }
  }
}

export const db = new InMemoryDataStore();
