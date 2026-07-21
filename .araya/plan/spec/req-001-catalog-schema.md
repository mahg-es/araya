# REQ-001-CATALOG-SCHEMA — Canonical Catalog Architecture

**Workstream:** WS-04 (Canonical Catalog Schema Design)
**Architect:** Aisha (Backend Architect)
**Date:** 2026-07-22
**Status:** Draft — for review by Manu (Product Owner)
**Confidence:** 0.95
**Dependency:** AWU-004 (Esteban GAR) — satisfied by req-001-audit.md

---

## Executive Summary

This document defines the architecture for the ARAYA canonical catalog — the
single source of truth for all commands, functions, skills, and agents. The
catalog powers `/araya:man`, `--help`, search, and delegation routing. It is
**never manually curated** — it is generated and validated against five
repository sources (`araya.yaml`, `extensions/araya/index.ts`, `skills/`,
`prompts/agents/`, `pi.registerCommand` metadata).

The catalog serves as the bridge between the **extension runtime** (what pi
actually registers) and the **organizational knowledge** (what agents need to
discover). It enables agents to answer "What can I use? When should I use it?
Who handles this?" without depending on hardcoded text or memorized prompts.

---

## 1. Canonical Catalog Schema

### 1.1 Entity Model

```
┌──────────────────────────────────────────────────────────┐
│                    CATALOG                                │
│  catalog_version: semver                                 │
│  generated_at: ISO 8601                                  │
│  sources_hash: SHA-256 of all source inputs              │
│  entries: CatalogEntry[]                                 │
│  cross_refs: CrossReference[]                            │
└──────────┬──────────┬──────────┬─────────────────────────┘
           │          │          │
           ▼          ▼          ▼
    ┌──────────┐ ┌─────────┐ ┌──────────┐
    │ Command  │ │ Skill   │ │ Agent    │
    │ Entry    │ │ Entry   │ │ Entry    │
    └──────────┘ └─────────┘ └──────────┘
```

### 1.2 CatalogEntry (Union Type)

Every entry in the catalog shares a **base schema** with type-specific
extensions. This enables unified search across all entity types.

```typescript
// Base — common to all catalog entries
interface CatalogEntryBase {
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
```

### 1.3 CommandEntry (extends CatalogEntryBase)

```typescript
interface CommandEntry extends CatalogEntryBase {
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

interface CommandArgument {
  name: string;
  required: boolean;
  type: "string" | "number" | "boolean" | "path";
  description: string;
  default?: string;
}

interface CommandFlag {
  flag: string;                  // e.g. "--check"
  short?: string;                // e.g. "-c"
  type: "boolean" | "value";
  description: string;
}

interface CommandExample {
  command: string;               // full example
  description: string;           // what it demonstrates
}
```

### 1.4 SkillEntry (extends CatalogEntryBase)

```typescript
interface SkillEntry extends CatalogEntryBase {
  type: "skill";

  // Source
  skill_dir: string;             // relative path to skills/<name>/
  has_skilling_md: boolean;       // does SKILL.md exist?

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

  // Cross-cutting
  is_ax: boolean;                // is it an AX (cross-cutting) skill?
  is_mandatory: boolean;         // must all agents have it?
}
```

### 1.5 AgentEntry (extends CatalogEntryBase)

```typescript
interface AgentEntry extends CatalogEntryBase {
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
```

### 1.6 Supporting Types

```typescript
enum Domain {
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
  AX = "ax",                     // cross-cutting
}

enum EntryStatus {
  ENABLED = "enabled",
  DISABLED = "disabled",
  DEPRECATED = "deprecated",
  NOT_INSTALLED = "not_installed",
}

interface PermissionRequirement {
  permission: string;            // e.g. "can_write_code", "can_approve_review"
  level: "required" | "recommended";
}

interface CrossReference {
  from_id: string;
  to_id: string;
  relationship: "related" | "alternative" | "requires" | "replaces" | "delegates_to";
  reason?: string;
}
```

### 1.7 Catalog Container

```typescript
interface Catalog {
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

interface CatalogStats {
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
  orphans_total: number;         // skills_or_orphan + skills_undeclared
  drift_detected: boolean;
  last_validated: string;
}
```

---

## 2. Sources of Truth

The catalog is never manually written. It is **extracted** from five
sources, each with a defined extraction strategy.

