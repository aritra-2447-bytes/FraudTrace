import React from 'react';
import {
  ShieldAlert,
  Activity,
  Search,
  PlusCircle,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle2,
  Sun,
  Moon,
} from 'lucide-react';
import { DashboardSummary } from '../types';
import { useTheme } from '../context/ThemeContext';

interface TopBarProps {
  summary: DashboardSummary;
  onOpenDetectionModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeScreen: 'dashboard' | 'case';
  onNavigateHome: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
                                                summary,
                                                onOpenDetectionModal,
                                                searchQuery,
                                                setSearchQuery,
                                                activeScreen,
                                                onNavigateHome,
                                              }) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
      <div className="flex flex-col gap-5 mb-6">
        {/* Brand Header & Control Row */}
        <div
            className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border shadow-lg transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d2e] border-[#2a2d3e]'
            }`}
        >
          <div className="flex items-center gap-3 cursor-pointer" onClick={onNavigateHome}>
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-500 shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-xl font-bold tracking-tight font-mono ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  FraudTrace
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                Demo Version 1.6
              </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Financial Crime & Cross-Account Pattern Detection Engine
              </p>
            </div>
          </div>

          {/* Global Search, Actions & Theme Toggle */}
          <div className="flex items-center gap-3">
            <div className="relative min-w-[200px] sm:min-w-[280px] md:min-w-[320px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                  type="text"
                  placeholder="Search Pattern ID, Account, or Txn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
                      isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'
                          : 'bg-[#0f1117] border-[#2a2d3e] text-slate-200 placeholder-slate-500'
                  }`}
              />
            </div>

            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center gap-1.5 text-xs font-medium ${
                    isLight
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                        : 'bg-[#0f1117] hover:bg-[#2a2d3e] border-[#2a2d3e] text-amber-400'
                }`}
            >
              {isLight ? (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600" />
                  </>
              ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                  </>
              )}
            </button>

            <button
                onClick={onOpenDetectionModal}
                className="flex items-center gap-2 px-8.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-all shadow-md hover:shadow-indigo-500/20 cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Run ML Detection</span>
            </button>

            {activeScreen === 'case' && (
                <button
                    onClick={onNavigateHome}
                    className={`flex items-center gap-2 px-3.5 py-2 font-medium text-xs rounded-lg transition-colors cursor-pointer ${
                        isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            : 'bg-[#2a2d3e] hover:bg-[#32364c] text-slate-200'
                    }`}
                >
                  ← Back
                </button>
            )}
          </div>
        </div>

        {/* KPI Stat Cards Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Clusters */}
          <div
              className={`border p-4 rounded-xl relative overflow-hidden flex items-center justify-between shadow-sm transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d2e] border-[#2a2d3e]'
              }`}
          >
            <div className="space-y-1">
            <span className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Active Suspicious Clusters
            </span>
              <div className={`text-2xl font-bold font-mono ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {summary.active_clusters}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-indigo-500 font-medium">
                <Activity className="w-3.5 h-3.5" />
                <span>Real-time graph analysis</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Flagged Transactions 24h */}
          <div
              className={`border p-4 rounded-xl relative overflow-hidden flex items-center justify-between shadow-sm transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d2e] border-[#2a2d3e]'
              }`}
          >
            <div className="space-y-1">
            <span className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Flagged Transactions (24h)
            </span>
              <div className="text-2xl font-bold font-mono text-red-500">
                {summary.flagged_transactions_24h}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>+12.4% vs previous window</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Accounts Under Watch */}
          <div
              className={`border p-4 rounded-xl relative overflow-hidden flex items-center justify-between shadow-sm transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d2e] border-[#2a2d3e]'
              }`}
          >
            <div className="space-y-1">
            <span className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Accounts Under Watch
            </span>
              <div className="text-2xl font-bold font-mono text-amber-500">
                {summary.accounts_under_watch}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-500 font-medium">
                <Users className="w-3.5 h-3.5" />
                <span>Behavioral anomaly monitoring</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Pending Cases */}
          <div
              className={`border p-4 rounded-xl relative overflow-hidden flex items-center justify-between shadow-sm transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d2e] border-[#2a2d3e]'
              }`}
          >
            <div className="space-y-1">
            <span className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Pending Analyst Cases
            </span>
              <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
                {summary.pending_cases}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SLA Target: &lt; 2h review</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
  );
};
