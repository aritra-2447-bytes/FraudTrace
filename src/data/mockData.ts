import {
  DashboardSummary,
  SuspiciousPattern,
  PatternDetail,
  TimelineData,
  FlaggedAccount,
  EntityInvestigation,
} from '../types';

export const INITIAL_SUMMARY: DashboardSummary = {
  active_clusters: 12,
  flagged_transactions_24h: 347,
  accounts_under_watch: 89,
  pending_cases: 5,
};

export const INITIAL_PATTERNS: SuspiciousPattern[] = [
  {
    pattern_id: 'PAT-001',
    pattern_type: 'smurfing',
    accounts_involved: 7,
    total_amount: 450000,
    time_span_hours: 36,
    risk_score: 87,
    first_seen: '2024-01-15T10:23:00Z',
    last_seen: '2024-01-16T22:41:00Z',
    status: 'open',
    description: 'Multiple micro-deposits structured below threshold fan into a single consolidation node.',
  },
  {
    pattern_id: 'PAT-002',
    pattern_type: 'layering',
    accounts_involved: 12,
    total_amount: 2850000,
    time_span_hours: 18,
    risk_score: 94,
    first_seen: '2024-01-16T02:15:00Z',
    last_seen: '2024-01-16T20:05:00Z',
    status: 'under_review',
    description: 'Rapid multi-hop transfers across newly registered shell company accounts with near-zero hold time.',
  },
  {
    pattern_id: 'PAT-003',
    pattern_type: 'mule chain',
    accounts_involved: 9,
    total_amount: 875000,
    time_span_hours: 48,
    risk_score: 91,
    first_seen: '2024-01-14T18:00:00Z',
    last_seen: '2024-01-16T18:30:00Z',
    status: 'open',
    description: 'Linear chain pass-through across compromised student accounts terminating at a P2P crypto gateway.',
  },
  {
    pattern_id: 'PAT-004',
    pattern_type: 'round-tripping',
    accounts_involved: 5,
    total_amount: 15000000,
    time_span_hours: 12,
    risk_score: 78,
    first_seen: '2024-01-16T08:00:00Z',
    last_seen: '2024-01-16T20:00:00Z',
    status: 'open',
    description: 'Circular flow of funds returning to originating account within 12 hours to artificially inflate GST turnover.',
  },
  {
    pattern_id: 'PAT-005',
    pattern_type: 'smurfing',
    accounts_involved: 6,
    total_amount: 320000,
    time_span_hours: 24,
    risk_score: 65,
    first_seen: '2024-01-15T14:10:00Z',
    last_seen: '2024-01-16T14:10:00Z',
    status: 'resolved',
    description: 'Divided cash deposits funneled through mobile banking UPI proxies.',
  },
  {
    pattern_id: 'PAT-006',
    pattern_type: 'layering',
    accounts_involved: 8,
    total_amount: 1210000,
    time_span_hours: 30,
    risk_score: 82,
    first_seen: '2024-01-15T09:30:00Z',
    last_seen: '2024-01-16T15:30:00Z',
    status: 'under_review',
    description: 'Split payments routed through offshore trade invoices and virtual accounts.',
  },
];

export const INITIAL_TIMELINE: TimelineData[] = [
  { date: '2024-01-03', pattern_count: 2 },
  { date: '2024-01-04', pattern_count: 4 },
  { date: '2024-01-05', pattern_count: 3 },
  { date: '2024-01-06', pattern_count: 5 },
  { date: '2024-01-07', pattern_count: 8 },
  { date: '2024-01-08', pattern_count: 6 },
  { date: '2024-01-09', pattern_count: 9 },
  { date: '2024-01-10', pattern_count: 7 },
  { date: '2024-01-11', pattern_count: 11 },
  { date: '2024-01-12', pattern_count: 10 },
  { date: '2024-01-13', pattern_count: 14 },
  { date: '2024-01-14', pattern_count: 12 },
  { date: '2024-01-15', pattern_count: 18 },
  { date: '2024-01-16', pattern_count: 15 },
];

