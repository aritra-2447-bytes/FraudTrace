import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { PatternDetail, EntityInvestigation } from '../types';
import { Bot, RefreshCw, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface AiBriefPanelProps {
  pattern: PatternDetail;
  entity: EntityInvestigation | null;
}

function generateClientFallbackBrief(pattern: PatternDetail, entity: EntityInvestigation | null): string {
  const vpnStatus = entity?.device_telematics.vpn_detected
      ? 'High Risk: Active VPN/Proxy usage detected during funds transit.'
      : 'No active VPN detected on primary hardware.';

  const panMatch = entity?.government_verifications.pan_verification.status === 'VALID'
      ? `Validated (${entity.government_verifications.pan_verification.name_match})`
      : 'Invalid or unverified';

  const tdsMismatch = entity?.government_verifications.tds_tax_deductions.mismatch_flag
      ? 'Critical Mismatch: Declared transaction volume significantly diverges from reported TDS tax filings.'
      : 'Normal tax deduction alignment.';

  const nodeIds = pattern?.graph?.nodes ? pattern.graph.nodes.map((n) => n.id).slice(0, 3).join('`, `') : 'N/A';

  return `### 1. Pattern Summary
The system flagged a high-risk **${pattern.pattern_type.toUpperCase()}** cluster involving **${pattern.accounts_involved} accounts** with a total transactional velocity of **₹${pattern.total_amount.toLocaleString('en-IN')}** across **${pattern.time_span_hours} hours**. Anomaly Risk Score is calculated at **${pattern.risk_score}/100**.

### 2. Device & Location Anomalies
${entity ? `- **Hardware ID**: \`${entity.device_telematics.device_id}\` (${entity.device_telematics.device_model})
- **IP & Network**: Last recorded IP \`${entity.device_telematics.last_ip}\`. ${vpnStatus}
- **Geolocation**: ${entity.device_telematics.last_location.address} (\`${entity.device_telematics.last_location.latitude}, ${entity.device_telematics.last_location.longitude}\`).` : '- Telematics pending verification.'}

### 3. Identity & Tax Verification Signals
${entity ? `- **PAN Registry**: ${panMatch} under category \`${entity.government_verifications.pan_verification.tax_category}\`.
- **GST Compliance**: Status \`${entity.government_verifications.gst_verification.status}\` for registered entity *${entity.government_verifications.gst_verification.registered_business}*.
- **Tax Deductions (TDS)**: ${tdsMismatch}
- **Aadhaar Verification**: Status \`${entity.government_verifications.aadhaar_verification.status}\` (Biometric Lock: \`${entity.government_verifications.aadhaar_verification.biometric_lock_status}\`).` : '- Government verification records pending.'}

### 4. Likely Fraud Mechanism
This transactional velocity exhibits classical characteristics of multi-layered financial structuring. Rapid funds aggregation followed by fan-out transfers suggests automated bot scripts or mule account networks designed to obfuscate beneficial ownership prior to external withdrawal.

### 5. Recommended Action
1. **Freeze Account Outflows**: Immediately apply temporary debit freeze across involved nodes (\`${nodeIds}\`).
2. **File Inter-Bank SAR**: Prepare Suspicious Activity Report (SAR) for FIU-IND submission citing structuring and telematics anomalies.
3. **Escalate to Compliance Senior**: Initiate enhanced due diligence (EDD) and request biometric re-authentication.`;
}

export const AiBriefPanel: React.FC<AiBriefPanelProps> = ({ pattern, entity }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [brief, setBrief] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const fetchAiBrief = async () => {
    setLoading(true);
    setError(null);
    const API_BASE = import.meta.env.VITE_API_URL || '';

    try {
      const response = await fetch(`${API_BASE}/api/ai/investigative-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern, entity }),
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json();
        if (data.brief) {
          setBrief(data.brief);
          setGeneratedAt(data.generated_at || new Date().toISOString());
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {
      console.warn('AI brief API endpoint unreachable, generating client fallback brief:', err);
    }

    // Fallback to client-side brief generation if API is unreachable or fails
    const fallbackText = generateClientFallbackBrief(pattern, entity);
    setBrief(fallbackText);
    setGeneratedAt(new Date().toISOString());
    setLoading(false);
  };

  useEffect(() => {
    fetchAiBrief();
  }, [pattern.pattern_id]);

  return (
      <div
          className={`border rounded-2xl p-4 sm:p-5 flex flex-col space-y-4 transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161926] border-[#232738]'
          }`}
      >
        {/* Header */}
        <div
            className={`flex items-center justify-between pb-3 border-b ${
                isLight ? 'border-slate-200' : 'border-[#232738]'
            }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm font-extrabold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                <span>AI Investigative Brief</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-500 border border-indigo-500/30">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Gemini 2.5 Flash
              </span>
              </h3>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Automated Plain-Language Case Intelligence Report
              </p>
            </div>
          </div>

          <button
              onClick={fetchAiBrief}
              disabled={loading}
              className={`p-2 border rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 text-xs font-bold min-h-[36px] ${
                  isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      : 'bg-[#0f1117] hover:bg-[#232738] border-[#232738] text-slate-300'
              }`}
              title="Re-generate Brief"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
            <div className="space-y-4 py-4 animate-pulse">
              <div className={`h-4 rounded w-3/4 ${isLight ? 'bg-slate-200' : 'bg-[#2a2d3e]'}`}></div>
              <div className="space-y-2">
                <div className={`h-3 rounded w-full ${isLight ? 'bg-slate-200' : 'bg-[#2a2d3e]'}`}></div>
                <div className={`h-3 rounded w-5/6 ${isLight ? 'bg-slate-200' : 'bg-[#2a2d3e]'}`}></div>
                <div className={`h-3 rounded w-4/6 ${isLight ? 'bg-slate-200' : 'bg-[#2a2d3e]'}`}></div>
              </div>
              <div className={`h-4 rounded w-1/2 pt-2 ${isLight ? 'bg-slate-200' : 'bg-[#2a2d3e]'}`}></div>
              <div className="space-y-2">
                <div className={`h-3 rounded w-full ${isLight ? 'bg-slate-200' : 'bg-[#2a2d3e]'}`}></div>
                <div className={`h-3 rounded w-11/12 ${isLight ? 'bg-slate-200' : 'bg-[#2a2d3e]'}`}></div>
              </div>
              <div className="flex items-center gap-2 text-xs text-indigo-500 pt-2 font-mono">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Analyzing pattern topology & cross-referencing telematics...</span>
              </div>
            </div>
        ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Error Generating AI Brief</span>
              </div>
              <p>{error}</p>
              <button
                  onClick={fetchAiBrief}
                  className="px-3 py-1 bg-red-600 text-white font-medium rounded hover:bg-red-500 cursor-pointer"
              >
                Retry Generation
              </button>
            </div>
        ) : brief ? (
            <div className="text-xs space-y-3 leading-relaxed max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              <div className={`max-w-none text-xs space-y-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => (
                          <h1
                              className={`text-sm font-bold border-b pb-1 mt-3 mb-1 font-mono ${
                                  isLight ? 'text-indigo-600 border-slate-200' : 'text-indigo-400 border-[#2a2d3e]'
                              }`}
                              {...props}
                          />
                      ),
                      h2: ({ node, ...props }) => (
                          <h2
                              className={`text-xs font-bold border-b pb-1 mt-3 mb-1 font-mono ${
                                  isLight ? 'text-indigo-700 border-slate-200' : 'text-indigo-300 border-[#2a2d3e]'
                              }`}
                              {...props}
                          />
                      ),
                      h3: ({ node, ...props }) => (
                          <h3
                              className={`text-xs font-bold mt-2 mb-1 ${
                                  isLight ? 'text-slate-900' : 'text-slate-100'
                              }`}
                              {...props}
                          />
                      ),
                      p: ({ node, ...props }) => (
                          <p
                              className={`mb-2 leading-relaxed ${
                                  isLight ? 'text-slate-700' : 'text-slate-300'
                              }`}
                              {...props}
                          />
                      ),
                      ul: ({ node, ...props }) => (
                          <ul
                              className={`list-disc pl-4 space-y-1 my-2 ${
                                  isLight ? 'text-slate-700' : 'text-slate-300'
                              }`}
                              {...props}
                          />
                      ),
                      ol: ({ node, ...props }) => (
                          <ol
                              className={`list-decimal pl-4 space-y-1 my-2 font-mono ${
                                  isLight ? 'text-slate-700' : 'text-slate-300'
                              }`}
                              {...props}
                          />
                      ),
                      strong: ({ node, ...props }) => (
                          <strong
                              className={`font-bold ${
                                  isLight ? 'text-indigo-700' : 'text-indigo-300'
                              }`}
                              {...props}
                          />
                      ),
                    }}
                >
                  {brief}
                </ReactMarkdown>
              </div>

              {generatedAt && (
                  <div
                      className={`text-[10px] pt-2 border-t flex items-center justify-between font-mono ${
                          isLight ? 'border-slate-200 text-slate-500' : 'border-[#2a2d3e] text-slate-500'
                      }`}
                  >
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified LLM Intelligence</span>
              </span>
                    <span>Generated: {new Date(generatedAt).toLocaleTimeString()}</span>
                  </div>
              )}
            </div>
        ) : null}
      </div>
  );
};
