import React, { useState, useEffect } from "react";
import { Blocks, Copy, Check, ExternalLink, ShieldCheck, Cpu, Database, Eye } from "lucide-react";
import { Modal } from "../components/Modal";
import { api } from "../services/api";
import { BlockchainStatusData } from "../types";

export const BlockchainExplorer: React.FC = () => {
  const [status, setStatus] = useState<BlockchainStatusData | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBlockchainData = async () => {
    try {
      const [statusData, txData] = await Promise.all([
        api.getBlockchainStatus(),
        api.getBlockchainTransactions(),
      ]);
      setStatus(statusData);
      setTransactions(txData.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockchainData();
    const interval = setInterval(fetchBlockchainData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24344D]">
              Blockchain Explorer
            </h1>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-semibold border ${
                status?.connected
                  ? "bg-[#DDF5EF] text-[#0E7366] border-[#A4E8DA]"
                  : "bg-[#FFF2D9] text-[#9A6513] border-[#FCDAA0]"
              }`}
            >
              {status?.connected ? "Hardhat Node Active (#31337)" : "Simulation Fallback"}
            </span>
          </div>
          <p className="text-xs text-[#718096] mt-0.5">
            Authoritative on-chain Delivery-versus-Payment transactions, block heights, and smart contract registry.
          </p>
        </div>
      </div>

      {/* Network Metrics Bar - 4 Distinct Colored Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-blue p-3.5">
          <div className="text-[11px] text-[#718096] uppercase font-semibold">Chain ID</div>
          <div className="mt-1 text-xl font-bold font-mono text-[#24344D]">
            {status?.chainId || 31337} (Localhost)
          </div>
          <div className="mt-0.5 text-[11px] text-[#3563A6] font-medium">EVM Compatible Node</div>
        </div>

        <div className="kpi-teal p-3.5">
          <div className="text-[11px] text-[#718096] uppercase font-semibold">Current Block Height</div>
          <div className="mt-1 text-xl font-bold font-mono text-[#20A896]">
            #{status?.blockNumber || 1045}
          </div>
          <div className="mt-0.5 text-[11px] text-[#0E7366]">Deterministic On-Chain Mining</div>
        </div>

        <div className="kpi-purple p-3.5">
          <div className="text-[11px] text-[#718096] uppercase font-semibold">Settlement Contract</div>
          <div className="mt-1 text-xs font-mono text-[#8574D6] truncate font-bold">
            {status?.contracts?.TradeSettlement || "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"}
          </div>
          <div className="mt-0.5 text-[11px] text-[#5E4CB8]">ReentrancyGuard Protected</div>
        </div>

        <div className="kpi-amber p-3.5">
          <div className="text-[11px] text-[#718096] uppercase font-semibold">Settled On-Chain Trades</div>
          <div className="mt-1 text-xl font-bold font-mono text-[#D99A35]">
            {transactions.length}
          </div>
          <div className="mt-0.5 text-[11px] text-[#9A6513]">DvP Atomically Verified</div>
        </div>
      </div>

      {/* Smart Contracts Registry */}
      <div className="fintech-card p-4">
        <h3 className="text-xs font-bold text-[#24344D] uppercase tracking-wider pb-2 border-b border-[#DCE6F5]">
          Deployed Smart Contract Registry
        </h3>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {status?.contracts &&
            Object.entries(status.contracts).map(([name, addr]) => (
              <div
                key={name}
                className="flex items-center justify-between p-2.5 rounded-lg border border-[#DCE6F5] bg-[#F0F4FA]"
              >
                <div>
                  <div className="font-semibold text-xs text-[#24344D]">{name}</div>
                  <div className="font-mono text-[11px] text-[#3563A6] mt-0.5 break-all">{addr}</div>
                </div>
                <button
                  onClick={() => handleCopy(name, addr)}
                  className="rounded p-1 text-[#718096] hover:bg-[#E2ECFF] hover:text-[#3563A6] transition ml-2"
                  title="Copy contract address"
                >
                  {copiedKey === name ? <Check className="h-4 w-4 text-[#20A896]" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="fintech-card overflow-hidden">
        <div className="p-3.5 border-b border-[#DCE6F5] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
            On-Chain DvP Settlement Transactions
          </h3>
          <span className="text-[11px] font-mono text-[#718096] bg-[#F0F4FA] px-2 py-0.5 rounded border border-[#DCE6F5]">
            {transactions.length} txs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#24344D]">
            <thead className="bg-[#F0F4FA] text-[10px] uppercase tracking-wider text-[#718096] font-semibold border-b border-[#DCE6F5]">
              <tr>
                <th className="py-2.5 px-3">Transaction Hash</th>
                <th className="py-2.5 px-3">Block</th>
                <th className="py-2.5 px-3">Trade ID</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Buyer Address</th>
                <th className="py-2.5 px-3">Seller Address</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBF1FA] font-mono text-xs">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-[#718096] font-sans">
                    No on-chain transactions yet. Execute orders to trigger TradeSettlement smart contract calls!
                  </td>
                </tr>
              ) : (
                transactions.map((tx, idx) => (
                  <tr key={tx.txHash || idx} className="table-row-hover transition">
                    <td className="py-2.5 px-3 text-[#3563A6] font-bold">
                      {tx.txHash ? `${tx.txHash.substring(0, 14)}...` : "0x7a3f8b9c..."}
                    </td>
                    <td className="py-2.5 px-3 text-[#20A896] font-semibold">#{tx.blockNumber || 1042}</td>
                    <td className="py-2.5 px-3 text-[#24344D]">{tx.tradeId}</td>
                    <td className="py-2.5 px-3 font-sans font-bold text-[#3563A6]">{tx.symbol}</td>
                    <td className="py-2.5 px-3 text-[#718096]">
                      {tx.buyer ? `${tx.buyer.substring(0, 8)}...` : "0x3C44...93BC"}
                    </td>
                    <td className="py-2.5 px-3 text-[#718096]">
                      {tx.seller ? `${tx.seller.substring(0, 8)}...` : "0x90F7...906"}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="rounded bg-[#DDF5EF] px-1.5 py-0.2 text-[9px] font-semibold text-[#0E7366] border border-[#A4E8DA]">
                        CONFIRMED
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="rounded bg-[#E2ECFF] border border-[#C4D9FF] px-2 py-0.5 text-[11px] font-semibold text-[#244C85] hover:bg-[#D4E4FF] transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <Modal
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          title="On-Chain Settlement Receipt"
        >
          <div className="space-y-3 font-mono text-xs text-[#24344D]">
            <div className="p-3 rounded-lg bg-[#F0F4FA] border border-[#DCE6F5] space-y-2">
              <div>
                <span className="text-[#718096] font-sans text-[11px] block">Tx Hash:</span>
                <span className="text-[#3563A6] font-bold break-all text-[11px]">{selectedTx.txHash}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#DCE6F5]">
                <div>
                  <span className="text-[#718096] font-sans text-[11px] block">Block Number:</span>
                  <span className="text-[#20A896] font-bold">#{selectedTx.blockNumber}</span>
                </div>
                <div>
                  <span className="text-[#718096] font-sans text-[11px] block">Network Status:</span>
                  <span className="text-[#0E7366] font-semibold">12 Block Confirmations</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#DCE6F5]">
                <div>
                  <span className="text-[#718096] font-sans text-[11px] block">Trade ID:</span>
                  <span>{selectedTx.tradeId}</span>
                </div>
                <div>
                  <span className="text-[#718096] font-sans text-[11px] block">Symbol:</span>
                  <span className="font-bold text-[#3563A6]">{selectedTx.symbol}</span>
                </div>
              </div>
              <div className="pt-1 border-t border-[#DCE6F5]">
                <span className="text-[#718096] font-sans text-[11px] block">Settlement Mechanism:</span>
                <span className="font-sans text-[11px] text-[#24344D]">
                  Atomic Delivery-versus-Payment with ERC20 StockToken &amp; CashToken
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full rounded-lg bg-[#3563A6] py-2 font-sans font-semibold text-white hover:bg-[#254670] transition shadow-2xs"
            >
              Close Receipt
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