### 2.1 Source Matrix

```
SOURCE                      EXTRACTS                        PARSER
──────────────────────────────────────────────────────────────────────
araya.yaml                  Agents, agent.skills,            YAML parser
                            model_tiers, permissions,
                            capabilities, agent status,
                            provider_optimization

extensions/araya/           Slash commands, subcommand       AST parser
index.ts                    routes, handler types,           (regex-based
                            delegation mappings,             for TypeScript
                            inline handler logic,            patterns)
                            hardcoded help text

skills/<name>/              Skill purpose, problem_solved,   Markdown
SKILL.md                    when_to_use, input/output        frontmatter
                            descriptions, keywords           parser

prompts/agents/             Agent personality,               Markdown
<name>.md                   self-declared skills,            parser
                            delegation rules (written
                            in natural language)

pi.registerCommand          Command metadata that            Runtime
metadata                    cannot be extracted from         reflection
                            source alone (e.g., runtime-
                            computed descriptions)
```

### 2.2 Extraction Rules Per Source

#### araya.yaml → AgentEntry + SkillEntry.assigned_agents

| YAML path | Maps to | Notes |
|-----------|---------|-------|
| `agents.<name>` | `AgentEntry.id`, `.name` | Key is the agent name |
| `agents.<name>.role` | `AgentEntry.role` | |
| `agents.<name>.emoji` | `AgentEntry.emoji` | |
| `agents.<name>.model_tier` | `AgentEntry.model_tier` | |
| `agents.<name>.primary_provider` | `AgentEntry.primary_provider` | |
| `agents.<name>.max_turns` | `AgentEntry.max_turns` | |
| `agents.<name>.execution_mode` | `AgentEntry.execution_mode` | |
| `agents.<name>.permissions.can_write_code` | `AgentEntry.can_write_code` | default: false |
| `agents.<name>.permissions.can_approve_review` | `AgentEntry.can_approve_review` | default: false |
| `agents.<name>.permissions.can_merge_pr` | `AgentEntry.can_merge_pr` | default: false |
| `agents.<name>.capabilities` | `AgentEntry.capabilities` | |
| `agents.<name>.skills` | `AgentEntry.skills` | raw list; cross-ref to SkillEntry |
| `agents.<name>.status` | `AgentEntry.agent_status` | "dormant" if status == "dormant" |
| `agents.<name>.description` | `AgentEntry.purpose` | fallback if no prompt |

**Skill assignment reverse map:** For each `skill_name` in `agents.<name>.skills`,
set `SkillEntry.assigned_agents += [name]` and `SkillEntry.assigned_agent_count++`.

**Orphan detection:** Skills in `araya.yaml` agents but no `skills/<name>/` dir
→ mark `SkillEntry.is_undeclared = true`.

**Unassigned detection:** `skills/<name>/` dirs not referenced by any agent →
mark `SkillEntry.is_orphan = true`.

#### extensions/araya/index.ts → CommandEntry

Parse the TypeScript source using pattern matching (no TS compiler needed;
the patterns are stable):

| Pattern | Extracts |
|---------|----------|
| `pi.registerCommand("<name>", { description: "..." })` | `CommandEntry.slash_command`, `.short_help`, `.registration_method = "registerCommand"` |
| `SUBCOMMAND_ROUTES = { "<word>": { agent: "<agent>", task: "..." } }` | `CommandEntry.slash_command = "/araya <word>"`, `.parent_command = "/araya"`, `.handler_type = "agent_delegation"`, `.delegated_agent`, `.delegation_task_template`, `.registration_method = "subcommand_route"` |
| `SUBCOMMAND_ROUTES = { "<word>": "inline" }` | `.handler_type = "inline"`, `.registration_method = "subcommand_route"` |
| `if (firstWord === "version")` | `.handler_type = "inline_handler"` for inline patterns inside route handler |

**Syntax extraction from handler code:**
- Read `args` parsing logic (e.g., `parseRunFlags`) to derive `CommandArgument[]` and `CommandFlag[]`.
- Pattern-match `if (!task) { ctx.ui.notify("❌ ...") }` blocks for required argument detection.
- Pattern-match `--<flag>` references for flag extraction.

**Delegation correctness audit:**
- Extract delegated agent for each subcommand route.
- Cross-reference with `SkillEntry`: does delegated agent have the necessary skill?
- Flag mismatches per the audit pattern in `req-001-audit.md` (e.g., `generate-uat` → sonia should be clara).

