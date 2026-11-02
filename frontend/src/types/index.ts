export type UserRole = "INVESTOR" | "BROKER" | "AUDITOR" | "REGULATOR";
export type KycStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  walletAddress: string;
  kycStatus: KycStatus;
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

export interface PortfolioData {
  userId: string;
  walletAddress: string;
  cashBalance: number;
  totalPortfolioValue: number;
  totalStockValue: number;
  realizedPnL: number;
  holdings?: Record<string, number>;
  averageCosts?: Record<string, number>;
  updatedAt: string;
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
  isSimulated: boolean;
  history: MarketPricePoint[];
}

export interface Order {
  id: string;
  onChainOrderId?: number;
  userId: string;
  traderAddress: string;
  symbol: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  price: number;
  quantity: number;
  filledQty: number;
  remainingQty: number;
  status: "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED" | "REJECTED";
  createdAt: number;
  updatedAt: number;
  txHash?: string;
}

export interface Trade {
  id: string;
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
  txHash?: string;
  blockNumber?: number;
  isTampered?: boolean;
  tamperedFields?: Record<string, any>;
  onChainVerified?: boolean;
}

export interface FeatureExplanation {
  feature_name: string;
  feature_value: number;
  impact_score: number;
  direction: string;
  description: string;
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
  topFeatures: FeatureExplanation[];
  participantAddresses: string[];
  disclaimer: string;
  reviewStatus: "FLAGGED" | "REVIEWED" | "DISMISSED" | "ESCALATED";
}

export interface ModelMetricsData {
  primary_model: {
    name: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix: number[][];
  };
  supervised_model: {
    name: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix: number[][];
    classes: string[];
  };
  feature_importances: Record<string, number>;
  samples_total?: number;
  train_samples?: number;
  test_samples?: number;
  trained_at?: string;
  disclaimer: string;
}

export interface BlockchainStatusData {
  connected: boolean;
  rpcUrl: string;
  chainId?: number;
  blockNumber?: number;
  contracts: Record<string, string>;
  demoAccounts: Record<string, string>;
}
