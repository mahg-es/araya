// ARAYA v2 — Types
// Shared type definitions for the orchestration framework.

// ─── Core Types ──────────────────────────────────────────────────────────

export interface ArayaV2Config {
  version: string;
  description: string;
  delivery_modes: Record<string, DeliveryMode>;
  workflow_policies: Record<string, WorkflowPolicy>;
  model_tiers: Record<string, ModelTier>;
  execution_budget: ExecutionBudget;
  circuit_breakers: CircuitBreakers;
  execution_modes: Record<string, ExecutionModeConfig>;
  safe_mode: SafeModeConfig;
  branch_strategy: Record<string, BranchConfig>;
  human_approval_required_for: string[];
  artifact_storage: ArtifactStorageConfig;
  agents: Record<string, AgentV2Config>;
}

export interface DeliveryMode {
  description: string;
  phases: string[];
  requires_approval: boolean;
}

export interface WorkflowPolicy {
  description: string;
  default_gates: string[] | "all";
  override?: boolean;
  require_security_review?: boolean;
  require_architect_review?: boolean;
}

export interface ModelTier {
  purpose: string;
  primary_provider: string;
  primary_capability: string;
  allowed_fallback_providers: string[];
  reasoning_effort: "low" | "medium" | "high";
}

export interface ExecutionBudget {
  max_cost_usd: number;
  max_runtime_minutes: number;
  max_parallel_agents: number;
  max_reasoning_tokens: number;
  max_turns_per_agent: number;
}

export interface CircuitBreakers {
  max_failures_per_phase: number;
  max_retries: number;
  stop_on_security_failure: boolean;
  stop_on_schema_risk: boolean;
  stop_on_cost_threshold_exceeded: boolean;
}

export interface ExecutionModeConfig {
  description: string;
}

export interface SafeModeConfig {
  description: string;
  restrictions: string[];
}

export interface BranchConfig {
  type: string;
  description: string;
  pattern?: string;
}

export interface ArtifactStorageConfig {
  runs: string;
  reports: string;
  evidence: string;
  telemetry: string;
  approvals: string;
  memory: string;
}

export interface AgentV2Config {
  role: string;
  emoji: string;
  model_tier?: string;
  reasoning_effort?: "low" | "medium" | "high";
  primary_provider?: string;
  max_turns?: number;
  execution_mode?: string;
  permissions?: AgentPermissions;
  capabilities?: string[];
  skills: string[];
  description?: string;
}

export interface AgentPermissions {
  can_write_code: boolean;
  can_merge_pr?: boolean;
  can_approve_review?: boolean;
}

// ─── Run Types ───────────────────────────────────────────────────────────

export type RunStatus =
  | "completed"
  | "failed"
  | "blocked"
  | "needs_review"
  | "partial"
  | "timeout"
  | "cancelled";

export type DeliveryModeName = "full" | "standard" | "quick" | "review" | "repair";
export type WorkflowPolicyName = "auto" | "conservative" | "balanced" | "aggressive";
export type ExecutionModeName = "deterministic" | "adaptive";
export type ModelTierName = "fast" | "balanced" | "reasoning";

export interface RunConfig {
  mode: DeliveryModeName;
  policy: WorkflowPolicyName;
  execution_mode: ExecutionModeName;
  safe_mode: boolean;
  task: string;
}

export interface StructuredOutput {
  run_id: string;
  trace_id: string;
  delegation_depth: number;
  agent: string;
  role: string;
  status: RunStatus;
  mode: string;
  policy: string;
  execution_mode: string;
  confidence: number;
  low_confidence_items: string[];
  escalation_reason: string | null;
  requires_human_approval: boolean;
  approval_reason: string | null;
  model_provider: string;
  model_used: string;
  model_tier: string;
  reasoning_effort: string;
  fallback_provider_used: string | null;
  fallback_reason: string | null;
  input_tokens: number;
  output_tokens: number;
  reasoning_tokens: number;
  cost_estimate_usd: number | null;
  execution_time_ms: number;
  retry_count: number;
  files_changed: string[];
  tests_added: number;
  tests_run: number;
  tests_passed: boolean;
  coverage_percent: number | null;
  risks: Risk[];
  blockers: Blocker[];
  pending_items: string[];
  recommendation: "proceed" | "block" | "revise";
  evidence: Evidence;
  summary: string;
  next_phase: string;
  capabilities_used: string[];
}

export interface Risk {
  id: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  mitigation: string;
}

export interface Blocker {
  id: string;
  description: string;
  requires: string;
}

export interface Evidence {
  logs: string[];
  screenshots: string[];
  reports: string[];
  coverage_files: string[];
  benchmarks: string[];
  audit_trail: string[];
}

// ─── Engine State ────────────────────────────────────────────────────────

export interface RunState {
  run_id: string;
  trace_id: string;
  config: RunConfig;
  start_time: number;
  phases_completed: string[];
  current_phase: string;
  failures: number;
  retries: number;
  cost_accumulated: number;
  tokens_used: number;
  agent_outputs: Map<string, StructuredOutput>;
  circuit_breaker_tripped: boolean;
  budget_exceeded: boolean;
}