#### skills/<name>/SKILL.md → SkillEntry

| Markdown pattern | Maps to |
|-----------------|---------|
| Frontmatter `name:` | `SkillEntry.name` |
| Frontmatter `description:` | initial `purpose` |
| `## What problem this solves` | `SkillEntry.problem_solved` |
| `## When to use` | `SkillEntry.when_to_use` |
| `## Input` | `SkillEntry.input_description` |
| `## Output` | `SkillEntry.output_description` |

**Domain inference from directory categorization:**
The existing 17-domain taxonomy (from `req-001-audit.md`) maps skills to
domains. Initial mapping is manual curation (one-time), subsequent validation
is automatic — if a skill moves or its content changes domain-signaling
keywords, flag for review.

#### prompts/agents/<name>.md → AgentEntry enrichment

| Pattern | Maps to |
|---------|---------|
| File exists | `AgentEntry.has_prompt_file = true`, `.prompt_path` |
| `## Available Skills` section | cross-reference with `araya.yaml` skills; detect drift |
| "delegate" / "must not execute" language | `AgentEntry.tasks_must_delegate`, `.tasks_must_not_execute` (NLP heuristic) |
| `**Permissions:**` section | cross-reference with `araya.yaml` permissions |

**Drift detection:** Compare skills listed in prompt vs. `araya.yaml`.
Mismatches → CatalogStats.drift_detected = true.

#### Runtime reflection → CommandEntry metadata gaps

Some metadata is only available at runtime (e.g., `pi.registerCommand`
returns nothing, and the handler is a closure). For these:
- The catalog populator runs **inside the extension process** with access to
  the `pi` ExtensionAPI.
- It introspects registered commands to fill gaps that source-code parsing
  cannot (e.g., runtime-computed descriptions, dynamic handler behavior).

### 2.3 Truth Hierarchy

When sources conflict (e.g., skill listed in prompt but not in araya.yaml):

```
PRIORITY (highest first):
1. araya.yaml           — governance source of truth (agents, skills assignments)
2. extensions/araya/    — runtime source of truth (registered commands)
3. skills/SKILL.md       — skill content source of truth
4. prompts/agents/*.md  — agent personality source of truth (overridable by araya.yaml)
```

Conflict resolution rule: **Higher priority wins. Lower-priority source is
flagged as divergent in `CatalogStats.drift_detected`.** Catalog always
reflects the higher-priority truth.

---

## 3. Auto-Generation and Validation Strategy

### 3.1 Core Principle: Zero Manual Maintenance

The catalog file (`.araya/catalog/catalog.json`) is a **build artifact** —
never edited by hand. It is generated by the catalog populator and validated
on every `/araya:ax3 --check` run.

```
┌─────────────────────────────────────────────────────────────────┐
│                     CATALOG LIFECYCLE                            │
│                                                                  │
│  SOURCES                    POPULATOR          VALIDATOR         │
│  ───────                    ─────────          ─────────         │
│  araya.yaml ─┐                                                │
│  index.ts   ─┤                                                │
│  skills/    ─┼──► extract ──► catalog.json ──► validate ──► ✅ │
│  prompts/   ─┤                              │                  │
│  runtime    ─┘                              ▼                  │
│                                        DRIFT REPORT             │
│                                        (if diverged)            │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Populator (Generation)

**Location:** `src/araya/catalog/populator.ts`

**Invocation:**
- `POST /araya:man --regenerate` (manual trigger)
- `/araya:ax3` reconciliation (auto-runs populator)
- Pre-commit hook (generates fresh catalog before commits)
- CI/CD pipeline (validates that catalog matches committed version)

**Algorithm:**
```
function populate(root: string): Catalog
  1. Parse araya.yaml → AgentEntry[] (all agents)
  2. Parse extensions/araya/index.ts → CommandEntry[] (all commands)
  3. Walk skills/ → SkillEntry[] (all SKILL.md files)
  4. Parse prompts/agents/ → enrich AgentEntry[] (drift detection)
  5. merge:
     - For each skill in agents[].skills, link to SkillEntry
     - For each orphan skill dir, flag is_orphan
     - For each undeclared skill, flag is_undeclared
  6. Derive keywords for each entry from:
     - name tokenization
     - purpose text (TF-IDF significant terms)
     - domain classification
     - related skills/agents
  7. Build cross_refs:
     - agent ↔ skill (assignment)
     - agent ↔ agent (delegation chain)
     - command ↔ agent (delegation mapping)
     - command ↔ skill (relevant skills for the command)
  8. Compute sources_hash = SHA-256(all source files)
  9. Compute CatalogStats
  10. Write catalog.json to .araya/catalog/
  11. Return Catalog
