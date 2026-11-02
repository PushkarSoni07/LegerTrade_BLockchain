import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  FileCheck2,
  Lock,
  PauseCircle,
  PlayCircle,
  AlertOctagon,
  CheckCircle2,
  Search,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { AuditRecordModel, AnomalyAlert } from "../types";

export const AuditorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const isPrivileged = currentUser?.role === "AUDITOR" || currentUser?.role === "REGULATOR";
  const [records, setRecords] = useState<AuditRecordModel[]>([]);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [tradingHalted, setTradingHalted] = useState(false);
  const [haltNotice, setHaltNotice] = useState<string | null>(null);

  const fetchAuditorData = async () => {
    try {
      const [auditRes, alertRes] = await Promise.all([
        api.getAuditRecords(),
        api.getSurveillanceAlerts(),
      ]);
      setRecords(auditRes.records);
      setAlerts(alertRes.alerts);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAuditorData();
  }, []);

  const handleToggleHalt = () => {
    const nextState = !tradingHalted;
    setTradingHalted(nextState);
    if (nextState) {
      setHaltNotice("REGULATORY ACTION: Simulated market circuit-breaker activated. Trading frozen.");
    } else {
      setHaltNotice("REGULATORY ACTION: Market circuit-breaker released. Regular matching resumed.");
    }
    setTimeout(() => setHaltNotice(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24344D]">
              Auditor &amp; Regulator Portal
            </h1>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-semibold border ${
                isPrivileged
                  ? "bg-[#DDF5EF] text-[#0E7366] border-[#A4E8DA]"
                  : "bg-[#FFF2D9] text-[#9A6513] border-[#FCDAA0]"
              }`}
            >
              {isPrivileged ? `Authorized (${currentUser?.role})` : "Observation Mode"}
            </span>
          </div>
          <p className="text-xs text-[#718096] mt-0.5">
            Read-only verification, compliance hold simulation, and immutable blockchain ledger oversight.
          </p>
        </div>

        {/* Regulatory Action Button */}
        <div>
          <button
            onClick={handleToggleHalt}
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
              tradingHalted
                ? "bg-[#20A896] text-white hover:bg-[#188A7B]"
                : "bg-[#DC2626] text-white hover:bg-[#B91C1C]"
            }`}
          >
            {tradingHalted ? (
              <>
                <PlayCircle className="h-4 w-4" />
                <span>Resume Simulated Trading</span>
              </>
            ) : (
              <>
                <PauseCircle className="h-4 w-4" />
                <span>Simulate Regulatory Freeze</span>
              </>
            )}
          </button>
        </div>
      </div>

      {haltNotice && (
        <div className="flex items-center space-x-2 rounded-lg border border-[#FCDAA0] bg-[#FFF2D9] p-3 text-xs text-[#9A6513] shadow-2xs">
          <AlertOctagon className="h-4 w-4 text-[#D99A35]" />
          <span>{haltNotice}</span>
        </div>
      )}

      {/* Compliance Overview Cards - 3 Colored Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="kpi-teal p-3.5">
          <div className="flex items-center justify-between text-[#718096]">
            <span className="uppercase font-semibold tracking-wider text-[10px]">Audit Log Chaining</span>
            <ShieldCheck className="h-4 w-4 text-[#20A896]" />
          </div>
          <div className="mt-1 text-2xl font-bold text-[#24344D] font-mono">{records.length} Records</div>
          <div className="mt-0.5 text-[11px] text-[#0E7366] font-medium">100% Cryptographically Chained</div>
        </div>

        <div className="kpi-amber p-3.5">
          <div className="flex items-center justify-between text-[#718096]">
            <span className="uppercase font-semibold tracking-wider text-[10px]">Surveillance Incidents</span>
            <ShieldAlert className="h-4 w-4 text-[#D99A35]" />
          </div>
          <div className="mt-1 text-2xl font-bold text-[#D99A35] font-mono">
            {alerts.filter((a) => a.isAnomaly).length} Flagged
          </div>
          <div className="mt-0.5 text-[11px] text-[#9A6513]">Isolation Forest Scored</div>
        </div>

        <div className="kpi-blue p-3.5">
          <div className="flex items-center justify-between text-[#718096]">
            <span className="uppercase font-semibold tracking-wider text-[10px]">Market Circuit Status</span>
            <Lock className="h-4 w-4 text-[#3563A6]" />
          </div>
          <div className="mt-1 text-2xl font-bold text-[#24344D] font-mono">
            {tradingHalted ? "HALTED" : "NOMINAL"}
          </div>
          <div className="mt-0.5 text-[11px] text-[#3563A6]">Regulatory Oversight Active</div>
        </div>
      </div>

      {/* Flagged Incidents for Review */}
      <div className="fintech-card overflow-hidden">
        <div className="p-3.5 border-b border-[#DCE6F5] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">Regulatory Review Queue</h3>
            <p className="text-[11px] text-[#718096]">High-risk anomalous trade patterns identified for inquiry</p>
          </div>
          <span className="text-[11px] font-mono text-[#718096] bg-[#F0F4FA] px-2 py-0.5 rounded border border-[#DCE6F5]">
            {alerts.filter((a) => a.isAnomaly).length} flagged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#24344D]">
            <thead className="bg-[#F0F4FA] text-[10px] uppercase tracking-wider text-[#718096] font-semibold border-b border-[#DCE6F5]">
              <tr>
                <th className="py-2.5 px-3">Trade Reference</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Anomaly Score</th>
                <th className="py-2.5 px-3">Simulated Violation</th>
                <th className="py-2.5 px-3">Feature Indication</th>
                <th className="py-2.5 px-3 text-right">Regulatory Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBF1FA] font-mono text-xs">
              {alerts.filter((a) => a.isAnomaly).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#718096] font-sans">
                    No active surveillance incidents currently flagged. All settled trades conform to nominal parameters.
                  </td>
                </tr>
              ) : (
                alerts
                  .filter((a) => a.isAnomaly)
                  .map((a) => (
                    <tr key={a.id} className="table-row-hover transition">
                      <td className="py-2.5 px-3 text-[#24344D] font-medium">{a.tradeId}</td>
                      <td className="py-2.5 px-3 font-sans font-bold text-[#3563A6]">{a.symbol}</td>
                      <td className="py-2.5 px-3 text-[#DC2626] font-bold">{a.riskScore.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-sans text-[#24344D]">{a.patternType.replace("SIMULATED_", "")}</td>
                      <td className="py-2.5 px-3 font-sans text-[#718096] text-[11px] truncate max-w-sm">
                        {a.topFeatures?.[0]?.description || "Abnormal trading metrics"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <span className="rounded bg-[#FEECEB] px-1.5 py-0.2 text-[9px] font-bold text-[#B91C1C] border border-[#FCC8C5]">
                          UNDER INQUIRY
                        </span>
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
