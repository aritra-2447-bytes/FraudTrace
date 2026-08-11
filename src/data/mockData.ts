import {
  DashboardSummary,
  SuspiciousPattern,
  PatternDetail,
  TimelineData,
  FlaggedAccount,
  EntityInvestigation,
} from '../types';

export const INITIAL_SUMMARY: DashboardSummary = {
  active_clusters: 0,
  flagged_transactions_24h: 0,
  accounts_under_watch: 0,
  pending_cases: 0,
};

export const INITIAL_PATTERNS: SuspiciousPattern[] = [];

export const INITIAL_TIMELINE: TimelineData[] = [];

export const TOP_FLAGGED_ACCOUNTS: FlaggedAccount[] = [];

export const PATTERN_DETAILS_MAP: Record<string, PatternDetail> = {};

export const ENTITY_INVESTIGATIONS_MAP: Record<string, EntityInvestigation> = {};

export const DEFAULT_ENTITY_INVESTIGATION: EntityInvestigation = {
  account_id: 'ACC-UNKNOWN',
  device_telematics: {
    device_id: 'DEV-10293-A1',
    device_model: 'Android Device',
    last_ip: '103.11.22.33',
    vpn_detected: false,
    last_location: {
      latitude: 28.6139,
      longitude: 77.209,
      address: 'Connaught Place, New Delhi, India',
      timestamp: '2024-01-16T12:00:00Z',
    },
  },
  government_verifications: {
    pan_verification: {
      status: 'VALID',
      name_match: 'MATCHED',
      tax_category: 'Individual',
    },
    gst_verification: {
      gstin: '07AAAAA0000A1Z5',
      status: 'ACTIVE',
      filing_compliance: 'REGULAR',
      registered_business: 'Standard Entity',
    },
    tds_tax_deductions: {
      tds_claimed_last_fy: 12000,
      mismatch_flag: false,
    },
    aadhaar_verification: {
      status: 'VERIFIED',
      linked_mobile_match: true,
      biometric_lock_status: 'UNLOCKED',
    },
  },
};

export function getMockPatternDetail(
  patternId: string,
  availablePatterns: SuspiciousPattern[] = INITIAL_PATTERNS
): PatternDetail {
  if (PATTERN_DETAILS_MAP[patternId]) {
    return PATTERN_DETAILS_MAP[patternId];
  }

  const found =
    availablePatterns.find((p) => p.pattern_id === patternId) ||
    INITIAL_PATTERNS.find((p) => p.pattern_id === patternId);

  const basePattern = found || {
    pattern_id: patternId,
    pattern_type: 'smurfing',
    risk_score: 85,
    status: 'open' as const,
    total_amount: 500000,
    accounts_involved: 5,
    time_span_hours: 24,
    first_seen: new Date(Date.now() - 86400000).toISOString(),
    last_seen: new Date().toISOString(),
    description: 'Suspicious transactional pattern flagged by automated risk model.',
  };

  const fallbackGraph = PATTERN_DETAILS_MAP['PAT-001']?.graph || {
    nodes: [
      { id: 'ACC-001', risk_score: 85, total_sent: basePattern.total_amount, total_received: 0, role: 'Origin Account', account_name: 'Primary Node' },
      { id: 'ACC-002', risk_score: 90, total_sent: 0, total_received: basePattern.total_amount, role: 'Destination Node', account_name: 'Consolidation Hub' },
    ],
    edges: [
      { id: 'E-001', source: 'ACC-001', target: 'ACC-002', amount: basePattern.total_amount, timestamp: new Date().toISOString() },
    ],
  };

  const fallbackTxns = PATTERN_DETAILS_MAP['PAT-001']?.transactions || [
    {
      txn_id: 'TXN-001',
      from_account: 'ACC-001',
      to_account: 'ACC-002',
      amount: basePattern.total_amount,
      timestamp: new Date().toISOString(),
      flag_reason: 'Automated anomaly threshold exceeded',
    },
  ];

  return {
    ...basePattern,
    graph: fallbackGraph,
    transactions: fallbackTxns,
  };
}

export function getMockEntityInvestigation(patternId: string): EntityInvestigation {
  if (ENTITY_INVESTIGATIONS_MAP[patternId]) {
    return ENTITY_INVESTIGATIONS_MAP[patternId];
  }
  return DEFAULT_ENTITY_INVESTIGATION;
}