```

**Keyword derivation rules:**
- Split name on hyphens, underscores, slashes → all tokens are keywords.
- Extract nouns and verbs from `purpose` using simple POS tagging (or just
  significant words ≥ 4 chars).
- Add domain name as keyword.
- Add all `aliases` as keywords.
- Add agent name for skill entries (so `/araya:man --agent aisha` finds
  aisha's skills).

### 3.3 Validator (Drift Detection)

**Location:** `src/araya/catalog/validator.ts`

**Invocation:**
- `/araya:ax3 --check` (reads current catalog, re-parses sources, compares)
- `npm test` (unit test: generates fresh catalog, asserts equality)
- Pre-commit hook (blocks commit if drift detected without regeneration)

**Algorithm:**
```
function validate(root: string): ValidationReport
  1. Generate fresh catalog from sources (populate in-memory, no write)
  2. Read existing catalog.json from .araya/catalog/
  3. If no existing catalog: report "no catalog — run /araya:ax3"
  4. Compare:
     a. sources_hash: if different → sources changed, catalog needs regeneration
     b. entries count per type: if different → entries added/removed without catalog update
     c. Field-by-field diff for each entry → detailed drift report
  5. For each divergence, classify:
     - ADDED: entry exists in fresh but not in stored
     - REMOVED: entry exists in stored but not in fresh
     - MODIFIED: field value differs
  6. Return ValidationReport with exit code: 0 = clean, 1 = drift
```

**Drift severity classification:**
- **CRITICAL:** Agent permissions changed, command disabled, skill deleted
- **HIGH:** Agent skills changed, command delegation target changed
- **MEDIUM:** Description updated, keywords changed, examples added
- **LOW:** Formatting only, metadata timestamp updated

### 3.4 Integration Points

| Hook | Action |
|------|--------|
| `pi.on("before_extension_load")` | Populator runs; loads catalog into memory for fast `/araya:man` responses |
| `/araya:ax3` | Calls populator as part of full reconciliation |
| `/araya:ax3 --check` | Calls validator; reports drift without writing |
| `git pre-commit` | Validates catalog matches sources; blocks if drift |
| CI pipeline | `npm run catalog:validate` → exit code determines pass/fail |

### 3.5 Manual Override Mechanism

Some fields cannot be auto-derived (e.g., `usage_notes`, nuanced `when_to_use`,
domain classification for ambiguous skills). These are stored in an **overlay
file** — `.araya/catalog/overrides.yaml` — that the populator merges on top of
auto-extracted data.

```yaml
# .araya/catalog/overrides.yaml
overrides:
  "cmd:araya:validate":
    usage_notes:
      - "Does not check for implementation completeness — only AC coverage."
      - "For full delivery validation, use Daneel's reality-verification."
    keywords_extra:
      - "acceptance"
      - "checklist"
  "skill:ai-routing":
    domain: "ax"  # override auto-detected domain
```

**Rules:**
- Overrides **supplement**, never replace, auto-extracted data.
- If a field is auto-extractable and the override differs, the validator flags
  it as `OVERRIDE_DIVERGENCE` — the override may be stale.
- Overrides can add keywords but cannot remove auto-derived ones.

---

## 4. API / MCP for the Delegation Broker

### 4.1 Broker Architecture

The delegation broker is the **runtime layer** that accepts `/araya <agent>
"<task>"` requests and dispatches them independently of any specific runtime's
subagent mechanism. This satisfies DI-001 and DI-002.

```
┌──────────┐     ┌──────────────────┐     ┌──────────────┐
│  Agent   │────►│  BROKER          │────►│  Target      │
│  (any    │     │                  │     │  Agent       │
│  runtime)│     │  POST /delegate  │     │  (executes)  │
│          │     │                  │     │              │
│          │◄────│  Correlation ID  │◄────│  Result      │
└──────────┘     └──────────────────┘     └──────────────┘
```

### 4.2 Delegation Protocol

The broker exposes a protocol accessible from any agent runtime:

```
ENDPOINT:           /araya:delegate
TRANSPORT:          MCP (Model Context Protocol) tool call
                    OR direct function call within pi runtime
