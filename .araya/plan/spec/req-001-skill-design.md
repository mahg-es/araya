# REQ-001 Skill Design — araya-command-and-delegation-expert

- **Document:** Spec — Skill Design (WS-05)
- **Date:** 2026-07-22
- **Author:** Priscila (Technical Writer)
- **Version:** 1.0
- **Status:** Draft — pending review by Manu, Aisha, Aurora
- **Parent:** `.araya/plan/spec/req-001-workstreams.md` (Workstream 5, AWU-015 a AWU-017)
- **Covers AC:** AC-9, AC-10, AC-11, AC-12

---

## 1. Purpose of This Document

This document **designs** the cross-cutting skill `araya-command-and-delegation-expert`. It defines:

- The skill's section structure and format
- The 10 teaching behaviors mapped from REQ-001
- How the skill integrates with AGENTS.md and the AX3 contract hierarchy
- The activation mechanism (task matching, always-on invocation)
- The validation strategy to verify agent compliance

**This is a design document, not the skill itself.** The skill will be implemented in `skills/araya-command-and-delegation-expert/SKILL.md` as AWU-015.

---

## 2. Skill Identity & Metadata

### 2.1 Frontmatter

```yaml
---
name: araya-command-and-delegation-expert
description: >
  Cross-cutting mandatory skill for all ARAYA agents. Teaches command discovery,
  manual consultation (/araya:man), capability-aware execution, and mandatory
  specialist delegation. Every agent MUST apply these behaviors before executing
  any task. This is an ARAYA AX (cross-cutting) feature — no agent is exempt.
---
```

### 2.2 Classification

| Attribute | Value |
|-----------|-------|
| **Type** | AX (cross-cutting) — applies to all agents |
| **Nature** | Mandatory — no agent may operate without it |
| **Lifecycle** | Always-active — not an on-demand skill |
| **Assignation** | All 30 agents via `araya.yaml` `skills:` list |
| **Depends on** | `/araya:man` system (WS-09), Delegation Broker (WS-10), Catalog Registry (WS-07) |
| **Depended by** | Agent prompt integration (WS-11), Testing (WS-14) |

---

## 3. Skill Structure (Section Map)

The skill file (`skills/araya-command-and-delegation-expert/SKILL.md`) will follow the canonical ARAYA skill format established by existing skills (`adr-write`, `ax3`, `definition-of-done`, `token-efficiency`):

```
---
name: ...
description: ...
---

# Title (H1)

Brief purpose statement (2-3 sentences).

## What Problem This Solves

## When to Use

## Input

## Output

## Preflight — Mandatory Discovery Protocol (H2)

   ### Step 1 — Consult Catalog Before Task
   ### Step 2 — Identify Relevant Capabilities
   ### Step 3 — Consult Manual Before Unknown Functions
   ### Step 4 — Prefer Native ARAYA Capabilities
   ### Step 5 — Never Invent Commands, Agents, or Behaviors
   ### Step 6 — Verify Availability, Compatibility, and Permissions

## Execution — Delegation Protocol (H2)

   ### Step 7 — Delegate to Specialist Agent When One Exists
   ### Step 8 — Never Assume Tasks Outside Your Authority
   ### Step 9 — Register Missing Capabilities
   ### Step 10 — Propose New Capabilities Only After Confirming None Exists

## The Specialist Delegation Contract (H2)

   ### Sonia's Constraints
   ### General Agent Constraints
   ### Exception Protocol
   ### Prohibited Excuses

## Integration Points (H2)

   ### With AGENTS.md
   ### With AX3.md
   ### With /araya:man
   ### With the Delegation Broker

## Rules (H2)

## Verification — How to Confirm an Agent Applies This Skill (H2)

## Done Criteria
```

### 3.1 Section Rationale

