import React, { useState, useEffect } from "react";
import { PieChart, Wallet, TrendingUp, TrendingDown, Coins } from "lucide-react";
import { MetricCard } from "../components/MetricCard";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Holding } from "../types";
import { formatINR, formatINRSigned, formatNumberIN } from "../utils/formatters";

export const PortfolioPage: React.FC = () => {
  const { currentUser, portfolio } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPortfolio = async () => {
    try {
      const res = await api.getPortfolio();
      setHoldings(res.holdings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const totalStockValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalValue = (portfolio?.cashBalance || 0) + totalStockValue;
  const totalUnrealized = holdings.reduce((sum, h) => sum + h.unrealizedPnL, 0);
  const totalCostBasis = holdings.reduce((sum, h) => sum + h.quantity * h.averageBuyPrice, 0);
  const overallReturnPct = totalCostBasis > 0 ? (totalUnrealized / totalCostBasis) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24344D]">
              Holdings &amp; P&amp;L (₹ INR)
            </h1>
            <span className="rounded bg-[#E2ECFF] px-2 py-0.5 text-[10px] font-semibold text-[#3563A6] border border-[#C4D9FF]">
              Account: {currentUser?.username}
            </span>
          </div>
          <p className="text-xs text-[#718096] mt-0.5">
            Breakdown of tokenized stock assets, weighted average acquisition costs in ₹ INR, and unrealized gains.
          </p>
        </div>

        <div className="rounded-lg border border-[#DCE6F5] bg-white px-3 py-1.5 text-xs font-mono text-[#24344D] shadow-2xs">
          <span className="text-[#718096]">Wallet: </span>
          <span>{currentUser?.walletAddress}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Total Portfolio Valuation"
          value={formatINR(totalValue)}
          subtext="Cash + Stock Positions"
          variant="blue"
          icon={<Wallet className="h-4 w-4" />}
        />
        <MetricCard
          title="Simulated Cash Balance"
          value={formatINR(portfolio?.cashBalance || 0)}
          subtext="Available Liquid Buying Power"
          variant="teal"
          icon={<Coins className="h-4 w-4 text-[#20A896]" />}
        />
        <MetricCard
          title="Stock Positions Value"
          value={formatINR(totalStockValue)}
          subtext={`${holdings.length} Active Positions`}
          variant="purple"
          icon={<PieChart className="h-4 w-4 text-[#8574D6]" />}
        />
        <MetricCard
          title="Total Unrealized P&L"
          value={formatINRSigned(totalUnrealized)}
          change={overallReturnPct}
          subtext="Weighted Unrealized Return"
          variant={totalUnrealized >= 0 ? "teal" : "amber"}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Holdings Breakdown Table */}
      <div className="fintech-card overflow-hidden">
        <div className="p-3.5 border-b border-[#DCE6F5] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
            Equity Holdings Breakdown
          </h3>
          <span className="text-[11px] text-[#718096] font-mono">{holdings.length} positions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#24344D]">
            <thead className="bg-[#F0F4FA] text-[10px] uppercase tracking-wider text-[#718096] font-semibold border-b border-[#DCE6F5]">
              <tr>
                <th className="py-2.5 px-4">Instrument</th>
                <th className="py-2.5 px-4">Shares Owned</th>
                <th className="py-2.5 px-4">Avg Buy Price (₹)</th>
                <th className="py-2.5 px-4">Current Price (₹)</th>
                <th className="py-2.5 px-4">Current Valuation</th>
                <th className="py-2.5 px-4">Unrealized P&L</th>
                <th className="py-2.5 px-4 text-right">Return (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE6F5] font-mono text-xs">
              {holdings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#718096] font-sans">
                    No simulated stock holdings currently in your portfolio. Place a BUY order in the Trading Terminal!
                  </td>
                </tr>
              ) : (
                holdings.map((h) => {
                  const isPos = h.unrealizedPnL >= 0;
                  return (
                    <tr key={h.symbol} className="table-row-hover transition">
                      <td className="py-2.5 px-4 font-sans font-bold text-[#3563A6] text-xs">
                        <span>s{h.symbol}</span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#24344D]">{h.quantity} sh</td>
                      <td className="py-2.5 px-4 text-[#718096]">{formatINR(h.averageBuyPrice)}</td>
                      <td className="py-2.5 px-4 text-[#24344D] font-semibold">{formatINR(h.currentPrice)}</td>
                      <td className="py-2.5 px-4 font-bold text-[#24344D]">{formatINR(h.currentValue)}</td>
                      <td className={`py-2.5 px-4 font-semibold ${isPos ? "text-[#20A896]" : "text-[#DC2626]"}`}>
                        {formatINRSigned(h.unrealizedPnL)}
                      </td>
                      <td className={`py-2.5 px-4 text-right font-bold ${isPos ? "text-[#20A896]" : "text-[#DC2626]"}`}>
                        {isPos ? "+" : ""}
                        {h.unrealizedPnLPercent.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