RUNTIME-AGNOSTIC:   Agents call the broker via MCP tool "araya_delegate"
                    which any MCP-compatible client can invoke.
```

### 4.3 Request Schema

```typescript
interface DelegateRequest {
  // Correlation
  delegation_id: string;         // ULID, generated by broker on receipt
  run_id: string;                // parent run/session ID
  parent_delegation_id?: string; // for chain tracking

  // Target
  target_agent: string;          // agent name (must exist in catalog)
  task: string;                  // natural language task description

  // Context
  source_agent: string;          // who is requesting
  source_runtime: string;        // "pi" | "codex" | "claude" | "agy"
  context_files?: string[];      // optional file paths for context

  // Execution
  max_depth: number;             // remaining delegation depth (default: 3)
  model_tier?: string;           // override target agent's tier
  timeout_ms?: number;           // max wait for result
  safe_mode?: boolean;           // dry-run only
}
```

### 4.4 Response Schema

```typescript
interface DelegateResponse {
  // Correlation
  delegation_id: string;
  run_id: string;
  status: DelegateStatus;

  // Result
  result?: DelegateResult;
  error?: DelegateError;

  // Timing
  created_at: string;
  dispatched_at?: string;
  completed_at?: string;
  duration_ms?: number;
}

enum DelegateStatus {
  PENDING = "pending",
  DISPATCHED = "dispatched",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  BLOCKED = "blocked",
  TIMEOUT = "timeout",
  REJECTED = "rejected",
}

interface DelegateResult {
  summary: string;               // human-readable result
  artifacts: ArtifactRef[];      // files produced
  confidence: number;            // 0.0–1.0
  evidence_path: string;         // .araya/runs/{run_id}/delegation-{id}.md
  agent_response: string;        // full agent output
  risks: string[];
  blockers: string[];
}

interface DelegateError {
  code: DelegateErrorCode;
  message: string;
  suggestions?: string[];        // suggested alternative agents
}

enum DelegateErrorCode {
  AGENT_NOT_FOUND = "agent_not_found",
  AGENT_DISABLED = "agent_disabled",
  AGENT_BARE = "agent_bare",     // agent exists but has ≤1 non-ax skill
  RECURSION_DETECTED = "recursion_detected",
  MAX_DEPTH_EXCEEDED = "max_depth_exceeded",
  PERMISSION_DENIED = "permission_denied",
  SELF_DELEGATION = "self_delegation",
  CAPABILITY_MISMATCH = "capability_mismatch",
  TIMEOUT = "timeout",
  RUNTIME_ERROR = "runtime_error",
}
```

### 4.5 Recursion Protection (DI-004)

```
validateDelegationChain(request):
  1. If request.source_agent == request.target_agent → REJECT (self_delegation)
  2. Resolve chain: follow parent_delegation_id to root
  3. If target_agent appears in chain → REJECT (cycle_detected)
  4. If chain.length >= request.max_depth → REJECT (max_depth_exceeded)
  5. If target_agent.status != "active" → REJECT (agent_disabled / agent_dormant)
  6. If target_agent has ≤1 non-ax skill → WARN + optional REJECT (agent_bare)
  7. Check capabilities: does target_agent.skills cover task keywords?
     → If gap, WARN with suggestions; caller can proceed or cancel
  8. Accept → generate delegation_id, transition to DISPATCHED
