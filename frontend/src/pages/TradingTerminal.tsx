import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  ArrowDownUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Coins,
  RefreshCw,
} from "lucide-react";
import { Modal } from "../components/Modal";
import { TradingChart } from "../components/TradingChart";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { MarketInstrument, Order, Trade } from "../types";
import { formatINR, formatNumberIN } from "../utils/formatters";

export const TradingTerminal: React.FC<{ initialSymbol?: string }> = ({
  initialSymbol = "AAPL",
}) => {
  const { currentUser, portfolio, refreshProfile } = useAuth();
  const [markets, setMarkets] = useState<MarketInstrument[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"LIMIT" | "MARKET">("LIMIT");
  const [quantity, setQuantity] = useState("10");
  const [price, setPrice] = useState("1785.00");
  const [orders, setOrders] = useState<Order[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTerminalData = async () => {
    try {
      const [mktData, orderData, tradeData] = await Promise.all([
        api.getMarkets(),
        api.getOrders(),
        api.getTrades(),
      ]);
      setMarkets(mktData);
      setOrders(orderData);
      setTrades(tradeData.slice(0, 10));

      const curr = mktData.find((m) => m.symbol === selectedSymbol);
      if (curr && orderType === "MARKET") {
        setPrice(curr.currentPrice.toFixed(2));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTerminalData();
    const interval = setInterval(fetchTerminalData, 3000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const activeMarket = markets.find((m) => m.symbol === selectedSymbol) || markets[0];

  useEffect(() => {
    if (activeMarket) {
      setPrice(activeMarket.currentPrice.toFixed(2));
    }
  }, [selectedSymbol]);

  const numQty = parseFloat(quantity) || 0;
  const numPrice = orderType === "MARKET" ? activeMarket?.currentPrice || 0 : parseFloat(price) || 0;
  const estimatedTotal = +(numQty * numPrice).toFixed(2);

  const availableCash = portfolio?.cashBalance || 0;
  const availableShares = portfolio?.holdings?.[selectedSymbol] || 0;

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (numQty <= 0) {
      setErrorMsg("Quantity must be greater than zero");
      return;
    }
    if (orderType === "LIMIT" && numPrice <= 0) {
      setErrorMsg("Limit price must be greater than zero");
      return;
    }

    if (side === "BUY" && estimatedTotal > availableCash) {
      setErrorMsg(
        `Insufficient simulated cash. Required: ${formatINR(estimatedTotal)}, Available: ${formatINR(availableCash)}`
      );
      return;
    }
    if (side === "SELL" && numQty > availableShares) {
      setErrorMsg(`Insufficient shares of ${selectedSymbol}. Required: ${numQty}, Available: ${availableShares}`);
      return;
    }

    setConfirmModalOpen(true);
  };

  const handleExecuteOrder = async () => {
    setLoading(true);
    setConfirmModalOpen(false);
    try {
      const res = await api.placeOrder({
        symbol: selectedSymbol,
        side,
        orderType,
        price: numPrice,
        quantity: numQty,
      });

      if (res.matchedTradesCount > 0) {
        setSuccessMsg(`Order Matched & Settled! ${res.matchedTradesCount} trade(s) executed atomically.`);
      } else {
        setSuccessMsg(`Limit order placed into OrderBook! Standing for matching counter-order.`);
      }

      await fetchTerminalData();
      await refreshProfile();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || err.message || "Order submission failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await api.cancelOrder(orderId);
      setSuccessMsg("Order cancelled successfully");
      await fetchTerminalData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || err.message || "Failed cancelling order");
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24344D]">
              Trading Terminal
            </h1>
            <span className="rounded bg-[#E2ECFF] px-2 py-0.5 text-[10px] font-semibold text-[#3563A6] border border-[#C4D9FF]">
              Atomic DvP OrderBook (₹)
            </span>
          </div>
          <p className="text-xs text-[#718096] mt-0.5">
            Submit buy and sell orders with guaranteed Delivery-versus-Payment execution denominated in ₹ INR.
          </p>
        </div>

        {/* Symbol Selector Pills */}
        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-lg border border-[#DCE6F5] shadow-2xs">
          {markets.map((m) => (
            <button
              key={m.symbol}
              onClick={() => setSelectedSymbol(m.symbol)}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                selectedSymbol === m.symbol
                  ? "bg-[#3563A6] text-white shadow-2xs"
                  : "text-[#718096] hover:text-[#24344D]"
              }`}
            >
              {m.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Notices */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-lg border border-[#A6E8D9] bg-[#DDF5EF] p-2.5 text-xs text-[#0E7366]">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-[#0E7366] hover:text-black">
            &times;
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center justify-between rounded-lg border border-[#FCC8C5] bg-[#FEECEB] p-2.5 text-xs text-[#B91C1C]">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-[#B91C1C] hover:text-black">
            &times;
          </button>
        </div>
      )}

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Chart */}
        <div className="lg:col-span-8">
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
        </div>

        {/* Right Column: Order Entry Form */}
        <div className="lg:col-span-4 fintech-card p-4">
          <form onSubmit={handleOpenConfirm} className="space-y-3.5">
            {/* Buy / Sell Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[#F0F4FA] border border-[#DCE6F5]">
              <button
                type="button"
                onClick={() => setSide("BUY")}
                className={`rounded-md py-1.5 text-xs font-bold transition ${
                  side === "BUY"
                    ? "bg-[#20A896] text-white shadow-2xs"
                    : "text-[#718096] hover:text-[#24344D]"
                }`}
              >
                Buy {selectedSymbol}
              </button>
              <button
                type="button"
                onClick={() => setSide("SELL")}
                className={`rounded-md py-1.5 text-xs font-bold transition ${
                  side === "SELL"
                    ? "bg-[#DC2626] text-white shadow-2xs"
                    : "text-[#718096] hover:text-[#24344D]"
                }`}
              >
                Sell {selectedSymbol}
              </button>
            </div>

            {/* Order Type: Market / Limit */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#718096] font-medium">Order Type</span>
              <div className="flex space-x-1.5">
                <button
                  type="button"
                  onClick={() => setOrderType("LIMIT")}
                  className={`rounded px-2.5 py-1 text-xs font-semibold ${
                    orderType === "LIMIT"
                      ? "bg-[#E2ECFF] text-[#244C85] border border-[#C4D9FF]"
                      : "text-[#718096] hover:text-[#24344D]"
                  }`}
                >
                  Limit
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("MARKET")}
                  className={`rounded px-2.5 py-1 text-xs font-semibold ${
                    orderType === "MARKET"
                      ? "bg-[#E2ECFF] text-[#244C85] border border-[#C4D9FF]"
                      : "text-[#718096] hover:text-[#24344D]"
                  }`}
                >
                  Market
                </button>
              </div>
            </div>

            {/* Price Input in INR */}
            <div>
              <label className="block text-[11px] font-semibold text-[#24344D]">
                {orderType === "MARKET" ? "Market Execution Price (₹)" : "Limit Price (₹ INR)"}
              </label>
              <div className="mt-1 relative rounded-lg">
                <span className="absolute left-2.5 top-2 text-xs font-bold text-[#718096]">₹</span>
                <input
                  type="number"
                  step="0.05"
                  disabled={orderType === "MARKET"}
                  value={orderType === "MARKET" ? activeMarket?.currentPrice.toFixed(2) : price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-lg border border-[#DCE6F5] bg-white pl-7 pr-3 py-1.5 text-xs text-[#24344D] font-mono focus:border-[#3563A6] focus:outline-none disabled:bg-[#F0F4FA] disabled:text-[#718096]"
                />
              </div>
            </div>

            {/* Quantity Input */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-[#24344D]">
                <span>Quantity</span>
                <span className="text-[#718096] font-normal">
                  {side === "BUY"
                    ? `Max: ${Math.floor(availableCash / Math.max(numPrice, 1))} sh`
                    : `Available: ${availableShares} sh`}
                </span>
              </div>
              <div className="mt-1 relative rounded-lg">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-lg border border-[#DCE6F5] bg-white px-3 py-1.5 text-xs text-[#24344D] font-mono focus:border-[#3563A6] focus:outline-none"
                />
              </div>
            </div>

            {/* Summary Box */}
            <div className="rounded-lg border border-[#DCE6F5] bg-[#F0F4FA] p-2.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#718096]">
                <span>Estimated Value:</span>
                <span className="font-mono text-[#24344D] font-bold">{formatINR(estimatedTotal)}</span>
              </div>
              <div className="flex justify-between text-[#718096]">
                <span>Available Cash:</span>
                <span className="font-mono text-[#20A896] font-semibold">{formatINR(availableCash)}</span>
              </div>
              <div className="flex justify-between text-[#718096]">
                <span>Settlement Protocol:</span>
                <span className="text-[#3563A6] font-medium text-[11px]">Atomic On-Chain DvP</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg py-2.5 text-xs font-bold text-white shadow-2xs transition disabled:opacity-50 ${
                side === "BUY"
                  ? "bg-[#20A896] hover:bg-[#1A8778]"
                  : "bg-[#DC2626] hover:bg-[#B91C1C]"
              }`}
            >
              {loading ? "Transacting..." : `${side} ${selectedSymbol} (${orderType})`}
            </button>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Simulated Order"
      >
        <div className="space-y-3.5 text-xs text-[#24344D]">
          <p className="text-[#718096]">
            Please verify your simulated order specifications before submitting to the smart contract:
          </p>

          <div className="rounded-lg border border-[#DCE6F5] bg-[#F0F4FA] p-3 space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-[#718096] font-sans">Instrument:</span>
              <span className="font-bold text-[#3563A6]">{selectedSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#718096] font-sans">Side:</span>
              <span className={side === "BUY" ? "text-[#20A896] font-bold" : "text-[#DC2626] font-bold"}>
                {side}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#718096] font-sans">Order Type:</span>
              <span className="text-[#24344D]">{orderType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#718096] font-sans">Quantity:</span>
              <span className="text-[#24344D]">{numQty} shares</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#718096] font-sans">Execution Price:</span>
              <span className="text-[#24344D]">{formatINR(numPrice)}</span>
            </div>
            <div className="pt-2 border-t border-[#DCE6F5] flex justify-between text-xs">
              <span className="text-[#24344D] font-sans font-semibold">Total Value:</span>
              <span className="text-[#20A896] font-bold">{formatINR(estimatedTotal)}</span>
            </div>
          </div>

          <div className="flex space-x-2 pt-1">
            <button
              onClick={() => setConfirmModalOpen(false)}
              className="w-1/2 rounded-lg border border-[#DCE6F5] bg-white py-2 text-[#718096] hover:bg-[#F0F4FA] transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteOrder}
              className={`w-1/2 rounded-lg py-2 text-white font-bold transition shadow-2xs ${
                side === "BUY" ? "bg-[#20A896] hover:bg-[#1A8778]" : "bg-[#DC2626] hover:bg-[#B91C1C]"
              }`}
            >
              Confirm &amp; Settle
            </button>
          </div>
        </div>
      </Modal>

      {/* Orders & Execution Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Open Orders Table */}
        <div className="fintech-card p-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#DCE6F5]">
            <h3 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">Active Orders</h3>
            <span className="text-[11px] text-[#718096] font-mono">
              {orders.filter((o) => o.status === "OPEN" || o.status === "PARTIALLY_FILLED").length} open
            </span>
          </div>

          <div className="mt-2.5 overflow-x-auto max-h-60">
            <table className="w-full text-left text-xs text-[#24344D]">
              <thead className="bg-[#F0F4FA] text-[10px] uppercase tracking-wider text-[#718096] font-semibold border-b border-[#DCE6F5]">
                <tr>
                  <th className="py-2 px-2.5">Symbol</th>
                  <th className="py-2 px-2.5">Side</th>
                  <th className="py-2 px-2.5">Price</th>
                  <th className="py-2 px-2.5">Filled</th>
                  <th className="py-2 px-2.5">Status</th>
                  <th className="py-2 px-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F5] font-mono text-xs">
                {orders
                  .filter((o) => o.status === "OPEN" || o.status === "PARTIALLY_FILLED")
                  .map((o) => (
                    <tr key={o.id} className="table-row-hover">
                      <td className="py-2 px-2.5 font-bold text-[#24344D]">{o.symbol}</td>
                      <td className={`py-2 px-2.5 font-semibold ${o.side === "BUY" ? "text-[#20A896]" : "text-[#DC2626]"}`}>
                        {o.side}
                      </td>
                      <td className="py-2 px-2.5">{formatINR(o.price)}</td>
                      <td className="py-2 px-2.5 text-[#718096]">
                        {o.filledQty}/{o.quantity}
                      </td>
                      <td className="py-2 px-2.5 font-sans">
                        <span className="badge-blue">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-right">
                        <button
                          onClick={() => handleCancelOrder(o.id)}
                          className="text-[11px] font-sans font-medium text-[#DC2626] hover:underline"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Execution Tape Table */}
        <div className="fintech-card p-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#DCE6F5]">
            <h3 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">Execution Tape</h3>
            <span className="text-[11px] text-[#718096] font-mono">{trades.length} trades</span>
          </div>

          <div className="mt-2.5 overflow-x-auto max-h-60">
            <table className="w-full text-left text-xs text-[#24344D]">
              <thead className="bg-[#F0F4FA] text-[10px] uppercase tracking-wider text-[#718096] font-semibold border-b border-[#DCE6F5]">
                <tr>
                  <th className="py-2 px-2.5">Trade ID</th>
                  <th className="py-2 px-2.5">Symbol</th>
                  <th className="py-2 px-2.5">Price</th>
                  <th className="py-2 px-2.5">Qty</th>
                  <th className="py-2 px-2.5">Total Value</th>
                  <th className="py-2 px-2.5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F5] font-mono text-xs">
                {trades.map((t) => (
                  <tr key={t.id} className="table-row-hover">
                    <td className="py-2 px-2.5 text-[#24344D]">{t.id}</td>
                    <td className="py-2 px-2.5 font-bold text-[#3563A6]">{t.symbol}</td>
                    <td className="py-2 px-2.5 text-[#24344D]">{formatINR(t.price)}</td>
                    <td className="py-2 px-2.5 text-[#718096]">{t.quantity}</td>
                    <td className="py-2 px-2.5 text-[#20A896] font-semibold">{formatINR(t.totalCost)}</td>
                    <td className="py-2 px-2.5 font-sans text-[#718096] text-[11px]">
                      {new Date(t.timestamp * 1000).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