| Section | Purpose | Why this structure |
|---------|---------|-------------------|
| **What Problem** | Context: why this skill exists, what failure it fixes | Answers "why should I care?" — critical for agent adoption |
| **When to Use** | Activation trigger: at task start, before any command, before any delegation | Makes the "always-on" nature explicit |
| **Input / Output** | What the agent receives and produces | Maintains contract clarity |
| **Preflight (6 steps)** | Discovery behaviors: catalog, manual, verification | Groups the "before execution" behaviors (AC-1 through AC-6 from the 10 teaching points) |
| **Execution (4 steps)** | Delegation behaviors: delegate, boundary, register, propose | Groups the "during execution" behaviors (AC-7 through AC-10) |
| **Specialist Delegation Contract** | Binding rules from REQ-001 for Sonia and all agents | Copied verbatim from REQ-001 so agents have the contract in their own skill |
| **Integration Points** | How this skill interacts with AGENTS.md, AX3.md, /araya:man, Broker | Answers "how does this fit in the bigger picture?" |
| **Rules** | Non-negotiable, binary constraints | DoD-style checklist that agents can self-verify |
| **Verification** | How to test that an agent applies the skill | Enables AC-11, AC-14, AC-17, AC-18, AC-19 |
| **Done Criteria** | Standard ARAYA closeout | Consistent format across all skills |

---

## 4. Content — The 10 Teaching Behaviors

Each teaching point from REQ-001 is mapped to a detailed, actionable instruction within the skill.

### 4.1 Preflight Group (Discovery — Before You Execute)

#### [1] Consult the ARAYA Catalog Before Starting Any Task

- **REQ-001 text:** "Consultar el catálogo de ARAYA antes de iniciar una tarea"
- **What the agent does:**
  - Before ANY task execution, the agent queries the catalog:
    - `/araya:man` — list all available capabilities
    - `/araya:man --search <keyword>` — find relevant ones
  - The query must happen BEFORE the agent writes code, calls a tool, or delegates.
  - Even if the agent "thinks" it knows what to do, it verifies against the catalog first.
- **Rationale:** The audit (Esteban, 2026-07-22) found that agents skip discovery because their prompts contain enough context to proceed. This step forces a catalog check, closing the gap between "I think I know" and "I verified."
- **Example:**
  ```
  Agent receives: "Deploy the app to production"
  ❌ WRONG: Proceeds to write docker-compose and kubectl commands from memory
  ✅ RIGHT: First runs /araya:man --search deploy → discovers Isla (infra architect)
            has kubernetes + cloud-deploy skills → delegates to Isla
  ```

#### [2] Identify Relevant Commands, Functions, Skills, and Specialists

- **REQ-001 text:** "Identificar comandos, funciones, skills y especialistas relevantes"
- **What the agent does:**
  - From the catalog query, extract the subset of capabilities that match the current task.
  - The agent must identify ALL four categories:
    1. **Commands** — slash commands (`/araya:man`, `/araya:delegate`)
    2. **Functions** — runtime capabilities, tools available
    3. **Skills** — what domain skills exist that are relevant
    4. **Specialists** — which agents own those skills
  - If only 3 of 4 categories are identified → incomplete discovery.
- **Rationale:** Partial discovery leads to partial delegation. An agent that finds the right command but not the right specialist will still execute manually.
- **Example:**
  ```
  Task: "Write unit tests for the auth module"
  Discovery:
    Commands:  /araya:man test-case, /araya run --mode=tdd
    Functions: read, write, edit, bash, grep
    Skills:    unit-test, test-case, tdd-generate, tdd-execute
    Specialists: Teresa (QA Engineer) — unit-test, test-case, tdd-generate
                Priya (QA Lead) — e2e-strategy, cicd-quality
  → Delegates to Teresa for test generation, Priya for review
  ```

#### [3] Consult --help or /araya:man Before Using an Unknown Function

- **REQ-001 text:** "Consultar `--help` o `/araya:man` antes de usar una función desconocida"
- **What the agent does:**
  - Before invoking any command, function, or skill the agent has not personally used before in this session, it MUST:
    - `/araya:man <command|function|skill>` — read the full manual entry
    - OR `<command> --help` — read inline help
  - "Unknown" = not yet invoked by this agent in the current session. Even if the agent "knows about" the function from its prompt, it reads the manual before first use.
  - After reading, the agent confirms: syntax, required args, optional flags, preconditions, permissions, and the responsible specialist.
- **Rationale:** The audit found that `/araya help` is hardcoded and diverges from repository truth. Once WS-09 implements live `/araya:man` from the registry, this step ensures agents always use the live version, not stale prompt memory.
- **Example:**
  ```
  Agent wants to use: /araya:graph:prepare
  Agent has not used it before in this session.
  → Runs: /araya:man /araya:graph:prepare
  → Reads: purpose, syntax, preconditions (graph builder must be installed),
           responsible agent (Esteban), output format
  → Now invokes with correct syntax and awareness of constraints
  ```

