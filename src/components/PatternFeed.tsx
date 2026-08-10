import React, { useState } from 'react';
import { SuspiciousPattern, PatternType } from '../types';
import { ExternalLink, Filter, Layers, Zap, RefreshCw, GitBranch } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface PatternFeedProps {
  patterns: SuspiciousPattern[];
  onOpenCase: (patternId: string) => void;
  searchQuery: string;
}

export const PatternFeed: React.FC<PatternFeedProps> = ({
                                                          patterns,
                                                          onOpenCase,
                                                          searchQuery,
                                                        }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [selectedType, setSelectedType] = useState<string>('all');

  // Filter patterns
  const filteredPatterns = patterns.filter((pattern) => {
    const matchesSearch =
        pattern.pattern_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pattern.pattern_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pattern.description && pattern.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType =
        selectedType === 'all' || pattern.pattern_type.toLowerCase() === selectedType.toLowerCase();

    return matchesSearch && matchesType;
  });

  const getRiskBadgeColor = (score: number) => {
    if (score > 70) {
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    }
    if (score >= 40) {
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  };

  const getPatternIcon = (type: PatternType) => {
    switch (type) {
      case 'smurfing':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'layering':
        return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
      case 'round-tripping':
        return <RefreshCw className="w-3.5 h-3.5 text-purple-400" />;
      case 'mule chain':
        return <GitBranch className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <Zap className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
      <div
          className={`border rounded-2xl p-4 sm:p-5 flex flex-col h-full transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161926] border-[#232738]'
          }`}
      >
        {/* Header & Filter Controls */}
        <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b ${
                isLight ? 'border-slate-200' : 'border-[#232738]'
            }`}
        >
          <div>
            <h2 className={`text-base font-extrabold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              <span>Suspicious Pattern Feed</span>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              {filteredPatterns.length} detected
            </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Ranked by ML anomaly risk score descending
            </p>
          </div>

          {/* Filter Pills - Mobile Touch Friendly Horizontal Scroll */}
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0 custom-scrollbar -mx-1 px-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0 hidden sm:block" />
            {['all', 'smurfing', 'layering', 'round-tripping', 'mule chain'].map((type) => (
                <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-1.5 rounded-xl capitalize font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                        selectedType === type
                            ? 'bg-indigo-600 text-white'
                            : isLight
                                ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                                : 'bg-[#0f1117] text-slate-400 hover:text-slate-200 border border-[#232738]'
                    }`}
                >
                  {type}
                </button>
            ))}
          </div>
        </div>

        {/* Pattern Feed List */}
        <div className="overflow-y-auto space-y-3 pr-1 max-h-[520px] custom-scrollbar">
          {filteredPatterns.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No suspicious patterns matching current criteria.
              </div>
          ) : (
              filteredPatterns.map((pattern) => (
                  <div
                      key={pattern.pattern_id}
                      className={`border hover:border-indigo-500/50 p-4 rounded-xl transition-all duration-200 group flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isLight
                              ? 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                              : 'bg-[#0f1117] border-[#232738] hover:border-indigo-500/40'
                      }`}
                  >
                    {/* Info Column */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                  <span
                      className={`text-sm font-extrabold transition-colors group-hover:text-indigo-600 ${
                          isLight ? 'text-slate-900' : 'text-slate-100'
                      }`}
                  >
                    {pattern.pattern_id}
                  </span>

                        {/* Pattern Type Pill */}
                        <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                                isLight
                                    ? 'bg-white border-slate-200 text-slate-700'
                                    : 'bg-[#161926] border-[#232738] text-slate-200'
                            }`}
                        >
                    {getPatternIcon(pattern.pattern_type)}
                          <span>{pattern.pattern_type}</span>
                  </span>

                        {/* Case Status Pill */}
                        <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                pattern.status === 'open'
                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    : pattern.status === 'under_review'
                                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            }`}
                        >
                    {pattern.status.replace('_', ' ')}
                  </span>
                      </div>

                      <p className={`text-xs line-clamp-2 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {pattern.description}
                      </p>

                      {/* Metrics Breakdown */}
                      <div
                          className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-1 ${
                              isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}
                      >
                        <div>
                          Nodes:{' '}
                          <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {pattern.accounts_involved}
                    </span>
                        </div>
                        <div>
                          Total:{' '}
                          <span className="text-emerald-600 font-bold">
                      {formatRupees(pattern.total_amount)}
                    </span>
                        </div>
                        <div>
                          Span:{' '}
                          <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {pattern.time_span_hours}h
                    </span>
                        </div>
                      </div>
                    </div>

                    {/* Action & Risk Badge Column */}
                    <div
                        className={`flex items-end justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 ${
                            isLight ? 'border-slate-200' : 'border-[#232738]'
                        }`}
                    >
                      {/* Risk Score Badge */}
                      <div className="flex flex-col items-start md:items-end">
                        <div className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          Risk Score
                        </div>
                        <div
                            className={`inline-flex items-center justify-center px-3.5 h-10 rounded-xl border text-xs font-bold ${getRiskBadgeColor(
                                pattern.risk_score
                            )}`}
                        >
                          {pattern.risk_score} / 100
                        </div>
                      </div>

                      {/* Open Case Button */}
                      <button
                          onClick={() => onOpenCase(pattern.pattern_id)}
                          className="flex items-center justify-center gap-1.5 px-4 h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap min-w-[100px]"
                      >
                        <span>Open Case</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
              ))
          )}
        </div>
      </div>
  );
};