export const TOP_FLAGGED_ACCOUNTS: FlaggedAccount[] = [
  {
    account_id: 'ACC-***-001',
    risk_score: 94,
    linked_suspicious_txns: 23,
    holder_category: 'Individual Savings',
    primary_flag: 'High-frequency structuring nexus node',
  },
  {
    account_id: 'ACC-***-089',
    risk_score: 91,
    linked_suspicious_txns: 19,
    holder_category: 'Current / Business Shell',
    primary_flag: 'Near-zero holding duration & sudden velocity spike',
  },
  {
    account_id: 'ACC-***-412',
    risk_score: 88,
    linked_suspicious_txns: 16,
    holder_category: 'Mule Student Account',
    primary_flag: 'Device geo-anomaly & proxy IP hopping',
  },
  {
    account_id: 'ACC-***-773',
    risk_score: 85,
    linked_suspicious_txns: 14,
    holder_category: 'Current Account',
    primary_flag: 'Circular fund routing hub',
  },
  {
    account_id: 'ACC-***-305',
    risk_score: 81,
    linked_suspicious_txns: 11,
    holder_category: 'NRE/NRO Account',
    primary_flag: 'Rapid cross-border layering conduit',
  },
];

export const PATTERN_DETAILS_MAP: Record<string, PatternDetail> = {
  'PAT-001': {
    pattern_id: 'PAT-001',
    pattern_type: 'smurfing',
    risk_score: 87,
    status: 'open',
    total_amount: 450000,
    accounts_involved: 7,
    time_span_hours: 36,
    first_seen: '2024-01-15T10:23:00Z',
    last_seen: '2024-01-16T22:41:00Z',
    description: 'Structured smurfing network fanning small cash amounts into central accumulator ACC-002.',
    graph: {
      nodes: [
        { id: 'ACC-001', risk_score: 91, total_sent: 120000, total_received: 0, role: 'Feeder Account', account_name: 'Rajesh Kumar (Mule)' },
        { id: 'ACC-002', risk_score: 95, total_sent: 450000, total_received: 450000, role: 'Central Hub', account_name: 'Apex Trading Corp' },
        { id: 'ACC-003', risk_score: 84, total_sent: 80000, total_received: 0, role: 'Feeder Account', account_name: 'Suresh Patel' },
        { id: 'ACC-004', risk_score: 79, total_sent: 75000, total_received: 0, role: 'Feeder Account', account_name: 'Anita Sharma' },
        { id: 'ACC-005', risk_score: 82, total_sent: 95000, total_received: 0, role: 'Feeder Account', account_name: 'Vikram Singh' },
        { id: 'ACC-006', risk_score: 76, total_sent: 80000, total_received: 0, role: 'Feeder Account', account_name: 'Neha Verma' },
        { id: 'ACC-007', risk_score: 89, total_sent: 0, total_received: 450000, role: 'Off-Ramp Destination', account_name: 'Zenith Crypto Exchange Gateway' },
      ],
      edges: [
        { id: 'E1', source: 'ACC-001', target: 'ACC-002', amount: 120000, timestamp: '2024-01-15T11:00:00Z' },
        { id: 'E2', source: 'ACC-003', target: 'ACC-002', amount: 80000, timestamp: '2024-01-15T12:15:00Z' },
        { id: 'E3', source: 'ACC-004', target: 'ACC-002', amount: 75000, timestamp: '2024-01-15T14:30:00Z' },
        { id: 'E4', source: 'ACC-005', target: 'ACC-002', amount: 95000, timestamp: '2024-01-16T09:10:00Z' },
        { id: 'E5', source: 'ACC-006', target: 'ACC-002', amount: 80000, timestamp: '2024-01-16T11:45:00Z' },
        { id: 'E6', source: 'ACC-002', target: 'ACC-007', amount: 450000, timestamp: '2024-01-16T22:41:00Z' },
      ],
    },
    transactions: [
      {
        txn_id: 'TXN-9901',
        from_account: 'ACC-001',
        to_account: 'ACC-002',
        amount: 120000,
        timestamp: '2024-01-15T11:00:00Z',
        flag_reason: 'High velocity micro-transfer below ₹2L threshold to linked accumulator account',
      },
      {
        txn_id: 'TXN-9902',
        from_account: 'ACC-003',
        to_account: 'ACC-002',
        amount: 80000,
        timestamp: '2024-01-15T12:15:00Z',
        flag_reason: 'Coordinated deposit window match with ACC-001 from shared IP subnet',
      },
      {
        txn_id: 'TXN-9903',
        from_account: 'ACC-004',
        to_account: 'ACC-002',
        amount: 75000,
        timestamp: '2024-01-15T14:30:00Z',
        flag_reason: 'Dormant account sudden activation & immediate sweep outward',
      },
      {
        txn_id: 'TXN-9904',
        from_account: 'ACC-005',
        to_account: 'ACC-002',
        amount: 95000,
        timestamp: '2024-01-16T09:10:00Z',
        flag_reason: 'Structuring velocity alert: 4th incoming transfer within 24h window',
      },
      {
        txn_id: 'TXN-9905',
        from_account: 'ACC-006',
        to_account: 'ACC-002',
        amount: 80000,
        timestamp: '2024-01-16T11:45:00Z',
        flag_reason: 'Structuring threshold bypass (< ₹1,00,000 cash equivalent)',
      },
      {
        txn_id: 'TXN-9906',
        from_account: 'ACC-002',
        to_account: 'ACC-007',
        amount: 450000,
        timestamp: '2024-01-16T22:41:00Z',
        flag_reason: 'Immediate sweep of pooled funds to high-risk virtual asset service provider',
      },
    ],
  },
  'PAT-002': {
    pattern_id: 'PAT-002',
    pattern_type: 'layering',
    risk_score: 94,
    status: 'under_review',
    total_amount: 2850000,
    accounts_involved: 12,
    time_span_hours: 18,
    first_seen: '2024-01-16T02:15:00Z',
    last_seen: '2024-01-16T20:05:00Z',
    description: 'Complex multi-tiered layering across 12 shell enterprise accounts to disguise illicit origin.',
    graph: {
      nodes: [
        { id: 'ACC-101', risk_score: 88, total_sent: 2850000, total_received: 0, role: 'Source Node', account_name: 'Solaria Global Ltd' },
        { id: 'ACC-102', risk_score: 92, total_sent: 1400000, total_received: 1425000, role: 'Layer 1 Shell', account_name: 'Vanguard Logistics' },
        { id: 'ACC-103', risk_score: 91, total_sent: 1410000, total_received: 1425000, role: 'Layer 1 Shell', account_name: 'Matrix Overseas Ltd' },
        { id: 'ACC-104', risk_score: 96, total_sent: 700000, total_received: 700000, role: 'Layer 2 Transit', account_name: 'BlueSky Holding' },
        { id: 'ACC-105', risk_score: 93, total_sent: 700000, total_received: 700000, role: 'Layer 2 Transit', account_name: 'Omega Consulting' },
        { id: 'ACC-106', risk_score: 97, total_sent: 0, total_received: 2800000, role: 'Ultimate Beneficiary', account_name: 'Panthera Capital Offshore' },
      ],
      edges: [
        { id: 'E101', source: 'ACC-101', target: 'ACC-102', amount: 1425000, timestamp: '2024-01-16T02:15:00Z' },
        { id: 'E102', source: 'ACC-101', target: 'ACC-103', amount: 1425000, timestamp: '2024-01-16T02:20:00Z' },
        { id: 'E103', source: 'ACC-102', target: 'ACC-104', amount: 700000, timestamp: '2024-01-16T08:00:00Z' },
        { id: 'E104', source: 'ACC-102', target: 'ACC-105', amount: 700000, timestamp: '2024-01-16T08:10:00Z' },
        { id: 'E105', source: 'ACC-104', target: 'ACC-106', amount: 1400000, timestamp: '2024-01-16T20:00:00Z' },
        { id: 'E106', source: 'ACC-105', target: 'ACC-106', amount: 1400000, timestamp: '2024-01-16T20:05:00Z' },
      ],
    },
    transactions: [
      {
        txn_id: 'TXN-8801',
        from_account: 'ACC-101',
        to_account: 'ACC-102',
        amount: 1425000,
        timestamp: '2024-01-16T02:15:00Z',
        flag_reason: 'Unusual high-value transfer with fake trade invoice descriptor',
      },
      {
        txn_id: 'TXN-8802',
        from_account: 'ACC-101',
        to_account: 'ACC-103',
        amount: 1425000,
        timestamp: '2024-01-16T02:20:00Z',
        flag_reason: 'Symmetrical split transfer executed simultaneously',
      },
      {
        txn_id: 'TXN-8803',
        from_account: 'ACC-102',
        to_account: 'ACC-104',
        amount: 700000,
        timestamp: '2024-01-16T08:00:00Z',
        flag_reason: 'Rapid pass-through: account held funds for < 6 hours',
      },
      {
        txn_id: 'TXN-8804',
        from_account: 'ACC-104',
        to_account: 'ACC-106',
        amount: 1400000,
        timestamp: '2024-01-16T20:00:00Z',
        flag_reason: 'Re-consolidation into offshore tax-haven entity',
      },
    ],
  },
  'PAT-003': {
    pattern_id: 'PAT-003',
    pattern_type: 'mule chain',
    risk_score: 91,
    status: 'open',
    total_amount: 875000,
    accounts_involved: 9,
    time_span_hours: 48,
    first_seen: '2024-01-14T18:00:00Z',
    last_seen: '2024-01-16T18:30:00Z',
    description: 'Sequential mule pipeline transferring funds through 9 newly opened student savings accounts.',
    graph: {
      nodes: [
        { id: 'ACC-201', risk_score: 93, total_sent: 875000, total_received: 0, role: 'Originator', account_name: 'Phishing Scam Pool' },
        { id: 'ACC-202', risk_score: 89, total_sent: 870000, total_received: 875000, role: 'Mule #1', account_name: 'Aarav Mehta' },
        { id: 'ACC-203', risk_score: 90, total_sent: 860000, total_received: 870000, role: 'Mule #2', account_name: 'Pooja Nair' },
        { id: 'ACC-204', risk_score: 92, total_sent: 850000, total_received: 860000, role: 'Mule #3', account_name: 'Karan Joshi' },
        { id: 'ACC-205', risk_score: 95, total_sent: 0, total_received: 850000, role: 'Crypto Cashout', account_name: 'Peer2Peer Merchant Node' },
      ],
      edges: [
        { id: 'E201', source: 'ACC-201', target: 'ACC-202', amount: 875000, timestamp: '2024-01-14T18:00:00Z' },
        { id: 'E202', source: 'ACC-202', target: 'ACC-203', amount: 870000, timestamp: '2024-01-15T04:15:00Z' },
        { id: 'E203', source: 'ACC-203', target: 'ACC-204', amount: 860000, timestamp: '2024-01-15T16:20:00Z' },
        { id: 'E204', source: 'ACC-204', target: 'ACC-205', amount: 850000, timestamp: '2024-01-16T18:30:00Z' },
      ],
    },
    transactions: [
      {
        txn_id: 'TXN-7701',
        from_account: 'ACC-201',
        to_account: 'ACC-202',
        amount: 875000,
        timestamp: '2024-01-14T18:00:00Z',
        flag_reason: 'Initial victim sweep into freshly KYC-activated account',
      },
      {
        txn_id: 'TXN-7702',
        from_account: 'ACC-202',
        to_account: 'ACC-203',
        amount: 870000,
        timestamp: '2024-01-15T04:15:00Z',
        flag_reason: 'Mule commission deduction (₹5,000 kept) & immediate push to next hop',
      },
      {
        txn_id: 'TXN-7703',
        from_account: 'ACC-203',
        to_account: 'ACC-204',
        amount: 860000,
        timestamp: '2024-01-15T16:20:00Z',
        flag_reason: 'Rapid sequential transit across newly flagged student accounts',
      },
      {
        txn_id: 'TXN-7704',
        from_account: 'ACC-204',
        to_account: 'ACC-205',
        amount: 850000,
        timestamp: '2024-01-16T18:30:00Z',
        flag_reason: 'Final cashout at unregistered P2P cryptocurrency gateway',
      },
    ],
  },
  'PAT-004': {
    pattern_id: 'PAT-004',
    pattern_type: 'round-tripping',
    risk_score: 78,
    status: 'open',
    total_amount: 15000000,
    accounts_involved: 5,
    time_span_hours: 12,
    first_seen: '2024-01-16T08:00:00Z',
    last_seen: '2024-01-16T20:00:00Z',
    description: 'Circular movement of ₹1.5 Cr across affiliated company accounts returning to source.',
    graph: {
      nodes: [
        { id: 'ACC-301', risk_score: 82, total_sent: 15000000, total_received: 15000000, role: 'Origin & Terminus', account_name: 'Apex Infrastructure Ltd' },
        { id: 'ACC-302', risk_score: 77, total_sent: 15000000, total_received: 15000000, role: 'Intermediary 1', account_name: 'BuildTech Enterprises' },
        { id: 'ACC-303', risk_score: 79, total_sent: 15000000, total_received: 15000000, role: 'Intermediary 2', account_name: 'Crestline Materials' },
        { id: 'ACC-304', risk_score: 75, total_sent: 15000000, total_received: 15000000, role: 'Intermediary 3', account_name: 'Delta Supplies' },
      ],
      edges: [
        { id: 'E301', source: 'ACC-301', target: 'ACC-302', amount: 15000000, timestamp: '2024-01-16T08:00:00Z' },
        { id: 'E302', source: 'ACC-302', target: 'ACC-303', amount: 15000000, timestamp: '2024-01-16T12:00:00Z' },
        { id: 'E303', source: 'ACC-303', target: 'ACC-304', amount: 15000000, timestamp: '2024-01-16T16:00:00Z' },
        { id: 'E304', source: 'ACC-304', target: 'ACC-301', amount: 15000000, timestamp: '2024-01-16T20:00:00Z' },
      ],
    },
    transactions: [
      {
        txn_id: 'TXN-6601',
        from_account: 'ACC-301',
        to_account: 'ACC-302',
        amount: 15000000,
        timestamp: '2024-01-16T08:00:00Z',
        flag_reason: 'Same-day high value transfer without genuine goods movement documentation',
      },
      {
        txn_id: 'TXN-6602',
        from_account: 'ACC-302',
        to_account: 'ACC-303',
        amount: 15000000,
        timestamp: '2024-01-16T12:00:00Z',
        flag_reason: '100% principal roll-forward to common Director-linked entity',
      },
      {
        txn_id: 'TXN-6603',
        from_account: 'ACC-303',
        to_account: 'ACC-304',
        amount: 15000000,
        timestamp: '2024-01-16T16:00:00Z',
        flag_reason: 'Automated treasury sweep cycle step 3',
      },
      {
        txn_id: 'TXN-6604',
        from_account: 'ACC-304',
        to_account: 'ACC-301',
        amount: 15000000,
        timestamp: '2024-01-16T20:00:00Z',
        flag_reason: 'Loop completion: full ₹1.5 Cr returned to original account in 12h',
      },
    ],
  },
};

