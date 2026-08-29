import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { PatternFeed } from './components/PatternFeed';
import { TopAccountsWidget } from './components/TopAccountsWidget';
import { RiskTimeline } from './components/RiskTimeline';
import { CaseHeader } from './components/CaseHeader';
import { NetworkGraph } from './components/NetworkGraph';
import { TransactionTable } from './components/TransactionTable';
import { AiBriefPanel } from './components/AiBriefPanel';
import { CaseActionsPanel } from './components/CaseActionsPanel';
import { EntityVerificationModal } from './components/EntityVerificationModal';
import { RunDetectionModal } from './components/RunDetectionModal';
import { WelcomeModal } from './components/WelcomeModal';
import { ShapeGrid } from './components/ShapeGrid';
import { useTheme } from './context/ThemeContext';
import {
  DashboardSummary,
  SuspiciousPattern,
  TimelineData,
  FlaggedAccount,
  PatternDetail,
  EntityInvestigation,
  CaseStatus,
  ModelDetectionResponse,
} from './types';
import {
  INITIAL_SUMMARY,
  INITIAL_PATTERNS,
  INITIAL_TIMELINE,
  TOP_FLAGGED_ACCOUNTS,
  getMockPatternDetail,
  getMockEntityInvestigation,
} from './data/mockData';
import { ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  // Navigation Routing State
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dashboard & Case Data States (Fetched dynamically from backend server)
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [patterns, setPatterns] = useState<SuspiciousPattern[]>([]);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [flaggedAccounts, setFlaggedAccounts] = useState<FlaggedAccount[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);

  // Active Case Detail State
  const [activePatternDetail, setActivePatternDetail] = useState<PatternDetail | null>(null);
  const [activeEntityInvestigation, setActiveEntityInvestigation] = useState<EntityInvestigation | null>(null);
  const [loadingCase, setLoadingCase] = useState<boolean>(false);
  const [caseError, setCaseError] = useState<string | null>(null);

  // Modals state
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [showEntityModal, setShowEntityModal] = useState<boolean>(false);
  const [showDetectionModal, setShowDetectionModal] = useState<boolean>(false);

  //Server waking up
  const [isServerReady, setIsServerReady] = useState<boolean>(false);
  const [isWakingServer, setIsWakingServer] = useState<boolean>(true);

  const handleResetLiveState = () => {
    setPatterns([]);
    setSummary({
      active_clusters: 0,
      flagged_transactions_24h: 0,
      accounts_under_watch: 0,
      pending_cases: 0,
    });
    setTimeline([]);
    setFlaggedAccounts([]);
    setActivePatternDetail(null);
    setActiveEntityInvestigation(null);
  };

  // Sync URL changes with router state
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch Dashboard Master Data with Graceful Mock Fallbacks
  const fetchDashboardData = async () => {
    const API_BASE = import.meta.env.VITE_API_URL || '';
    try {
      setLoadingDashboard(true);
      const [sumRes, patRes, timeRes, accRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/summary`).catch(() => null),
        fetch(`${API_BASE}/api/patterns`).catch(() => null),
        fetch(`${API_BASE}/api/dashboard/timeline`).catch(() => null),
        fetch(`${API_BASE}/api/accounts/flagged`).catch(() => null),
      ]);

      if (sumRes && sumRes.ok) setSummary(await sumRes.json());
      else setSummary(INITIAL_SUMMARY);

      if (patRes && patRes.ok) setPatterns(await patRes.json());
      else setPatterns(INITIAL_PATTERNS);

      if (timeRes && timeRes.ok) setTimeline(await timeRes.json());
      else setTimeline(INITIAL_TIMELINE);

      if (accRes && accRes.ok) setFlaggedAccounts(await accRes.json());
      else setFlaggedAccounts(TOP_FLAGGED_ACCOUNTS);
    } catch (err) {
      console.warn('Backend endpoint unreachable, falling back to local mock data:', err);
      setSummary(INITIAL_SUMMARY);
      setPatterns(INITIAL_PATTERNS);
      setTimeline(INITIAL_TIMELINE);
      setFlaggedAccounts(TOP_FLAGGED_ACCOUNTS);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || '';

    // Proactive ping to wake Render immediately on load
    const pingServer = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        if (res.ok) {
          setIsServerReady(true);
          console.log("Ping ");
          setIsWakingServer(false);
        }
      } catch {
        // Server still sleeping; start background polling
        pollServerHealth();
      }
    };

    const pollServerHealth = () => {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/health`);
          if (res.ok) {
            setIsServerReady(true);
            setIsWakingServer(false);
            clearInterval(interval);
          }
        } catch {
          // Keep retrying every 5 seconds until Render boots
        }
      }, 5000);
    };

    pingServer();
    fetchDashboardData();
  }, []);

  // Fetch Case Investigation Data with Graceful Mock Fallback
  const fetchCaseData = async (patternId: string) => {
    // If activePatternDetail is already populated for this case (e.g. from ML sandbox execution), preserve it
    if (activePatternDetail && activePatternDetail.pattern_id === patternId) {
      setLoadingCase(false);
      return;
    }

    const API_BASE = import.meta.env.VITE_API_URL || '';
    const fallbackDetail = getMockPatternDetail(patternId, patterns);
    const fallbackEntity = getMockEntityInvestigation(patternId);

    try {
      setLoadingCase(true);
      setCaseError(null);

      const [detailRes, entityRes] = await Promise.all([
        fetch(`${API_BASE}/api/patterns/${patternId}`).catch(() => null),
        fetch(`${API_BASE}/api/patterns/${patternId}/investigate-entity`).catch(() => null),
      ]);

      if (detailRes && detailRes.ok) {
        const detailData = await detailRes.json();
        setActivePatternDetail(detailData);
      } else {
        setActivePatternDetail(fallbackDetail);
      }

      if (entityRes && entityRes.ok) {
        const entityData = await entityRes.json();
        setActiveEntityInvestigation(entityData);
      } else {
        setActiveEntityInvestigation(fallbackEntity);
      }
    } catch (err: any) {
      console.warn(`Error loading case details from API for ${patternId}, using mock data fallback:`, err);
      setActivePatternDetail(fallbackDetail);
      setActiveEntityInvestigation(fallbackEntity);
    } finally {
      setLoadingCase(false);
    }
  };

  // Wire ML Detection Output to Live Dashboard State
  const handlePatternDetected = (
    newPatternId: string,
    detectedPattern: ModelDetectionResponse['patterns_detected'][0],
    rawTransactions: any[]
  ) => {
    const txns = Array.isArray(rawTransactions) ? rawTransactions : [];
    const firstSeen = txns[0]?.timestamp || new Date().toISOString();
    const lastSeen = txns[txns.length - 1]?.timestamp || firstSeen;

    const timeSpanMs = new Date(lastSeen).getTime() - new Date(firstSeen).getTime();
    const timeSpanHours = Math.max(1, Math.ceil(timeSpanMs / 3600000)) || 24;

    // 1. setPatterns -> prepend new SuspiciousPattern built from detectedPattern + rawTransactions
    const newPatternItem: SuspiciousPattern = {
      pattern_id: newPatternId,
      pattern_type: detectedPattern.pattern_type as any,
      accounts_involved: detectedPattern.accounts.length,
      total_amount: detectedPattern.total_amount,
      risk_score: detectedPattern.risk_score,
      first_seen: firstSeen,
      last_seen: lastSeen,
      time_span_hours: timeSpanHours,
      status: 'open',
      description: detectedPattern.explanation,
    };

    setPatterns((prev) => [newPatternItem, ...prev]);

    // 2. setSummary -> increment all 4 KPI fields
    setSummary((prev) => {
      const base = prev || {
        active_clusters: 0,
        flagged_transactions_24h: 0,
        accounts_under_watch: 0,
        pending_cases: 0,
      };
      return {
        active_clusters: base.active_clusters + 1,
        flagged_transactions_24h: base.flagged_transactions_24h + txns.length,
        accounts_under_watch: base.accounts_under_watch + detectedPattern.accounts.length,
        pending_cases: base.pending_cases + 1,
      };
    });

    // 3. setTimeline -> find today's date entry and increment pattern_count, or push a new entry
    const todayStr = new Date().toISOString().split('T')[0];
    setTimeline((prev) => {
      const exists = prev.some((item) => item.date === todayStr);
      const pType = detectedPattern.pattern_type;

      if (exists) {
        return prev.map((item) => {
          if (item.date === todayStr) {
            return {
              ...item,
              pattern_count: item.pattern_count + 1,
              smurfing_count: pType === 'smurfing' ? (item.smurfing_count || 0) + 1 : item.smurfing_count,
              layering_count: pType === 'layering' ? (item.layering_count || 0) + 1 : item.layering_count,
              mule_chain_count: pType === 'mule chain' ? (item.mule_chain_count || 0) + 1 : item.mule_chain_count,
            };
          }
          return item;
        });
      } else {
        const newEntry: TimelineData = {
          date: todayStr,
          pattern_count: 1,
          smurfing_count: pType === 'smurfing' ? 1 : 0,
          layering_count: pType === 'layering' ? 1 : 0,
          mule_chain_count: pType === 'mule chain' ? 1 : 0,
        };
        return [...prev, newEntry];
      }
    });

    // 3b. setFlaggedAccounts -> Build entries for detectedPattern.accounts, merge with existing, sort top 5
    setFlaggedAccounts((prev) => {
      const newEntries: FlaggedAccount[] = detectedPattern.accounts.map((accId) => ({
        account_id: accId,
        risk_score: detectedPattern.risk_score,
        linked_suspicious_txns: txns.filter(
          (t: any) => t.from === accId || t.to === accId
        ).length,
        primary_flag: detectedPattern.pattern_type,
        holder_category: accId.includes('HUB')
          ? 'Consolidation Hub'
          : accId.includes('MULE')
            ? 'Mule Account'
            : 'Participant',
      }));

      const merged = [...prev];
      for (const entry of newEntries) {
        const idx = merged.findIndex((a) => a.account_id === entry.account_id);
        if (idx !== -1) {
          merged[idx] = merged[idx].risk_score >= entry.risk_score ? merged[idx] : entry;
        } else {
          merged.push(entry);
        }
      }

      return merged.sort((a, b) => b.risk_score - a.risk_score).slice(0, 5);
    });

    // 4. setActivePatternDetail -> construct full PatternDetail with graph nodes/edges built from rawTransactions
    const uniqueAccountIds = Array.from(
      new Set([
        ...detectedPattern.accounts,
        ...txns.map((t: any) => t.from).filter(Boolean),
        ...txns.map((t: any) => t.to).filter(Boolean),
      ])
    );

    const nodes = uniqueAccountIds.map((accId) => {
      const totalSent = txns
        .filter((t: any) => t.from === accId)
        .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
      const totalReceived = txns
        .filter((t: any) => t.to === accId)
        .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

      const role = accId.includes('HUB')
        ? 'Consolidation Hub'
        : accId.includes('MULE')
          ? 'Mule Account'
          : 'Participant';

      return {
        id: accId,
        risk_score: detectedPattern.risk_score,
        total_sent: totalSent,
        total_received: totalReceived,
        role,
        account_name: accId,
        bank_name: accId.includes('HUB') ? 'HDFC Bank' : accId.includes('MULE') ? 'Canara Bank' : 'State Bank of India',
      };
    });

    const edges = txns.map((t: any, index: number) => ({
      id: `E-${newPatternId}-${index}`,
      source: t.from,
      target: t.to,
      amount: Number(t.amount) || 0,
      timestamp: t.timestamp || new Date().toISOString(),
    }));

    const transactions = txns.map((t: any, index: number) => ({
      txn_id: `TXN-${newPatternId}-${String(index + 1).padStart(3, '0')}`,
      from_account: t.from,
      to_account: t.to,
      amount: Number(t.amount) || 0,
      timestamp: t.timestamp || new Date().toISOString(),
      flag_reason: detectedPattern.explanation,
    }));

    const newDetail: PatternDetail = {
      pattern_id: newPatternId,
      pattern_type: detectedPattern.pattern_type as any,
      risk_score: detectedPattern.risk_score,
      status: 'open',
      total_amount: detectedPattern.total_amount,
      accounts_involved: detectedPattern.accounts.length,
      time_span_hours: timeSpanHours,
      first_seen: firstSeen,
      last_seen: lastSeen,
      description: detectedPattern.explanation,
      notes: 'Generated from Custom ML Anomaly Detection Sandbox',
      graph: {
        nodes,
        edges,
      },
      transactions,
    };

    setActivePatternDetail(newDetail);

    // Set entity investigation
    const primaryAcc = uniqueAccountIds[0] || 'ACC-001';
    setActiveEntityInvestigation({
      account_id: primaryAcc,
      device_telematics: {
        device_id: `DEV-${Math.floor(10000 + Math.random() * 90000)}`,
        device_model: 'Samsung Galaxy S23 Ultra',
        last_ip: '103.22.14.88',
        vpn_detected: true,
        last_location: {
          latitude: 22.5726,
          longitude: 88.3639,
          address: 'Kolkata, West Bengal, India',
          timestamp: lastSeen,
        },
      },
      government_verifications: {
        pan_verification: {
          status: 'VALID',
          name_match: 'MATCHED',
          tax_category: 'Corporate / Business',
        },
        gst_verification: {
          gstin: '19AAAAA0000A1Z5',
          status: 'ACTIVE',
          filing_compliance: 'REGULAR',
          registered_business: 'Apex Trading Corp Ltd',
        },
        tds_tax_deductions: {
          tds_claimed_last_fy: 45000,
          mismatch_flag: false,
        },
        aadhaar_verification: {
          status: 'VERIFIED',
          linked_mobile_match: true,
          biometric_lock_status: 'UNLOCKED',
        },
      },
    });
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle route matching
  const isCaseRoute = currentPath.startsWith('/case/');
  const activePatternId = isCaseRoute ? currentPath.split('/case/')[1] : null;

  useEffect(() => {
    if (activePatternId) {
      fetchCaseData(activePatternId);
    }
  }, [activePatternId]);

  // Handler to update case status
  const handleUpdateStatus = async (newStatus: CaseStatus, newNotes: string) => {
    if (!activePatternId) return;
    const API_BASE = import.meta.env.VITE_API_URL || '';

    try {
      const res = await fetch(`${API_BASE}/api/patterns/${activePatternId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes: newNotes }),
      }).catch(() => null);

      if (res && res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.warn('Failed to update pattern status on server, updating local state:', err);
    }

    // Always update local React state seamlessly
    if (activePatternDetail) {
      setActivePatternDetail({
        ...activePatternDetail,
        status: newStatus,
        notes: newNotes,
      });
    }
    setPatterns((prev) =>
      prev.map((p) => (p.pattern_id === activePatternId ? { ...p, status: newStatus } : p))
    );
  };

  return (
    <div
      className={`min-h-screen p-3 sm:p-6 lg:p-8 antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200 relative overflow-hidden ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#0b0d14] text-[#f1f5f9]'
        }`}
    >
      {/* Background Interactive ShapeGrid */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-25 dark:opacity-20 overflow-hidden">
        <div style={{ width: '1600px', height: '1080px', position: 'relative' }}>
          <ShapeGrid
            speed={0}
            squareSize={45}
            direction="down"
            borderColor="#999"
            hoverFillColor="#222"
            shape="square"
            hoverTrailAmount={0}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Navbar & KPI Summary */}
        <TopBar
          summary={
            summary || {
              active_clusters: 0,
              flagged_transactions_24h: 0,
              accounts_under_watch: 0,
              pending_cases: 0,
            }
          }
          onOpenDetectionModal={() => setShowDetectionModal(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeScreen={isCaseRoute ? 'case' : 'dashboard'}
          onNavigateHome={() => navigateTo('/')}
        />

        {/* SCREEN 1: Main Dashboard (/) */}
        {!isCaseRoute && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Center Grid: Pattern Feed (Left 65%) & Top Accounts Widget (Right 35%) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PatternFeed
                  patterns={patterns}
                  onOpenCase={(patternId) => navigateTo(`/case/${patternId}`)}
                  searchQuery={searchQuery}
                />
              </div>

              <div className="lg:col-span-1">
                <TopAccountsWidget accounts={flaggedAccounts} />
              </div>
            </div>

            {/* Bottom: Risk Timeline AreaChart */}
            <div>
              <RiskTimeline timeline={timeline} />
            </div>
          </div>
        )}

        {/* SCREEN 2: Case Investigation View (/case/:patternId) */}
        {isCaseRoute && (
          <div className="animate-in fade-in duration-200">
            {loadingCase ? (
              <div
                className={`border rounded-xl p-12 text-center space-y-3 ${isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#1a1d2e] border-[#2a2d3e] text-slate-400'
                  }`}
              >
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                <div className="font-mono text-sm">Fetching pattern topology & transaction ledger...</div>
              </div>
            ) : caseError || !activePatternDetail ? (
              <div
                className={`border rounded-xl p-8 text-center text-red-500 space-y-3 ${isLight ? 'bg-white border-red-200' : 'bg-[#1a1d2e] border-red-500/30'
                  }`}
              >
                <AlertCircle className="w-8 h-8 mx-auto" />
                <div className="font-bold text-base">Case Pattern Not Found</div>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {caseError || 'Requested pattern ID does not exist.'}
                </p>
                <button
                  onClick={() => navigateTo('/')}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium text-xs rounded-lg hover:bg-indigo-500 cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div>
                {/* Case Header */}
                <CaseHeader
                  pattern={activePatternDetail}
                  onNavigateHome={() => navigateTo('/')}
                  onOpenEntityVerification={() => setShowEntityModal(true)}
                />

                {/* Two Column Layout: Left (60%) / Right (40%) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column (60% width = 7/12 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Interactive Network Graph */}
                    <NetworkGraph graph={activePatternDetail.graph} />

                    {/* Paginated Transaction Table */}
                    <TransactionTable transactions={activePatternDetail.transactions} />
                  </div>

                  {/* Right Column (40% width = 5/12 cols) */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* LLM Brief Panel (Gemini API) */}
                    <AiBriefPanel
                      pattern={activePatternDetail}
                      entity={activeEntityInvestigation}
                    />

                    {/* Case Actions & Status Panel */}
                    <CaseActionsPanel
                      pattern={activePatternDetail}
                      onUpdateStatus={handleUpdateStatus}
                      onOpenEntityVerification={() => setShowEntityModal(true)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Entity Verification & Telematics Modal */}
        {showEntityModal && activeEntityInvestigation && activePatternDetail && (
          <EntityVerificationModal
            entity={activeEntityInvestigation}
            patternId={activePatternDetail.pattern_id}
            onClose={() => setShowEntityModal(false)}
          />
        )}

        {/* ML Model Detection Sandbox Modal */}
        {showDetectionModal && (
          <RunDetectionModal
            onClose={() => setShowDetectionModal(false)}
            onPatternDetected={handlePatternDetected}
            onOpenCase={(newPatternId) => {
              navigateTo(`/case/${newPatternId}`);
            }}
          />
        )}

        {/* Welcome Modal on Load */}
        {showWelcome && (
          <WelcomeModal
            onClose={() => {
              setShowWelcome(false);
            }}
            onRefreshData={handleResetLiveState}
          />
        )}

        {/* Professional Polish Footer */}
        <footer
          className={`mt-8 border-t p-3 px-1 flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2 transition-colors ${isLight
            ? 'border-slate-200 text-slate-500'
            : 'border-[#232738] text-slate-500'
            }`}
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 uppercase tracking-tight font-bold text-emerald-600 dark:text-[#22c55e]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>API Connectivity Stable</span>
            </span>
            <span className={`hidden md:inline opacity-60 border-l pl-4 ${isLight ? 'border-slate-200' : 'border-[#232738]'}`}>
              Region: AP-SOUTH-1 (Mumbai)
            </span>
          </div>
          <div className="flex items-center gap-4 font-semibold">
            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>FIN-GUARD ML Engine v2.4 PRO</span>
            <span className={`border-l pl-4 ${isLight ? 'border-slate-200 text-slate-500' : 'border-[#232738] text-slate-500'}`}>
              Session Secure
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
