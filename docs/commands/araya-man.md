# /araya:man — Command Reference

- **Document:** `/araya:man` Command Reference
- **Date:** 2026-07-22
- **Author:** Priscila (Technical Writer)
- **Version:** 1.0
- **Status:** draft
- **Subject Matter Expert:** Valentina (Backend Developer) — catalog implementation, WS-09

---

## Table of Contents

1. [What is /araya:man?](#1-what-is-arayaman)
2. [Why It Matters](#2-why-it-matters)
3. [How to Use — All Modes](#3-how-to-use--all-modes)
   - [Mode 1: Browse Everything](#mode-1-browse-everything)
   - [Mode 2: Unified Lookup](#mode-2-unified-lookup)
   - [Mode 3: Agent Profile](#mode-3-agent-profile)
   - [Mode 4: Skill Reference](#mode-4-skill-reference)
   - [Mode 5: Command Reference](#mode-5-command-reference)
   - [Mode 6: Keyword Search](#mode-6-keyword-search)
   - [Mode 7: List by Type](#mode-7-list-by-type)
   - [Mode 8: Man Help](#mode-8-man-help)
4. [How It Works](#4-how-it-works)
5. [Expected Output Samples](#5-expected-output-samples)
6. [Troubleshooting](#6-troubleshooting)
7. [Related Commands](#7-related-commands)

---

## 1. What is /araya:man?

`/araya:man` (ARAYA Manual) is the **canonical discovery system** for the entire ARAYA Framework. It lets any agent or human browse, search, and inspect all registered commands, agents, and skills across the organization.

It is powered by the **canonical catalog** (`.araya/catalog/catalog.json`), which is auto-generated from repository sources — **never hand-edited**. The catalog is validated against source truth by `/araya:ax3 --check` and by Daneel's reality verification.

**Key principle:** agents should never invent commands, flags, agent names, or skill names. `/araya:man` is the single source of truth for "what exists in ARAYA."

---

## 2. Why It Matters

Without `/araya:man`, agents face three failure modes:

| Failure | What Happens | /araya:man Fix |
|---------|-------------|-----------------|
| **Discovery gap** | Agent doesn't know a capability exists, writes duplicate code | Searches catalog before starting work |
| **Authority violation** | Agent executes specialist work instead of delegating | Identifies the correct specialist agent |
| **Command invention** | Agent fabricates a command that doesn't exist | Validates against real registered commands |

The `araya-command-and-delegation-expert` skill (assigned to **every** ARAYA agent) mandates catalog consultation **before the first tool call of every task**.

---

## 3. How to Use — All Modes

### Mode 1: Browse Everything

```
/araya:man
```

Shows the **full catalog summary**: command count, agent roster with tiers and skill counts, skill overview. Stats include orphan and undeclared skill detection.

**When to use:**
- You just loaded ARAYA and want an overview
- You need counts: "how many agents exist? how many skills?"
- You want to see orphan/undeclared skill warnings

---

### Mode 2: Unified Lookup

```
/araya:man <query>
```

Performs a unified lookup across commands, agents, and skills. Tries:
1. **Exact command match** (by slash command or name)
2. **Exact agent match** (case-insensitive name)
3. **Exact skill match** (case-insensitive name)
4. **Partial match** (did-you-mean suggestions)
5. **Fuzzy match** (Levenshtein distance, top 5 suggestions)

**Examples:**

```bash
# Look up a command
/araya:man ax3

# Look up an agent
/araya:man valentina

# Look up a skill
/araya:man api-design

# Look up with slash prefix
/araya:man /araya:validate
```

**Expected output for a command lookup:**

```markdown
## /araya:ax3

**Purpose:** Reconcile the AX3 contract hierarchy — validate, check, or repair
**Status:** 🟢 Active | **Domain:** `governance`

**Syntax:**
```

/araya:ax3 [--check|--dry-run|--scope <path>|--repair]
```

**Arguments:**
  - *(none — all behavior via flags)*

**Flags:**
  - `--check`: Detect drift (exit 0 = clean, 1 = drift)
  - `--dry-run`: Preview changes without writing
  - `--scope <path>`: Reconcile a specific subtree
  - `--repair`: Fix safe inconsistencies

**Examples:**
  - `/araya:ax3` — reconcile entire AX3 tree
  - `/araya:ax3 --check` — detect drift
  - `/araya:ax3 --dry-run` — preview changes
  - `/araya:ax3 --scope src/` — reconcile source subtree
  - `/araya:ax3 --repair` — fix safe inconsistencies

*Catalog entry: `cmd:ax3` — last validated 2026-07-22*
```

---

### Mode 3: Agent Profile

```
/araya:man --agent <name>
```

Shows a **complete agent profile**: role, purpose, model tier, provider, capabilities, skills, permissions (can_write_code, can_approve_review, can_merge_pr), execution mode, max turns, and **MUST NOT execute** / **Must Delegate To** constraints.

**Examples:**

```bash
/araya:man --agent sonia
/araya:man --agent valentina
/araya:man --agent diana
```

**Expected output (abbreviated):**

```markdown
## 👑 Manu — Product Owner (The Data Professor's proxy)

**Purpose:** Permanent proxy for The Data Professor. Owns product direction,
requirements, acceptance criteria, and release decisions.
**Status:** 🟢 Active | **Tier:** `reasoning` | **Provider:** deepseek

**Capabilities:**
  - Product Ownership
  - Acceptance Criteria Definition
  - Gap Analysis (Q&A questionnaires)
  - Release Gate Authority

**Skills:**
  - `sdd-vision`
  - `sdd-requirements`
  - `test-case`
  - `po-gap-questionnaire`
  - `definition-of-done`
  - `project-planning`
  - `bdd-feature`
  - `pm-status`

**Permissions:**
  - ✍️ Can write governance docs
  - ❌ Cannot approve reviews
  - ❌ Cannot merge PRs
  - **Max turns:** 12
```

**When to use:**
- Before delegating to an agent: verify they have the right skills
- When choosing between agents: compare capabilities
- When auditing authority boundaries: check "MUST NOT execute" constraints

---

### Mode 4: Skill Reference

```
/araya:man --skill <name>
```

Shows a **complete skill reference**: purpose, domain, status, whether it's cross-cutting (AX) or mandatory, what problem it solves, when to use it, input/output descriptions, assigned agents, prerequisites.

**Examples:**

```bash
/araya:man --skill api-design
/araya:man --skill threat-model
/araya:man --skill araya-command-and-delegation-expert
```

**Expected output:**

```markdown
## /skill:araya-command-and-delegation-expert

**Purpose:** Cross-cutting mandatory skill for all ARAYA agents. Teaches
command discovery, manual consultation (/araya:man), capability-aware
execution, and mandatory specialist delegation.
**Domain:** `governance` | **Status:** 🟢 Active
**🔀 Cross-cutting (AX):** Yes
**⚠️ Mandatory:** All agents must have this skill

**Problem Solved:**
Agents skip discovery, write code from memory when a specialist should do it,
invent commands that don't exist, and execute specialist work instead of
delegating.

**Assigned Agents (27):**
  - sonia, manu, valentina, alejandra, teresa, diana, aisha, isla, ...
```

**When to use:**
- Before using an unfamiliar skill: understand its scope
- When onboarding a new agent: check skill assignments
- When auditing capability coverage: find orphaned skills

---

### Mode 5: Command Reference

```
/araya:man --command <name>
```

Shows a **detailed command reference**: purpose, status, domain, syntax, arguments, flags, examples, execution handler, delegated agent, usage notes, risks, alternatives, and related commands.

**Examples:**

```bash
/araya:man --command /araya:validate
/araya:man --command /araya:status
/araya:man --command /araya:delegate
```

---

### Mode 6: Keyword Search

```
/araya:man --search <keyword>
```

Searches across **all catalog entries** (commands, agents, skills) by keyword. Results are grouped by type with compact formatting.

**Examples:**

```bash
# Find everything related to security
/araya:man --search security

# Find deployment-related capabilities
/araya:man --search deploy

# Find testing-related capabilities
/araya:man --search test

# Find all agents in a domain
/araya:man --search architecture
```

**Expected output:**

```markdown
## 🔍 Results for: "security" (8 found)

### Commands (1)
  - **/araya:security-audit**  --mode full|quick|review
    Run a complete security audit pipeline across all ARAYA projects

### Agents (3)
  - **🛡️ Diana** — Cybersecurity Specialist [reasoning] (5 skills)
  - **🔧 Isla** — Infra Architect [reasoning] (5 skills)
  - **Priya** — QA Lead [balanced] (3 skills)

### Skills (4)
  - **/skill:secure-arch** — Review system architecture for security (Diana, Isla)
  - **/skill:secure-code** — Review source code for security vulnerabilities (Diana)
  - **/skill:pentest** — Execute security penetration testing (Diana)
  - **/skill:compliance** — Assess compliance with regulatory frameworks (Diana)
```

---

### Mode 7: List by Type

```
/araya:man --list agents|commands|skills
```

Lists **all entries of a specific type** in compact format.

**Examples:**

```bash
# All 28 agents
/araya:man --list agents

# All registered commands
/araya:man --list commands

# All 120 skills
/araya:man --list skills
```

---

### Mode 8: Man Help

```
/araya:man --help
```

Shows help about `/araya:man` itself — syntax, usage, and examples.

---

## 4. How It Works

### Architecture

```
/araya:man (slash command)
       │
       ▼
extensions/araya/index.ts ──► dist/araya/catalog/help-provider.ts
       │                              │
       │                              ├── man()        — unified lookup
       │                              ├── manAgent()   — agent profile
       │                              ├── manSkill()   — skill reference
       │                              ├── manSearch()  — keyword search
       │                              ├── listAll()    — full catalog
       │                              ├── listByType() — filtered listing
       │                              └── manHelp()    — man help
       │
       ▼
dist/araya/catalog/index.ts (getCatalog)
       │
       ▼
.araya/catalog/catalog.json  ← auto-generated from:
  ├── araya.yaml (agents, capabilities, tiers)
  ├── skills/**/*.md (skill definitions)
  └── extensions/araya/index.ts (command registrations)
```

### Catalog Lifecycle

1. **Populate:** `dist/araya/catalog/populator.ts` reads `araya.yaml`, scans `skills/`, extracts command registrations
2. **Validate:** `dist/araya/catalog/validator.ts` compares catalog against source truth, detects drift, orphan skills, undeclared skills
3. **Write:** Catalog written to `.araya/catalog/catalog.json`
4. **Cache:** In-memory cache with 60-second TTL (`getCatalog()`)
5. **Search:** Keyword search across all entry types

### Fuzzy Matching

When no exact match is found, `/araya:man` uses **Levenshtein distance** to suggest close alternatives. This prevents agents from inventing names — a misspelled query still finds the right entry.

```
/araya:man valentinoa
→ Agent not found. Did you mean: valentina, valentino, ...
```

---

## 5. Expected Output Samples

### 5.1 /araya:man (browse all)

```markdown
## 📚 ARAYA Catalog — 156 entries

**Version:** 0.73.5 | **Generated:** 2026-07-22T12:00:00Z

### Stats
  **Commands:** 25 (24 enabled, 1 deprecated)
  **Skills:** 120 (2 orphans, 0 undeclared)
  **Agents:** 28 (27 active, 1 dormant, 2 bare)
  **Orphans total:** 2
  **Drift:** ✅ Clean

### Usage
  /araya:man <query> — look up a command, agent, or skill
  /araya:man --agent <name> — agent profile
  /araya:man --skill <name> — skill details
  /araya:man --command <name> — command reference
  /araya:man --search <keyword> — search by keyword
  /araya:man --list agents|commands|skills — list by type

### Commands (24 enabled)
  - /araya run --mode full|standard|quick|review|repair ...
  - /araya:status ...
  - /araya:man ...
  ...

### Agents (27 active)
  - 👑 Manu — Product Owner [reasoning] (8 skills)
  - 🌟 Sonia — PM Head Orchestrator [reasoning] (11 skills)
  ...

### Skills (120 total) — use /araya:man --list skills for full list
  - /skill:araya-command-and-delegation-expert — Cross-cutting mandatory skill ...
  ...
```

### 5.2 /araya:man --agent sonia (detailed profile)

```markdown
## 🌟 Sonia — PM Head Orchestrator

**Purpose:** Orchestrate ARAYA deliveries. Decompose work, assign agents,
coordinate parallel execution, govern quality gates, and report status.
**Status:** 🟢 Active | **Tier:** `reasoning` | **Provider:** deepseek

**Capabilities:**
  - Delivery Orchestration
  - Work Decomposition (Workstreams → AWUs)
  - Dependency Analysis (DAG)
  - Quality Gate Enforcement
  - Status Reporting

**Skills:**
  - `project-planning`
  - `pm-plan`
  - `pm-decompose`
  - `pm-dependencies`
  - `pm-risk`
  - `pm-status`
  - `sprint-planning`
  - `daily-standup`
  - `retrospective`
  - `impediment`
  - `velocity`

**Permissions:**
  - ✍️ Can write governance docs
  - ❌ Cannot approve reviews
  - ❌ Cannot merge PRs
  - **Execution mode:** deterministic
  - **Max turns:** 15

**🚫 Tasks This Agent MUST NOT Execute:**
  - Architecture (delegate to Aisha, Lin, Junia, Isla)
  - Backend implementation (delegate to Valentina)
  - Frontend implementation (delegate to Alejandra)
  - Testing (delegate to Teresa, Priya)
  - Security (delegate to Diana)
  - Infrastructure (delegate to Isla)
  - Technical documentation (delegate to Priscila)
  - Data analysis (delegate to Bernabé)
  - Educational design (delegate to Eunice)

**📤 Task Categories That Must Be Delegated:**
  - architecture, backend, frontend, testing, security, infrastructure,
    technical-docs, data-analysis, educational-design

*Catalog entry: `agent:sonia` — last validated 2026-07-22*
```

### 5.3 /araya:man --search deploy

```markdown
## 🔍 Results for: "deploy" (6 found)

### Commands (1)
  - /araya run ...

### Agents (2)
  - 🔧 Isla — Infra Architect [reasoning] (5 skills)
  - Aquila — Static Site Engineer [balanced] (4 skills)

### Skills (3)
  - /skill:cloud-deploy — Provision and deploy cloud infrastructure (Isla)
  - /skill:deployment-automation — Automate deployments for static sites (Aquila)
  - /skill:kubernetes — Design Kubernetes manifests and Helm charts (Isla)
```

### 5.4 Non-existent query (fuzzy match)

```markdown
## ❌ Not Found: "securty"

The command, agent, or skill you searched for does not exist in the catalog.

### 💡 Suggestions
  - /skill:secure-arch
  - /skill:secure-code
  - diana
  - /skill:secrets

### How to Search
  - /araya:man --search <keyword> — search by keyword
  - /araya:man --command <name> — look up a command
  - /araya:man --agent <name> — look up an agent
  - /araya:man --skill <name> — look up a skill
  - /araya:man — list all capabilities
```

---

## 6. Troubleshooting

### Symptom: `/araya:man` returns "failed" error

**Cause:** The catalog module (`dist/araya/catalog/help-provider`) cannot be imported. Either the catalog has not been generated or there is a runtime compatibility issue.

**Solution:**
1. Verify the catalog file exists: `ls .araya/catalog/catalog.json`
2. Regenerate the catalog: `/araya:ax3 --repair`
3. If using pi.dev, ensure the ARAYA extension is loaded: `/reload`

---

### Symptom: Agent profile shows "bare" status

**Cause:** The agent has fewer skills than expected (typically < 3 skills).

**Solution:**
1. Review the agent's prompt at `prompts/agents/<name>.md`
2. Verify skill assignments in `araya.yaml`
3. If skills are missing, update `araya.yaml` and reload

**Example:**
```markdown
- **Trinity** — Dynamic Capability Agent [balanced] (0 skills) 🟡 Dormant
```

---

### Symptom: "Orphan skill" warning

**Cause:** A skill directory exists in `skills/` but is not assigned to any agent in `araya.yaml`.

**Solution:**
1. Identify the orphan skill: `/araya:man --list skills` and look for ⚠️ markers
2. Decide: assign to an agent, or archive the skill directory
3. Update `araya.yaml` to add the skill to the appropriate agent

---

### Symptom: "Drift detected" in catalog stats

**Cause:** The catalog file (`.araya/catalog/catalog.json`) is out of sync with repository sources. An agent was added, removed, or had skills changed without regenerating the catalog.

**Solution:**
1. Run `/araya:ax3 --check` to see the specific drift
2. Run `/araya:ax3 --repair` to regenerate the catalog
3. Or run the populate command directly

---

### Symptom: Agent not found in search

**Cause:** The agent name might be misspelled, or the agent exists but the catalog hasn't been regenerated.

**Solution:**
1. Try `/araya:man` without arguments to see all agents
2. Check fuzzy suggestions in the output: "Did you mean?"
3. Verify the agent is in `araya.yaml`

---

### Symptom: Command shows "N/A" for delegated agent

**Cause:** Some commands are handled directly by the extension and don't delegate to a specific agent.

**Not a bug.** Commands like `/araya:man` and `/araya:status` are handler-type commands that execute inline. Only commands that delegate to agents (like `/araya:delegate`) have a `delegated_agent` field.

---

## 7. Related Commands

| Command | Description |
|---------|-------------|
| `/araya:man` | Browse catalog — this command |
| `/araya:man --search <term>` | Search catalog by keyword |
| `/araya:ax3` | Reconcile AX3 contract hierarchy (includes catalog) |
| `/araya:ax3 --check` | Check for drift (includes catalog drift) |
| `/araya:ax3 --repair` | Fix safe inconsistencies (regenerates catalog) |
| `/araya:status` | Full agent roster with tiers and skills |
| `/araya help` | Complete command manual |
| `/araya:delegate <agent> "<task>"` | Delegate to a specialist agent |
| `/araya:delegation-status <id>` | Check delegation execution status |

---

*Document generated from the canonical catalog system. All output samples reflect the actual runtime behavior of the help-provider module (`src/araya/catalog/help-provider.ts`).*
