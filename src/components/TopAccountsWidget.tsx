import React, { useState } from 'react';
import { FlaggedAccount } from '../types';
import { ShieldAlert, UserX, AlertOctagon, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface TopAccountsWidgetProps {
  accounts: FlaggedAccount[];
}

export const TopAccountsWidget: React.FC<TopAccountsWidgetProps> = ({ accounts }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [selectedAccount, setSelectedAccount] = useState<FlaggedAccount | null>(null);

  const getRiskColor = (score: number) => {
    if (score > 90) return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (score > 70) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  };

  return (
    <div
      className={`border rounded-2xl p-4 sm:p-5 flex flex-col transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#161926] border-[#232738]'
      }`}
    >
      <div
        className={`flex items-center justify-between pb-3 mb-3 border-b ${
          isLight ? 'border-slate-200' : 'border-[#232738]'
        }`}
      >
        <div>
          <h3 className={`text-sm font-extrabold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
            <UserX className="w-4 h-4 text-red-500" />
            <span>Top Flagged Accounts</span>
          </h3>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Highest individual risk profile</p>
        </div>
        <span className={`text-[11px] font-bold ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Ranked Top 5</span>
      </div>

      <div className="space-y-2.5">
        {accounts.slice(0, 5).map((acc, index) => (
          <div
            key={acc.account_id}
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
              isLight
                ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                : 'bg-[#0f1117] border-[#232738] hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-extrabold ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-500'
                    : 'bg-[#161926] border-[#232738] text-slate-400'
                }`}
              >
                #{index + 1}
              </span>
              <div>
                <div className={`text-xs font-extrabold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                  {acc.account_id}
                </div>
                <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {acc.linked_suspicious_txns} suspicious txns
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-md border text-xs font-bold ${getRiskColor(
                  acc.risk_score
                )}`}
              >
                {acc.risk_score}
              </span>
              <button
                onClick={() => setSelectedAccount(acc)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer min-h-[36px] px-2 flex items-center justify-center"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick View Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`border rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161926] border-[#232738] text-slate-100'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-[#232738]'}`}>
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                <h4 className="font-extrabold text-base">
                  Account Dossier: {selectedAccount.account_id}
                </h4>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`flex justify-between p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f1117] border-[#232738]'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Calculated Anomaly Score:</span>
                <span className="font-extrabold text-red-500">
                  {selectedAccount.risk_score} / 100
                </span>
              </div>
              <div className={`flex justify-between p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f1117] border-[#232738]'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Linked Suspicious Txns:</span>
                <span className="font-bold">
                  {selectedAccount.linked_suspicious_txns}
                </span>
              </div>
              <div className={`flex justify-between p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f1117] border-[#232738]'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Holder Classification:</span>
                <span className="font-bold text-indigo-500">
                  {selectedAccount.holder_category || 'High-Frequency Trader'}
                </span>
              </div>
              <div className={`p-3 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0f1117] border-[#232738]'}`}>
                <div className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Primary Risk Flag:</div>
                <div className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                  {selectedAccount.primary_flag || 'High-frequency structuring nexus node with rapid pass-through.'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAccount(null)}
                className="px-5 h-10 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500 cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
