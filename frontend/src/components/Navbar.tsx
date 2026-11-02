import React, { useState } from "react";
import {
  Layers,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  Coins,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { formatINR } from "../utils/formatters";

interface NavbarProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  onOpenGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen,
  onOpenGuide,
}) => {
  const { currentUser, demoUsers, switchDemoUser, portfolio, refreshProfile } = useAuth();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetMsg, setFaucetMsg] = useState<string | null>(null);

  const handleClaimFaucet = async () => {
    try {
      setFaucetLoading(true);
      await api.claimFaucet();
      setFaucetMsg("+₹1,00,000 Added!");
      await refreshProfile();
      setTimeout(() => setFaucetMsg(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setFaucetLoading(false);
    }
  };

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
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
    <header className="sticky top-0 z-40 w-full border-b border-[#DCE6F5] bg-white shadow-2xs">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileMenu}
            className="rounded-lg p-1.5 text-[#718096] hover:bg-[#F0F4FA] hover:text-[#24344D] md:hidden"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#3563A6] to-[#20A896] text-white shadow-xs">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-bold tracking-tight text-[#24344D]">
                  Ledger<span className="text-[#3563A6]">Trade</span>
                </span>
                <span className="rounded bg-[#E2ECFF] px-1.5 py-0.2 text-[9px] font-semibold text-[#3563A6] border border-[#C4D9FF]">
                  SIMULATED INR
                </span>
              </div>
              <p className="text-[10px] text-[#718096] hidden sm:block -mt-0.5">
                Blockchain Stock Trading &amp; Audit System
              </p>
            </div>
          </div>
        </div>

        {/* Center / Network & Faucet */}
        <div className="hidden lg:flex items-center space-x-3">
          <div className="flex items-center space-x-2 rounded-full border border-[#DCE6F5] bg-[#F0F4FA] px-3 py-1 text-xs text-[#24344D]">
            <span className="h-2 w-2 rounded-full bg-[#20A896] animate-pulse"></span>
            <span className="text-[11px] font-medium text-[#24344D]">Hardhat Network (Local #31337)</span>
            <span className="text-[#CBD5E1]">•</span>
            <span className="text-[#718096] font-mono text-[10px]">DvP Protocol v1.0</span>
          </div>

          {/* Add Demo Funds Button with soft teal/green accent */}
          <button
            onClick={handleClaimFaucet}
            disabled={faucetLoading}
            className="flex items-center space-x-1.5 rounded-lg border border-[#A6E8D9] bg-[#DDF5EF] px-2.5 py-1 text-xs font-semibold text-[#0E7366] hover:bg-[#C9F0E5] transition shadow-2xs"
            title="Request simulated ₹1,00,000 demo funds"
            id="faucet-button"
          >
            <Coins className="h-3.5 w-3.5 text-[#20A896]" />
            <span>{faucetMsg || (faucetLoading ? "Adding..." : "+₹1,00,000 Demo Funds")}</span>
          </button>
        </div>

        {/* Right Controls: Cash, Help & Guide Button, User Switcher */}
        <div className="flex items-center space-x-2.5">
          {/* Simulated Cash Display */}
          {portfolio && (
            <div className="hidden sm:flex flex-col text-right pr-2">
              <span className="text-[10px] font-medium uppercase text-[#718096]">Simulated Cash</span>
              <span className="text-xs font-bold text-[#24344D] font-mono">
                {formatINR(portfolio.cashBalance)}
              </span>
            </div>
          )}

          {/* PROMINENT HELP & GUIDE BUTTON with soft blue styling */}
          <button
            onClick={onOpenGuide}
            className="flex items-center space-x-1.5 rounded-lg border border-[#C4D9FF] bg-[#E2ECFF] px-3 py-1.5 text-xs font-semibold text-[#244C85] hover:bg-[#D4E4FF] transition shadow-2xs"
            title="Open LedgerTrade Project Guide & Manual"
            id="nav-help-guide-button"
          >
            <HelpCircle className="h-4 w-4 text-[#3563A6]" />
            <span className="hidden sm:inline">Help &amp; Guide</span>
          </button>

          {/* Role-Aware Demo Account Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center space-x-2 rounded-lg border border-[#DCE6F5] bg-white px-2.5 py-1 text-left text-xs text-[#24344D] hover:bg-[#F0F4FA] transition shadow-2xs"
              id="demo-user-selector-button"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3563A6] text-[10px] font-bold uppercase text-white">
                {currentUser?.username.substring(0, 2) || "LT"}
              </div>
              <div className="hidden md:block">
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-xs text-[#24344D]">{currentUser?.username || "Guest"}</span>
                  <span className={`rounded px-1.5 py-0.2 text-[9px] font-semibold border ${getRoleBadgeClass(currentUser?.role)}`}>
                    {currentUser?.role || "DEMO"}
                  </span>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-[#718096]" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#DCE6F5] bg-white p-2 shadow-lg z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-[#DCE6F5] text-xs">
                  <p className="font-semibold text-[#24344D]">Switch Demo Account</p>
                  <p className="text-[10px] text-[#718096] mt-0.5">
                    Toggle roles to test investor, auditor, and regulator permissions.
                  </p>
                </div>
                <div className="mt-1 space-y-1">
                  {demoUsers.map((u) => {
                    const isSelected = currentUser?.id === u.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchDemoUser(u);
                          setIsUserDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                          isSelected
                            ? "bg-[#E2ECFF] text-[#244C85] font-semibold border border-[#C4D9FF]"
                            : "text-[#24344D] hover:bg-[#F0F4FA]"
                        }`}
                      >
                        <div>
                          <div className="font-medium capitalize text-[#24344D]">{u.username}</div>
                          <div className="text-[10px] text-[#718096] font-mono">
                            {u.walletAddress.substring(0, 8)}...
                          </div>
                        </div>
                        <span className={`rounded px-1.5 py-0.2 text-[9px] font-semibold border ${getRoleBadgeClass(u.role)}`}>
                          {u.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
