export type UserRole = "INVESTOR" | "BROKER" | "AUDITOR" | "REGULATOR";
export type KycStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  walletAddress: string;
  kycStatus: KycStatus;
  createdAt: string;
}

export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT";
export type OrderStatus = "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED" | "REJECTED";

export interface Order {
  id: string;
  onChainOrderId?: number;
  userId: string;
  traderAddress: string;
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  price: number;
  quantity: number;
  filledQty: number;
  remainingQty: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  txHash?: string;
}

export interface Trade {
  id: string;
  tradeIdBytes32?: string;
  buyOrderId: string;
  sellOrderId: string;
  symbol: string;
  price: number;
  quantity: number;
  totalCost: number;
  buyerAddress: string;
  sellerAddress: string;
  buyerUserId: string;
  sellerUserId: string;
  timestamp: number;
  txHash?: string;
  blockNumber?: number;
  auditRecordId?: number;
  canonicalHash: string;
  isSettledOnChain: boolean;
}

export interface Holding {
  symbol: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface Portfolio {
  userId: string;
  walletAddress: string;
  cashBalance: number;       // simulated USD
  holdings: Record<string, number>; // symbol -> quantity
  averageCosts: Record<string, number>; // symbol -> avg price
  realizedPnL: number;
  totalPortfolioValue: number;
  updatedAt: string;
}

export interface AuditRecordModel {
  recordId: number;
  tradeId: string;
  buyOrderId: string;
  sellOrderId: string;
  symbol: string;
  price: number;
  quantity: number;
  buyerAddress: string;
  sellerAddress: string;
  timestamp: number;
  previousHash: string;
  canonicalHash: string;
  blockNumber?: number;
  txHash?: string;
  isTampered?: boolean;
  tamperedFields?: Record<string, any>;
  onChainVerified?: boolean;
}

export interface AnomalyAlert {
  id: string;
  tradeId: string;
  symbol: string;
  timestamp: number;
  riskScore: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  patternType: "NORMAL" | "SIMULATED_WASH_TRADING" | "SIMULATED_SPOOFING" | "SIMULATED_PUMP_DUMP";
  isAnomaly: boolean;
  topFeatures: Array<{
    feature_name: string;
    feature_value: number;
    impact_score: number;
    direction: string;
    description: string;
  }>;
  participantAddresses: string[];
  disclaimer: string;
  reviewStatus: "FLAGGED" | "REVIEWED" | "DISMISSED" | "ESCALATED";
}

export interface MarketPricePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketInstrument {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  isin: string;
  isSimulated: true;
  history: MarketPricePoint[];
}
