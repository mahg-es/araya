// ARAYA v2 — Barrel export
export { ArayaOrchestrator } from "./orchestrator";
export { WorkflowPolicyEngine } from "./engines/workflow-policy";
export { ModelSelectionEngine } from "./engines/model-selection";
export { QualityGateEngine } from "./engines/quality-gate";
export { ExecutionBudgetEngine } from "./engines/execution-budget";
export { CircuitBreakerEngine } from "./engines/circuit-breaker";
export { DelegationEngine } from "./engines/delegation";
export { ArayaExecutionAdapter, ExecutionEvent, HostCapabilities } from "./adapter";
export { PiAdapter } from "./adapters/pi";
export { MockAdapter } from "./adapters/mock";
export { resolveAdapter } from "./adapters/factory";
export { ToolRegistry, ToolResult } from "./tools/registry";
export { WorktreeSandboxManager } from "./sandbox/worktree";
export { ProviderRegistry } from "./providers/registry";
export { TerminalApiAdapter } from "./adapters/terminal-api";
export { DispositionEngine, DISPOSITIONS } from "./engines/disposition";
export type { Disposition, Unit, MoveContext, EmitResult } from "./engines/disposition";
export { ScoreLedger, resolveScoreLedgerPath } from "./ledger/score-ledger";
export type { ScoreEntry } from "./ledger/score-ledger";
export { ArbiterEngine, MAX_STRIKES, FLAKY_RERUN_BUDGET, PROTOCOL_HUMAN } from "./engines/arbiter";
export type { ViolationInput, ArbiterOutcome } from "./engines/arbiter";
export { ArbiterLedger, resolveArbiterLedgerPath } from "./ledger/arbiter-ledger";
export { Verifier, VERIFIER_IDENTITY, PRODUCER_IS_EMITTER_STRIKE_ARMED } from "./engines/verifier";
export type { VerificationEvidence, VerificationResult } from "./engines/verifier";
export { DefinitionOfReadyGate } from "./engines/definition-of-ready-gate";
export type {
  ReadinessGate, MachineGate, HumanGate, ReadinessGateResult,
  GateKind, HumanRuling, DorInput, DorOutcome,
} from "./engines/definition-of-ready-gate";
export type { ArbiterEntry, Severity, ViolationType, ArbiterAction } from "./ledger/arbiter-ledger";
export {
  BoundaryResolver, parseContract, loadContract,
  DESCRIPTIVE_BEGIN, DESCRIPTIVE_END,
} from "./contract/contract";
export type { BoundaryManifest, BoundaryFrontmatter, ParsedContract } from "./contract/contract";
export { walkChain } from "./contract/walk-chain";
export type { ChainResult, PrescriptiveRule } from "./contract/walk-chain";
export { spliceDescriptive, observeDescriptive, regenerateDescriptive } from "./contract/descriptive-generator";
export { prescriptiveAsReadinessGates } from "./contract/gate-seam";
export { extractTopLevelExports, extractSurface, observeSurface } from "./contract/surface";
export {
  PUBLISHED_INTERFACE_KIND, PUBLIC_CONTRACT_STRIKE_ARMED,
  parsePromisedSurface, detectBreakingChange, checkPublishedInterface, renderInterfaceDescriptive,
} from "./contract/published-interface";
export type { BreakingChange, InterfaceCheck } from "./contract/published-interface";
export { apiContractInvocation } from "./engines/certification/api-contract-target";
export type { ApiContractTarget } from "./engines/certification/api-contract-target";
// AX3 — Agent Execution Contract Hierarchy (AX Feature)
export { preflight, postflight, reconcile, check, dryRun } from "./ax3";
export type { Ax3Doc, Ax3IndexEntry, Ax3Chain, Ax3Change, Ax3ReconcileResult, Ax3CheckResult } from "./ax3";
export * from "./types";

