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
      className={`border rounded-2xl p-4 sm:p-5 flex flex-col space-y-3 transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#161926] border-[#232738]'
      }`}
    >
      {/* Table Header & Search */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
          isLight ? 'border-slate-200' : 'border-[#232738]'
        }`}
      >
        <div>
          <h3 className={`text-sm font-extrabold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
            Pattern Transaction Ledger ({transactions.length} Txns)
          </h3>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
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
            className={`rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 w-full sm:w-60 border min-h-[36px] ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                : 'bg-[#0f1117] border-[#232738] text-slate-200 placeholder-slate-500'
            }`}
          />
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs">
          <thead>
            <tr
              className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-[#0f1117] text-slate-400 border-[#232738]'
              }`}
            >
              <th className="p-3">Txn ID</th>
              <th className="p-3">From Account</th>
              <th className="p-3">To Account</th>
              <th className="p-3 text-right">Amount (₹)</th>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Suspicious Flag Reason</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-[#232738]'}`}>
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
                  className={`transition-colors ${
                    isLight ? 'hover:bg-slate-50' : 'hover:bg-[#0f1117]/60'
                  }`}
                >
                  <td className="p-3 font-extrabold text-indigo-600 dark:text-indigo-400">
                    <div className="flex items-center gap-1.5">
                      <span>{tx.txn_id}</span>
                      <button
                        onClick={() => handleCopy(tx.txn_id)}
                        className={`p-1 cursor-pointer ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                        title="Copy Txn ID"
                      >
                        {copiedId === tx.txn_id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className={`p-3 font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{tx.from_account}</td>
                  <td className={`p-3 font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{tx.to_account}</td>
                  <td className="p-3 text-right font-bold text-emerald-600">
                    {formatRupees(tx.amount)}
                  </td>
                  <td className={`p-3 whitespace-nowrap ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {new Date(tx.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className={`p-3 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <span className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-500 border border-red-500/20 text-[11px] inline-block font-semibold">
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
        className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs border-t ${
          isLight ? 'border-slate-200 text-slate-500' : 'border-[#232738] text-slate-400'
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
            className={`p-2 rounded-lg border disabled:opacity-40 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
              isLight ? 'bg-slate-100 border-slate-200 hover:bg-slate-200' : 'bg-[#0f1117] border-[#232738] hover:bg-[#232738]'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className={`font-bold px-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg border disabled:opacity-40 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
              isLight ? 'bg-slate-100 border-slate-200 hover:bg-slate-200' : 'bg-[#0f1117] border-[#232738] hover:bg-[#232738]'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
