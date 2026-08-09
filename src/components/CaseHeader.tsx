import React from 'react';
import { PatternDetail, CaseStatus } from '../types';
import { ShieldAlert, ArrowLeft, Users, Calendar, Clock, DollarSign, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CaseHeaderProps {
  pattern: PatternDetail;
  onNavigateHome: () => void;
  onOpenEntityVerification: () => void;
}

export const CaseHeader: React.FC<CaseHeaderProps> = ({
  pattern,
  onNavigateHome,
  onOpenEntityVerification,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskColor = (score: number) => {
    if (score > 70) return 'bg-red-500/15 text-red-500 border-red-500/30';
    if (score >= 40) return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
    return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30';
  };

  return (
    <div
      className={`border rounded-xl p-5 shadow-lg space-y-4 mb-6 transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d2e] border-[#2a2d3e]'
      }`}
    >
      {/* Top Navigation & Title Bar */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
          isLight ? 'border-slate-200' : 'border-[#2a2d3e]'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className={`p-2 border rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                : 'bg-[#0f1117] border-[#2a2d3e] hover:bg-[#2a2d3e] text-slate-300'
            }`}
            title="Back to Main Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl font-bold font-mono ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Case Report: {pattern.pattern_id}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold font-mono rounded bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 uppercase">
                {pattern.pattern_type}
              </span>
              <span
                className={`px-2.5 py-0.5 text-xs font-bold font-mono rounded border uppercase ${
                  pattern.status === 'open'
                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                    : pattern.status === 'under_review'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                }`}
              >
                {pattern.status.replace('_', ' ')}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {pattern.description || 'Automated multi-account graph anomaly cluster investigation'}
            </p>
          </div>
        </div>

        {/* Risk Badge & Deep Audit Trigger */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-[10px] font-mono uppercase ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>
              ML Anomaly Score
            </div>
            <div
              className={`inline-block px-3 py-1 rounded-lg border text-sm font-bold font-mono ${getRiskColor(
                pattern.risk_score
              )}`}
            >
              {pattern.risk_score} / 100
            </div>
          </div>

          <button
            onClick={onOpenEntityVerification}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-colors shadow-md hover:shadow-red-500/20 flex items-center gap-2 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Deep Telematics Audit</span>
          </button>
        </div>
      </div>

      {/* Case Key Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className={`p-3 border rounded-lg ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f1117] border-[#2a2d3e]'}`}>
          <div className={`flex items-center gap-1.5 text-[11px] mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Total Value Moved</span>
          </div>
          <div className="text-base font-bold text-emerald-600">
            {formatRupees(pattern.total_amount)}
          </div>
        </div>

        <div className={`p-3 border rounded-lg ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f1117] border-[#2a2d3e]'}`}>
          <div className={`flex items-center gap-1.5 text-[11px] mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Accounts Involved</span>
          </div>
          <div className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
            {pattern.accounts_involved} Node Accounts
          </div>
        </div>

        <div className={`p-3 border rounded-lg ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f1117] border-[#2a2d3e]'}`}>
          <div className={`flex items-center gap-1.5 text-[11px] mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>First Detected</span>
          </div>
          <div className={`font-semibold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            {new Date(pattern.first_seen).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        <div className={`p-3 border rounded-lg ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f1117] border-[#2a2d3e]'}`}>
          <div className={`flex items-center gap-1.5 text-[11px] mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span>Activity Window</span>
          </div>
          <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            {pattern.time_span_hours} Hours Duration
          </div>
        </div>
      </div>
    </div>
  );
};