#### [4] Prefer Native ARAYA Capabilities Over Duplicated Manual Procedures

- **REQ-001 text:** "Preferir capacidades nativas de ARAYA frente a procedimientos manuales duplicados"
- **What the agent does:**
  - When the agent identifies a task requirement, it asks: "Does ARAYA already solve this?"
  - If YES → use the ARAYA capability, do NOT write custom code or manual steps.
  - If the capability exists but is insufficient → propose enhancement, don't bypass.
  - "Manual procedure" = writing a script, function, or step-by-step process that duplicates what an ARAYA command, skill, or agent already provides.
- **Rationale:** Prevents the exact waste that REQ-001 was created to stop. The audit found drift between `araya.yaml` and `prompts/` because agents worked around missing capabilities instead of fixing the source.
- **Example:**
  ```
  Task: "Set up CI/CD pipeline for this project"
  ❌ WRONG: Agent writes a 200-line .github/workflows/deploy.yml from scratch
  ✅ RIGHT: Agent discovers Isla has cicd-pipeline skill → delegates to Isla
            Isla generates pipeline config using ARAYA conventions and templates
  ```

#### [5] Never Invent Commands, Arguments, Flags, Agents, or Behaviors

- **REQ-001 text:** "No inventar comandos, argumentos, flags, agentes o comportamientos"
- **What the agent does:**
  - The agent MUST NOT generate, assume, or fabricate:
    - Slash commands (`/araya:fake-command`)
    - Command arguments or flags (`--made-up-flag`)
    - Agent names that do not exist in the registry
    - Skill names that do not exist in `skills/`
    - Behaviors or guarantees not documented in the manual or catalog
  - If the agent needs a capability that doesn't exist → go to Step 9 (register gap), not Step "invent it."
  - The agent must validate every command, agent name, and skill name against the catalog before using it in output, delegation, or recommendations.
- **Rationale:** Hallucinated commands and agents erode trust and create invalid delegation chains. The validation test (AC-18) must confirm zero inventions.
- **Example:**
  ```
  Agent thinks: "I'll use /araya:deploy --env=staging"
  ❌ WRONG: /araya:deploy does not exist. --env was invented.
  ✅ RIGHT: /araya:man --search deploy → /araya:man cloud-deploy
            Reads that Isla handles deployment. Delegates with correct syntax:
            /araya isla "Deploy to staging environment"
  ```

#### [6] Verify Availability, Compatibility, and Permissions Before Executing

- **REQ-001 text:** "Verificar disponibilidad, compatibilidad y permisos antes de ejecutar"
- **What the agent does:**
  - Before executing a command or delegating, the agent checks:
    1. **Availability:** Is the command/skill/agent enabled in this environment? (Not deprecated, not disabled, not uninstalled)
    2. **Compatibility:** Does the target runtime support this? (pi.dev vs. Codex vs. Claude CLI vs. AGY)
    3. **Permissions:** Does the agent have the required permissions to execute or delegate?
  - This applies to both the agent's own tools AND the target of a delegation.
  - The catalog entry for each capability must expose these fields.
- **Rationale:** The audit found agents delegating `generate-uat` to Sonia who doesn't have `uat-generate`. A permission check prevents this.
- **Example:**
  ```
  Agent wants to delegate "Run security penetration test" → Diana
  Check: Diana's permissions → read-only (cannot write/edit/bash)
  Penetration testing tools need bash access → COMPATIBILITY CONFLICT
  Agent escalates: "Diana can review but cannot execute pentest tools directly.
                   Recommend: Diana designs test plan, Valentina executes tooling."
  ```

### 4.2 Execution Group (Delegation — During the Task)

#### [7] Delegate to the Specialist Agent When One Exists

- **REQ-001 text:** "Delegar en el agente especializado cuando exista uno competente"
- **What the agent does:**
  - After discovery identifies a specialist for the task → delegate. Do not execute directly.
  - "Exists" = the agent is registered in araya.yaml, has the required skill, and is available.
  - "Competent" = the agent's skills match the task's domain requirements.
  - Delegation must use the formal delegation channel: `/araya:delegate <agent> "<task>"` (once WS-10 is implemented) or `/araya <agent> "<task>"` (current mechanism).
  - The delegating agent remains responsible for the outcome, not the execution.
