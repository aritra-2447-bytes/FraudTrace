import React, { useState } from 'react';
import { PatternDetail, CaseStatus } from '../types';
import { Save, ShieldCheck, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CaseActionsPanelProps {
  pattern: PatternDetail;
  onUpdateStatus: (newStatus: CaseStatus, newNotes: string) => Promise<void>;
  onOpenEntityVerification: () => void;
}

export const CaseActionsPanel: React.FC<CaseActionsPanelProps> = ({
                                                                    pattern,
                                                                    onUpdateStatus,
                                                                    onOpenEntityVerification,
                                                                  }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [status, setStatus] = useState<CaseStatus>(pattern.status);
  const [notes, setNotes] = useState<string>(pattern.notes || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdateStatus(status, notes);
    setSaving(false);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 2000);
  };

  return (
      <div
          className={`border rounded-2xl p-4 sm:p-5 transition-colors space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161926] border-[#232738]'
          }`}
      >
        <div
            className={`pb-3 border-b flex items-center justify-between ${
                isLight ? 'border-slate-200' : 'border-[#232738]'
            }`}
        >
          <div>
            <h3 className={`text-sm font-extrabold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              Analyst Action & Disposition Panel
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Case status controls & compliance escalation triggers
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Status Dropdown */}
          <div>
            <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Case Status Disposition
            </label>
            <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CaseStatus)}
                className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-semibold capitalize cursor-pointer border min-h-[40px] ${
                    isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-[#0f1117] border-[#232738] text-slate-200'
                }`}
            >
              <option value="open">Open (Active Investigation)</option>
              <option value="under_review">Under Review (Compliance Flagged)</option>
              <option value="resolved">Resolved (Closed / Actioned)</option>
            </select>
          </div>

          {/* Analyst Notes */}
          <div>
            <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Investigative Notes & Case Log
            </label>
            <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Document key findings, inter-bank SAR filings, or rationale..."
                className={`w-full rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 resize-none border ${
                    isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        : 'bg-[#0f1117] border-[#232738] text-slate-200 placeholder-slate-500'
                }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save & Update'}</span>
            </button>

            <button
                onClick={onOpenEntityVerification}
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 h-11 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Escalate & Verify Registry</span>
            </button>
          </div>

          {successMsg && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded text-center justify-center font-mono animate-in fade-in font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Case status successfully updated!</span>
              </div>
          )}
        </div>
      </div>
  );
};