export const ENTITY_INVESTIGATIONS_MAP: Record<string, EntityInvestigation> = {
  'PAT-001': {
    account_id: 'ACC-002',
    device_telematics: {
      device_id: 'DEV-88291-X9',
      device_model: 'Samsung Galaxy S23 Ultra',
      last_ip: '103.22.14.88',
      vpn_detected: true,
      last_location: {
        latitude: 22.5726,
        longitude: 88.3639,
        address: 'Park Street, Kolkata, West Bengal, India',
        timestamp: '2024-01-16T22:40:12Z',
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
  },
  'PAT-002': {
    account_id: 'ACC-101',
    device_telematics: {
      device_id: 'DEV-44102-Z1',
      device_model: 'Apple iPhone 15 Pro',
      last_ip: '185.220.101.4',
      vpn_detected: true,
      last_location: {
        latitude: 19.076,
        longitude: 72.8777,
        address: 'Bandra Kurla Complex, Mumbai, Maharashtra, India',
        timestamp: '2024-01-16T20:02:11Z',
      },
    },
    government_verifications: {
      pan_verification: {
        status: 'VALID',
        name_match: 'PARTIAL',
        tax_category: 'Private Limited Company',
      },
      gst_verification: {
        gstin: '27AABCS9912K1Z9',
        status: 'CANCELLED',
        filing_compliance: 'DEFAULTING',
        registered_business: 'Solaria Global Pvt Ltd',
      },
      tds_tax_deductions: {
        tds_claimed_last_fy: 0,
        mismatch_flag: true,
      },
      aadhaar_verification: {
        status: 'SUSPICIOUS',
        linked_mobile_match: false,
        biometric_lock_status: 'LOCKED',
      },
    },
  },
  'PAT-003': {
    account_id: 'ACC-202',
    device_telematics: {
      device_id: 'DEV-99120-M4',
      device_model: 'OnePlus 11R 5G',
      last_ip: '49.36.182.91',
      vpn_detected: false,
      last_location: {
        latitude: 12.9716,
        longitude: 77.5946,
        address: 'MG Road, Bengaluru, Karnataka, India',
        timestamp: '2024-01-16T18:25:00Z',
      },
    },
    government_verifications: {
      pan_verification: {
        status: 'VALID',
        name_match: 'MATCHED',
        tax_category: 'Individual',
      },
      gst_verification: {
        gstin: 'NOT_REGISTERED',
        status: 'INACTIVE',
        filing_compliance: 'IRREGULAR',
        registered_business: 'N/A (Student Savings)',
      },
      tds_tax_deductions: {
        tds_claimed_last_fy: 0,
        mismatch_flag: false,
      },
      aadhaar_verification: {
        status: 'VERIFIED',
        linked_mobile_match: true,
        biometric_lock_status: 'UNLOCKED',
      },
    },
  },
};

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

  return {
    ...basePattern,
    graph: PATTERN_DETAILS_MAP['PAT-001'].graph,
    transactions: PATTERN_DETAILS_MAP['PAT-001'].transactions,
  };
}

export function getMockEntityInvestigation(patternId: string): EntityInvestigation {
  if (ENTITY_INVESTIGATIONS_MAP[patternId]) {
    return ENTITY_INVESTIGATIONS_MAP[patternId];
  }
  return DEFAULT_ENTITY_INVESTIGATION;
}