- **Rationale:** The audit found 7 of 28 (25%) subcommand routes where Sonia executes specialist work. The delegation contract in REQ-001 explicitly forbids this. This behavior is the single most impactful teaching point — it's the reason REQ-001 exists.
- **Key constraint from REQ-001:**
  > La delegación en agentes especialistas es obligatoria cuando ARAYA disponga de un agente competente para la tarea.

#### [8] Never Assume Tasks Outside Your Own Authority or Responsibility

- **REQ-001 text:** "No asumir tareas fuera de su propia autoridad o responsabilidad"
- **What the agent does:**
  - Each agent has a bounded domain of authority defined by:
    - Their role in `araya.yaml`
    - Their assigned skills
    - Their permissions (`write_code: true/false`)
    - Their tier (reasoning, balanced, fast)
  - The agent MUST NOT execute tasks that fall outside this boundary.
  - "Authority" = the agent is permitted to make decisions in this domain.
  - "Responsibility" = the agent is accountable for results in this domain.
  - Crossing either boundary requires explicit exception (see Exception Protocol).
- **Rationale:** Prevents scope creep and maintains the integrity of the specialist model. When agents assume tasks outside their domain, they produce lower-quality output and erode the specialist system.
- **Agent boundary examples (from REQ-001):**
  - Sonia must not execute: architecture, backend/frontend implementation, testing, security, infrastructure, technical docs, data analysis, educational design, or any task belonging to another specialist.
  - Diana must not write code (read-only).
  - Elena audits process, not technical/mathematical correctness.
  - Lidia is the only agent qualified to validate profitability methodology.

#### [9] Register When a Required Capability or Specialist Does Not Exist

- **REQ-001 text:** "Registrar cuando una capacidad o especialista necesario no existe"
- **What the agent does:**
  - When discovery confirms that no existing capability or specialist meets the task requirement, the agent MUST record this gap.
  - The record must include:
    - What was needed (task description)
    - What was searched (catalog queries executed)
    - Why existing capabilities were insufficient (specific gap)
    - Recommended new capability or specialist (if agent can propose one)
  - The gap record goes to: `.araya/postoffice/thread.md` as an `status:open` entry directed to `po-proxy` (Manu) or `.araya/plan/gaps/` as a structured gap report.
  - The agent must NOT proceed to execute the task manually. It stops, records, and escalates.
- **Rationale:** Gap visibility drives capability planning. Without registration, gaps remain invisible until failure. Aurora uses gap records for workforce planning and capability registry updates.
- **Example:**
  ```
  Task: "Generate a GDPR Data Protection Impact Assessment"
  Discovery: /araya:man --search GDPR → no results
            /araya:man --search DPIA → no results
            /araya:man diana → Diana has compliance skill but not DPIA-specific
  Gap registered: "GDPR-DPIA needed. Diana has compliance domain but no
                  DPIA-specific skill or template. Recommend: create dpia-generate
                  skill or extend compliance skill with DPIA module."
  ```

#### [10] Propose New Capabilities Only After Confirming None Exists

- **REQ-001 text:** "Proponer nuevas capacidades únicamente después de confirmar que no existe una equivalente"
- **What the agent does:**
  - Before proposing a new command, skill, function, or agent:
    1. Search the catalog exhaustively: by name, by domain, by purpose, by similar keywords
    2. Consult `/araya:man <existing-similar-capability>` to confirm it doesn't cover the need
    3. If an existing capability covers 80%+ of the need → propose extending it, not creating a new one
    4. If truly no equivalent exists → proceed with proposal (which goes through Step 9 gap registration first)
  - The agent must include evidence of the search in the proposal: what was searched, what was found, why it's insufficient.
