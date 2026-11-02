import React, { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Shield,
  Activity,
  Coins,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { MetricCard } from "../components/MetricCard";
import { TradingChart } from "../components/TradingChart";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { MarketInstrument, Trade, Holding } from "../types";
import { formatINR, formatINRSigned, formatNumberIN } from "../utils/formatters";

export const InvestorDashboard: React.FC<{ onNavigateToTerminal: (symbol: string) => void }> = ({
  onNavigateToTerminal,
}) => {
  const { currentUser, portfolio, refreshProfile } = useAuth();
  const [markets, setMarkets] = useState<MarketInstrument[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [mktData, tradesData, portData] = await Promise.all([
        api.getMarkets(),
        api.getTrades(),
        api.getPortfolio(),
      ]);
      setMarkets(mktData);
      setRecentTrades(tradesData.slice(0, 5));
      setHoldings(portData.holdings);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const activeMarket = markets.find((m) => m.symbol === selectedSymbol) || markets[0];

  const totalStockVal = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPortVal = (portfolio?.cashBalance || 0) + totalStockVal;
  const totalUnrealizedPnL = holdings.reduce((sum, h) => sum + h.unrealizedPnL, 0);

  // Coloured badges for instrument symbols
  const getSymbolBadgeClass = (sym: string) => {
    switch (sym) {
      case "AAPL":
        return "bg-[#E2ECFF] text-[#3563A6] border border-[#C4D9FF]";
      case "TSLA":
        return "bg-[#DDF5EF] text-[#20A896] border border-[#B2EADF]";
      case "MSFT":
        return "bg-[#EEE9FF] text-[#8574D6] border border-[#D5CBFB]";
      case "GOOGL":
        return "bg-[#FFF2D9] text-[#D99A35] border border-[#F7DBB4]";
      default:
        return "bg-[#F0F4FA] text-[#718096] border border-[#DCE6F5]";
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-1">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24344D]">
              Investor Overview
            </h1>
            <span className="rounded bg-[#E2ECFF] px-2 py-0.5 text-[10px] font-semibold text-[#3563A6] border border-[#C4D9FF]">
              {currentUser?.username} ({currentUser?.role})
            </span>
          </div>
          <p className="text-xs text-[#718096] mt-0.5">
            Simulated portfolio performance, atomic on-chain settlement receipts, and real-time INR market depth.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => refreshProfile()}
            className="flex items-center space-x-1.5 rounded-lg border border-[#DCE6F5] bg-white px-2.5 py-1.5 text-xs text-[#24344D] hover:bg-[#F0F4FA] transition shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#3563A6]" />
            <span>Sync Portfolio</span>
          </button>
        </div>
      </div>

      {/* 4 Distinct KPI Cards: Blue, Teal, Purple, Amber */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Total Portfolio Value"
          value={formatINR(totalPortVal)}
          subtext="Cash + Tokenized Equities"
          variant="blue"
          icon={<Wallet className="h-3.5 w-3.5" />}
        />
        <MetricCard
          title="Available Simulated Cash"
          value={formatINR(portfolio?.cashBalance || 0)}
          subtext="Liquid Buying Power (₹ INR)"
          variant="teal"
          icon={<Coins className="h-3.5 w-3.5" />}
        />
        <MetricCard
          title="Unrealized Gain / Loss"
          value={formatINRSigned(totalUnrealizedPnL)}
          change={totalStockVal > 0 ? (totalUnrealizedPnL / (totalStockVal - totalUnrealizedPnL)) * 100 : 0}
          subtext="Against Weighted Cost Basis"
          variant="purple"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
        <MetricCard
          title="Settled Trade Events"
          value={formatNumberIN(recentTrades.length)}
          subtext="Cryptographically Chained"
          variant="amber"
          icon={<Activity className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Main Grid: Compact Chart & Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Market Chart */}
        <div className="lg:col-span-8 space-y-3">
          {activeMarket && (
            <TradingChart
              symbol={activeMarket.symbol}
              name={activeMarket.name}
              currentPrice={activeMarket.currentPrice}
              change24h={activeMarket.change24h}
              change24hPercent={activeMarket.change24hPercent}
              data={activeMarket.history}
            />
          )}

          {/* Quick Trade Trigger Button */}
          <div className="flex items-center justify-between rounded-lg border border-[#DCE6F5] bg-white p-3 shadow-2xs">
            <div>
              <div className="text-xs font-bold text-[#24344D]">
                Execute Simulated Order for {selectedSymbol}
              </div>
              <div className="text-[11px] text-[#718096]">
                Atomic DvP execution with deterministic price-time priority matching in ₹ INR
              </div>
            </div>
            <button
              onClick={() => onNavigateToTerminal(selectedSymbol)}
              className="rounded-lg bg-[#3563A6] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#254670] transition shadow-2xs"
            >
              Open Trading Terminal &rarr;
            </button>
          </div>
        </div>

        {/* Right Column: Watchlist & Risk Summary */}
        <div className="lg:col-span-4 space-y-3">
          {/* Watchlist with coloured symbol badges */}
          <div className="fintech-card p-3.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#718096] pb-2 border-b border-[#DCE6F5]">
              Simulated Instruments (₹)
            </h3>
            <div className="mt-2 divide-y divide-[#EBF1FA]">
              {markets.map((m) => {
                const isSelected = m.symbol === selectedSymbol;
                const isPos = m.change24hPercent >= 0;
                return (
                  <button
                    key={m.symbol}
                    onClick={() => setSelectedSymbol(m.symbol)}
                    className={`flex w-full items-center justify-between py-2 px-2 rounded-lg text-left transition ${
                      isSelected ? "bg-[#E2ECFF] border-l-3 border-[#3563A6]" : "hover:bg-[#F0F4FA]"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${getSymbolBadgeClass(
                          m.symbol
                        )}`}
                      >
                        {m.symbol.substring(0, 2)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#24344D]">{m.symbol}</div>
                        <div className="text-[10px] text-[#718096] truncate max-w-[100px]">
                          {m.name.replace(" (Simulated)", "").replace(" (Simulated INR)", "")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-[#24344D]">
                        {formatINR(m.currentPrice)}
                      </div>
                      <div
                        className={`text-[10px] font-semibold ${
                          isPos ? "text-[#20A896]" : "text-[#DC2626]"
                        }`}
                      >
                        {isPos ? "+" : ""}
                        {m.change24hPercent.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Academic Risk & Compliance Summary with subtle teal accent */}
          <div className="rounded-xl border border-[#BDECE3] bg-gradient-to-br from-white to-[#F2FAF7] p-3.5 shadow-2xs">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-[#20A896] pb-2 border-b border-[#D2F2EB]">
              <Shield className="h-3.5 w-3.5 text-[#20A896]" />
              <span>Surveillance &amp; Integrity</span>
            </div>
            <div className="mt-2.5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-[#24344D]">
                <span className="text-[11px] text-[#718096]">Anomaly Risk Level:</span>
                <span className="rounded bg-[#DDF5EF] px-1.5 py-0.2 text-[10px] font-semibold text-[#0E7366] border border-[#A4E8DA]">
                  NOMINAL (0.12)
                </span>
              </div>
              <div className="flex justify-between items-center text-[#24344D]">
                <span className="text-[11px] text-[#718096]">Model Pipeline:</span>
                <span className="font-mono text-[10px] text-[#3563A6] font-semibold">Isolation Forest (FastAPI)</span>
              </div>
              <div className="flex justify-between items-center text-[#24344D]">
                <span className="text-[11px] text-[#718096]">Delivery-vs-Payment:</span>
                <span className="text-[#20A896] font-semibold text-[11px]">Atomic On-Chain</span>
              </div>
              <div className="flex justify-between items-center text-[#24344D]">
                <span className="text-[11px] text-[#718096]">Audit Chain Hash:</span>
                <span className="font-mono text-[10px] text-[#718096]">keccak256</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Table: Recent Executed Trades */}
      <div className="fintech-card p-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE6F5]">
          <div>
            <h3 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
              Recent Settled Trades
            </h3>
            <p className="text-[11px] text-[#718096]">
              Immutable settlement events confirmed on Hardhat Ethereum node
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#718096] bg-[#F0F4FA] px-2 py-0.5 rounded border border-[#DCE6F5]">
            {recentTrades.length} records
          </span>
        </div>

        <div className="mt-2.5 overflow-x-auto">
          <table className="w-full text-left text-xs text-[#24344D]">
            <thead className="bg-[#F0F4FA] text-[10px] uppercase tracking-wider text-[#718096] font-semibold border-y border-[#DCE6F5]">
              <tr>
                <th className="py-2.5 px-3">Trade ID</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Execution Price</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Total Value</th>
                <th className="py-2.5 px-3">Tx Hash</th>
                <th className="py-2.5 px-3">Audit Record</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBF1FA] font-mono text-xs">
              {recentTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-[#718096] font-sans">
                    No trades executed yet. Place matching orders in the Trading Terminal!
                  </td>
                </tr>
              ) : (
                recentTrades.map((t) => (
                  <tr key={t.id} className="table-row-hover transition">
                    <td className="py-2 px-3 text-[#24344D] font-medium">{t.id}</td>
                    <td className="py-2 px-3 font-sans font-bold text-[#3563A6]">{t.symbol}</td>
                    <td className="py-2 px-3 text-[#24344D]">{formatINR(t.price)}</td>
                    <td className="py-2 px-3 text-[#718096]">{t.quantity} sh</td>
                    <td className="py-2 px-3 text-[#20A896] font-semibold">
                      {formatINR(t.totalCost)}
                    </td>
                    <td className="py-2 px-3 text-[#718096]">
                      {t.txHash ? `${t.txHash.substring(0, 10)}...` : "Simulated Tx"}
                    </td>
                    <td className="py-2 px-3 text-[#3563A6] font-semibold">#{t.auditRecordId ?? 0}</td>
                    <td className="py-2 px-3 font-sans">
                      <span className="rounded bg-[#DDF5EF] px-1.5 py-0.2 text-[9px] font-semibold text-[#0E7366] border border-[#A4E8DA]">
                        VERIFIED
                      </span>
                    </td>
                    <td className="py-2 px-3 font-sans text-[#718096] text-[11px]">
                      {new Date(t.timestamp * 1000).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
