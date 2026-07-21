// ARAYA Catalog Types
// WS-07: Canonical catalog schema per req-001-catalog-schema.md §1
// Author: Valentina (Backend Developer)
// Date: 2026-07-22

// ─── Enums ─────────────────────────────────────────────────────────────────

export enum Domain {
  BACKEND = "backend",
  FRONTEND = "frontend",
  ARCHITECTURE = "architecture",
  QA_TESTING = "qa_testing",
  SECURITY = "security",
  INFRA_DEVOPS = "infra_devops",
  DATA_AI = "data_ai",
  BI_ANALYTICS = "bi_analytics",
  FINOPS = "finops",
  PROFITABILITY = "profitability",
  EDUCATION = "education",
  CONTENT_BRAND = "content_brand",
  DOCUMENTATION = "documentation",
  GOVERNANCE_PM = "governance_pm",
  KNOWLEDGE = "knowledge",
  CHRO = "chro",
  AX = "ax",
}

export enum EntryStatus {
  ENABLED = "enabled",
  DISABLED = "disabled",
  DEPRECATED = "deprecated",
  NOT_INSTALLED = "not_installed",
}

// ─── Supporting Types ──────────────────────────────────────────────────────

export interface PermissionRequirement {
  permission: string;           // e.g. "can_write_code", "can_approve_review"
  level: "required" | "recommended";
}

export interface CrossReference {
  from_id: string;
  to_id: string;
  relationship: "related" | "alternative" | "requires" | "replaces" | "delegates_to";
  reason?: string;
}

// ─── CatalogEntry Base ─────────────────────────────────────────────────────

export interface CatalogEntryBase {
  // Identity
  id: string;                    // unique, e.g. "cmd:araya:ax3", "skill:api-design", "agent:aisha"
  type: "command" | "skill" | "agent";
  name: string;                  // canonical name, e.g. "/araya:ax3", "api-design", "aisha"

  // Discovery
  keywords: string[];            // searchable terms (auto-derived + manual override)
  domain: Domain;                // governance domain (enum)
  aliases: string[];             // alternative names, e.g. "/araya help" → "/araya:man"
  display_name: string;          // human-readable, e.g. "AX3 Reconciliation"

  // Classification
  purpose: string;               // 1-2 sentences: what it does, when to use it
  status: EntryStatus;           // enabled | disabled | deprecated | not_installed
  tier: "fast" | "balanced" | "reasoning" | null; // null for commands/skills without tier

  // Source of truth
  source_files: string[];        // absolute repo paths to sources
  source_type: "araya.yaml" | "registerCommand" | "skills/SKILL.md" | "prompts/agents/*.md" | "runtime_derived";
  is_auto_generated: boolean;    // true = no manual override needed
  auto_overrides?: Record<string, string>; // manual overrides for fields that can't be auto-derived

  // Relationships
  related: string[];             // IDs of related entries
  alternatives: string[];        // IDs of alternative capabilities
  requires: string[];            // IDs of prerequisites

  // Contract
  preconditions: string[];       // what must be true before use
  side_effects: string[];        // what this changes
  risks: string[];               // known risks or gotchas
  permissions: PermissionRequirement[];

  // Meta
  deprecated_since?: string;     // ISO date when deprecated
  replaced_by?: string;          // ID of replacement entry
  last_validated: string;        // ISO date of last auto-validation
}

// ─── CommandEntry ──────────────────────────────────────────────────────────

export interface CommandArgument {
  name: string;
  required: boolean;
  type: "string" | "number" | "boolean" | "path";
  description: string;
  default?: string;
}

export interface CommandFlag {
  flag: string;                  // e.g. "--check"
  short?: string;                // e.g. "-c"
  type: "boolean" | "value";
  description: string;
}

export interface CommandExample {
  command: string;               // full example
  description: string;           // what it demonstrates
}

export interface CommandEntry extends CatalogEntryBase {
  type: "command";

  // Registration
  registration_method: "registerCommand" | "subcommand_route" | "inline_handler";
  slash_command: string;         // e.g. "/araya:ax3"
  parent_command?: string;       // for subcommands, e.g. "/araya"

