export type PatternType = 'smurfing' | 'layering' | 'round-tripping' | 'mule chain';
export type CaseStatus = 'open' | 'under_review' | 'resolved';

export interface DashboardSummary {
  active_clusters: number;
  flagged_transactions_24h: number;
  accounts_under_watch: number;
  pending_cases: number;
}

export interface SuspiciousPattern {
  pattern_id: string;
  pattern_type: PatternType;
  accounts_involved: number;
  total_amount: number;
  time_span_hours: number;
  risk_score: number;
  first_seen: string;
  last_seen: string;
  status: CaseStatus;
  notes?: string;
  description?: string;
}

export interface GraphNode {
  id: string;
  risk_score: number;
  total_sent: number;
  total_received: number;
  role?: string;
  account_name?: string;
  bank_name?: string;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  amount: number;
  timestamp: string;
  id?: string;
}

export interface PatternGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface PatternTransaction {
  txn_id: string;
  from_account: string;
  to_account: string;
  amount: number;
  timestamp: string;
  flag_reason: string;
}

export interface PatternDetail extends SuspiciousPattern {
  graph: PatternGraph;
  transactions: PatternTransaction[];
}

export interface TimelineData {
  date: string;
  pattern_count: number;
  smurfing_count?: number;
  layering_count?: number;
  mule_chain_count?: number;
}

export interface FlaggedAccount {
  account_id: string;
  risk_score: number;
  linked_suspicious_txns: number;
  holder_category?: string;
  primary_flag?: string;
}

export interface DeviceTelematics {
  device_id: string;
  device_model: string;
  last_ip: string;
  vpn_detected: boolean;
  last_location: {
    latitude: number;
    longitude: number;
    address: string;
    timestamp: string;
  };
}

export interface GovernmentVerifications {
  pan_verification: {
    status: 'VALID' | 'INVALID' | 'SUSPENDED';
    name_match: 'MATCHED' | 'PARTIAL' | 'MISMATCHED';
    tax_category: string;
  };
  gst_verification: {
    gstin: string;
    status: 'ACTIVE' | 'CANCELLED' | 'INACTIVE';
    filing_compliance: 'REGULAR' | 'DEFAULTING' | 'IRREGULAR';
    registered_business: string;
  };
  tds_tax_deductions: {
    tds_claimed_last_fy: number;
    mismatch_flag: boolean;
  };
  aadhaar_verification: {
    status: 'VERIFIED' | 'UNVERIFIED' | 'SUSPICIOUS';
    linked_mobile_match: boolean;
    biometric_lock_status: 'UNLOCKED' | 'LOCKED';
  };
}

export interface EntityInvestigation {
  account_id: string;
  device_telematics: DeviceTelematics;
  government_verifications: GovernmentVerifications;
}

export interface RawTransactionInput {
  from: string;
  to: string;
  amount: number;
  timestamp: string;
}

export interface ModelDetectionResponse {
  patterns_detected: {
    pattern_type: PatternType;
    accounts: string[];
    risk_score: number;
    total_amount: number;
    explanation: string;
  }[];
}