- **Rationale:** Prevents capability sprawl. The audit found 4 skills without declaration in `araya.yaml` and 4 declared without implementation — evidence of uncoordinated creation. This step ensures new capabilities are deliberate.
- **Example:**
  ```
  Agent thinks: "We need a /araya:validate-config command"
  ✅ Proper process:
    1. /araya:man --search validate → finds /araya:validate (delivery validation)
    2. /araya:man /araya:validate → confirms it validates deliveries, not configs
    3. /araya:man --search config → no config-specific validation found
    4. Gap different from /araya:validate (deliveries vs. configs)
    5. Proposal: "/araya:validate-config — validates araya.yaml + extensions config"
       with evidence that /araya:validate serves a different purpose
  ```

---

## 5. The Specialist Delegation Contract

This section is copied **verbatim** from REQ-001 ("Specialist Delegation Contract") and becomes a binding part of the skill. It applies to all agents, not just Sonia.

### 5.1 Sonia's Constraints

Sonia must:
- Analyze work
- Divide it into Workstreams and Atomic Work Units
- Identify dependencies
- Request agent and model eligibility from Aurora
- Assign each unit to the corresponding specialist agent
- Coordinate sequence, parallelism, validation, and closure
- Verify each specialist returns sufficient evidence

Sonia must NOT directly execute:
- Architecture
- Backend or frontend implementation
- Testing
- Security
- Infrastructure
- Technical documentation
- Data analysis
- Educational design
- Tasks belonging to any other available specialist

Sonia may execute only activities within her delivery authority: planning, decomposition, coordination, tracking, dependency resolution, and result consolidation.

### 5.2 General Agent Constraints

An agent may only execute work outside their specialty when ALL of:
1. No specialist is available for the task.
2. Aurora confirms the absence of an adequate capability.
3. The exception is formally recorded.
4. Risks and limits are explicitly stated.
5. Current governance permits the substitution.

### 5.3 Prohibited Excuses

Time pressure, apparent simplicity, or convenience are NOT valid reasons to bypass delegation.

---

## 6. Integration with AGENTS.md and AX3.md

### 6.1 AGENTS.md Integration

The skill's activation instruction is embedded in `AGENTS.md` via a one-line pointer, consistent with the pattern used by `ax-postoffice`:

```markdown
## ARAYA Cross-Cutting Skills

Every agent in this project MUST apply the following skills on every task:

- **Command & Delegation:** before executing any task, run the `araya-command-and-delegation-expert` preflight and apply its delegation protocol. See `skills/araya-command-and-delegation-expert/SKILL.md`.
```

This line goes in the root `AGENTS.md`, under a new section `## ARAYA Cross-Cutting Skills`.

**Why AGENTS.md (not just araya.yaml):**

- `AGENTS.md` is the entry point that ALL runtimes read (pi.dev, Codex, Claude CLI, AGY). It is the universal contract.
- `araya.yaml` assigns the skill to agents but doesn't guarantee the runtime loads it at task start.
- The AGENTS.md pointer ensures the skill is consulted even if the runtime doesn't support automatic skill injection from `araya.yaml`.

### 6.2 AX3.md Integration

The skill integrates with AX3 at two levels:

**Level 1 — The skill itself is an AX3-governed artifact:**

- The skill file `skills/araya-command-and-delegation-expert/SKILL.md` lives under `skills/AX3.md`.
- Any change to the skill triggers AX3 postflight: update `skills/AX3.md`'s Child AX3 Index.

**Level 2 — The skill modifies agent AX3 preflight behavior:**

- The AX3 contract (root `AX3.md`) states: "Before any agent modifies files, it MUST read the applicable AX3 chain."
- This skill EXTENDS the preflight: before the AX3 preflight, the agent must run the command-and-delegation preflight (consult catalog, identify capabilities).
- The two preflights are ordered:
  1. **Command & Delegation preflight** — what capabilities exist for this task?
  2. **AX3 preflight** — what contracts govern the files I'll touch?

**Implementation in AX3.md:**

The root `AX3.md` "Read Before Editing" section gains a new bullet:

```markdown
## Read Before Editing (Preflight — MANDATORY)

0. If the `araya-command-and-delegation-expert` skill is assigned to you, apply its
   preflight protocol BEFORE the AX3 preflight: consult catalog, identify capabilities,
   verify availability. See `skills/araya-command-and-delegation-expert/SKILL.md`.
1. Read this root `AX3.md`
2. Identify every file or folder you expect to touch
...
```

### 6.3 Integration Diagram