```

### 4.6 Persistence (DI-003)

Every delegation writes to `.araya/runs/{run_id}/`:

```
.araya/runs/{run_id}/
├── run.json                  # session metadata
├── delegation-{id}.json      # request + response for each delegation
├── delegation-{id}.md        # human-readable evidence
├── artifacts/                # files produced by delegated agent
└── chain.dot                 # delegation DAG (Graphviz)
```

### 4.7 MCP Tool Registration

The broker registers the following MCP tools for runtime-agnostic access:

```json
{
  "tools": [
    {
      "name": "araya_delegate",
      "description": "Delegate a task to an ARAYA specialist agent. Use this instead of executing work directly when a specialist agent exists.",
      "inputSchema": { /* DelegateRequest */ }
    },
    {
      "name": "araya_catalog_search",
      "description": "Search the ARAYA canonical catalog for commands, skills, or agents matching criteria.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": { "type": "string", "description": "Search keywords" },
          "type": { "enum": ["command", "skill", "agent", "all"] },
          "domain": { "enum": [/* Domain */] },
          "status": { "enum": ["enabled", "disabled", "deprecated"] }
        }
      }
    },
    {
      "name": "araya_man",
      "description": "Display manual page for a command, skill, or agent.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": { "type": "string", "description": "Command name, skill name, or agent name" },
          "format": { "enum": ["full", "summary", "syntax_only"] }
        }
      }
    }
  ]
}
```

---

## 5. Relationship with Existing Slash Command Registry

### 5.1 Current State

The current architecture has two layers:

```
LAYER 1: pi.registerCommand(<name>, { handler })
         ↓
         38 individually registered slash commands
         Some delegate to agents via pi.sendUserMessage(buildAgentPrompt(...))
         Some are inline handlers (hardcoded logic in index.ts)

LAYER 2: SUBCOMMAND_ROUTES (inside /araya handler)
         ↓
         28 space-form routes (/araya validate, /araya learn, etc.)
         Maps firstWord → { agent, task } or "inline"
         Pattern-matched in a giant if/else chain
```

### 5.2 Target State: Three-Layer Architecture

```
LAYER 0: CATALOG (.araya/catalog/catalog.json)
         Generated from sources. Read-only at runtime.
         Single source of truth for ALL commands, skills, agents.

LAYER 1: /araya:man SYSTEM
         Consumes catalog. Provides help, search, detail views.
         Dispatches --help, /araya:man <query>, /araya:man --search.

LAYER 2: DELEGATION BROKER (/araya:delegate)
         Consumes catalog for agent lookup, capability validation.
         Handles dispatch, state machine, evidence persistence.

LAYER 3: EXTENSION (pi.registerCommand handlers)
         Slimmed down. All commands delegate through broker.
         No more hardcoded agent→task mappings in SUBCOMMAND_ROUTES.
         Instead: routes reference catalog entries.
```

### 5.3 Migration Path (Non-Destructive)

The existing 38 `pi.registerCommand` calls and 28 SUBCOMMAND_ROUTES are
**preserved** — they continue to work. The catalog and broker are added
alongside, not in replacement:

**Phase A (this deliverable):**
1. Add catalog populator and validator.
2. Catalog is generated. Existing commands continue working unchanged.
3. `/araya:man` is added as a new command that reads from the catalog.

**Phase B (WS-07: Catalog Population):**
4. Populator runs. First catalog.json committed to repo.
5. Validator hooks into `/araya:ax3 --check`.

**Phase C (WS-09: /araya:man):**
6. `/araya:man` goes live. It serves from the catalog.
7. `/araya help` is **redirected** to `/araya:man` for consistency.
8. `--help` on each command delegates to `/araya:man <command>`.

**Phase D (WS-10: Delegation Broker):**
9. Broker goes live. `/araya <agent> <task>` routes through broker
   instead of directly calling `buildAgentPrompt` + `pi.sendUserMessage`.
10. SUBCOMMAND_ROUTES entries are migrated one-by-one to catalog references.
11. Old SUBCOMMAND_ROUTES continue working during migration; removed
    only after each route's delegation is confirmed correct.

### 5.4 Catalog ↔ Extension Synchronization Contract

```
CONTRACT: Every pi.registerCommand must have a corresponding
          CommandEntry in the catalog.

VALIDATION:
- On extension load, verify: for each registered command,
  ∃ CommandEntry with matching slash_command.
- If missing → WARN in logs, auto-generate minimal entry.
- If extra (catalog entry with no registered command) →
  mark as "not_installed" in catalog.

CONTRACT: Every SUBCOMMAND_ROUTES entry must have a corresponding
          CommandEntry (parent_command="/araya") in the catalog.

VALIDATION:
- On catalog generation, parse SUBCOMMAND_ROUTES from index.ts.
- For each firstWord → agent mapping, generate CommandEntry.
- Flag incorrect delegations (agent lacks required skill) as
  CatalogEntry.risks entries.
