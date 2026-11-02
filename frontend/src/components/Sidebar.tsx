import React from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Cpu,
  PieChart,
  Blocks,
  FileCheck2,
  Radar,
  ListOrdered,
  ShieldAlert,
  Settings,
  AlertCircle,
  Info,
  Heart,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export type NavTab =
  | "investor-overview"
  | "markets"
  | "terminal"
  | "portfolio"
  | "blockchain"
  | "audit"
  | "ai-surveillance"
  | "orders"
  | "auditor-portal"
  | "settings"
  | "about";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { currentUser } = useAuth();
  const isPrivileged = currentUser?.role === "AUDITOR" || currentUser?.role === "REGULATOR";

  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: "investor-overview",
      label: "Investor Overview",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: "markets",
      label: "Simulated Markets",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      id: "terminal",
      label: "Trading Terminal",
      icon: <Cpu className="h-4 w-4" />,
      badge: "DvP",
    },
    {
      id: "portfolio",
      label: "Holdings & P&L",
      icon: <PieChart className="h-4 w-4" />,
    },
    {
      id: "blockchain",
      label: "Blockchain Explorer",
      icon: <Blocks className="h-4 w-4" />,
    },
    {
      id: "audit",
      label: "Audit Console",
      icon: <FileCheck2 className="h-4 w-4" />,
      badge: "Tamper Proof",
    },
    {
      id: "ai-surveillance",
      label: "AI Surveillance",
      icon: <Radar className="h-4 w-4" />,
      badge: "FastAPI",
    },
    {
      id: "orders",
      label: "Order Management",
      icon: <ListOrdered className="h-4 w-4" />,
    },
    {
      id: "auditor-portal",
      label: "Auditor / Regulator",
      icon: <ShieldAlert className="h-4 w-4" />,
      badge: isPrivileged ? "Active" : "Protected",
    },
    {
      id: "settings",
      label: "System Settings",
      icon: <Settings className="h-4 w-4" />,
    },
    {
      id: "about",
      label: "About Project",
      icon: <Info className="h-4 w-4" />,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between py-3">
      <div className="space-y-4">
        {/* Navigation Section */}
        <div className="px-3">
          <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#718096]">
            Platform Modules
          </p>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`relative flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#E2ECFF] text-[#3563A6] font-semibold border-l-3 border-[#3563A6] shadow-2xs"
                      : "text-[#24344D] hover:bg-[#DEE7F4] hover:text-[#3563A6]"
                  }`}
                  id={`nav-tab-${item.id}`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className={isActive ? "text-[#3563A6]" : "text-[#718096]"}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-semibold ${
                        isActive
                          ? "bg-white text-[#3563A6] border border-[#C4D9FF]"
                          : "bg-white/80 text-[#718096] border border-[#D5E0F2]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Academic Sandbox Card with light amber background & subtle amber border */}
        <div className="mx-3 rounded-lg border border-[#FCDAA0] bg-[#FFF2D9] p-2.5 text-xs shadow-2xs">
          <div className="flex items-center space-x-1.5 text-[#9A6513] font-semibold text-[11px]">
            <AlertCircle className="h-3.5 w-3.5 text-[#D99A35]" />
            <span>Academic Sandbox</span>
          </div>
          <p className="text-[10px] text-[#8C5D10] mt-1 leading-snug">
            Simulated tokens &amp; synthetic tickers in ₹ INR. Zero real financial exposure.
          </p>
        </div>
      </div>

      {/* Footer Info & Attribution */}
      <div className="px-3 text-center border-t border-[#D5E0F2] pt-2 pb-1 space-y-1">
        <div className="text-[11px] text-[#718096] font-medium flex items-center justify-center">
          <span>Made with</span>
          <Heart className="inline-block h-3 w-3 mx-1 text-[#20A896] fill-[#20A896]" aria-label="love" />
          <span>by <strong className="font-semibold text-[#24344D]">Pushkar Soni</strong></span>
        </div>
        <div className="text-[9px] text-[#8A9BB2] font-mono">
          LedgerTrade v1.0 • Academic B.Tech
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar with soft blue-tinted background */}
      <aside className="hidden md:flex w-60 flex-col border-r border-[#D5E0F2] bg-[#E8EEF8]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onCloseMobile}></div>
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-[#E8EEF8] border-r border-[#D5E0F2] shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