```
AGENTS.md
  ├── Points to AX3.md chain (existing)
  ├── Points to PostOffice (existing)
  └── Points to araya-command-and-delegation-expert (NEW)

AX3.md (root)
  ├── Preflight section → references command-and-delegation preflight (NEW Step 0)
  ├── Hierarchy section (existing)
  └── Child AX3 Index → skills/AX3.md (existing)

skills/AX3.md
  └── Child AX3 Index → araya-command-and-delegation-expert/SKILL.md (NEW)

araya-command-and-delegation-expert/SKILL.md (NEW)
  ├── 10 teaching behaviors
  ├── Specialist Delegation Contract
  ├── Integration Points (this section)
  └── Verification protocol
```

### 6.4 Relationship to Existing AX Skills

The skill joins the existing set of AX (cross-cutting) skills:

| AX Skill | Scope | Activation |
|----------|-------|------------|
| `ax3` | Contract hierarchy pre/post-flight | Before editing + after changes |
| `ax-postoffice` | Operational directive channel | Cycle start + cycle end |
| `token-efficiency` | Token budget optimization | Before large tasks |
| **`araya-command-and-delegation-expert`** | **Discovery + delegation** | **Before any task + before any command/delegation** |

These four AX skills form the mandatory baseline for all ARAYA agents. Together, they ensure:
1. Agents know what they can use (`command-and-delegation`)
2. Agents respect project contracts (`ax3`)
3. Agents stay informed of operational context (`postoffice`)
4. Agents optimize resource consumption (`token-efficiency`)

---

## 7. Activation Mechanism

### 7.1 Always-On — Not On-Demand

This skill is not invoked with `/skill:araya-command-and-delegation-expert`. It is **always active** for every agent that has it assigned. The skill is a permanent layer in the agent's decision-making, not a tool it chooses to use.

### 7.2 Task Matching

The skill activates on these triggers:

| Trigger | When | What the agent does |
|---------|------|---------------------|
| **Task Start** | Agent receives a new task or user request | Run preflight (Steps 1-6): consult catalog, identify capabilities, verify availability |
| **Unknown Command** | Agent considers invoking a command not yet used in this session | Run Step 3: consult `/araya:man` or `--help` |
| **Delegation Decision** | Agent decides who should execute a subtask | Run Steps 7-8: delegate to specialist, respect boundaries |
| **Capability Not Found** | Agent discovers no existing capability for a need | Run Steps 9-10: register gap, propose only after confirming none exists |
| **Task Completion** | Agent finishes work | Verify that all delegation was proper; register any unregistered gaps |

### 7.3 Invocation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  AGENT RECEIVES TASK                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  TRIGGER 1: Task Start                                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Step 1: /araya:man (consult catalog)                   │  │
│  │ Step 2: Identify commands, functions, skills, agents   │  │
│  │ Step 4: Prefer native ARAYA capabilities               │  │
│  │ Step 5: Validate: no invented commands/agents          │  │
│  │ Step 6: Verify availability, compatibility, permissions│  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  TRIGGER 2: For each unknown command/function                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Step 3: /araya:man <cmd> OR <cmd> --help              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  TRIGGER 3: For each subtask — who executes?                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Step 7: Delegate to specialist if exists               │  │
│  │ Step 8: Never assume tasks outside own authority       │  │
│  └───────────────────────────────────────────────────────┘  │
│              │                          │                    │
│    Specialist exists            No specialist               │
│              │                          │                    │
│              ▼                          ▼                    │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │ /araya:delegate   │    │ Step 9: Register gap          │   │
│  │ <agent> "<task>"  │    │ Step 10: Propose only after   │   │
│  │                   │    │          confirming no equiv   │   │
│  └──────────────────┘    └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Runtime Independence

The activation mechanism is **runtime-agnostic** by design:

| Runtime | How the skill activates |
|---------|------------------------|
| **pi.dev** | Skill assigned in `araya.yaml` → loaded into agent context → always-on. Task start triggers preflight. |
| **Codex** | AGENTS.md pointer loads the skill. Agent prompt includes the skill behavior. |
| **Claude CLI** | AGENTS.md → reads skill. CLAUDE.md or equivalent loads it. |
| **AGY** | AGENTS.md → reads skill. Agent context includes it. |

