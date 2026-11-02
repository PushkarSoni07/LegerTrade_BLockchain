import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  Search,
  Download,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Binary,
  Layers,
  Wrench,
} from "lucide-react";
import { Modal } from "../components/Modal";
import { api } from "../services/api";
import { AuditRecordModel } from "../types";
import { formatINR } from "../utils/formatters";

export const AuditConsole: React.FC = () => {
  const [records, setRecords] = useState<AuditRecordModel[]>([]);
  const [searchSymbol, setSearchSymbol] = useState("");
  const [searchTradeId, setSearchTradeId] = useState("");
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [chainStatus, setChainStatus] = useState<any | null>(null);
  const [merkleData, setMerkleData] = useState<any | null>(null);
  const [isMerkleModalOpen, setIsMerkleModalOpen] = useState(false);
  const [tamperSuccessMsg, setTamperSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      const res = await api.getAuditRecords({
        symbol: searchSymbol || undefined,
        tradeId: searchTradeId || undefined,
      });
      setRecords(res.records);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [searchSymbol, searchTradeId]);

  const handleVerifyRecord = async (recordId: number) => {
    try {
      setLoading(true);
      const res = await api.verifyRecord(recordId);
      setVerificationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyChain = async () => {
    try {
      setLoading(true);
      const res = await api.verifyChain();
      setChainStatus(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowMerkle = async () => {
    try {
      const res = await api.getMerkleRoot();
      setMerkleData(res);
      setIsMerkleModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTamperRecord = async (recordId: number) => {
    try {
      setLoading(true);
      await api.simulateTamper(recordId, 9999.0, 500);
      setTamperSuccessMsg(`Academic Demo: Record #${recordId} has been deliberately altered! Run verification to observe detection.`);
      await fetchRecords();
      const res = await api.verifyRecord(recordId);
      setVerificationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreRecord = async (recordId: number) => {
    try {
      setLoading(true);
      await api.restoreRecord(recordId);
      setTamperSuccessMsg(`Record #${recordId} has been restored to authentic state.`);
      await fetchRecords();
      const res = await api.verifyRecord(recordId);
      setVerificationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24344D]">
              Cryptographic Audit Console
            </h1>
            <span className="rounded bg-[#DDF5EF] px-2 py-0.5 text-[10px] font-semibold text-[#0E7366] border border-[#A4E8DA]">
              Tamper-Evident Ledger
            </span>
          </div>
          <p className="text-xs text-[#718096] mt-0.5">
            Recompute canonical keccak256 trade hashes, verify cryptographic chaining, and test tamper detection.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleVerifyChain}
            className="flex items-center space-x-1.5 rounded-lg border border-[#A6E8D9] bg-[#DDF5EF] px-3 py-1.5 text-xs font-semibold text-[#0E7366] hover:bg-[#C9F0E5] transition shadow-2xs"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#20A896]" />
            <span>Verify Full Chain</span>
          </button>

          <button
            onClick={handleShowMerkle}
            className="flex items-center space-x-1.5 rounded-lg border border-[#C4D9FF] bg-[#E2ECFF] px-3 py-1.5 text-xs font-semibold text-[#244C85] hover:bg-[#D4E4FF] transition shadow-2xs"
          >
            <Layers className="h-3.5 w-3.5 text-[#3563A6]" />
            <span>Merkle Checkpoint</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {tamperSuccessMsg && (
        <div className="flex items-center justify-between rounded-lg border border-[#FCDAA0] bg-[#FFF2D9] p-3 text-xs text-[#9A6513] shadow-2xs">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-[#D99A35]" />
            <span>{tamperSuccessMsg}</span>
          </div>
          <button onClick={() => setTamperSuccessMsg(null)} className="text-[#9A6513] font-bold hover:underline">
            &times;
          </button>
        </div>
      )}

      {/* Chain Status Result Banner */}
      {chainStatus && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-lg p-3 text-xs border ${
            chainStatus.isIntact
              ? "border-[#A6E8D9] bg-[#DDF5EF] text-[#0E7366]"
              : "border-[#FCC8C5] bg-[#FEECEB] text-[#B91C1C]"
          }`}
        >
          <div className="flex items-center space-x-2">
            {chainStatus.isIntact ? (
              <CheckCircle2 className="h-4 w-4 text-[#20A896]" />
            ) : (
              <XCircle className="h-4 w-4 text-[#DC2626]" />
            )}
            <span className="font-bold">
              {chainStatus.isIntact
                ? `Cryptographic Audit Chain Intact: Verified all ${chainStatus.recordsChecked} records sequentially.`
                : `CHAIN INTEGRITY FAILURE: Broken sequence at record #${chainStatus.brokenAtRecordId}!`}
            </span>
          </div>
          {chainStatus.reason && <p className="mt-1 font-mono text-[11px] sm:mt-0">{chainStatus.reason}</p>}
        </div>
      )}

      {/* Verification Inspector Box (When a specific record is verified) */}
      {verificationResult && (
        <div
          className={`fintech-card p-4 text-xs ${
            verificationResult.localVerification.isValid && !verificationResult.isTampered
              ? "border-[#A6E8D9] bg-gradient-to-r from-white to-[#F2FAF7]"
              : "border-[#FCC8C5] bg-gradient-to-r from-white to-[#FFF5F5]"
          }`}
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-[#DCE6F5]">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs text-[#24344D]">
                Record #{verificationResult.recordId} Hash Verification
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[9px] font-bold ${
                  verificationResult.localVerification.isValid && !verificationResult.isTampered
                    ? "bg-[#DDF5EF] text-[#0E7366] border border-[#A4E8DA]"
                    : "bg-[#FEECEB] text-[#B91C1C] border border-[#FCC8C5]"
                }`}
              >
                {verificationResult.localVerification.isValid && !verificationResult.isTampered
                  ? "HASH MATCH - INTEGRITY INTACT"
                  : "TAMPER DETECTED - HASH MISMATCH"}
              </span>
            </div>
            <button
              onClick={() => setVerificationResult(null)}
              className="text-[#718096] hover:text-[#24344D]"
            >
              &times;
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
            <div>
              <div className="text-[#718096] font-sans text-[11px]">Stored Canonical Hash:</div>
              <div className="mt-1 p-2 rounded bg-[#F0F4FA] border border-[#DCE6F5] text-[#3563A6] break-all font-semibold">
                {verificationResult.localVerification.storedHash}
              </div>
            </div>

            <div>
              <div className="text-[#718096] font-sans text-[11px]">Recomputed keccak256 Hash:</div>
              <div
                className={`mt-1 p-2 rounded border break-all font-semibold ${
                  verificationResult.localVerification.isValid && !verificationResult.isTampered
                    ? "bg-[#DDF5EF] border-[#A6E8D9] text-[#0E7366]"
                    : "bg-[#FEECEB] border-[#FCC8C5] text-[#B91C1C]"
                }`}
              >
                {verificationResult.localVerification.recomputedHash}
              </div>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[#DCE6F5] font-sans text-xs">
            <span className="text-[#718096]">
              On-chain confirmation:{" "}
              <strong className="text-[#24344D]">
                {verificationResult.onChainVerification?.confirmedOnChain ? "Yes (Matches Hardhat Contract)" : "Simulated Local"}
              </strong>
            </span>

            {verificationResult.isTampered && (
              <button
                onClick={() => handleRestoreRecord(verificationResult.recordId)}
                className="rounded bg-[#DDF5EF] px-2.5 py-1 text-xs font-semibold text-[#0E7366] border border-[#A6E8D9] hover:bg-[#C9F0E5] transition"
              >
                Restore Authentic Record
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-[#DCE6F5] bg-white p-3 text-xs shadow-2xs">
        <div className="flex items-center space-x-1.5 text-[#718096]">
          <Search className="h-3.5 w-3.5 text-[#3563A6]" />
          <span className="font-semibold uppercase tracking-wider text-[10px]">Filter Audit Logs:</span>
        </div>

        <input
          type="text"
          placeholder="Filter by Symbol (e.g. AAPL)..."
          value={searchSymbol}
          onChange={(e) => setSearchSymbol(e.target.value)}
          className="rounded-md border border-[#DCE6F5] bg-white px-2.5 py-1 text-xs text-[#24344D] placeholder-[#718096] focus:outline-none focus:border-[#3563A6]"
        />

        <input
          type="text"
          placeholder="Filter by Trade ID..."
          value={searchTradeId}
          onChange={(e) => setSearchTradeId(e.target.value)}
          className="rounded-md border border-[#DCE6F5] bg-white px-2.5 py-1 text-xs text-[#24344D] placeholder-[#718096] focus:outline-none focus:border-[#3563A6]"
        />

        <button
          onClick={fetchRecords}
          className="rounded-md border border-[#DCE6F5] bg-[#F0F4FA] px-2.5 py-1 text-xs font-medium text-[#24344D] hover:bg-[#E2ECFF] transition flex items-center space-x-1"
        >
          <RefreshCw className="h-3 w-3 text-[#3563A6]" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Records Table */}
      <div className="fintech-card overflow-hidden">
        <div className="p-3.5 border-b border-[#DCE6F5] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">Sequential Audit Trail</h3>
            <p className="text-[11px] text-[#718096]">
              Each record cryptographically encapsulates its predecessor's hash, forming an immutable sequence.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#718096] bg-[#F0F4FA] px-2 py-0.5 rounded border border-[#DCE6F5]">
            {records.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#24344D]">
            <thead className="bg-[#F0F4FA] text-[10px] uppercase tracking-wider text-[#718096] font-semibold border-b border-[#DCE6F5]">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Trade ID</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Price (₹)</th>
                <th className="py-2.5 px-3">Qty</th>
                <th className="py-2.5 px-3">Previous Hash</th>
                <th className="py-2.5 px-3">Canonical Hash</th>
                <th className="py-2.5 px-3">Integrity</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBF1FA] font-mono text-xs">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-[#718096] font-sans">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const isTampered = !!r.isTampered;
                  return (
                    <tr
                      key={r.recordId}
                      className={`transition ${isTampered ? "bg-[#FFF5F5]" : "table-row-hover"}`}
                    >
                      <td className="py-2.5 px-3 text-[#3563A6] font-bold">#{r.recordId}</td>
                      <td className="py-2.5 px-3 text-[#24344D]">{r.tradeId}</td>
                      <td className="py-2.5 px-3 font-sans font-bold text-[#3563A6]">{r.symbol}</td>
                      <td className="py-2.5 px-3 text-[#24344D]">{formatINR(r.price)}</td>
                      <td className="py-2.5 px-3 text-[#718096]">{r.quantity} sh</td>
                      <td className="py-2.5 px-3 text-[#718096] text-[10px]">
                        {r.previousHash.substring(0, 10)}...
                      </td>
                      <td className="py-2.5 px-3 text-[#20A896] text-[10px]">
                        {r.canonicalHash.substring(0, 10)}...
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                            isTampered
                              ? "bg-[#FEECEB] text-[#B91C1C] border border-[#FCC8C5]"
                              : "bg-[#DDF5EF] text-[#0E7366] border border-[#A4E8DA]"
                          }`}
                        >
                          {isTampered ? "TAMPERED" : "VERIFIED"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1.5 font-sans">
                        <button
                          onClick={() => handleVerifyRecord(r.recordId)}
                          className="rounded bg-[#E2ECFF] border border-[#C4D9FF] px-2 py-0.5 text-[11px] font-semibold text-[#244C85] hover:bg-[#D4E4FF] transition"
                        >
                          Verify Hash
                        </button>
                        {!isTampered ? (
                          <button
                            onClick={() => handleTamperRecord(r.recordId)}
                            className="rounded bg-[#FEECEB] border border-[#FCC8C5] px-2 py-0.5 text-[11px] font-semibold text-[#B91C1C] hover:bg-[#FDD8D5] transition"
                            title="Deliberately alter record to demonstrate tamper detection"
                          >
                            Simulate Tamper
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestoreRecord(r.recordId)}
                            className="rounded bg-[#DDF5EF] border border-[#A6E8D9] px-2 py-0.5 text-[11px] font-semibold text-[#0E7366] hover:bg-[#C9F0E5] transition"
                          >
                            Restore
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Merkle Root Checkpoint Modal */}
      {merkleData && (
        <Modal
          isOpen={isMerkleModalOpen}
          onClose={() => setIsMerkleModalOpen(false)}
          title="Merkle Root Audit Checkpoint"
        >
          <div className="space-y-3.5 text-xs font-mono text-[#24344D]">
            <p className="text-[#718096] font-sans">
              Batched trades can be anchored into the on-chain AuditLog contract as a single 32-byte Merkle root:
            </p>

            <div>
              <div className="text-[#718096] font-sans text-[11px]">Computed Merkle Root:</div>
              <div className="p-2.5 mt-1 rounded-lg bg-[#F0F4FA] border border-[#DCE6F5] text-[#3563A6] break-all font-bold">
                {merkleData.merkleRoot}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-sans">
              <div className="p-2.5 rounded-lg bg-[#F0F4FA] border border-[#DCE6F5]">
                <div className="text-[#718096] text-[11px]">Batched Records</div>
                <div className="mt-1 text-sm font-bold text-[#24344D] font-mono">
                  {merkleData.leavesCount} trades
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F0F4FA] border border-[#DCE6F5]">
                <div className="text-[#718096] text-[11px]">Verification Standard</div>
                <div className="mt-1 text-xs font-semibold text-[#20A896]">
                  OpenZeppelin MerkleProof
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsMerkleModalOpen(false)}
              className="w-full rounded-lg bg-[#3563A6] py-2 font-sans font-semibold text-white hover:bg-[#254670] transition shadow-2xs"
            >
              Close Checkpoint
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
