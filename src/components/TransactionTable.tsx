import React, { useState } from 'react';
import { PatternTransaction } from '../types';
import { Search, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface TransactionTableProps {
  transactions: PatternTransaction[];
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const pageSize = 5;

  const filtered = transactions.filter(
    (t) =>
      t.txn_id.toLowerCase().includes(search.toLowerCase()) ||
      t.from_account.toLowerCase().includes(search.toLowerCase()) ||
      t.to_account.toLowerCase().includes(search.toLowerCase()) ||
      t.flag_reason.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div
      className={`border rounded-xl p-4 flex flex-col shadow-lg space-y-3 transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d2e] border-[#2a2d3e]'
      }`}
    >
      {/* Table Header & Search */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
          isLight ? 'border-slate-200' : 'border-[#2a2d3e]'
        }`}
      >
        <div>
          <h3 className={`text-sm font-bold font-mono ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
            Pattern Transaction Ledger ({transactions.length} Txns)
          </h3>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Individual fund transfers flagged in this suspicious cluster
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search txn, account, reason..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className={`rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 w-full sm:w-60 border ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                : 'bg-[#0f1117] border-[#2a2d3e] text-slate-200 placeholder-slate-500'
            }`}
          />
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr
              className={`border-b font-mono text-[11px] uppercase tracking-wider ${
                isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-[#0f1117] text-slate-400 border-[#2a2d3e]'
              }`}
            >
              <th className="p-2.5">Txn ID</th>
              <th className="p-2.5">From Account</th>
              <th className="p-2.5">To Account</th>
              <th className="p-2.5 text-right">Amount (₹)</th>
              <th className="p-2.5">Timestamp</th>
              <th className="p-2.5">Suspicious Flag Reason</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-[#2a2d3e]'}`}>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">
                  No transactions found matching criteria.
                </td>
              </tr>
            ) : (
              paginated.map((tx) => (
                <tr
                  key={tx.txn_id}
                  className={`transition-colors font-mono ${
                    isLight ? 'hover:bg-slate-50' : 'hover:bg-[#0f1117]/60'
                  }`}
                >
                  <td className="p-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                    <div className="flex items-center gap-1.5">
                      <span>{tx.txn_id}</span>
                      <button
                        onClick={() => handleCopy(tx.txn_id)}
                        className={`p-0.5 cursor-pointer ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                        title="Copy Txn ID"
                      >
                        {copiedId === tx.txn_id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className={`p-2.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{tx.from_account}</td>
                  <td className={`p-2.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{tx.to_account}</td>
                  <td className="p-2.5 text-right font-bold text-emerald-600 font-mono">
                    {formatRupees(tx.amount)}
                  </td>
                  <td className={`p-2.5 whitespace-nowrap ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {new Date(tx.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className={`p-2.5 font-sans ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 text-[11px] inline-block font-medium">
                      {tx.flag_reason}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div
        className={`flex items-center justify-between pt-2 text-xs border-t ${
          isLight ? 'border-slate-200 text-slate-500' : 'border-[#2a2d3e] text-slate-400'
        }`}
      >
        <div>
          Showing {paginated.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`p-1 rounded border disabled:opacity-40 cursor-pointer ${
              isLight ? 'bg-slate-100 border-slate-200 hover:bg-slate-200' : 'bg-[#0f1117] border-[#2a2d3e] hover:bg-[#2a2d3e]'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`p-1 rounded border disabled:opacity-40 cursor-pointer ${
              isLight ? 'bg-slate-100 border-slate-200 hover:bg-slate-200' : 'bg-[#0f1117] border-[#2a2d3e] hover:bg-[#2a2d3e]'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
