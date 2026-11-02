import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Navbar } from "./components/Navbar";
import { Sidebar, NavTab } from "./components/Sidebar";
import { ProjectGuideModal } from "./components/ProjectGuideModal";

import { InvestorDashboard } from "./pages/InvestorDashboard";
import { MarketsPage } from "./pages/MarketsPage";
import { TradingTerminal } from "./pages/TradingTerminal";
import { PortfolioPage } from "./pages/PortfolioPage";
import { BlockchainExplorer } from "./pages/BlockchainExplorer";
import { AuditConsole } from "./pages/AuditConsole";
import { AISurveillance } from "./pages/AISurveillance";
import { OrderManagement } from "./pages/OrderManagement";
import { AuditorDashboard } from "./pages/AuditorDashboard";
import { SettingsPage } from "./pages/SettingsPage";
import { AboutProject } from "./pages/AboutProject";
import { LoginRegister } from "./pages/LoginRegister";

const MainContent: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>("investor-overview");
  const [terminalSymbol, setTerminalSymbol] = useState("AAPL");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleNavigateToTerminal = (symbol: string) => {
    setTerminalSymbol(symbol);
    setActiveTab("terminal");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F4FA] text-[#24344D]">
        <div className="flex flex-col items-center space-y-2.5">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#3563A6] border-t-transparent" />
          <p className="text-xs text-[#718096] font-mono">Initializing LedgerTrade Node Environment...</p>
        </div>
      </div>
    );
  }

  // If user explicitly requests login/register screen or hasn't selected account
  if (showAuthModal || !currentUser) {
    return (
      <div className="min-h-screen bg-[#F0F4FA]">
        <LoginRegister onSuccess={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F0F4FA] text-[#24344D]">
      {/* Top Fixed Header */}
      <Navbar
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Persistent Desktop Sidebar & Mobile Drawer */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 bg-[#F0F4FA]">
          <div className="mx-auto max-w-7xl">
            {activeTab === "investor-overview" && (
              <InvestorDashboard onNavigateToTerminal={handleNavigateToTerminal} />
            )}
            {activeTab === "markets" && (
              <MarketsPage onNavigateToTerminal={handleNavigateToTerminal} />
            )}
            {activeTab === "terminal" && (
              <TradingTerminal initialSymbol={terminalSymbol} />
            )}
            {activeTab === "portfolio" && <PortfolioPage />}
            {activeTab === "blockchain" && <BlockchainExplorer />}
            {activeTab === "audit" && <AuditConsole />}
            {activeTab === "ai-surveillance" && <AISurveillance />}
            {activeTab === "orders" && <OrderManagement />}
            {activeTab === "auditor-portal" && <AuditorDashboard />}
            {activeTab === "settings" && <SettingsPage />}
            {activeTab === "about" && (
              <AboutProject
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenGuide={() => setIsGuideOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Interactive Project Guide Modal */}
      <ProjectGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
