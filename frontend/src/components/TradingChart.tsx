import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { MarketPricePoint } from "../types";
import { formatINR } from "../utils/formatters";

interface TradingChartProps {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  change24hPercent: number;
  data: MarketPricePoint[];
}

export const TradingChart: React.FC<TradingChartProps> = ({
  symbol,
  name,
  currentPrice,
  change24h,
  change24hPercent,
  data,
}) => {
  const [chartType, setChartType] = useState<"price" | "volume">("price");

  const isPositive = change24hPercent >= 0;
  // Positive: blue & teal gradient; Negative: muted red
  const strokeColor = isPositive ? "#20A896" : "#DC2626";
  const startColor = isPositive ? "#20A896" : "#DC2626";
  const stopColor = isPositive ? "#E2ECFF" : "#FEECEB";

  const chartData = (data || []).map((d) => ({
    timeStr: new Date(d.time * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    price: d.close,
    volume: d.volume,
    high: d.high,
    low: d.low,
    open: d.open,
  }));

  const minPrice = data.length > 0 ? Math.min(...data.map((d) => d.low)) * 0.998 : 0;
  const maxPrice = data.length > 0 ? Math.max(...data.map((d) => d.high)) * 1.002 : 1000;

  return (
    <div className="fintech-card p-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#DCE6F5] gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-[#24344D] tracking-tight">{symbol}</h2>
            <span className="text-xs text-[#718096]">• {name}</span>
            <span className="rounded bg-[#E2ECFF] px-1.5 py-0.2 text-[9px] font-semibold text-[#3563A6] border border-[#C4D9FF]">
              SIMULATED INR
            </span>
          </div>

          <div className="mt-1 flex items-baseline space-x-2.5">
            <span className="text-xl font-bold font-mono text-[#24344D]">
              {formatINR(currentPrice)}
            </span>
            <span
              className={`text-xs font-semibold ${
                isPositive ? "text-[#20A896]" : "text-[#DC2626]"
              }`}
            >
              {isPositive ? `+${formatINR(change24h)}` : `-${formatINR(Math.abs(change24h))}`} (
              {isPositive ? `+${change24hPercent.toFixed(2)}%` : `${change24hPercent.toFixed(2)}%`})
            </span>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setChartType("price")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              chartType === "price"
                ? "bg-[#3563A6] text-white shadow-2xs font-semibold"
                : "bg-[#F0F4FA] text-[#718096] hover:text-[#24344D] hover:bg-[#E2ECFF]"
            }`}
          >
            Price Trend
          </button>
          <button
            onClick={() => setChartType("volume")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              chartType === "volume"
                ? "bg-[#3563A6] text-white shadow-2xs font-semibold"
                : "bg-[#F0F4FA] text-[#718096] hover:text-[#24344D] hover:bg-[#E2ECFF]"
            }`}
          >
            Volume Histogram
          </button>
        </div>
      </div>

      {/* Subtle blue-tinted chart canvas background */}
      <div className="mt-3 h-56 sm:h-64 w-full bg-gradient-to-b from-[#FBFDFF] to-[#F2F6FC] rounded-lg p-2 border border-[#E4EDF8]">
        {chartType === "price" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={startColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={stopColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E3ECF7" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="timeStr" stroke="#8A9BB2" fontSize={10} tickLine={false} />
              <YAxis
                domain={[minPrice, maxPrice]}
                stroke="#8A9BB2"
                fontSize={10}
                tickLine={false}
                orientation="right"
                tickFormatter={(v) => `₹${Math.round(v).toLocaleString("en-IN")}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#DCE6F5",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#24344D",
                  boxShadow: "0 4px 12px rgba(53,99,166,0.08)",
                }}
                formatter={(val: any) => [formatINR(Number(val)), "Simulated Price"]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={strokeColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${symbol})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#E3ECF7" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="timeStr" stroke="#8A9BB2" fontSize={10} tickLine={false} />
              <YAxis stroke="#8A9BB2" fontSize={10} tickLine={false} orientation="right" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#DCE6F5",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#24344D",
                  boxShadow: "0 4px 12px rgba(53,99,166,0.08)",
                }}
              />
              <Bar dataKey="volume" fill="#20A896" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