```

### 5.5 Hardcoded Help Text — Deprecation Strategy

The current `/araya help` hardcoded string (~100 lines in index.ts lines
256–350) is preserved as a **fallback** during transition:

1. **Immediate:** Add `/araya:man` that reads from catalog.
2. **Transition:** `/araya help` displays: "For full interactive help, use
   `/araya:man`. Quick reference:" followed by auto-generated summary from
   catalog (not the hardcoded string).
3. **Completion:** Remove hardcoded help string entirely. Hardcoded content
   is archived to `.araya/catalog/legacy/help-archived-2026-07.txt` for
   historical reference.

---

## 6. Catalog Storage and File Layout

```
.araya/
  catalog/
    catalog.json              # the generated catalog (build artifact)
    catalog.schema.json        # JSON Schema for validation
    overrides.yaml             # manual overrides (human-editable)
    legacy/                    # archived hardcoded content
      help-archived-YYYY-MM.txt
    stats/
      catalog-YYYY-MM-DD.json  # daily snapshots for trend analysis
  runs/
    {run_id}/
      delegation-{id}.json
      delegation-{id}.md
      artifacts/
      chain.dot
```

---

## 7. Performance and Scale Considerations

### 7.1 Catalog Size

| Metric | Current | Projected (with full enrichment) |
|--------|---------|----------------------------------|
| Commands | ~38 registered + 28 subroutes = ~66 | ~66 (stable) |
| Skills | 122 | 126 (orphans resolved) |
| Agents | 30 | 30 (stable) |
| Cross-references | ~200 | ~500 (skill↔agent, command↔agent, agent↔agent) |
| **Catalog JSON size** | N/A | ~150–250 KB (acceptable for in-memory loading) |

### 7.2 Generation Performance

- Populator runs in < 500ms on current codebase (parsing ~3000 lines of TS,
  700 lines of YAML, 122 SKILL.md files).
- Catalog is loaded once on extension init and cached in memory.
- Validation (comparison) runs in < 100ms (JSON diff).

### 7.3 Search Performance

- `/araya:man --search <keyword>` runs against in-memory catalog.
- Keyword index pre-built at generation time (Map<keyword, entryId[]>).
- Sub-10ms response for typical queries.

---

## 8. Architecture Decisions (ADR)

### ADR: Catalog is a Build Artifact, Not a Runtime Database

**Decision:** The catalog is a JSON file committed to the repository,
generated by the populator. It is not a live database queried at runtime.

**Rationale:**
- **Git-versioned:** Catalog changes are visible in PRs. Drift is detectable
  by git diff.
- **Offline-first:** Agents can read catalog.json without running the
  extension.
- **CI/CD-friendly:** Validation can run as a pre-commit hook without a
  running agent.
- **Simplicity:** No need for a database, cache invalidation, or sync
  protocol.

**Tradeoff:** Slight latency on extension load (populator runs). Mitigated by
caching and incremental regeneration (only re-generate if sources_hash changed).

### ADR: Overlay for Manual Overrides, Not Mixed Source

**Decision:** Fields that cannot be auto-derived are stored in a separate
`overrides.yaml` file, not mixed into the auto-generated catalog.

**Rationale:**
- **Clean separation:** Auto-generated content vs. human-curated content.
- **Safe regeneration:** Populator can regenerate catalog.json without
  touching human overrides.
- **Drift detection:** Validator can detect when overrides are stale
  (auto-extracted value changed but override wasn't updated).

### ADR: MCP as Broker Protocol

**Decision:** The delegation broker exposes MCP tools for runtime-agnostic
access, with a thin pi-specific wrapper for local performance.

**Rationale:**
- **DI-002 compliance:** Any MCP client (Codex, Claude CLI, AGY) can
  delegate without a proprietary `subagent` tool.
- **Standard protocol:** MCP is an emerging standard for AI tool calling.
- **Graceful degradation:** If MCP is unavailable, fall back to direct
  function call within pi runtime.

---

## 9. Verification Criteria (for WS-04 closeout)

These criteria must be met before WS-04 is considered complete:

1. **Schema completeness:** All five entity types (CatalogEntryBase,
   CommandEntry, SkillEntry, AgentEntry, CrossReference) are fully defined
   with field-level types and descriptions.
2. **Source mapping:** Every field in every entity has a defined extraction
   rule from one of the five sources.
3. **No manual catalog:** The architecture explicitly prevents manual
   catalog maintenance. Populator and validator are specified.
4. **Drift detection:** Validator detects when sources change without
   catalog regeneration. Exit code contract defined.
5. **Broker API:** DelegateRequest and DelegateResponse schemas are
   complete. Error codes cover all defined failure modes.
6. **Recursion protection:** Algorithm for cycle detection and depth
   limiting is specified (DI-004).
7. **Existing registry preserved:** Migration path is non-destructive.
   Existing 38 commands and 28 subroutes continue to work.
8. **ADR written:** Architecture decisions documented with rationale.
9. **File layout:** Storage paths and naming conventions defined.
10. **This document reviewed by Manu (Product Owner) as SPEC_APPROVED.**

---

## Appendix A: Domain → Skill Mapping (Initial Curation)

This mapping bootstraps the domain classifier. It is stored as `overrides.yaml`
until the populator can auto-derive domains from skill content + agent assignment.

```
DOMAIN              SKILLS
──────────────────────────────────────────────────────
backend:            api-design, api-document, api-gateway, api-integration,
                    auth-middleware, db-optimization, db-schema, endpoint,
                    error-handling
