import React from 'react';
import { Sparkles, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface WelcomeModalProps {
  onClose: () => void;
  onRefreshData?: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose, onRefreshData }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const steps = [
    'Click "Run ML Detection" in the top bar',
    'Choose a preset attack scenario or paste your own transaction JSON',
    'Click "Execute ML Pattern Detector" — Gemini AI will analyze the stream',
    'The result appears instantly in the Suspicious Pattern Feed below',
    'Click "Open Case" on any pattern to investigate the full network graph',
  ];

  const jsonExample = `[
  { "from": "ACC-001", "to": "ACC-002", "amount": 98000, "timestamp": "2024-01-16T10:00:00Z" },
  { "from": "ACC-003", "to": "ACC-002", "amount": 95000, "timestamp": "2024-01-16T10:15:00Z" }
]`;
  const API_BASE = import.meta.env.VITE_API_URL || ''
  const handlegetStarted = () => {
    onClose();

    fetch(`${API_BASE}/api/health`)
      .then((res) => {
        if (!res.ok) {
          console.warn("Server is not healthy...");
        }
        if (res.ok) {
          console.log('From Server:', res);
          if (onRefreshData) {
            onRefreshData();
          }
        }
      })
      .catch((err) => {
        console.error('Server health check failed:', err);
      })
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div
        className={`border rounded-2xl max-w-[560px] w-full p-6 space-y-5 my-auto shadow-2xl animate-in fade-in zoom-in duration-200 relative ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#161926] border-[#232738] text-slate-200'
          }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Sparkles className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Welcome to FraudTrace</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Financial Crime Pattern Detection Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={handlegetStarted}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#232738] text-slate-400'
              }`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1 - What this is */}
        <div
          className={`p-3.5 rounded-xl text-xs leading-relaxed border ${isLight ? 'bg-indigo-50/50 border-indigo-100 text-slate-700' : 'bg-indigo-950/30 border-indigo-500/20 text-slate-300'
            }`}
        >
          <p>
            <strong className=" font-semibold">FraudTrace</strong> detects financial crime patterns (smurfing, layering, round-tripping, mule chains) that are invisible at the transaction level but emerge across accounts and time.
          </p>
        </div>

        {/* Section 2 - How to get started */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            How to{' '}
            <span className="bg-amber-400 text-black px-1 py-0.5 rounded">
              Get Started
            </span>
          </h3>
          <ol className="space-y-2">
            {steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs">
                <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* JSON Format Hint */}
        <div className="space-y-1.5">
          <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Expected Transaction JSON Format
          </span>
          <pre
            className={`p-3 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto border ${isLight
              ? 'bg-slate-50 border-slate-200 text-slate-800'
              : 'bg-[#0f1117] border-[#232738] text-slate-300'
              }`}
          >
            {jsonExample}
          </pre>
          <p className={`text-[11px] italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Each object is one transaction. <code className="font-mono text-indigo-400">from</code> and <code className="font-mono text-indigo-400">to</code> are account IDs, <code className="font-mono text-indigo-400">amount</code> is in ₹, <code className="font-mono text-indigo-400">timestamp</code> is ISO 8601.
          </p>
        </div>

        {/* CTA Button */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={handlegetStarted}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-500 hover:border-amber-500 text-black font-bold rounded-xl px-8 py-2.5 text-sm transition-all shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
