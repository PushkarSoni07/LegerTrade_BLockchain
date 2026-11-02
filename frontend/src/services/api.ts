import axios from "axios";
import {
  User,
  PortfolioData,
  Holding,
  MarketInstrument,
  Order,
  Trade,
  AuditRecordModel,
  AnomalyAlert,
  ModelMetricsData,
  BlockchainStatusData,
} from "../types";

const API_BASE = "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("ledgertrade_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const demoUserId = localStorage.getItem("ledgertrade_demo_user_id");
  if (demoUserId) {
    config.headers["x-demo-user"] = demoUserId;
  }
  return config;
});

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await apiClient.post<{ user: User; token: string }>("/auth/login", { email, password });
    return res.data;
  },
  async register(username: string, email: string, password: string, role: string) {
    const res = await apiClient.post<{ user: User; token: string }>("/auth/register", {
      username,
      email,
      password,
      role,
    });
    return res.data;
  },
  async getDemoUsers() {
    const res = await apiClient.get<User[]>("/auth/demo-users");
    return res.data;
  },
  async switchDemoAccount(userId: string) {
    const res = await apiClient.post<{ user: User; token: string }>("/auth/switch-demo", { userId });
    return res.data;
  },
  async getProfile() {
    const res = await apiClient.get<{ user: User; portfolio: PortfolioData }>("/auth/profile");
    return res.data;
  },

  // Markets
  async getMarkets() {
    const res = await apiClient.get<MarketInstrument[]>("/markets");
    return res.data;
  },
  async getMarketDetails(symbol: string) {
    const res = await apiClient.get<{
      instrument: MarketInstrument;
      depth: {
        bids: Array<{ price: number; quantity: number }>;
        asks: Array<{ price: number; quantity: number }>;
        spread: number;
      };
      disclaimer: string;
    }>(`/markets/${symbol}`);
    return res.data;
  },

  // Orders
  async placeOrder(params: {
    symbol: string;
    side: "BUY" | "SELL";
    orderType: "MARKET" | "LIMIT";
    price: number;
    quantity: number;
  }) {
    const res = await apiClient.post<{
      message: string;
      order: Order;
      matchedTradesCount: number;
      settledTrades: Trade[];
    }>("/orders", params);
    return res.data;
  },
  async cancelOrder(orderId: string) {
    const res = await apiClient.delete<{ message: string; order: Order }>(`/orders/${orderId}`);
    return res.data;
  },
  async getOrders() {
    const res = await apiClient.get<Order[]>("/orders");
    return res.data;
  },

  // Trades
  async getTrades() {
    const res = await apiClient.get<Trade[]>("/trades");
    return res.data;
  },
  async getTrade(id: string) {
    const res = await apiClient.get<Trade>(`/trades/${id}`);
    return res.data;
  },

  // Portfolio
  async getPortfolio() {
    const res = await apiClient.get<{
      portfolio: PortfolioData;
      holdings: Holding[];
      disclaimer: string;
    }>("/portfolio");
    return res.data;
  },
  async claimFaucet() {
    const res = await apiClient.post<{ message: string; newCashBalance: number }>("/portfolio/faucet");
    return res.data;
  },

  // Blockchain Explorer
  async getBlockchainStatus() {
    const res = await apiClient.get<BlockchainStatusData>("/blockchain/status");
    return res.data;
  },
  async getBlockchainTransactions() {
    const res = await apiClient.get<{ total: number; transactions: any[] }>("/blockchain/transactions");
    return res.data;
  },

  // Audit
  async getAuditRecords(params?: { symbol?: string; tradeId?: string; wallet?: string }) {
    const res = await apiClient.get<{ total: number; records: AuditRecordModel[] }>("/audit/records", { params });
    return res.data;
  },
  async verifyRecord(recordId: number) {
    const res = await apiClient.get<{
      recordId: number;
      isTampered: boolean;
      localVerification: { isValid: boolean; storedHash: string; recomputedHash: string };
      onChainVerification: { confirmedOnChain: boolean; matchesLocal?: boolean; onChainStoredHash?: string; note?: string };
    }>(`/audit/verify/${recordId}`);
    return res.data;
  },
  async verifyChain() {
    const res = await apiClient.get<{
      status: "INTACT" | "COMPROMISED";
      isIntact: boolean;
      totalRecords: number;
      brokenAtRecordId?: number;
      reason?: string;
      verifiedAt: string;
    }>("/audit/verify-chain");
    return res.data;
  },
  async getMerkleRoot() {
    const res = await apiClient.get<{ merkleRoot: string; leavesCount: number; leaves: string[]; timestamp: string }>(
      "/audit/merkle"
    );
    return res.data;
  },
  async simulateTamper(recordId: number, fakePrice?: number, fakeQty?: number) {
    const res = await apiClient.post<{ message: string; tamperedRecord: AuditRecordModel }>(
      `/audit/tamper/${recordId}`,
      { fakePrice, fakeQty }
    );
    return res.data;
  },
  async restoreRecord(recordId: number) {
    const res = await apiClient.post<{ message: string; record: AuditRecordModel }>(`/audit/restore/${recordId}`);
    return res.data;
  },
  getExportUrl(format: "csv" | "json") {
    return `${API_BASE}/audit/export?format=${format}`;
  },

  // AI Surveillance
  async getSurveillanceAlerts() {
    const res = await apiClient.get<{ total: number; alerts: AnomalyAlert[] }>("/surveillance/alerts");
    return res.data;
  },
  async getModelMetrics() {
    const res = await apiClient.get<ModelMetricsData>("/surveillance/metrics");
    return res.data;
  },
  async simulateSuspiciousPattern(pattern: "WASH_TRADING" | "SPOOFING" | "PUMP_DUMP") {
    const res = await apiClient.post<{ message: string; recentAlerts: AnomalyAlert[] }>("/surveillance/simulate", {
      pattern,
    });
    return res.data;
  },
};