  // Syntax
  syntax: string;                // e.g. "/araya:ax3 [--check|--dry-run|--scope <path>|--repair]"
  arguments: CommandArgument[];
  flags: CommandFlag[];
  examples: CommandExample[];

  // Execution
  handler_type: "agent_delegation" | "inline" | "runtime_function";
  delegated_agent?: string;      // agent name if delegated
  delegation_task_template?: string; // the task string passed to the agent

  // Help
  short_help: string;            // one line
  long_help: string;             // full description
  usage_notes: string[];         // common pitfalls, when NOT to use
}

// ─── SkillEntry ────────────────────────────────────────────────────────────

export interface SkillEntry extends CatalogEntryBase {
  type: "skill";

  // Source
  skill_dir: string;             // relative path to skills/<name>/
  has_skilling_md: boolean;      // does SKILL.md exist?

  // Assignment
  assigned_agents: string[];     // agent names (from araya.yaml)
  assigned_agent_count: number;
  is_orphan: boolean;            // exists in skills/ but no agent has it
  is_undeclared: boolean;        // agent declares it but no skills/ directory

  // Content
  problem_solved: string;        // from SKILL.md "What problem this solves"
  when_to_use: string;           // from SKILL.md "When to use"
  input_description: string;     // from SKILL.md "Input"
  output_description: string;    // from SKILL.md "Output"
  usage_notes: string;           // from SKILL.md "When to use" (syntax guidance)

  // Cross-cutting
  is_ax: boolean;                // is it an AX (cross-cutting) skill?
  is_mandatory: boolean;         // must all agents have it?
}

// ─── AgentEntry ────────────────────────────────────────────────────────────

export interface AgentEntry extends CatalogEntryBase {
  type: "agent";

  // Identity
  emoji: string;
  role: string;                  // e.g. "Backend Architect"
  model_tier: "fast" | "balanced" | "reasoning";
  primary_provider: string;
  max_turns: number;
  execution_mode?: string;

  // Permissions
  can_write_code: boolean;
  can_approve_review: boolean;
  can_merge_pr: boolean;

  // Capabilities
  capabilities: string[];
  skills: string[];              // skill names (not IDs)
  skill_count: number;

  // Prompt
  has_prompt_file: boolean;
  prompt_path?: string;          // prompts/agents/<name>.md

  // Delegation contract
  must_delegate_to: string[];    // agents this agent must delegate certain work to
  never_delegate_from: string[]; // agents that should not delegate to this one
  tasks_must_delegate: string[]; // task categories that must be delegated
  tasks_must_not_execute: string[]; // task categories outside authority

  // Status
  agent_status: "active" | "dormant" | "bare" | "provisioned";
  bare_risk?: "none" | "low" | "high"; // ≤1 non-ax skill → high
}

// ─── Catalog Container ─────────────────────────────────────────────────────

export interface CatalogStats {
  total_entries: number;
  commands_count: number;
  commands_enabled: number;
  commands_disabled: number;
  commands_deprecated: number;
  skills_count: number;
  skills_orphan: number;
  skills_undeclared: number;
  agents_count: number;
  agents_active: number;
  agents_dormant: number;
  agents_bare: number;
  orphans_total: number;         // skills_orphan + skills_undeclared
  drift_detected: boolean;
  last_validated: string;
}

export interface Catalog {
  version: string;               // semver of catalog schema
  generated_at: string;          // ISO 8601
  sources_hash: string;          // SHA-256 to detect source drift
  source_files: string[];        // all files that contributed
  stats: CatalogStats;
  commands: CommandEntry[];
  skills: SkillEntry[];
  agents: AgentEntry[];
  cross_refs: CrossReference[];
}

// ─── Validator Types ───────────────────────────────────────────────────────

export type DriftSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface DriftEntry {
  id: string;
  type: "ADDED" | "REMOVED" | "MODIFIED";
  severity: DriftSeverity;
  field?: string;
  old_value?: any;
  new_value?: any;
  message: string;
}

export interface ValidationReport {
  valid: boolean;
  drift_count: number;
  drift_entries: DriftEntry[];
  sources_hash_match: boolean;
  message: string;
}
