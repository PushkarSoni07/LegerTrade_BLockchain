import React, { useState, useEffect } from "react";
import {
  X,
  HelpCircle,
  BookOpen,
  Play,
  ArrowRight,
  TrendingUp,
  Cpu,
  Shield,
  FileCheck2,
  Layers,
  Wrench,
  AlertTriangle,
  Terminal,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { NavTab } from "./Sidebar";

interface ProjectGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavTab) => void;
}

type GuideSection =
  | "getting-started"
  | "overview"
  | "trading-workflow"
  | "blockchain"
  | "ai-surveillance"
  | "audit-verification"
  | "navigation"
  | "tech-stack"
  | "limitations"
  | "troubleshooting"
  | "running";

export const ProjectGuideModal: React.FC<ProjectGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  // Default active section is Getting Started per requirements
  const [activeSection, setActiveSection] = useState<GuideSection>("getting-started");

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigateAndClose = (tab: NavTab) => {
    onNavigateTab(tab);
    onClose();
  };

  const sections: Array<{ id: GuideSection; label: string; icon: React.ReactNode }> = [
    { id: "getting-started", label: "B. Getting Started", icon: <Play className="h-3.5 w-3.5" /> },
    { id: "overview", label: "A. Project Overview", icon: <BookOpen className="h-3.5 w-3.5" /> },
    { id: "trading-workflow", label: "C. How Trading Works", icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { id: "blockchain", label: "D. Blockchain Explained", icon: <Layers className="h-3.5 w-3.5" /> },
    { id: "ai-surveillance", label: "E. AI/ML Surveillance", icon: <Cpu className="h-3.5 w-3.5" /> },
    { id: "audit-verification", label: "F. Audit & Verification", icon: <FileCheck2 className="h-3.5 w-3.5" /> },
    { id: "navigation", label: "G. Navigation Guide", icon: <ArrowRight className="h-3.5 w-3.5" /> },
    { id: "tech-stack", label: "H. Technology Stack", icon: <Wrench className="h-3.5 w-3.5" /> },
    { id: "limitations", label: "I. Demo Limitations", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    { id: "troubleshooting", label: "J. Troubleshooting", icon: <HelpCircle className="h-3.5 w-3.5" /> },
    { id: "running", label: "K. Running the Project", icon: <Terminal className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      {/* Modal Dialog Card */}
      <div
        className="flex flex-col w-full max-w-5xl h-[88vh] bg-white rounded-xl border border-[#E5EAF0] shadow-xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
      >
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#DCE6F5] bg-[#F0F4FA]">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3563A6] text-white shadow-xs">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <h2 id="guide-title" className="text-sm font-bold text-[#24344D]">
                LedgerTrade — Project Guide
              </h2>
              <p className="text-[11px] text-[#718096]">
                Interactive instruction manual, blockchain architecture, and trading workflows
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#718096] hover:bg-[#E2ECFF] hover:text-[#3563A6] transition"
            aria-label="Close guide popup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Left Sidebar TOC + Right Scrollable Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Table of Contents Column with soft blue-tinted background */}
          <div className="w-56 sm:w-64 border-r border-[#D5E0F2] bg-[#E8EEF8] p-3 overflow-y-auto hidden md:block">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#718096] px-2 mb-2">
              Guide Sections
            </div>
            <nav className="space-y-1">
              {sections.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`flex items-center space-x-2.5 w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? "bg-[#E2ECFF] text-[#3563A6] font-semibold border-l-3 border-[#3563A6] shadow-2xs"
                        : "text-[#24344D] hover:bg-[#DEE7F4]"
                    }`}
                  >
                    <span className={isActive ? "text-[#3563A6]" : "text-[#718096]"}>{sec.icon}</span>
                    <span className="truncate">{sec.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 pt-4 border-t border-[#D5E0F2] px-2 text-[11px] text-[#718096] space-y-2">
              <p className="font-semibold text-[#24344D]">Academic Demo</p>
              <p className="text-[10px] leading-relaxed">
                All quotes and balances are simulated INR values. Zero real funds or live broker connections.
              </p>
            </div>
          </div>

          {/* Right Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 text-[#263449] bg-white">
            {/* Mobile Tab Select */}
            <div className="md:hidden mb-4 pb-3 border-b border-[#E5EAF0]">
              <label className="block text-[11px] font-semibold text-[#738096] mb-1">
                Jump to Section
              </label>
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value as GuideSection)}
                className="w-full rounded-lg border border-[#E5EAF0] bg-white p-2 text-xs text-[#263449] focus:outline-none"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* SECTION B: GETTING STARTED (Default) */}
            {activeSection === "getting-started" && (
              <div className="space-y-4">
                <div className="border-b border-[#E5EAF0] pb-3">
                  <span className="text-[11px] font-bold text-[#58A99A] uppercase tracking-wider">
                    Quickstart Tutorial
                  </span>
                  <h3 className="text-lg font-bold text-[#263449] mt-0.5">B. Getting Started</h3>
                </div>

                <p className="text-xs text-[#738096] leading-relaxed">
                  Welcome to LedgerTrade! This step-by-step walkthrough explains how to test all major features
                  of the platform as a student, researcher, or evaluator:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#315C91]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#315C91] text-white text-[10px]">1</span>
                      <span>Explore Simulated Stocks</span>
                    </div>
                    <p className="text-[11px] text-[#738096] mt-1.5 leading-relaxed">
                      Visit the <strong>Simulated Markets</strong> or <strong>Investor Overview</strong> to review live synthetic ticker feeds for AAPL, TSLA, MSFT, and GOOGL quoted in simulated Indian Rupees (₹).
                    </p>
                    <button
                      onClick={() => navigateAndClose("markets")}
                      className="mt-2 text-[11px] font-semibold text-[#315C91] hover:underline flex items-center space-x-1"
                    >
                      <span>Go to Markets</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#315C91]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#315C91] text-white text-[10px]">2</span>
                      <span>Add Demo Funds (₹)</span>
                    </div>
                    <p className="text-[11px] text-[#738096] mt-1.5 leading-relaxed">
                      Click the <strong>Add Demo Funds</strong> button in the top navigation bar at any time to claim simulated ₹1,00,000 cash balance into your demo investor account.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#315C91]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#315C91] text-white text-[10px]">3</span>
                      <span>Submit Limit or Market Orders</span>
                    </div>
                    <p className="text-[11px] text-[#738096] mt-1.5 leading-relaxed">
                      Open the <strong>Trading Terminal</strong> to place BUY or SELL orders. The engine enforces pre-trade solvency checks and matches crossing orders.
                    </p>
                    <button
                      onClick={() => navigateAndClose("terminal")}
                      className="mt-2 text-[11px] font-semibold text-[#315C91] hover:underline flex items-center space-x-1"
                    >
                      <span>Open Trading Terminal</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#315C91]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#315C91] text-white text-[10px]">4</span>
                      <span>Inspect Holdings & On-Chain Audit</span>
                    </div>
                    <p className="text-[11px] text-[#738096] mt-1.5 leading-relaxed">
                      Check your <strong>Holdings & P&L</strong> page to see updated shares and acquisition costs. Then visit the <strong>Audit Console</strong> to verify the cryptographic keccak256 hash.
                    </p>
                    <button
                      onClick={() => navigateAndClose("audit")}
                      className="mt-2 text-[11px] font-semibold text-[#315C91] hover:underline flex items-center space-x-1"
                    >
                      <span>Open Audit Console</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB] text-xs">
                  <div className="flex items-center space-x-2 text-[#315C91] font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-[#58A99A]" />
                    <span>Role Switching Hint</span>
                  </div>
                  <p className="text-[11px] text-[#738096] mt-1">
                    Use the user perspective selector in the top-right corner to switch between <strong>Alice (Investor)</strong>, <strong>Bob (Counterparty)</strong>, and <strong>Diana (Auditor)</strong> to observe how role permissions and audit views adapt dynamically.
                  </p>
                </div>
              </div>
            )}

            {/* SECTION A: PROJECT OVERVIEW */}
            {activeSection === "overview" && (
              <div className="space-y-4">
                <div className="border-b border-[#E5EAF0] pb-3">
                  <span className="text-[11px] font-bold text-[#58A99A] uppercase tracking-wider">
                    Context & Goals
                  </span>
                  <h3 className="text-lg font-bold text-[#263449] mt-0.5">A. Project Overview</h3>
                </div>

                <p className="text-xs text-[#738096] leading-relaxed">
                  <strong>LedgerTrade</strong> is an academic fintech application designed to demonstrate how
                  decentralized blockchain architectures and machine-learning anomaly detection can modernize
                  securities trading, trade auditability, and market surveillance.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <h4 className="font-bold text-[#263449]">Why it was developed</h4>
                    <p className="text-[#738096] text-[11px] mt-1 leading-relaxed">
                      Traditional capital markets rely on centralized clearinghouses with multi-day settlement cycles (T+1 / T+2), opacity for regulators, and vulnerable paper-trail reconciliation. LedgerTrade demonstrates an atomic <strong>Delivery-versus-Payment (DvP)</strong> model where stock shares and cash exchange hands simultaneously on an immutable ledger.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <h4 className="font-bold text-[#263449]">How Blockchain & Python AI/ML Work Together</h4>
                    <ul className="list-disc list-inside text-[#738096] text-[11px] mt-1.5 space-y-1">
                      <li><strong>Hardhat Private Ethereum Blockchain:</strong> Provides deterministic order settlement via smart contracts (<code className="text-[#315C91]">TradeSettlement.sol</code>), tokenized simulated assets (<code className="text-[#315C91]">StockToken.sol</code>, <code className="text-[#315C91]">CashToken.sol</code>), and tamper-evident audit logs (<code className="text-[#315C91]">AuditLog.sol</code>).</li>
                      <li><strong>Python FastAPI AI Service:</strong> Continuously inspects trade velocities, price deviations, and cancel ratios using an Isolation Forest ML model to detect wash trading, spoofing, and pump-and-dump anomalies.</li>
                      <li><strong>Tamper-Proof Audit Chain:</strong> Every settled trade computes a sequential keccak256 hash linking the prior trade record, enabling regulators to instantly detect database tampering.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION C: HOW TRADING WORKS */}
            {activeSection === "trading-workflow" && (
              <div className="space-y-4">
                <div className="border-b border-[#E5EAF0] pb-3">
                  <span className="text-[11px] font-bold text-[#58A99A] uppercase tracking-wider">
                    Execution Pipeline
                  </span>
                  <h3 className="text-lg font-bold text-[#263449] mt-0.5">C. How Trading Works</h3>
                </div>

                <p className="text-xs text-[#738096] leading-relaxed">
                  Trading on LedgerTrade follows a deterministic 7-step lifecycle matching the implemented backend and smart contract mechanics:
                </p>

                <div className="space-y-2 text-xs">
                  {[
                    { step: "1", title: "Explore Simulated Market Prices", desc: "The frontend polls the backend periodic price engine (tick every 3 seconds), displaying candlestick charts and order depth in simulated INR." },
                    { step: "2", title: "Select a Simulated Instrument", desc: "Choose an equity ticker (AAPL, TSLA, MSFT, GOOGL) and specify BUY or SELL, order type (LIMIT or MARKET), price, and quantity." },
                    { step: "3", title: "Submit Order & Validate Balances", desc: "The backend verifies mock KYC approval, checks available simulated cash for buys, or verifies available share quantities for sells." },
                    { step: "4", title: "Order Book Ingestion", desc: "Valid orders are inserted into the memory data store with status OPEN, adhering to strict price-time priority." },
                    { step: "5", title: "Deterministic Order Matching", desc: "The matching engine pairs crossing limit orders (BUY price >= SELL price) or market orders, executing at the passive order's limit price." },
                    { step: "6", title: "Atomic On-Chain DvP Settlement", desc: "The backend invokes TradeSettlement.sol on the local Hardhat node, atomically transferring tokenized stock and cash between buyer and seller wallets." },
                    { step: "7", title: "Audit Receipt & Hash Chaining", desc: "AuditLog.sol emits an event and records a keccak256 canonical hash chaining back to the previous record hash. Transaction hashes and block numbers are persisted." },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start space-x-3 p-2.5 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#315C91] text-white text-[10px] font-bold mt-0.5">
                        {s.step}
                      </span>
                      <div>
                        <div className="font-bold text-[#263449] text-xs">{s.title}</div>
                        <p className="text-[11px] text-[#738096] mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION D: BLOCKCHAIN EXPLAINED */}
            {activeSection === "blockchain" && (
              <div className="space-y-4">
                <div className="border-b border-[#E5EAF0] pb-3">
                  <span className="text-[11px] font-bold text-[#58A99A] uppercase tracking-wider">
                    Smart Contracts & Architecture
                  </span>
                  <h3 className="text-lg font-bold text-[#263449] mt-0.5">D. Blockchain Explained</h3>
                </div>

                <p className="text-xs text-[#738096] leading-relaxed">
                  LedgerTrade interfaces with a local Ethereum-compatible network running on Hardhat (Chain ID 31337) at <code className="text-[#315C91]">http://127.0.0.1:8545</code>.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <h4 className="font-bold text-[#263449]">Smart Contract Responsibilities</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div className="p-2 bg-white rounded border border-[#E5EAF0]">
                        <span className="font-mono font-bold text-[#315C91] text-[11px]">UserRegistry.sol</span>
                        <p className="text-[10px] text-[#738096] mt-0.5">Maintains KYC status and role authorization (Investor, Broker, Auditor, Regulator).</p>
                      </div>
                      <div className="p-2 bg-white rounded border border-[#E5EAF0]">
                        <span className="font-mono font-bold text-[#315C91] text-[11px]">CashToken.sol</span>
                        <p className="text-[10px] text-[#738096] mt-0.5">ERC20 simulated cash token used for atomic cash settlement and faucet requests.</p>
                      </div>
                      <div className="p-2 bg-white rounded border border-[#E5EAF0]">
                        <span className="font-mono font-bold text-[#315C91] text-[11px]">StockToken.sol</span>
                        <p className="text-[10px] text-[#738096] mt-0.5">ERC20 tokenized equity representing shares of simulated companies.</p>
                      </div>
                      <div className="p-2 bg-white rounded border border-[#E5EAF0]">
                        <span className="font-mono font-bold text-[#315C91] text-[11px]">TradeSettlement.sol</span>
                        <p className="text-[10px] text-[#738096] mt-0.5">Atomic DvP coordinator with ReentrancyGuard ensuring simultaneous swap.</p>
                      </div>
                      <div className="p-2 bg-white rounded border border-[#E5EAF0] sm:col-span-2">
                        <span className="font-mono font-bold text-[#315C91] text-[11px]">AuditLog.sol</span>
                        <p className="text-[10px] text-[#738096] mt-0.5">Append-only sequential ledger storing canonical hashes and emitted TradeSettled logs.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 text-[11px] text-amber-900">
                    <strong className="block font-semibold mb-1">Distinction: On-Chain vs Off-Chain</strong>
                    High-frequency order matching and order cancellation take place in the in-memory backend matching engine for sub-millisecond response. Once two orders cross, the matched execution is settled on the Hardhat blockchain, generating an immutable transaction hash and block number.
                  </div>
                </div>
              </div>
            )}

            {/* SECTION E: AI/ML SURVEILLANCE */}
            {activeSection === "ai-surveillance" && (
              <div className="space-y-4">
                <div className="border-b border-[#E5EAF0] pb-3">
                  <span className="text-[11px] font-bold text-[#58A99A] uppercase tracking-wider">
                    FastAPI Anomaly Detection
                  </span>
                  <h3 className="text-lg font-bold text-[#263449] mt-0.5">E. AI/ML Surveillance</h3>
                </div>

                <p className="text-xs text-[#738096] leading-relaxed">
                  The Python AI microservice (<code className="text-[#315C91]">ml-service/run.py</code>) runs on FastAPI (<code className="text-[#315C91]">http://127.0.0.1:8000</code>) and provides real-time algorithmic market surveillance.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <h4 className="font-bold text-[#263449]">How the Model Works</h4>
                    <p className="text-[11px] text-[#738096] mt-1 leading-relaxed">
                      The service employs an <strong>Isolation Forest</strong> unsupervised anomaly detection model trained on tabular market execution features, including price-to-VWAP deviation, trading velocity, cancellation-to-fill ratio, and participant concentration.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <h4 className="font-bold text-[#263449]">Detected Market Abuse Patterns</h4>
                    <ul className="list-disc list-inside text-[11px] text-[#738096] mt-1.5 space-y-1">
                      <li><strong>Wash Trading:</strong> Rapid circular trading between colluding accounts with no change in beneficial ownership.</li>
                      <li><strong>Spoofing:</strong> Submitting and canceling large non-bona fide orders to manipulate order book perception.</li>
                      <li><strong>Pump & Dump:</strong> Rapid sequential buy surges coupled with sharp price inflations.</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50 text-[11px] text-blue-900">
                    <strong className="block font-semibold mb-0.5">Compliance Notice:</strong>
                    An AI anomaly alert constitutes a risk indicator for compliance officer review, not conclusive proof of fraud. Auditors can freeze symbols via the circuit-breaker in the Auditor Portal if needed.
                  </div>
                </div>
              </div>
            )}

            {/* SECTION F: AUDIT & VERIFICATION */}
            {activeSection === "audit-verification" && (
              <div className="space-y-4">
                <div className="border-b border-[#E5EAF0] pb-3">
                  <span className="text-[11px] font-bold text-[#58A99A] uppercase tracking-wider">
                    Cryptographic Integrity
                  </span>
                  <h3 className="text-lg font-bold text-[#263449] mt-0.5">F. Audit & Verification</h3>
                </div>

                <p className="text-xs text-[#738096] leading-relaxed">
                  Every trade settled on LedgerTrade is encoded into an immutable cryptographic record chained sequentially using keccak256 hashes.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <h4 className="font-bold text-[#263449]">Canonical Trade Hash Formula</h4>
                    <code className="block p-2 mt-1.5 rounded bg-white border border-[#E5EAF0] font-mono text-[10px] text-[#315C91] overflow-x-auto">
                      keccak256(recordId, tradeId, buyOrderId, sellOrderId, symbol, price, qty, buyer, seller, timestamp, previousHash)
                    </code>
                    <p className="text-[11px] text-[#738096] mt-1.5">
                      Because each record incorporates the previous record's hash, any retroactive modification of trade prices or quantities alters the resulting hash and breaks the entire forward chain.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <h4 className="font-bold text-[#263449]">Interactive Tamper Test</h4>
                    <p className="text-[11px] text-[#738096] mt-1 leading-relaxed">
                      In the <strong>Audit Console</strong>, you can click <em>"Simulate Tamper"</em> on any trade record. This deliberately alters the local price to ₹999. Clicking <em>"Verify Record"</em> or <em>"Verify Chain"</em> immediately flags a cryptographic mismatch, proving the tamper-evident security model!
                    </p>
                    <button
                      onClick={() => navigateAndClose("audit")}
                      className="mt-2 text-[11px] font-semibold text-[#315C91] hover:underline flex items-center space-x-1"
                    >
                      <span>Test in Audit Console</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION G: NAVIGATION GUIDE */}
            {activeSection === "navigation" && (
              <div className="space-y-4">
                <div className="border-b border-[#E5EAF0] pb-3">
                  <span className="text-[11px] font-bold text-[#58A99A] uppercase tracking-wider">
                    Sidebar Modules
                  </span>
                  <h3 className="text-lg font-bold text-[#263449] mt-0.5">G. Navigation Guide</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "investor-overview", label: "Investor Overview", desc: "KPI summaries, portfolio value in ₹ INR, live interactive chart, recent trade list." },
                    { id: "markets", label: "Simulated Markets", desc: "All simulated equity tickers with 24h highs, lows, price changes, and direct trading links." },
                    { id: "terminal", label: "Trading Terminal", desc: "Place BUY and SELL limit/market orders, live order book, execution tape, and order cancellation." },
                    { id: "portfolio", label: "Holdings & P&L", desc: "Detailed breakdown of owned tokenized shares, average acquisition prices, and unrealized gains." },
                    { id: "blockchain", label: "Blockchain Explorer", desc: "Node status, block numbers, smart contract registry addresses, and transaction hashes." },
                    { id: "audit", label: "Audit Console", desc: "Inspect sequential audit logs, verify cryptographic hashes, and perform tamper simulations." },
                    { id: "ai-surveillance", label: "AI Surveillance", desc: "Anomaly risk scores, feature importances, flagged abuse alerts, and pattern simulators." },
                    { id: "orders", label: "Order Management", desc: "Global order book filterable by symbol, side, or status (OPEN, FILLED, CANCELLED)." },
                    { id: "auditor-portal", label: "Auditor / Regulator", desc: "Privileged regulatory oversight portal with emergency market circuit-breaker controls." },
                    { id: "settings", label: "System Settings", desc: "MetaMask integration status, endpoint configurations, and demo state reset button." },
                    { id: "about", label: "About Project", desc: "Comprehensive documentation covering project architecture, tech stack, and evaluation guide." },
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigateAndClose(item.id as NavTab)}
                      className="p-2.5 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB] hover:border-[#315C91] cursor-pointer transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#315C91] text-xs">{item.label}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-[#738096]" />
                      </div>
                      <p className="text-[10px] text-[#738096] mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION H: TECHNOLOGY STACK */}
            {activeSection === "tech-stack" && (
              <div className="space-y-4">
                <div className="border-b border-[#E5EAF0] pb-3">
                  <span className="text-[11px] font-bold text-[#58A99A] uppercase tracking-wider">
                    Full Implementation Specs
                  </span>
                  <h3 className="text-lg font-bold text-[#263449] mt-0.5">H. Technology Stack</h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <div className="font-bold text-[#315C91]">Frontend Application</div>
                    <div className="text-[11px] text-[#738096] mt-1 space-y-0.5">
                      <p>• <strong>Framework:</strong> React 18 with TypeScript &amp; Vite 5</p>
                      <p>• <strong>Styling:</strong> Tailwind CSS &amp; custom minimal fintech design system</p>
                      <p>• <strong>Visualizations:</strong> Recharts (AreaCharts, BarCharts, responsive tooltips)</p>
                      <p>• <strong>Icons:</strong> Lucide React icons</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <div className="font-bold text-[#315C91]">Backend Core Server</div>
                    <div className="text-[11px] text-[#738096] mt-1 space-y-0.5">
                      <p>• <strong>Runtime:</strong> Node.js with Express &amp; TypeScript</p>
                      <p>• <strong>Web3 Driver:</strong> Ethers.js v6 for smart contract JSON-RPC interaction</p>
                      <p>• <strong>Matching Engine:</strong> Custom price-time priority limit order matching engine</p>
                      <p>• <strong>Persistence:</strong> Transactional JSON database with auto-writeback</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <div className="font-bold text-[#315C91]">Blockchain &amp; Smart Contracts</div>
                    <div className="text-[11px] text-[#738096] mt-1 space-y-0.5">
                      <p>• <strong>Language:</strong> Solidity 0.8.20 with OpenZeppelin ERC20 &amp; Ownable</p>
                      <p>• <strong>Environment:</strong> Hardhat Local Ethereum node (Port 8545, Chain 31337)</p>
                      <p>• <strong>Protocols:</strong> Delivery-versus-Payment (DvP), ERC20 simulated equities</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <div className="font-bold text-[#315C91]">AI / Machine Learning Microservice</div>
                    <div className="text-[11px] text-[#738096] mt-1 space-y-0.5">
                      <p>• <strong>Framework:</strong> Python 3.10+, FastAPI &amp; Uvicorn (Port 8000)</p>
                      <p>• <strong>Algorithms:</strong> Scikit-Learn Isolation Forest &amp; feature engineering</p>
                      <p>• <strong>Surveillance:</strong> Real-time anomaly risk scoring &amp; pattern classification</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION I: DEMO LIMITATIONS */}
            {activeSection === "limitations" && (
              <div className="space-y-4">
                <div className="border-b border-[#E5EAF0] pb-3">
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                    Educational Boundaries
                  </span>
                  <h3 className="text-lg font-bold text-[#263449] mt-0.5">I. Demo Limitations</h3>
                </div>

                <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 text-xs text-amber-950 space-y-2">
                  <p className="font-semibold text-amber-900">Academic Sandbox Environment Notice</p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                    <li><strong>No Real Funds:</strong> All cash balances, stock prices, and trade amounts are strictly simulated INR tokens for demonstration purposes.</li>
                    <li><strong>No External Exchange Linkage:</strong> Price changes are generated by a synthetic random-walk generator rather than live NSE, BSE, or NYSE market feeds.</li>
                    <li><strong>Private Consensus:</strong> The blockchain network is a single-node Hardhat developer network running locally, not public Ethereum mainnet.</li>
                    <li><strong>Research Scope:</strong> Designed for undergraduate/graduate coursework evaluation and thesis presentation.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* SECTION J: TROUBLESHOOTING */}
            {activeSection === "troubleshooting" && (
              <div className="space-y-4">
                <div className="border-b border-[#E5EAF0] pb-3">
                  <span className="text-[11px] font-bold text-[#58A99A] uppercase tracking-wider">
                    Diagnostic Guide
                  </span>
                  <h3 className="text-lg font-bold text-[#263449] mt-0.5">J. Troubleshooting</h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <div className="font-bold text-[#263449]">1. Blockchain Node Disconnected / Offline</div>
                    <p className="text-[11px] text-[#738096] mt-1">
                      Check if the Hardhat node is running in the background. If port 8545 is down, restart it by opening a terminal in the <code className="text-[#315C91]">blockchain/</code> folder and running <code className="text-[#315C91]">npx hardhat node</code>. The backend gracefully falls back to local simulation mode if the node is unavailable.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <div className="font-bold text-[#263449]">2. AI Surveillance Service Showing Offline</div>
                    <p className="text-[11px] text-[#738096] mt-1">
                      Verify that Python and FastAPI are running on port 8000. In the <code className="text-[#315C91]">ml-service/</code> directory, execute <code className="text-[#315C91]">python run.py</code>.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-[#E5EAF0] bg-[#F6F8FB]">
                    <div className="font-bold text-[#263449]">3. Re-setting Demo State to Clean Baseline</div>
                    <p className="text-[11px] text-[#738096] mt-1">
                      Navigate to <strong>System Settings</strong> and click <em>"Reset Demo Database"</em> to clear mock orders, restore default balances, and restart fresh.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION K: RUNNING THE PROJECT */}
            {activeSection === "running" && (
              <div className="space-y-4">
                <div className="border-b border-[#E5EAF0] pb-3">
                  <span className="text-[11px] font-bold text-[#58A99A] uppercase tracking-wider">
                    Verified Repository Commands
                  </span>
                  <h3 className="text-lg font-bold text-[#263449] mt-0.5">K. Running the Project</h3>
                </div>

                <p className="text-xs text-[#738096]">
                  These verified PowerShell commands launch the complete 4-tier stack in Windows:
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] font-bold text-[#263449]">One-Click Launch Script</span>
                    <pre className="p-2.5 mt-1 rounded bg-[#F6F8FB] border border-[#E5EAF0] font-mono text-[11px] text-[#315C91]">
                      ./scripts/start_all.ps1
                    </pre>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-[#263449]">Manual Terminal Commands</span>
                    <div className="space-y-1.5 mt-1 font-mono text-[11px]">
                      <div className="p-2 rounded bg-[#F6F8FB] border border-[#E5EAF0]">
                        <span className="text-[#738096] block text-[10px]"># 1. Hardhat Blockchain Node (Port 8545):</span>
                        <code className="text-[#315C91]">cd blockchain &amp;&amp; npx hardhat node</code>
                      </div>
                      <div className="p-2 rounded bg-[#F6F8FB] border border-[#E5EAF0]">
                        <span className="text-[#738096] block text-[10px]"># 2. Deploy Smart Contracts:</span>
                        <code className="text-[#315C91]">cd blockchain &amp;&amp; npx hardhat run scripts/deploy.js --network localhost</code>
                      </div>
                      <div className="p-2 rounded bg-[#F6F8FB] border border-[#E5EAF0]">
                        <span className="text-[#738096] block text-[10px]"># 3. Python AI Microservice (Port 8000):</span>
                        <code className="text-[#315C91]">cd ml-service &amp;&amp; python run.py</code>
                      </div>
                      <div className="p-2 rounded bg-[#F6F8FB] border border-[#E5EAF0]">
                        <span className="text-[#738096] block text-[10px]"># 4. Backend Express API (Port 5000):</span>
                        <code className="text-[#315C91]">cd backend &amp;&amp; npm run dev</code>
                      </div>
                      <div className="p-2 rounded bg-[#F6F8FB] border border-[#E5EAF0]">
                        <span className="text-[#738096] block text-[10px]"># 5. Frontend React App (Port 3000):</span>
                        <code className="text-[#315C91]">cd frontend &amp;&amp; npm run dev</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5EAF0] bg-[#F6F8FB] text-xs">
          <div className="text-[#738096] text-[11px]">
            Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E5EAF0] text-[10px]">Esc</kbd> anytime to close.
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-[#315C91] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#254670] transition shadow-sm"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