The activation logic is in the skill's text, not in a runtime-specific hook. The skill **teaches the agent the behavior** — the agent then self-regulates. This is the same mechanism as `ax3` and `ax-postoffice`: the skill is a contract the agent reads and follows.

### 7.5 Validation of Activation

The agent must demonstrate activation by producing evidence of:
1. A catalog query before its first tool call
2. A `/araya:man` invocation before using a new command
3. A delegation decision (or gap registration) for each subtask

If the agent's output does not contain these, the skill did not activate.

---

## 8. Validation — How to Verify an Agent Applies the Skill

### 8.1 Validation Strategy

Validation occurs at three levels:

| Level | What is tested | Who tests | When |
|-------|---------------|-----------|------|
| **L1 — Structural** | Skill is assigned to all 30 agents in `araya.yaml` | Automated test (AWU-043) | CI/CD, on agent registration |
| **L2 — Behavioral** | Agent demonstrates the 10 behaviors in task execution | Teresa (AWU-058, AWU-059, AWU-060, AWU-061) | Per test suite run |
| **L3 — Observational** | Agent output traces show catalog consultation and correct delegation | Daneel (AWU-065) | Pre-delivery verification |

### 8.2 L1 — Structural Validation

**Test: skill-assigned-to-all-agents**

```
Given: araya.yaml with 30 agent entries
When:  validation script runs
Then:  every agent's skills list MUST contain "araya-command-and-delegation-expert"
       if any agent is missing it → FAIL with agent name
```

**Test: skill-assigned-to-new-agent**

```
Given: a new agent entry added to araya.yaml
When:  pre-commit or CI validation runs
Then:  if the new agent does not have "araya-command-and-delegation-expert" → FAIL
       error message: "Agent <name> missing mandatory skill: araya-command-and-delegation-expert"
```

### 8.3 L2 — Behavioral Validation

#### Test AC-12: Agent Consults Catalog Before Improvising

```
Given: Agent receives task "Set up monitoring for the API"
       Agent does NOT have monitoring in its native prompt skills
When:  Agent begins task execution
Then:  Agent's output MUST contain (within first 3 tool calls):
       1. A catalog query (/araya:man --search monitor OR /araya:man monitoring)
       2. Identification of monitoring skill (Isla has it)
       3. Identification of monitoring specialist (Isla)
       If agent writes monitoring code directly without consulting catalog → FAIL
```

#### Test AC-14: Sonia Does Not Execute Specialist Work

```
Given: Sonia receives task "Generate UAT package for feature X"
       Clara has uat-generate skill
When:  Sonia processes the task
Then:  Sonia MUST delegate to Clara via /araya:delegate clara "Generate UAT package"
       Sonia MUST NOT generate UAT content herself
       If Sonia's output contains UAT content she generated → FAIL
```

#### Test AC-17: Agent Discovers Capability Not in Its Prompt

```
Given: Agent whose prompt does NOT mention "whale-curve-analyze"
       Agent receives task "Analyze customer profitability"
When:  Agent begins task
Then:  Agent MUST discover Lidia + whale-curve-analyze via catalog
       Agent MUST delegate to Lidia
       Agent MUST NOT attempt profitability analysis directly
```

#### Test AC-18: No Agent Invents Commands or Agents

```
Given: A suite of 10 diverse tasks presented to different agents
When:  Agents execute tasks
Then:  ZERO instances of:
       - Commands not in the catalog (/araya:fake-cmd)
       - Flags not documented (--made-up-flag)
       - Agent names not in araya.yaml
       - Skill names not in skills/
       Any violation → FAIL with source agent and invented term
```

#### Test AC-19: Agent Searches Before Proposing Duplicate

```
Given: Agent needs "cost analysis" capability
       Mateo already has cost-analysis skill
When:  Agent begins task
Then:  Agent MUST search catalog for cost analysis
       Agent MUST discover Mateo has the skill
       Agent MUST delegate, NOT propose creating a new cost-analysis command
       If agent proposes new command/skill without searching → FAIL
```

### 8.4 L3 — Observational Validation

Daneel's reality verification (AWU-065) checks that every agent execution in a run produces evidence of:

