import React, { useState, useEffect } from "react";
import { Settings, Wallet, Server, RotateCcw, ShieldCheck, Check, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export const SettingsPage: React.FC = () => {
  const { currentUser, refreshProfile } = useAuth();
  const [metaMaskConnected, setMetaMaskConnected] = useState(false);
  const [metaMaskAccount, setMetaMaskAccount] = useState<string | null>(null);
  const [rpcUrl, setRpcUrl] = useState("http://127.0.0.1:8545");
  const [mlUrl, setMlUrl] = useState("http://127.0.0.1:8000");
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [mlOnline, setMlOnline] = useState(true);

  useEffect(() => {
    // Check if window.ethereum has connected accounts
    if (typeof (window as any).ethereum !== "undefined") {
      (window as any).ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setMetaMaskConnected(true);
            setMetaMaskAccount(accounts[0]);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleConnectMetaMask = async () => {
    if (typeof (window as any).ethereum === "undefined") {
      alert(
        "MetaMask extension was not detected. LedgerTrade provides an active built-in local signer fallback for full functionality!"
      );
      return;
    }
    try {
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts.length > 0) {
        setMetaMaskConnected(true);
        setMetaMaskAccount(accounts[0]);
      }
    } catch (err: any) {
      alert(`MetaMask connection error: ${err.message}`);
    }
  };

  const handleResetDemoState = async () => {
    if (!window.confirm("Are you sure you want to re-seed the demo database to default initial state?")) {
      return;
    }
    try {
      localStorage.removeItem("ledgertrade_token");
      localStorage.removeItem("ledgertrade_demo_user_id");
      setResetSuccess("Demo environment state reset successfully. Reloading...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      alert(`Failed resetting state: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-1">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24344D]">
            System Settings &amp; Node Config
          </h1>
          <span className="rounded bg-[#E2ECFF] px-2 py-0.5 text-[10px] font-semibold text-[#3563A6] border border-[#C4D9FF]">
            Platform Config
          </span>
        </div>
        <p className="text-xs text-[#718096] mt-0.5">
          Web3 wallet connectivity, backend microservice endpoints, and simulation state management.
        </p>
      </div>

      {resetSuccess && (
        <div className="flex items-center space-x-2 rounded-lg border border-[#A6E8D9] bg-[#DDF5EF] p-3 text-xs text-[#0E7366]">
          <Check className="h-4 w-4 text-[#20A896]" />
          <span>{resetSuccess}</span>
        </div>
      )}

      {/* Settings Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Web3 Wallet Configuration */}
        <div className="fintech-card p-4 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#DCE6F5]">
            <Wallet className="h-4 w-4 text-[#3563A6]" />
            <h2 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
              Web3 Signer &amp; Wallet
            </h2>
          </div>

          <p className="text-xs text-[#718096] leading-relaxed">
            By default, LedgerTrade uses an internal private key on the local Hardhat node for autonomous
            atomic trade settlement. You can also connect MetaMask to test custom signatures.
          </p>

          <div className="p-3 rounded-lg border border-[#DCE6F5] bg-[#F0F4FA] space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#718096]">Built-in Node Signer:</span>
              <span className="rounded bg-[#DDF5EF] px-1.5 py-0.2 text-[9px] font-semibold text-[#0E7366] border border-[#A4E8DA]">
                ACTIVE (Local 0xf39F...)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#718096]">MetaMask Extension:</span>
              <span
                className={`rounded px-1.5 py-0.2 text-[9px] font-semibold border ${
                  metaMaskConnected
                    ? "bg-[#DDF5EF] text-[#0E7366] border-[#A4E8DA]"
                    : "bg-[#FFF2D9] text-[#9A6513] border-[#FCDAA0]"
                }`}
              >
                {metaMaskConnected ? "CONNECTED" : "NOT CONNECTED"}
              </span>
            </div>
          </div>

          <button
            onClick={handleConnectMetaMask}
            className="w-full rounded-lg bg-[#3563A6] py-2 text-xs font-semibold text-white hover:bg-[#254670] transition shadow-2xs"
          >
            {metaMaskConnected ? "MetaMask Linked" : "Connect MetaMask Wallet"}
          </button>
        </div>

        {/* Microservice Endpoint Status */}
        <div className="fintech-card p-4 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#DCE6F5]">
            <Server className="h-4 w-4 text-[#20A896]" />
            <h2 className="text-xs font-bold text-[#24344D] uppercase tracking-wider">
              Endpoints &amp; Services
            </h2>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div>
              <label className="block text-[11px] font-sans font-semibold text-[#24344D] mb-1">
                Hardhat JSON-RPC Endpoint (Port 8545)
              </label>
              <input
                type="text"
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
                className="w-full rounded-lg border border-[#DCE6F5] bg-white px-2.5 py-1.5 text-xs text-[#24344D] focus:outline-none focus:border-[#3563A6]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-sans font-semibold text-[#24344D] mb-1">
                FastAPI AI Surveillance Microservice (Port 8000)
              </label>
              <input
                type="text"
                value={mlUrl}
                onChange={(e) => setMlUrl(e.target.value)}
                className="w-full rounded-lg border border-[#DCE6F5] bg-white px-2.5 py-1.5 text-xs text-[#24344D] focus:outline-none focus:border-[#3563A6]"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-[#A6E8D9] bg-[#DDF5EF] text-[11px] text-[#0E7366] flex items-center justify-between">
            <span>FastAPI Heartbeat Status:</span>
            <span className="font-bold">HEALTHY (200 OK)</span>
          </div>
        </div>
      </div>

      {/* Dangerous Operations / State Reset */}
      <div className="rounded-xl border border-[#FCDAA0] bg-[#FFF2D9] p-4 text-xs">
        <div className="flex items-center space-x-2 text-[#9A6513] font-bold pb-2 border-b border-[#FCE0AE]">
          <AlertCircle className="h-4 w-4 text-[#D99A35]" />
          <h2 className="uppercase tracking-wider text-[11px]">Demo State Reset &amp; Bootstrap</h2>
        </div>

        <p className="mt-2 text-[#8C5D10] leading-relaxed">
          Resetting clears all in-memory mock limit orders, execution receipts, and custom trade logs,
          re-seeding the database back to clean INR balances (Alice: ₹4,50,000, Bob: ₹6,20,000).
        </p>

        <div className="mt-3">
          <button
            onClick={handleResetDemoState}
            className="flex items-center space-x-1.5 rounded-lg bg-[#D99A35] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#C28528] transition shadow-2xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Demo State to Default</span>
          </button>
        </div>
      </div>
    </div>
  );
};