frontend:           accessibility, animation, component, component-arch,
                    form-design, page-route, performance, responsive,
                    state-management
architecture:       adr-write, architecture-diagram, cache-strategy,
                    message-queue, microservice
qa_testing:         bdd-feature, cicd-quality, coverage, e2e-strategy,
                    integration-test, performance-test, regression,
                    tdd-execute, tdd-generate, test-case, uat-generate,
                    uat-review, unit-test
security:           compliance, pentest, secrets, secure-arch, secure-code,
                    threat-model
infra_devops:       cicd-pipeline, cloud-deploy, cloud-provision,
                    deployment-automation, docker, kubernetes, monitoring
data_ai:            agent-design, data-governance, data-lakehouse-design,
                    data-modeling, data-quality, etl-orchestration,
                    llm-local-deploy, medallion-architecture, model-fine-tuning,
                    rag-pipeline, spark-pipeline, vector-search
bi_analytics:       analytics-report, dashboard-design, data-visualization,
                    kpi-framework
finops:             budget-forecasting, cost-analysis, resource-rightsizing,
                    token-efficiency, usage-metering
profitability:      abc-costing-model, cost-to-serve, profitability-lineage,
                    whale-curve-analyze
education:          curriculum-planning, lab-scenario-design, student-assessment,
                    training-module
content_brand:      asset-management, brand-audit, brand-compliance,
                    content-calendar, geo-branding, multi-platform-publish,
                    seo-optimize, theme-design, visual-identity
documentation:      api-document, architecture-diagram, slide-deck-generate,
                    static-site-generate, technical-book
governance_pm:      cr-generate, daily-standup, definition-of-done, drr-create,
                    iar-generate, impediment, pm-decompose, pm-dependencies,
                    pm-plan, pm-risk, pm-status, project-planning,
                    reality-verification, retrospective, sprint-planning,
                    velocity
knowledge:          daily-note, knowledge-graph, organizational-knowledge,
                    pkm-workflow, trajectory-management
chro:               agent-topology, capability-registry, gap-analysis,
                    hiring-recommendations, organizational-health,
                    skills-lifecycle, spof-detection, workforce-planning
ax:                 ai-routing, autonomous-execution, ax-postoffice,
                    ax3, token-efficiency
```

---

## Appendix B: File Reference

| File | Role in this design |
|------|-------------------|
| `araya.yaml` | Primary source: agents, agent.skills, permissions, capabilities |
| `extensions/araya/index.ts` | Primary source: registered commands, subcommand routes, inline handlers |
| `skills/*/SKILL.md` | Primary source: skill content, purpose, when-to-use |
| `prompts/agents/*.md` | Enrichment source: agent personality, self-declared skills (drift detection) |
| `.araya/catalog/catalog.json` | **Target artifact** — the generated catalog |
| `.araya/catalog/overrides.yaml` | Human-curated supplements |
| `.araya/plan/spec/req-001-audit.md` | Input: Esteban's gap analysis (AWU-004) |
| `.araya/plan/requirements/req-001.md` | Input: acceptance criteria reference |
| `.araya/plan/spec/req-001-workstreams.md` | Input: workstream dependency chain |

---

*Aisha — Backend Architect. Architecture design complete. Ready for Manu review
and Valentina implementation (WS-07).*

