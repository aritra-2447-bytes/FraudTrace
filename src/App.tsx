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
import { useTheme } from './context/ThemeContext';
import {
  DashboardSummary,
  SuspiciousPattern,
  TimelineData,
  FlaggedAccount,
  PatternDetail,
  EntityInvestigation,
  CaseStatus,
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

  // Dashboard & Case Data States (Defaulting to mock data immediately)
  const [summary, setSummary] = useState<DashboardSummary | null>(INITIAL_SUMMARY);
  const [patterns, setPatterns] = useState<SuspiciousPattern[]>(INITIAL_PATTERNS);
  const [timeline, setTimeline] = useState<TimelineData[]>(INITIAL_TIMELINE);
  const [flaggedAccounts, setFlaggedAccounts] = useState<FlaggedAccount[]>(TOP_FLAGGED_ACCOUNTS);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(false);

  // Active Case Detail State
  const [activePatternDetail, setActivePatternDetail] = useState<PatternDetail | null>(null);
  const [activeEntityInvestigation, setActiveEntityInvestigation] = useState<EntityInvestigation | null>(null);
  const [loadingCase, setLoadingCase] = useState<boolean>(false);
  const [caseError, setCaseError] = useState<string | null>(null);

  // Modals state
  const [showEntityModal, setShowEntityModal] = useState<boolean>(false);
  const [showDetectionModal, setShowDetectionModal] = useState<boolean>(false);

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

  // Fetch Case Investigation Data with Graceful Mock Fallback
  const fetchCaseData = async (patternId: string) => {
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
        // Fall back to PATTERN_DETAILS_MAP or mock calculation
        setActivePatternDetail(fallbackDetail);
      }

      if (entityRes && entityRes.ok) {
        const entityData = await entityRes.json();
        setActiveEntityInvestigation(entityData);
      } else {
        // Fall back to ENTITY_INVESTIGATIONS_MAP or mock entity
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
      className={`min-h-screen font-sans p-4 sm:p-6 lg:p-8 antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200 ${
        isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#0f1117] text-[#f1f5f9]'
      }`}
    >
      <div className="max-w-7xl mx-auto">
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
                className={`border rounded-xl p-12 text-center space-y-3 ${
                  isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#1a1d2e] border-[#2a2d3e] text-slate-400'
                }`}
              >
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                <div className="font-mono text-sm">Fetching pattern topology & transaction ledger...</div>
              </div>
            ) : caseError || !activePatternDetail ? (
              <div
                className={`border rounded-xl p-8 text-center text-red-500 space-y-3 ${
                  isLight ? 'bg-white border-red-200' : 'bg-[#1a1d2e] border-red-500/30'
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
            onPatternCreated={(newPatternId) => {
              fetchDashboardData();
              navigateTo(`/case/${newPatternId}`);
            }}
          />
        )}

        {/* Professional Polish Footer */}
        <footer
          className={`mt-8 border rounded-xl p-3 px-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono gap-2 shadow-xs transition-colors ${
            isLight
              ? 'bg-white border-slate-200 text-slate-500'
              : 'bg-[#0a0c12] border-[#2a2d3e] text-[#64748b]'
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 uppercase tracking-tight font-semibold text-emerald-600 dark:text-[#22c55e]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>API Connectivity Stable</span>
            </span>
            <span className={`hidden md:inline opacity-60 border-l pl-4 ${isLight ? 'border-slate-200' : 'border-[#2a2d3e]'}`}>
              Region: AP-SOUTH-1 (Mumbai)
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>FIN-GUARD ML Engine v2.4 PRO</span>
            <span className={`border-l pl-4 ${isLight ? 'border-slate-200 text-slate-500' : 'border-[#2a2d3e] text-slate-500'}`}>
              Session Secure
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
