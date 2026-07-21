// ARAYA Delegation Broker — Public API
// WS-10 Part 1: Re-exports all public symbols
// Spec: .araya/plan/spec/req-001-delegation-architecture.md
// Isla, Infra Architect — 2026-07-22

// ─── Types ──────────────────────────────────────────────────────────────
export type {
  DelegationState,
  DelegationEvent,
  DelegationId,
  CorrelationId,
  SessionId,
  Depth,
  DelegateRequest,
  DelegateResponse,
  DelegationStatus,
  DelegationResult,
  DelegationFilter,
  DelegationSummary,
  DelegationRecord,
  AncestorChain,
  RiskEntry,
  BlockerEntry,
  AuditEntry,
  BrokerConfig,
  BrokerHealth,
  BrokerError,
  ErrorCode,
  CircuitBreakerState,
} from "./types";

export { ErrorCodes, TERMINAL_STATES } from "./types";

// ─── State Machine ──────────────────────────────────────────────────────
export {
  transition,
  canTransition,
  isTerminal,
  allowedEvents,
  getTransitionTable,
  validateTransitionMatrix,
} from "./state-machine";

// ─── Circuit Breaker ────────────────────────────────────────────────────
export { CircuitBreaker } from "./circuit-breaker";
export type { CircuitBreakerConfig } from "./circuit-breaker";

// ─── Broker Core ────────────────────────────────────────────────────────
export type { BrokerHandle } from "./broker";
export {
  initBroker,
  delegate,
  getStatus,
  listDelegations,
  getResult,
  cancel,
  recordDispatch,
  recordRunning,
  recordCompletion,
  recordFailure,
  recordTimeout,
  recordBlocked,
  recordUnblocked,
  healthCheck,
  getRecord,
  buildChildChain,
  emptyChain,
  validateRecursion,
} from "./broker";
export type { RecursionCheck } from "./broker";
