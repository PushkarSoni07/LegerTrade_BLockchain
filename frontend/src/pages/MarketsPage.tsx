import React, { useState, useEffect } from "react";
import { Search, TrendingUp, TrendingDown, ArrowUpRight, Activity } from "lucide-react";
import { api } from "../services/api";
import { MarketInstrument } from "../types";
import { formatINR, formatNumberIN } from "../utils/formatters";

export const MarketsPage: React.FC<{ onNavigateToTerminal: (symbol: string) => void }> = ({
  onNavigateToTerminal,
}) => {
  const [markets, setMarkets] = useState<MarketInstrument[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [loading, setLoading] = useState(true);

  const fetchMarkets = async () => {
    try {
      const data = await api.getMarkets();
      setMarkets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 3000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const filteredMarkets = markets.filter(
    (m) =>
      m.symbol.toLowerCase().includes(search.toLowerCase()) ||
      m.name.toLowerCase().includes(search.toLowerCase())
  );

  const getBadgeStyle = (sym: string) => {
    switch (sym) {
      case "AAPL":
        return "bg-[#E2ECFF] text-[#3563A6] border-[#C4D9FF]";
      case "TSLA":
        return "bg-[#DDF5EF] text-[#20A896] border-[#B2EADF]";
      case "MSFT":
        return "bg-[#EEE9FF] text-[#8574D6] border-[#D5CBFB]";
      case "GOOGL":
        return "bg-[#FFF2D9] text-[#D99A35] border-[#F7DBB4]";
      default:
        return "bg-[#F0F4FA] text-[#3563A6] border-[#DCE6F5]";
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24344D]">
              Simulated Markets (₹ INR)
            </h1>
            <span className="rounded bg-[#DDF5EF] px-2 py-0.5 text-[10px] font-semibold text-[#0E7366] border border-[#A6E8D9]">
              Synthetic Feed Active
            </span>
          </div>
          <p className="text-xs text-[#718096] mt-0.5">
            Real-time simulated ticker quotes in Indian Rupees, 24h high/low metrics, and order book depth.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#718096]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol or company..."
            className="w-full rounded-lg border border-[#DCE6F5] bg-white pl-8 pr-3 py-1.5 text-xs text-[#24344D] placeholder-[#718096] focus:border-[#3563A6] focus:outline-none shadow-2xs"
          />
        </div>
      </div>

      {/* Market Grid: Instruments Table */}
      <div className="fintech-card overflow-hidden">
        <div className="p-3.5 border-b border-[#DCE6F5] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
            Tradable Simulated Equities
          </h3>
          <span className="text-[11px] text-[#718096] font-mono">{filteredMarkets.length} instruments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#24344D]">
            <thead className="bg-[#F0F4FA] text-[10px] uppercase tracking-wider text-[#718096] font-semibold border-b border-[#DCE6F5]">
              <tr>
                <th className="py-2.5 px-4">Instrument</th>
                <th className="py-2.5 px-4">Simulated Price (₹)</th>
                <th className="py-2.5 px-4">24h Change</th>
                <th className="py-2.5 px-4 hidden md:table-cell">24h High</th>
                <th className="py-2.5 px-4 hidden md:table-cell">24h Low</th>
                <th className="py-2.5 px-4 hidden sm:table-cell">Simulated Volume</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE6F5] font-mono text-xs">
              {filteredMarkets.map((m) => {
                const isSelected = m.symbol === selectedSymbol;
                const isPos = m.change24hPercent >= 0;
                return (
                  <tr
                    key={m.symbol}
                    onClick={() => setSelectedSymbol(m.symbol)}
                    className={`cursor-pointer transition table-row-hover ${
                      isSelected ? "bg-[#E2ECFF]/40 border-l-2 border-[#3563A6]" : ""
                    }`}
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className={`flex h-7 w-7 items-center justify-center rounded font-sans font-bold text-xs border ${getBadgeStyle(m.symbol)}`}>
                          {m.symbol.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-sans font-bold text-[#24344D] text-xs">{m.symbol}</div>
                          <div className="font-sans text-[11px] text-[#718096]">
                            {m.name.replace(" (Simulated)", "").replace(" (Simulated INR)", "")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-[#24344D] font-bold text-sm">
                      {formatINR(m.currentPrice)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 font-semibold ${
                          isPos ? "text-[#20A896]" : "text-[#DC2626]"
                        }`}
                      >
                        {isPos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span>
                          {isPos ? "+" : ""}
                          {m.change24hPercent.toFixed(2)}%
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[#718096] hidden md:table-cell">
                      {formatINR(m.high24h)}
                    </td>
                    <td className="py-2.5 px-4 text-[#718096] hidden md:table-cell">
                      {formatINR(m.low24h)}
                    </td>
                    <td className="py-2.5 px-4 text-[#718096] hidden sm:table-cell">
                      {formatNumberIN(m.volume24h)} sh
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToTerminal(m.symbol);
                        }}
                        className="rounded-lg bg-[#3563A6] px-3 py-1 text-xs font-semibold text-white hover:bg-[#254670] transition shadow-2xs"
                      >
                        Trade &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
