import React, { useState } from "react";
import { Layers, ShieldCheck, ArrowRight, UserCheck, Lock, Mail, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface LoginRegisterProps {
  onSuccess: () => void;
}

export const LoginRegister: React.FC<LoginRegisterProps> = ({ onSuccess }) => {
  const { login, register, demoUsers, switchDemoUser } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("INVESTOR");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegisterMode) {
        await register(username, email, password, role);
      } else {
        await login(email, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = async (demoUser: any) => {
    await switchDemoUser(demoUser);
    onSuccess();
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case "INVESTOR":
        return "bg-[#E2ECFF] text-[#244C85] border border-[#C4D9FF]";
      case "BROKER":
        return "bg-[#EEE9FF] text-[#5E4CB8] border border-[#D6CCFC]";
      case "AUDITOR":
        return "bg-[#DDF5EF] text-[#0E7366] border border-[#A4E8DA]";
      case "REGULATOR":
        return "bg-[#FFF2D9] text-[#9A6513] border border-[#FCDAA0]";
      default:
        return "bg-[#F0F4FA] text-[#718096] border border-[#DCE6F5]";
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-8 bg-[#F0F4FA]">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Academic Demo Card & 1-Click Role Selection */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 rounded-full border border-[#A6E8D9] bg-[#DDF5EF] px-3 py-1 text-xs font-semibold text-[#0E7366]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#20A896]" />
              <span>Academic Prototype • Safe Sandbox</span>
            </div>
            <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#24344D]">
              Blockchain Stock Trading &amp; <span className="text-[#3563A6]">Audit System</span>
            </h1>
            <p className="mt-1.5 text-xs text-[#718096] leading-relaxed">
              Experience atomic Delivery-versus-Payment (DvP) stock settlement on a local Hardhat chain,
              cryptographically verifiable tamper-evident audit logging, and real-time AI market surveillance in simulated ₹ INR.
            </p>
          </div>

          {/* Quick Demo Account Selector */}
          <div className="fintech-card p-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#DCE6F5]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#24344D]">
                1-Click Demo Profiles
              </span>
              <span className="text-[11px] text-[#20A896] font-semibold">Instant Role Selection</span>
            </div>

            <div className="mt-2.5 space-y-2">
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectDemo(u)}
                  className="flex w-full items-center justify-between rounded-lg border border-[#DCE6F5] bg-[#F0F4FA] p-2.5 text-left transition hover:border-[#3563A6] hover:bg-[#E2ECFF]/40 group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E2ECFF] text-xs font-bold text-[#3563A6] border border-[#C4D9FF] group-hover:bg-[#3563A6] group-hover:text-white transition">
                      {u.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#24344D] capitalize">{u.username}</div>
                      <div className="text-[10px] text-[#718096] font-mono">
                        {u.walletAddress.substring(0, 8)}...{u.walletAddress.substring(36)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className={`rounded px-1.5 py-0.2 text-[9px] font-semibold border ${getRoleBadge(u.role)}`}>
                      {u.role}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#718096] group-hover:text-[#3563A6] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Custom Login / Register Form */}
        <div className="lg:col-span-6">
          <div className="fintech-card p-6 sm:p-7 shadow-sm">
            <div className="text-center pb-5 border-b border-[#DCE6F5]">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-[#3563A6] text-white shadow-xs">
                <Layers className="h-4 w-4" />
              </div>
              <h2 className="mt-2 text-base font-bold text-[#24344D]">
                {isRegisterMode ? "Create Demo Trader Account" : "Sign In to LedgerTrade"}
              </h2>
              <p className="text-[11px] text-[#718096] mt-0.5">
                {isRegisterMode
                  ? "Register a new participant identity on the simulated registry"
                  : "Access your simulated portfolio, order books, and audit console"}
              </p>
            </div>

            {error && (
              <div className="mt-3.5 rounded-lg border border-[#FCC8C5] bg-[#FEECEB] p-2.5 text-xs text-[#B91C1C]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              {isRegisterMode && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#24344D]">Username</label>
                  <div className="mt-1 relative rounded-lg">
                    <UserIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#718096]" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. trader_john"
                      className="w-full rounded-lg border border-[#DCE6F5] bg-white pl-8 pr-3 py-1.5 text-xs text-[#24344D] placeholder-[#718096] focus:border-[#3563A6] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#24344D]">Email Address</label>
                <div className="mt-1 relative rounded-lg">
                  <Mail className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#718096]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@ledgertrade.demo"
                    className="w-full rounded-lg border border-[#DCE6F5] bg-white pl-8 pr-3 py-1.5 text-xs text-[#24344D] placeholder-[#718096] focus:border-[#3563A6] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#24344D]">Password</label>
                <div className="mt-1 relative rounded-lg">
                  <Lock className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#718096]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#DCE6F5] bg-white pl-8 pr-3 py-1.5 text-xs text-[#24344D] placeholder-[#718096] focus:border-[#3563A6] focus:outline-none"
                  />
                </div>
              </div>

              {isRegisterMode && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#24344D]">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#DCE6F5] bg-white px-2.5 py-1.5 text-xs text-[#24344D] focus:border-[#3563A6] focus:outline-none"
                  >
                    <option value="INVESTOR">INVESTOR (Retail Trader)</option>
                    <option value="BROKER">BROKER (Market Maker)</option>
                    <option value="AUDITOR">AUDITOR (Compliance Officer)</option>
                    <option value="REGULATOR">REGULATOR (Market Oversight)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-lg bg-[#3563A6] py-2 text-xs font-semibold text-white hover:bg-[#254670] transition shadow-2xs disabled:opacity-50"
              >
                {loading ? "Authenticating..." : isRegisterMode ? "Complete Registration" : "Sign In"}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-[#DCE6F5] text-center text-xs text-[#718096]">
              {isRegisterMode ? (
                <span>
                  Already registered?{" "}
                  <button
                    onClick={() => setIsRegisterMode(false)}
                    className="font-semibold text-[#3563A6] hover:underline"
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  Need a demo identity?{" "}
                  <button
                    onClick={() => setIsRegisterMode(true)}
                    className="font-semibold text-[#3563A6] hover:underline"
                  >
                    Register New Account
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
