import React, { useState, useEffect } from "react";
import { ListOrdered, Filter, RefreshCw, XCircle, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";
import { Order, Trade } from "../types";
import { formatINR } from "../utils/formatters";

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filterSymbol, setFilterSymbol] = useState("ALL");
  const [filterSide, setFilterSide] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const loadData = async () => {
    try {
      const [orderData, tradeData] = await Promise.all([api.getOrders(), api.getTrades()]);
      setOrders(orderData);
      setTrades(tradeData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await api.cancelOrder(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterSymbol !== "ALL" && o.symbol !== filterSymbol) return false;
    if (filterSide !== "ALL" && o.side !== filterSide) return false;
    if (filterStatus !== "ALL" && o.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24344D]">
            Order Management
          </h1>
          <p className="text-xs text-[#718096] mt-0.5">
            Global order book states, open limit orders, cancellation controls, and fill logs in ₹ INR.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center space-x-1.5 rounded-lg border border-[#DCE6F5] bg-white px-2.5 py-1.5 text-xs text-[#24344D] hover:bg-[#F0F4FA] transition shadow-2xs"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[#3563A6]" />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-[#DCE6F5] bg-white p-3 text-xs shadow-2xs">
        <div className="flex items-center space-x-1.5 text-[#718096]">
          <Filter className="h-3.5 w-3.5 text-[#3563A6]" />
          <span className="font-semibold uppercase tracking-wider text-[10px]">Filter:</span>
        </div>

        <select
          value={filterSymbol}
          onChange={(e) => setFilterSymbol(e.target.value)}
          className="rounded-md border border-[#DCE6F5] bg-white px-2.5 py-1 text-xs text-[#24344D] focus:outline-none"
        >
          <option value="ALL">All Symbols</option>
          <option value="AAPL">AAPL</option>
          <option value="TSLA">TSLA</option>
          <option value="MSFT">MSFT</option>
          <option value="GOOGL">GOOGL</option>
        </select>

        <select
          value={filterSide}
          onChange={(e) => setFilterSide(e.target.value)}
          className="rounded-md border border-[#DCE6F5] bg-white px-2.5 py-1 text-xs text-[#24344D] focus:outline-none"
        >
          <option value="ALL">All Sides</option>
          <option value="BUY">BUY Only</option>
          <option value="SELL">SELL Only</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-[#DCE6F5] bg-white px-2.5 py-1 text-xs text-[#24344D] focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="PARTIALLY_FILLED">PARTIALLY FILLED</option>
          <option value="FILLED">FILLED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="fintech-card overflow-hidden">
        <div className="p-3.5 border-b border-[#DCE6F5] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
            Submitted Order Records
          </h3>
          <span className="text-[11px] font-mono text-[#718096]">{filteredOrders.length} orders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#24344D]">
            <thead className="bg-[#F0F4FA] text-[10px] uppercase tracking-wider text-[#718096] font-semibold border-b border-[#DCE6F5]">
              <tr>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Side</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Price (₹)</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Filled</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE6F5] font-mono text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-[#718096] font-sans">
                    No orders match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="table-row-hover transition">
                    <td className="py-2.5 px-3 text-[#24344D] font-medium">{o.id}</td>
                    <td className="py-2.5 px-3 font-sans font-bold text-[#3563A6]">{o.symbol}</td>
                    <td className={`py-2.5 px-3 font-bold ${o.side === "BUY" ? "text-[#20A896]" : "text-[#DC2626]"}`}>
                      {o.side}
                    </td>
                    <td className="py-2.5 px-3 text-[#718096]">{o.orderType}</td>
                    <td className="py-2.5 px-3 text-[#24344D]">{formatINR(o.price)}</td>
                    <td className="py-2.5 px-3 text-[#718096]">{o.quantity} sh</td>
                    <td className="py-2.5 px-3 text-[#718096]">
                      {o.filledQty}/{o.quantity}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-semibold ${
                          o.status === "FILLED"
                            ? "badge-green"
                            : o.status === "OPEN"
                            ? "badge-blue"
                            : o.status === "PARTIALLY_FILLED"
                            ? "badge-amber"
                            : "bg-[#F0F4FA] text-[#718096] border border-[#DCE6F5]"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      {(o.status === "OPEN" || o.status === "PARTIALLY_FILLED") && (
                        <button
                          onClick={() => handleCancel(o.id)}
                          className="rounded bg-[#FEECEB] border border-[#FCC8C5] px-2 py-0.5 text-[11px] font-semibold text-[#DC2626] hover:bg-[#FCD2D0] transition"
                        >
                          Cancel
                        </button>
                      )}
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