1. **Catalog consultation** — a `/araya:man` invocation or search in the execution trace
2. **Correct delegation** — specialist assignments match the capability registry
3. **No self-execution of specialist work** — Sonia's trace shows delegation, not direct execution, for specialist tasks
4. **Gap registration** — any "I couldn't find X" in the trace is paired with a corresponding gap entry in `.araya/postoffice/` or `.araya/plan/gaps/`

### 8.5 Validation Scorecard

Each agent is scored on compliance:

| Behavior # | Behavior | Pass Condition | Weight |
|-----------|----------|----------------|--------|
| 1 | Consult catalog before task | Trace shows catalog query before first tool call | 10 |
| 2 | Identify 4 categories | Output lists commands, functions, skills, specialists found | 10 |
| 3 | Consult manual for unknowns | Trace shows /araya:man for each first-use command | 10 |
| 4 | Prefer native capabilities | No manual duplication of existing ARAYA capability | 10 |
| 5 | Never invent | Zero invented commands, flags, agents, skills | 15 |
| 6 | Verify availability/perms | Trace shows permission check before delegation | 5 |
| 7 | Delegate to specialist | Specialist-appropriate tasks delegated, not self-executed | 20 |
| 8 | Respect authority boundaries | No tasks executed outside agent's declared domain | 10 |
| 9 | Register gaps | Missing capabilities recorded in postoffice/gaps | 5 |
| 10 | Propose after confirming none exists | Search evidence included in every new capability proposal | 5 |

**Minimum pass score: 85/100. Behaviors 5 and 7 are hard gates — zero tolerance.**

---

## 9. Delivery Package (What AWU-015 Produces)

When AWU-015 executes, it produces:

1. **`skills/araya-command-and-delegation-expert/SKILL.md`** — the complete skill file
2. **Updated `skills/AX3.md`** — Child AX3 Index gains entry for the new skill
3. **Updated root `AX3.md`** — Preflight section gains Step 0 referencing the skill
4. **Updated `AGENTS.md`** — gains `## ARAYA Cross-Cutting Skills` section with pointer to the skill

The skill file will be approximately 200-300 lines, following the structure defined in Section 3.

---

## 10. Open Questions for Review

These questions should be resolved during review by Manu, Aisha, and Aurora before AWU-015 proceeds to implementation:

| # | Question | Proposed Answer | Decided By |
|---|----------|----------------|------------|
| Q1 | Should the skill include the full verbatim Specialist Delegation Contract, or a summary? | Full verbatim — the contract is binding law and agents need the exact text. | Manu |
| Q2 | Should the 10 behaviors be presented as a numbered checklist or as prose? | Both: prose for understanding, checklist at the end for self-verification. | Priscila |
| Q3 | What is the minimum pass score for the behavioral validation scorecard? | 85/100 with Behaviors 5 and 7 as hard gates. | Aurora + Teresa |
| Q4 | Does the skill live in `skills/` or `.araya/skills/`? | `skills/` — consistent with all other skills. | Aisha |
| Q5 | Should `araya-command-and-delegation-expert` be placed in the AX baseline alongside ax3, ax-postoffice, token-efficiency? | Yes — it's the fourth mandatory AX skill. | Aurora |
| Q6 | Should the AGENTS.md pointer be a new section or part of the existing AX3 section? | New section `## ARAYA Cross-Cutting Skills` — distinct from AX3 which is a contract, not a skill. | Priscila |

---

## 11. Traceability

| REQ-001 Reference | Section in this Design |
|-------------------|----------------------|
| AC-9 (skill created) | Section 3 (Structure), Section 9 (Delivery Package) |
| AC-10 (all agents assigned) | Section 7.1 (Always-on), Section 8.2 (L1 Validation) |
| AC-11 (validation fails for new agent without skill) | Section 8.2 (Test: skill-assigned-to-new-agent) |
| AC-12 (agent consults before improvising) | Section 4.1 (Behavior 1), Section 8.3 (Test AC-12) |
| 10 teaching points | Section 4.1 (1-6), Section 4.2 (7-10) |
| Specialist Delegation Contract | Section 5 |
| DI-001 to DI-006 (broker requirements) | Section 7.3 (delegation flow references broker) |

---

*Priscila, Technical Writer — Design complete. Awaiting review by Manu (PO), Aisha (Backend Architect), and Aurora (Capability Officer) before AWU-015 implementation.*
