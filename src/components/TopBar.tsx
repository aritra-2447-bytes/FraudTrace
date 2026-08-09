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
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
      <div className="flex flex-col gap-5 mb-6">
        {/* Brand Header & Control Row - Flat layout with NO enclosing card */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2 px-1">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onNavigateHome}>
            <div className="w-11 h-11 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`text-2xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  FraudTrace
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                PRO INTEL v2.4
              </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Financial Crime & Cross-Account Pattern Detection Engine
              </p>
            </div>
          </div>

          {/* Global Search & Actions */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full lg:w-auto">
            <div className="relative flex-1 lg:w-[320px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                  type="text"
                  placeholder="Search Pattern ID, Account..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full border rounded-xl pl-10 pr-4 h-11 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
                      isLight
                          ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                          : 'bg-[#161926] border-[#232738] text-slate-200 placeholder-slate-500'
                  }`}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                  onClick={onOpenDetectionModal}
                  className="flex items-center justify-center gap-2 px-4 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Run ML Detection</span>
              </button>

              {activeScreen === 'case' && (
                  <button
                      onClick={onNavigateHome}
                      className={`flex items-center justify-center gap-2 px-3.5 h-11 font-semibold text-xs rounded-xl border transition-colors cursor-pointer ${
                          isLight
                              ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-[#161926] hover:bg-[#222638] text-slate-200 border-[#232738]'
                      }`}
                  >
                    ← Back
                  </button>
              )}
            </div>
          </div>
        </div>

        {/* KPI Stat Cards Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* Card 1: Active Clusters */}
          <div
              className={`border p-4 sm:p-5 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#161926] border-[#232738]'
              }`}
          >
            <div className="space-y-1">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Active Clusters
            </span>
              <div className={`text-2xl sm:text-3xl font-extrabold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {summary.active_clusters}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-indigo-500 font-medium">
                <Activity className="w-3.5 h-3.5" />
                <span>Real-time graph analysis</span>
              </div>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0 self-start sm:self-auto">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Card 2: Flagged Transactions 24h */}
          <div
              className={`border p-4 sm:p-5 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#161926] border-[#232738]'
              }`}
          >
            <div className="space-y-1">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Flagged Txns (24h)
            </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-red-500">
                {summary.flagged_transactions_24h}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>+12.4% vs window</span>
              </div>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 self-start sm:self-auto">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Card 3: Accounts Under Watch */}
          <div
              className={`border p-4 sm:p-5 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#161926] border-[#232738]'
              }`}
          >
            <div className="space-y-1">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Accounts Watched
            </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-500">
                {summary.accounts_under_watch}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-500 font-medium">
                <Users className="w-3.5 h-3.5" />
                <span>Anomaly monitoring</span>
              </div>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 self-start sm:self-auto">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Card 4: Pending Cases */}
          <div
              className={`border p-4 sm:p-5 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#161926] border-[#232738]'
              }`}
          >
            <div className="space-y-1">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Pending Cases
            </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                {summary.pending_cases}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SLA &lt; 2h review</span>
              </div>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0 self-start sm:self-auto">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>
  );
};
