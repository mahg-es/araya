// ARAYA Delegation Broker — Type Definitions
// WS-10 Part 1: Core types, state machine, error catalog
// Spec: .araya/plan/spec/req-001-delegation-architecture.md
// Isla, Infra Architect — 2026-07-22

// ─── Delegation State Machine ──────────────────────────────────────────

/** 8 states per DI-003 §5.4 state machine */
export type DelegationState =
  | "pending"
  | "dispatched"
  | "running"
  | "completed"
  | "failed"
  | "blocked"
  | "timeout"
  | "cancelled";

/** Events that drive state transitions */
export type DelegationEvent =
  | "VALIDATE_PASS"
  | "VALIDATE_FAIL"
  | "DISPATCH"
  | "DISPATCH_FAIL"
  | "RUNNING"
  | "COMPLETE"
  | "FAIL"
  | "TIMEOUT"
  | "BLOCK"
  | "UNBLOCK"
  | "CANCEL";

/** Terminal states — no further transitions allowed */
export const TERMINAL_STATES: ReadonlySet<DelegationState> = new Set([
  "completed",
  "failed",
  "timeout",
  "cancelled",
]);

// ─── Circuit Breaker ────────────────────────────────────────────────────

export type CircuitBreakerState = "closed" | "open" | "half_open";

// ─── Identifiers ────────────────────────────────────────────────────────

/** Delegation primary key — del_{uuid_short} */
export type DelegationId = string;

/** Links request → dispatch → result — cor_{uuid_short} */
export type CorrelationId = string;

/** Groups related delegations — ses_{uuid_short} */
export type SessionId = string;

/** Delegation chain depth (0 = direct, max configurable) */
export type Depth = number;

// ─── Request / Response ─────────────────────────────────────────────────

export interface DelegateRequest {
  targetAgent: string;
  task: string;
  requestedBy: string;
  sessionId?: string;
  correlationId?: string;        // if provided, used for idempotency
  timeoutMs?: number;
  parentDelegationId?: string;
  ancestorChain?: AncestorChain; // built server-side, never from input
}

export interface DelegateResponse {
  accepted: boolean;
  delegationId?: string;
  correlationId?: string;
  status?: DelegationState;
  reason?: string;               // rejection reason if !accepted
  suggestions?: string[];        // alternative agents if rejected
}

export interface DelegationStatus {
  delegationId: string;
  correlationId: string;
  status: DelegationState;
  requestedBy: string;
  dispatchedTo: string;
  task: string;
  depth: number;
  sessionId?: string;
  parentDelegationId?: string;
  createdAt: number;
  dispatchedAt?: number;
  runningAt?: number;
  completedAt?: number;
  errorCode?: ErrorCode;
  errorMessage?: string;
}

export interface DelegationResult {
  delegationId: string;
  correlationId: string;
  sessionId?: string;
  status: DelegationState;
  statusReason?: string;
  requestedBy: string;
  dispatchedTo: string;
  task: string;
  taskType?: string;
  createdAt: number;
  dispatchedAt?: number;
  runningAt?: number;
  completedAt?: number;
  durationMs?: number;
  confidence?: number;
  risks: RiskEntry[];
  blockers: BlockerEntry[];
  output: string;
  outputFormat: "markdown" | "json";
  parentDelegationId?: string;
  depth: number;
}

export interface DelegationFilter {
  sessionId?: string;
  agent?: string;
  status?: DelegationState;
  limit?: number;
}

export interface DelegationSummary {
  delegationId: string;
  status: DelegationState;
  requestedBy: string;
  dispatchedTo: string;
  task: string;
  createdAt: number;
  sessionId?: string;
  depth: number;
}

// ─── Ancestor Chain (Anti-Recursion) ────────────────────────────────────

export interface AncestorChain {
  /** Ordered list of agents from root delegator to immediate parent */
  agents: string[];
  /** Corresponding delegation_ids */
  delegationIds: string[];
  /** Current depth */
  depth: number;
}

// ─── Risk & Blocker ─────────────────────────────────────────────────────

export interface RiskEntry {
  severity: "low" | "medium" | "high" | "critical";
  description: string;
}

export interface BlockerEntry {
  description: string;
  resolution?: string;
}

// ─── Audit ──────────────────────────────────────────────────────────────

export interface AuditEntry {
  timestamp: number;
  event: string;
  from?: string;
  to?: string;
  actor: string;
  detail?: string;
}

// ─── Delegation Record (full, persisted) ────────────────────────────────

export interface DelegationRecord {
  delegationId: string;
  correlationId: string;
  sessionId?: string;
  status: DelegationState;
  requestedBy: string;
  dispatchedTo: string;
  task: string;
  taskType?: string;
  parentDelegationId?: string;
  ancestorChain: AncestorChain;
  depth: number;
  timeoutMs: number;
  createdAt: number;
  dispatchedAt?: number;
  runningAt?: number;
  completedAt?: number;
  output?: string;
  outputFormat?: "markdown" | "json";
  confidence?: number;
  risks: RiskEntry[];
  blockers: BlockerEntry[];
  auditLog: AuditEntry[];
}

// ─── Broker Config & Handle ─────────────────────────────────────────────

export interface BrokerConfig {
  maxDepth: number;
  defaultTimeoutMs: number;
  evidenceBasePath: string;
  maxConcurrentDelegations: number;
  circuitBreakerThreshold: number;
  circuitBreakerWindowMs: number;
  circuitBreakerCooldownMs: number;
  /** Absolute path to the ARAYA root (contains araya.yaml) */
  arayaRoot: string;
}

export interface BrokerHealth {
  initialized: boolean;
  startedAt: number;
  uptimeMs: number;
  activeDelegations: number;
  totalDelegations: number;
  failureCount: number;
  circuitBreakers: Record<string, CircuitBreakerState>;
}

// ─── Error Codes ────────────────────────────────────────────────────────

export const ErrorCodes = {
  AGENT_NOT_FOUND: "AGENT_NOT_FOUND",
  SELF_DELEGATION: "SELF_DELEGATION",
  CYCLE_DETECTED: "CYCLE_DETECTED",
  MAX_DEPTH_EXCEEDED: "MAX_DEPTH_EXCEEDED",
  CIRCUIT_OPEN: "CIRCUIT_OPEN",
  CAPABILITY_MISMATCH: "CAPABILITY_MISMATCH",
  TIMEOUT: "TIMEOUT",
  BROKER_NOT_INITIALIZED: "BROKER_NOT_INITIALIZED",
  INVALID_STATE_TRANSITION: "INVALID_STATE_TRANSITION",
  DUPLICATE_CORRELATION: "DUPLICATE_CORRELATION",
  SESSION_CLOSED: "SESSION_CLOSED",
  DISPATCH_FAILED: "DISPATCH_FAILED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export interface BrokerError {
  code: ErrorCode;
  message: string;
  detail?: string;
  suggestions?: string[];
}
