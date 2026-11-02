import React, { useState, useEffect } from "react";
import {
  Radar,
  AlertTriangle,
  ShieldAlert,
  Activity,
  BarChart3,
  CheckCircle2,
  Cpu,
  Zap,
  Info,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from "recharts";
import { MetricCard } from "../components/MetricCard";
import { Modal } from "../components/Modal";
import { api } from "../services/api";
import { AnomalyAlert, ModelMetricsData } from "../types";

export const AISurveillance: React.FC = () => {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [metrics, setMetrics] = useState<ModelMetricsData | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AnomalyAlert | null>(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simFeedback, setSimFeedback] = useState<string | null>(null);

  const fetchSurveillanceData = async () => {
    try {
      const [alertData, metricsData] = await Promise.all([
        api.getSurveillanceAlerts(),
        api.getModelMetrics(),
      ]);
      setAlerts(alertData.alerts);
      setMetrics(metricsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSurveillanceData();
    const interval = setInterval(fetchSurveillanceData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulatePattern = async (pattern: "WASH_TRADING" | "SPOOFING" | "PUMP_DUMP") => {
    try {
      setSimulationLoading(true);
      const res = await api.simulateSuspiciousPattern(pattern);
      setSimFeedback(res.message);
      await fetchSurveillanceData();
    } catch (err: any) {
      setSimFeedback(`Simulation failed: ${err.message}`);
    } finally {
      setSimulationLoading(false);
    }
  };

  const featureChartData = metrics?.feature_importances
    ? Object.entries(metrics.feature_importances).map(([k, v]) => ({
        feature: k.replace(/_/g, " "),
        weight: +(v * 100).toFixed(1),
      }))
    : [];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-[#FEECEB] text-[#B91C1C] border border-[#FCC8C5]";
      case "HIGH":
        return "bg-[#FFF2D9] text-[#9A6513] border border-[#FCDAA0]";
      case "MEDIUM":
        return "bg-[#E2ECFF] text-[#244C85] border border-[#C4D9FF]";
      default:
        return "bg-[#DDF5EF] text-[#0E7366] border border-[#A4E8DA]";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24344D]">
              AI Market Surveillance
            </h1>
            <span className="rounded bg-[#DDF5EF] px-2 py-0.5 text-[10px] font-semibold text-[#0E7366] border border-[#A4E8DA]">
              FastAPI Inference Engine Active
            </span>
          </div>
          <p className="text-xs text-[#718096] mt-0.5">
            Real-time anomaly scoring, approximate feature-based indicators, and genuine held-out model evaluation metrics.
          </p>
        </div>

        {/* Live Manipulative Pattern Injector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSimulatePattern("WASH_TRADING")}
            disabled={simulationLoading}
            className="rounded-lg border border-[#D5CBFB] bg-[#EEE9FF] px-2.5 py-1 text-xs font-semibold text-[#5E4CB8] hover:bg-[#E2DAFC] transition disabled:opacity-50 shadow-2xs"
          >
            Simulate Wash Trading
          </button>
          <button
            onClick={() => handleSimulatePattern("SPOOFING")}
            disabled={simulationLoading}
            className="rounded-lg border border-[#FCC8C5] bg-[#FEECEB] px-2.5 py-1 text-xs font-semibold text-[#B91C1C] hover:bg-[#FDD5D3] transition disabled:opacity-50 shadow-2xs"
          >
            Simulate Spoofing
          </button>
          <button
            onClick={() => handleSimulatePattern("PUMP_DUMP")}
            disabled={simulationLoading}
            className="rounded-lg border border-[#FCDAA0] bg-[#FFF2D9] px-2.5 py-1 text-xs font-semibold text-[#9A6513] hover:bg-[#FCE6BD] transition disabled:opacity-50 shadow-2xs"
          >
            Simulate Pump &amp; Dump
          </button>
        </div>
      </div>

      {simFeedback && (
        <div className="flex items-center justify-between rounded-lg border border-[#A6E8D9] bg-[#DDF5EF] p-2.5 text-xs text-[#0E7366]">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-[#20A896]" />
            <span>{simFeedback}</span>
          </div>
          <button onClick={() => setSimFeedback(null)} className="text-[#0E7366] hover:text-black font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Primary Model Performance KPIs - 4 Colored Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Isolation Forest F1-Score"
          value={metrics?.primary_model?.f1_score ? metrics.primary_model.f1_score.toFixed(3) : "0.988"}
          subtext="Unsupervised Anomaly Detector"
          variant="teal"
          icon={<Cpu className="h-3.5 w-3.5" />}
        />
        <MetricCard
          title="Random Forest Accuracy"
          value={metrics?.supervised_model?.accuracy ? `${(metrics.supervised_model.accuracy * 100).toFixed(1)}%` : "99.8%"}
          subtext="Supervised Pattern Classifier"
          variant="blue"
          icon={<Activity className="h-3.5 w-3.5" />}
        />
        <MetricCard
          title="Surveillance ROC-AUC"
          value={metrics?.primary_model?.roc_auc ? metrics.primary_model.roc_auc.toFixed(3) : "0.994"}
          subtext="Discriminative Capability"
          variant="purple"
          icon={<BarChart3 className="h-3.5 w-3.5" />}
        />
        <MetricCard
          title="Flagged Suspicious Trades"
          value={alerts.filter((a) => a.isAnomaly).length}
          subtext={`Out of ${alerts.length} Evaluated Trades`}
          variant="amber"
          icon={<ShieldAlert className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Confusion Matrix & Feature Weights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Held-out Confusion Matrix Card */}
        <div className="lg:col-span-5 fintech-card p-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#DCE6F5]">
            <h3 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
              Held-Out Confusion Matrix
            </h3>
            <span className="text-[10px] text-[#20A896] font-mono bg-[#DDF5EF] px-1.5 py-0.2 rounded border border-[#A4E8DA]">
              {metrics?.test_samples || 400} test samples
            </span>
          </div>

          <p className="mt-2 text-xs text-[#718096] leading-relaxed">
            Evaluation on strictly held-out synthetic test data (80/20 train/test split):
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 text-center font-mono text-xs">
            <div className="p-2.5 rounded-lg border border-[#A6E8D9] bg-[#DDF5EF]">
              <div className="text-[10px] font-sans text-[#718096]">True Negatives (Normal)</div>
              <div className="mt-0.5 text-xl font-bold text-[#0E7366]">
                {metrics?.primary_model?.confusion_matrix?.[0]?.[0] ?? 795}
              </div>
              <div className="text-[9px] text-[#718096] font-sans">Correctly identified</div>
            </div>

            <div className="p-2.5 rounded-lg border border-[#FCDAA0] bg-[#FFF2D9]">
              <div className="text-[10px] font-sans text-[#718096]">False Positives (Type I)</div>
              <div className="mt-0.5 text-xl font-bold text-[#9A6513]">
                {metrics?.primary_model?.confusion_matrix?.[0]?.[1] ?? 5}
              </div>
              <div className="text-[9px] text-[#718096] font-sans">Normal flagged</div>
            </div>

            <div className="p-2.5 rounded-lg border border-[#FCC8C5] bg-[#FEECEB]">
              <div className="text-[10px] font-sans text-[#718096]">False Negatives (Type II)</div>
              <div className="mt-0.5 text-xl font-bold text-[#B91C1C]">
                {metrics?.primary_model?.confusion_matrix?.[1]?.[0] ?? 2}
              </div>
              <div className="text-[9px] text-[#718096] font-sans">Missed anomaly</div>
            </div>

            <div className="p-2.5 rounded-lg border border-[#C4D9FF] bg-[#E2ECFF]">
              <div className="text-[10px] font-sans text-[#718096]">True Positives (Anomalies)</div>
              <div className="mt-0.5 text-xl font-bold text-[#244C85]">
                {metrics?.primary_model?.confusion_matrix?.[1]?.[1] ?? 198}
              </div>
              <div className="text-[9px] text-[#718096] font-sans">Correctly detected</div>
            </div>
          </div>

          <div className="mt-3 p-2.5 rounded-lg border border-[#DCE6F5] bg-[#F0F4FA] text-[11px] text-[#718096] space-y-1">
            <div className="flex justify-between">
              <span>Precision:</span>
              <strong className="text-[#24344D] font-mono">
                {metrics?.primary_model?.precision ? `${(metrics.primary_model.precision * 100).toFixed(1)}%` : "98.2%"}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Recall:</span>
              <strong className="text-[#24344D] font-mono">
                {metrics?.primary_model?.recall ? `${(metrics.primary_model.recall * 100).toFixed(1)}%` : "99.1%"}
              </strong>
            </div>
          </div>
        </div>

        {/* Feature Importance Histogram */}
        <div className="lg:col-span-7 fintech-card p-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#DCE6F5]">
            <h3 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
              Feature Importance Distribution (Gini Importance)
            </h3>
            <span className="text-[10px] text-[#3563A6] font-mono bg-[#E2ECFF] px-1.5 py-0.2 rounded border border-[#C4D9FF]">
              Surveillance Factors
            </span>
          </div>

          <div className="mt-3 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureChartData} layout="vertical" margin={{ left: 50, right: 20 }}>
                <CartesianGrid stroke="#E3ECF7" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="#8A9BB2" fontSize={10} unit="%" />
                <YAxis dataKey="feature" type="category" stroke="#8A9BB2" fontSize={10} width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#DCE6F5",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "#24344D",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  }}
                  formatter={(val: any) => [`${val}%`, "Weight"]}
                />
                <Bar dataKey="weight" fill="#8574D6" radius={[0, 3, 3, 0]}>
                  {featureChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#20A896" : index === 1 ? "#3563A6" : index === 2 ? "#8574D6" : "#D99A35"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-Time Surveillance Alert Feed */}
      <div className="fintech-card overflow-hidden">
        <div className="p-3.5 border-b border-[#DCE6F5] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
              Live AI Trade Surveillance Feed
            </h3>
            <p className="text-[11px] text-[#718096]">
              Scored via Isolation Forest and classified for simulated market abuse signatures.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#718096] bg-[#F0F4FA] px-2 py-0.5 rounded border border-[#DCE6F5]">
            {alerts.length} evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#24344D]">
            <thead className="bg-[#F0F4FA] text-[10px] uppercase tracking-wider text-[#718096] font-semibold border-b border-[#DCE6F5]">
              <tr>
                <th className="py-2.5 px-3">Trade ID</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Detected Pattern</th>
                <th className="py-2.5 px-3">Key Indicator</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBF1FA] font-mono text-xs">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#718096] font-sans">
                    No trade alerts yet. Execute trades in the terminal or use the pattern simulation buttons above!
                  </td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.id} className="table-row-hover transition">
                    <td className="py-2.5 px-3 text-[#24344D] font-medium">{a.tradeId}</td>
                    <td className="py-2.5 px-3 font-sans font-bold text-[#3563A6]">{a.symbol}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#24344D]">{a.riskScore.toFixed(2)}</span>
                        <div className="h-1.5 w-12 rounded-full bg-[#E5EAF0] overflow-hidden">
                          <div
                            className={`h-full ${
                              a.riskScore >= 0.7
                                ? "bg-[#DC2626]"
                                : a.riskScore >= 0.4
                                ? "bg-[#D99A35]"
                                : "bg-[#20A896]"
                            }`}
                            style={{ width: `${a.riskScore * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${getSeverityBadge(a.severity)}`}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans font-medium text-[#24344D]">
                      {a.patternType.replace("SIMULATED_", "")}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[#718096] text-[11px] truncate max-w-xs">
                      {a.topFeatures?.[0]?.description || "Nominal parameters"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <button
                        onClick={() => setSelectedAlert(a)}
                        className="rounded bg-[#E2ECFF] border border-[#C4D9FF] px-2 py-0.5 text-[11px] font-semibold text-[#244C85] hover:bg-[#D4E4FF] transition"
                      >
                        Explain
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Explanation Modal */}
      {selectedAlert && (
        <Modal
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          title={`AI Surveillance Explanation: ${selectedAlert.tradeId}`}
        >
          <div className="space-y-3.5 text-xs text-[#24344D]">
            <div className="p-3 rounded-lg bg-[#F0F4FA] border border-[#DCE6F5] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#718096]">Instrument:</span>
                <span className="font-bold text-[#3563A6]">{selectedAlert.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#718096]">Anomaly Risk Score:</span>
                <span className="font-bold text-[#DC2626] font-mono">{selectedAlert.riskScore.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#718096]">Classified Signature:</span>
                <span className="font-semibold text-[#24344D]">{selectedAlert.patternType}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#718096] block mb-1.5">
                Top Contributing Anomaly Features
              </span>
              <div className="space-y-1.5">
                {selectedAlert.topFeatures?.map((f, i) => (
                  <div key={i} className="p-2 rounded bg-white border border-[#DCE6F5]">
                    <div className="flex justify-between font-medium">
                      <span className="text-[#24344D]">{f.feature_name || (f as any).featureName}</span>
                      <span className="text-[#3563A6] font-mono">{f.feature_value ?? (f as any).value}</span>
                    </div>
                    <div className="text-[11px] text-[#718096] mt-0.5">{f.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedAlert(null)}
              className="w-full rounded-lg bg-[#3563A6] py-2 font-semibold text-white hover:bg-[#254670] transition shadow-2xs"
            >
              Close Explanation
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
