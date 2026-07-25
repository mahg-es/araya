// ARAYA Runtime Generator — Types
// REQ-043 Slice A: Generate runtime profiles from canonical sources
// Author: Valentina (Backend Developer)
// Date: 2026-07-25

/** A single agent's canonical profile extracted from araya.yaml */
export interface CanonicalAgent {
  name: string;
  version: string;
  status: "active" | "dormant" | "retired" | "proposed";
  emoji: string;
  role: {
    title: string;
    authority: string;
    mission?: string;
  };
  model: {
    tier: "fast" | "balanced" | "reasoning";
    primary_provider?: string;
    provider_policy?: string;
    reasoning_effort?: "low" | "medium" | "high";
  };
  max_turns: number;
  execution_mode?: string;
  permissions: {
    read?: boolean;
    write?: boolean;
    edit?: boolean;
    bash?: boolean;
    can_write_code: boolean;
    can_approve_review?: boolean;
    can_merge_pr?: boolean;
    can_modify_main?: boolean;
    can_access_secrets?: boolean;
    can_emit_binding?: boolean;
    can_produce_deliverables?: boolean;
  };
  capabilities: string[];
  skills: string[];
  description?: string;
  relay?: {
    can_receive_states: string[];
    allowed_results: string[];
    cannot_select_next_owner: boolean;
    evidence_required: boolean;
  };
  boundaries?: {
    must_not: string[];
    consult: Record<string, string>;
  };
  runtime: {
    targets: string[];
    generated: boolean;
  };
  provenance: {
    registry: string;
    narrative?: string;
    generated_hash?: string | null;
  };
}

/** A single skill's canonical profile */
export interface CanonicalSkill {
  name: string;
  version: string;
  status: string;
  owner: string;
  description: string;
  model_tier?: string;
  risk_level: string;
  purpose: {
    problem: string;
    outcome: string;
  };
  when_to_use: string[];
  when_not_to_use: string[];
  requires: {
    skills: string[];
    artifacts?: string[];
  };
  requires_skills: string[];
  permissions: {
    required: string[];
  };
  inputs: {
    required: string[];
  };
  outputs: {
    required: string[];
  };
  evidence_required: string[];
  side_effects: string[];
  failure_modes: string[];
  rollback: {
    strategy: string;
  };
  handoff_to: {
    success: string;
    relay_result: string;
    blocked: string;
  };
  acceptance_tests?: string[];
}

/** Source manifest for hash tracking */
export interface SourceManifest {
  files: string[];
  hashes: Record<string, string>;
  combined_hash: string;
  generated_at: string;
}

/** Runtime profile for a single agent in a target adapter format */
export interface RuntimeProfile {
  agent_name: string;
  adapter: string;
  content: string;
  source_hash: string;
  generated_at: string;
}

/** Generation result */
export interface GenerationResult {
  adapter: string;
  agents: string[];
  profiles_written: number;
  source_hash: string;
  errors: string[];
}

/** Drift report entry */
export interface DriftEntry {
  agent: string;
  adapter: string;
  field: string;
  canonical_value: unknown;
  generated_value: unknown;
  severity: "error" | "warning" | "info";
}

/** Drift validation result */
export interface DriftReport {
  clean: boolean;
  entries: DriftEntry[];
  source_hash_canonical: string;
  source_hash_generated: string;
}

/** Full options for generation */
export interface GenerateOptions {
  root: string;
  check: boolean;
  dry_run: boolean;
  adapters: string[];
  agent_filter: string[];
}

/** Adapter function: converts canonical agent + skills to runtime profile */
export type AdapterFn = (
  agent: CanonicalAgent,
  skills: CanonicalSkill[],
  narrativePrompt?: string,
) => RuntimeProfile;
