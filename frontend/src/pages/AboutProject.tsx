import React, { useState } from "react";
import {
  Layers,
  BookOpen,
  Cpu,
  ShieldCheck,
  FileCheck2,
  Workflow,
  HelpCircle,
  Terminal,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { NavTab } from "../components/Sidebar";

interface AboutProjectProps {
  onNavigateTab?: (tab: NavTab) => void;
  onOpenGuide?: () => void;
}

export const AboutProject: React.FC<AboutProjectProps> = ({
  onNavigateTab,
  onOpenGuide,
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-[#DCE6F5]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24344D]">
              About LedgerTrade
            </h1>
            <span className="rounded bg-[#E2ECFF] px-2 py-0.5 text-[10px] font-semibold text-[#3563A6] border border-[#C4D9FF]">
              System Documentation
            </span>
          </div>
          <p className="text-xs text-[#718096] mt-0.5">
            Comprehensive technical manual, architectural specifications, and implementation review.
          </p>
        </div>

        {onOpenGuide && (
          <button
            onClick={onOpenGuide}
            className="flex items-center space-x-1.5 rounded-lg border border-[#C4D9FF] bg-[#E2ECFF] px-3 py-1.5 text-xs font-semibold text-[#244C85] hover:bg-[#D4E4FF] transition shadow-2xs"
          >
            <HelpCircle className="h-4 w-4 text-[#3563A6]" />
            <span>Open Quick Guide Popup</span>
          </button>
        )}
      </div>

      {/* 1. Project Introduction & Objectives */}
      <div className="fintech-card p-4 space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-[#DCE6F5]">
          <BookOpen className="h-4 w-4 text-[#3563A6]" />
          <h2 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
            1. Project Introduction &amp; Objectives
          </h2>
        </div>
        <p className="text-xs text-[#718096] leading-relaxed">
          <strong>LedgerTrade</strong> is a blockchain-based stock trading, Delivery-versus-Payment (DvP)
          settlement, and regulatory audit system engineered as an academic demonstration for data science
          and financial technology research. The platform pairs a high-performance in-memory limit order matching
          engine with a private Ethereum smart contract settlement layer and a real-time Python FastAPI
          machine learning surveillance service.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
          <div className="p-3 rounded-lg border border-[#DCE6F5] bg-[#F0F4FA]">
            <span className="font-bold text-[#3563A6] block text-xs">Atomic DvP Settlement</span>
            <p className="text-[11px] text-[#718096] mt-1">
              Eliminate counterparty settlement risk by synchronizing stock token delivery and cash debit in a single atomic transaction.
            </p>
          </div>
          <div className="p-3 rounded-lg border border-[#A6E8D9] bg-[#DDF5EF]">
            <span className="font-bold text-[#0E7366] block text-xs">Tamper-Evident Audit</span>
            <p className="text-[11px] text-[#718096] mt-1">
              Chain all execution events with sequential keccak256 hashes so retroactive tampering can be instantly proven and localized.
            </p>
          </div>
          <div className="p-3 rounded-lg border border-[#D5CBFB] bg-[#EEE9FF]">
            <span className="font-bold text-[#5E4CB8] block text-xs">AI Market Surveillance</span>
            <p className="text-[11px] text-[#718096] mt-1">
              Employ Isolation Forest unsupervised anomaly scoring to detect wash trading, order spoofing, and volume anomalies.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Problem Statement */}
      <div className="fintech-card p-4 space-y-2.5">
        <div className="flex items-center space-x-2 pb-2 border-b border-[#DCE6F5]">
          <Lock className="h-4 w-4 text-[#D99A35]" />
          <h2 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
            2. Problem Statement
          </h2>
        </div>
        <p className="text-xs text-[#718096] leading-relaxed">
          Contemporary securities trading architectures face three persistent structural vulnerabilities:
        </p>
        <ul className="list-disc list-inside text-xs text-[#718096] space-y-1.5 pl-1 leading-relaxed">
          <li>
            <strong className="text-[#24344D]">Multi-Day Settlement Windows (T+1 / T+2):</strong> Creates prolonged counterparty credit exposure, requiring massive collateral deposits at central clearing counterparties (CCPs).
          </li>
          <li>
            <strong className="text-[#24344D]">Opaque Regulatory Reconciliation:</strong> Regulatory audits rely on retroactive trade logs that can be altered or disputed across institutional boundaries.
          </li>
          <li>
            <strong className="text-[#24344D]">Siloed Market Surveillance:</strong> Detecting wash trading and spoofing across fractured order books requires manual post-facto sampling rather than inline algorithmic feature inference.
          </li>
        </ul>
      </div>

      {/* 3. System Architecture & Diagram */}
      <div className="fintech-card p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#DCE6F5]">
          <div className="flex items-center space-x-2">
            <Workflow className="h-4 w-4 text-[#3563A6]" />
            <h2 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
              3. System Architecture
            </h2>
          </div>
          <span className="text-[10px] text-[#3563A6] font-mono bg-[#E2ECFF] px-2 py-0.5 rounded border border-[#C4D9FF]">
            4-Tier Architecture
          </span>
        </div>

        <p className="text-xs text-[#718096] leading-relaxed">
          The system comprises four decoupled, independently executable components communicating via RESTful JSON-RPC APIs:
        </p>

        {/* Visual Workflow Flowchart */}
        <div className="p-3.5 rounded-lg border border-[#DCE6F5] bg-[#F0F4FA] font-mono text-[11px] space-y-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-xs">
            <div className="w-full sm:w-1/4 p-2.5 rounded bg-white border border-[#C4D9FF] shadow-2xs">
              <span className="font-bold text-[#3563A6] block">1. React Frontend</span>
              <span className="text-[10px] text-[#718096]">Port 3000 (Vite)</span>
            </div>
            <span className="text-[#718096] hidden sm:block">&rarr;</span>
            <div className="w-full sm:w-1/4 p-2.5 rounded bg-white border border-[#A6E8D9] shadow-2xs">
              <span className="font-bold text-[#0E7366] block">2. Node Express API</span>
              <span className="text-[10px] text-[#718096]">Port 5000 (Matching)</span>
            </div>
            <span className="text-[#718096] hidden sm:block">&rarr;</span>
            <div className="w-full sm:w-1/4 p-2.5 rounded bg-white border border-[#D5CBFB] shadow-2xs">
              <span className="font-bold text-[#5E4CB8] block">3. Hardhat Node</span>
              <span className="text-[10px] text-[#718096]">Port 8545 (DvP Contracts)</span>
            </div>
            <span className="text-[#718096] hidden sm:block">&harr;</span>
            <div className="w-full sm:w-1/4 p-2.5 rounded bg-white border border-[#FCDAA0] shadow-2xs">
              <span className="font-bold text-[#9A6513] block">4. FastAPI AI</span>
              <span className="text-[10px] text-[#718096]">Port 8000 (ML Engine)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Smart Contract Responsibilities */}
      <div className="fintech-card p-4 space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-[#DCE6F5]">
          <Layers className="h-4 w-4 text-[#20A896]" />
          <h2 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
            4. Smart Contract Responsibilities
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-lg border border-[#DCE6F5] bg-white">
            <span className="font-bold text-[#3563A6] block font-mono text-xs">UserRegistry.sol</span>
            <p className="text-[11px] text-[#718096] mt-1 leading-snug">
              Stores on-chain KYC approvals and assigns institutional permissions for Investors, Brokers, Auditors, and Regulators.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-[#DCE6F5] bg-white">
            <span className="font-bold text-[#20A896] block font-mono text-xs">CashToken.sol &amp; StockToken.sol</span>
            <p className="text-[11px] text-[#718096] mt-1 leading-snug">
              ERC-20 standard tokens representing simulated cash (sUSD/INR token units) and tokenized company equities with authorized minting/burning boundaries.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-[#DCE6F5] bg-white">
            <span className="font-bold text-[#8574D6] block font-mono text-xs">TradeSettlement.sol</span>
            <p className="text-[11px] text-[#718096] mt-1 leading-snug">
              Implements reentrancy-guarded atomic Delivery-versus-Payment: atomically transfers tokenized stock from seller to buyer while simultaneously transferring cash from buyer to seller.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-[#DCE6F5] bg-white">
            <span className="font-bold text-[#D99A35] block font-mono text-xs">AuditLog.sol</span>
            <p className="text-[11px] text-[#718096] mt-1 leading-snug">
              Append-only cryptographic audit trail recording sequential trade hashes, block numbers, Merkle roots, and TradeSettled event emissions.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Trading Workflow & Price-Time Matching */}
      <div className="fintech-card p-4 space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-[#DCE6F5]">
          <Cpu className="h-4 w-4 text-[#3563A6]" />
          <h2 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
            5. Trading Workflow &amp; Matching Engine
          </h2>
        </div>

        <p className="text-xs text-[#718096] leading-relaxed">
          Order placement adheres to deterministic price-time priority:
        </p>

        <ol className="list-decimal list-inside text-xs text-[#718096] space-y-1.5 pl-1 leading-relaxed">
          <li><strong>Pre-Trade Solvency Check:</strong> The backend verifies trader KYC and solvency (adequate cash for buy, adequate shares for sell).</li>
          <li><strong>Order Book Insertion:</strong> Bids are ordered descending by price; asks are ordered ascending by price. Equal prices are ordered chronologically.</li>
          <li><strong>Crossing Detection:</strong> If a bid price &gt;= ask price, orders cross at the passive order's limit price.</li>
          <li><strong>Atomic Settlement Dispatch:</strong> Ethers.js invokes <code className="text-[#3563A6]">TradeSettlement.settleMatchedTrade()</code>.</li>
          <li><strong>Hash Computation:</strong> Canonical keccak256 hash is computed using the previous trade's hash and appended to the chain.</li>
        </ol>

        {onNavigateTab && (
          <div className="pt-1">
            <button
              onClick={() => onNavigateTab("terminal")}
              className="text-xs font-semibold text-[#3563A6] hover:underline flex items-center space-x-1"
            >
              <span>Test Trading Terminal workflow</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 6. AI/ML Methodology */}
      <div className="fintech-card p-4 space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-[#DCE6F5]">
          <ShieldCheck className="h-4 w-4 text-[#20A896]" />
          <h2 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
            6. AI/ML Methodology &amp; Models
          </h2>
        </div>

        <p className="text-xs text-[#718096] leading-relaxed">
          The Python service (<code className="text-[#3563A6]">ml-service/run.py</code>) implements an unsupervised
          <strong> Isolation Forest</strong> detector alongside a supervised Random Forest benchmark:
        </p>

        <div className="p-3 rounded-lg border border-[#DCE6F5] bg-[#F0F4FA] space-y-1.5 text-xs">
          <span className="font-semibold text-[#24344D] block">Engineered Features for Trade Evaluation:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#718096] pt-1 font-mono">
            <div className="p-1.5 bg-white rounded border border-[#DCE6F5]">price_deviation</div>
            <div className="p-1.5 bg-white rounded border border-[#DCE6F5]">qty_deviation</div>
            <div className="p-1.5 bg-white rounded border border-[#DCE6F5]">trade_velocity</div>
            <div className="p-1.5 bg-white rounded border border-[#DCE6F5]">cancel_ratio</div>
            <div className="p-1.5 bg-white rounded border border-[#DCE6F5]">participant_freq</div>
            <div className="p-1.5 bg-white rounded border border-[#DCE6F5]">bid_ask_spread</div>
            <div className="p-1.5 bg-white rounded border border-[#DCE6F5]">vwap_deviation</div>
            <div className="p-1.5 bg-white rounded border border-[#DCE6F5]">wash_circularity</div>
          </div>
        </div>
      </div>

      {/* 7. Audit & Verification Methodology */}
      <div className="fintech-card p-4 space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-[#DCE6F5]">
          <FileCheck2 className="h-4 w-4 text-[#8574D6]" />
          <h2 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
            7. Cryptographic Audit Methodology
          </h2>
        </div>

        <p className="text-xs text-[#718096] leading-relaxed">
          Audit integrity is enforced via a two-stage verification strategy:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-lg border border-[#DCE6F5] bg-white">
            <span className="font-bold text-[#3563A6] block text-xs">Sequential Chaining</span>
            <p className="text-[11px] text-[#718096] mt-1 leading-snug">
              Every record computes <code className="text-[#3563A6]">keccak256(...)</code> with <code className="text-[#3563A6]">previousHash</code> as an input argument. If any record's price or quantity is changed, the recomputed hash diverges and breaks the entire chain.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-[#DCE6F5] bg-white">
            <span className="font-bold text-[#0E7366] block text-xs">Merkle Tree Batched Checkpoints</span>
            <p className="text-[11px] text-[#718096] mt-1 leading-snug">
              Batched execution logs compute a Merkle Root stored directly on the AuditLog smart contract, allowing lightweight logarithmic proof verification (<code className="text-[#0E7366]">O(log n)</code>).
            </p>
          </div>
        </div>

        {onNavigateTab && (
          <div className="pt-1">
            <button
              onClick={() => onNavigateTab("audit")}
              className="text-xs font-semibold text-[#8574D6] hover:underline flex items-center space-x-1"
            >
              <span>Explore Audit Console and tamper simulation</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 8. Local Setup & Execution Guide */}
      <div className="fintech-card p-4 space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-[#DCE6F5]">
          <Terminal className="h-4 w-4 text-[#3563A6]" />
          <h2 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
            8. Local Setup &amp; Execution Guide
          </h2>
        </div>

        <p className="text-xs text-[#718096] leading-relaxed">
          The verified scripts in the repository start all services simultaneously:
        </p>

        <div className="space-y-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg border border-[#DCE6F5] bg-[#F0F4FA]">
            <span className="text-[#718096] block text-[10px]"># Automated All-in-One Startup Script (PowerShell):</span>
            <code className="text-[#3563A6] font-bold">./scripts/start_all.ps1</code>
          </div>

          <div className="p-2.5 rounded-lg border border-[#DCE6F5] bg-[#F0F4FA]">
            <span className="text-[#718096] block text-[10px]"># Automated Test Suite (Hardhat + Python + Backend):</span>
            <code className="text-[#3563A6] font-bold">./scripts/test_all.ps1</code>
          </div>
        </div>
      </div>

      {/* 9. Limitations & Academic Disclaimer */}
      <div className="rounded-xl border border-[#FCDAA0] bg-[#FFF2D9] p-4 text-xs text-[#9A6513] space-y-1.5 shadow-2xs">
        <span className="font-bold text-[11px] uppercase tracking-wider text-[#8C5D10] block">
          Academic Disclaimer &amp; Limitations
        </span>
        <p className="text-[11px] leading-relaxed">
          All financial quantities, asset tokens, cash balances, and price charts within LedgerTrade are
          purely simulated in Indian Rupees (₹ INR) for academic demonstration and thesis evaluation.
          No real fiat money, cryptocurrency, or live exchange connections (e.g. NSE, BSE) are utilized.
        </p>
      </div>
    </div>
  );
};
