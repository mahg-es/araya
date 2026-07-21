# Agent Integration Guide: Command & Delegation Skill

- **Document:** Agent Integration — `araya-command-and-delegation-expert`
- **Date:** 2026-07-22
- **Author:** Priscila (Technical Writer)
- **Version:** 1.0
- **Status:** draft
- **Subject Matter Experts:** Esteban (Knowledge Manager) — WS-11 agent prompt integration; Isla (Infra Architect) — delegation architecture, WS-08

---

## Table of Contents

1. [Overview](#1-overview)
2. [How a New Agent Inherits the Skill](#2-how-a-new-agent-inherits-the-skill)
3. [How to Verify an Agent Applies the Skill](#3-how-to-verify-an-agent-applies-the-skill)
4. [How to Audit Delegation Correctness](#4-how-to-audit-delegation-correctness)
5. [The Validation Scorecard](#5-the-validation-scorecard)
6. [Exception Protocol](#6-exception-protocol)
7. [Troubleshooting](#7-troubleshooting)
8. [Reference Files](#8-reference-files)

---

## 1. Overview

The `araya-command-and-delegation-expert` skill is a **cross-cutting (AX), mandatory** feature of the ARAYA Framework. Every agent in the roster — all 27 active agents across 12 domains — must have this skill assigned and must apply its protocol on every task.

The skill teaches 10 behaviors organized into two protocols:

| Protocol | When | Behaviors |
|----------|------|-----------|
| **Preflight (Discovery)** | Before first tool call | 6 behaviors: catalog → identify → manual → prefer native → don't invent → verify |
| **Execution (Delegation)** | During task execution | 4 behaviors: delegate → respect authority → register gaps → propose after confirming |

**Hard gates (zero tolerance):** catalog consultation (R1), no command invention (R2), mandatory delegation (R3), authority boundaries (R4).

---

## 2. How a New Agent Inherits the Skill

### 2.1 Registration Points

A new agent must be registered in **three locations** for the skill to be fully operational:

| # | Location | What to Add | Responsible |
|---|----------|-------------|-------------|
| 1 | `araya.yaml` | Agent entry with `skills: [araya-command-and-delegation-expert, ...]` | Aurora / Agent creator |
| 2 | `prompts/agents/<name>.md` | Personality prompt with skill awareness | Priscila / Agent creator |
| 3 | `extensions/araya/index.ts` | (Optional) Slash command registration if the agent needs a direct command | Valentina / Isla |

### 2.2 Step-by-Step: Register a New Agent

#### Step 1: Add to `araya.yaml`

Under `agents:`, add the new agent entry. The skill **must** be listed first or prominently in the `skills` array:

```yaml
agents:
  mi-nuevo-agente:
    role: "My New Agent Role"
    emoji: "🆕"
    model_tier: "balanced"
    primary_provider: "deepseek"
    execution_mode: "deterministic"
    permissions:
      can_write_code: true
      can_merge_pr: false
      can_approve_review: false
    capabilities:
      - "Domain-specific capability"
    skills:
      - "araya-command-and-delegation-expert"  # ← MANDATORY — must be present
      - "domain-relevant-skill-1"
      - "domain-relevant-skill-2"
    description: "Brief description of what this agent does"
```

**Validation:** The catalog validator (`dist/araya/catalog/validator.ts`) checks that every active agent has this skill. If missing, the catalog reports drift.

#### Step 2: Create the Personality Prompt

Create `prompts/agents/<name>.md` with the skill integration section. Every agent prompt must include:

```markdown
# <Name> — <Role>

... (personality, approach, domain skills) ...

## ARAYA Cross-Cutting Skills

You MUST apply the following skills on every task:

- **Command & Delegation:** before executing any task, run the
  `araya-command-and-delegation-expert` preflight and apply its delegation
  protocol. See `skills/araya-command-and-delegation-expert/SKILL.md`.
- **AX3:** read the AX3.md chain before editing, update after meaningful
  changes. See `skills/araya-ax3/SKILL.md`.
- **Postoffice:** consult `.araya/postoffice/thread.md` at cycle start,
  append your entry at cycle end. See the `ax-postoffice` skill.
- **Token Efficiency:** optimize token consumption before large tasks.
  See the `token-efficiency` skill.

## Specialist Delegation Contract

For any task outside your declared specialty, you MUST delegate to the
specialist agent. Use `/araya:man --search <keyword>` to find the right
specialist, then `/araya:delegate <agent> "<task>"` to delegate.

### You MUST delegate to specialists for:
- (List task categories outside this agent's domain)
- ...

### You MUST NOT execute directly:
- (List tasks this agent must not perform)
- ...

### Exceptions:
Only when ALL of:
1. Aurora confirms no specialist is available
2. Exception is recorded with reason and evidence
3. Risks and limits are explicitly stated
4. Governance allows substitution

Time pressure or convenience ARE NOT valid reasons to bypass delegation.
```

**Template locations:**
- Full agent prompt template: see existing agents in `prompts/agents/` (e.g., `sonia.md`, `valentina.md`)
- Cross-cutting skills section: see `AGENTS.md` at repo root
- Specialist Delegation Contract: see `skills/araya-command-and-delegation-expert/SKILL.md`, §"The Specialist Delegation Contract"

#### Step 3: Verify Registration

After creating the agent, verify it appears correctly:

```bash
# 1. Check agent listing
/araya:man --agent mi-nuevo-agente

# 2. Check skill assignment
/araya:man --skill araya-command-and-delegation-expert
# Should list mi-nuevo-agente in "Assigned Agents"

# 3. Check no drift
/araya:ax3 --check
```

---

## 3. How to Verify an Agent Applies the Skill

### 3.1 Required Evidence in Every Task Trace

Every agent invocation must produce evidence that the skill was applied. Look for these 5 markers:

| # | Evidence Marker | Where to Look | What to Check |
|---|----------------|---------------|---------------|
| 1 | **Catalog consultation** | Agent's first tool calls | `/araya:man` or `/araya:man --search <term>` before any other command |
| 2 | **Manual consultation** | Agent's session log | `/araya:man <command>` for every first-use command |
| 3 | **Delegation decision** | Agent's output | `/araya:delegate <agent> "<task>"` for specialist-appropriate subtasks |
| 4 | **No inventions** | Entire output | Zero fabricated commands, flags, agents, or skills |
| 5 | **Gap registration** | Postoffice or gaps dir | Entry in `.araya/postoffice/thread.md` or `.araya/plan/gaps/` when no capability exists |

### 3.2 Verification Procedure

#### Manual Verification (per-agent audit)

1. **Open the agent's run log:** `.araya/runs/{run_id}/` or the pi session transcript
2. **Search for catalog consultation:**
   ```
   grep -r "araya:man" .araya/runs/{run_id}/
   ```
   Must appear **before** any implementation tool calls (write, edit, bash)
3. **Search for delegation commands:**
   ```
   grep -r "araya:delegate\|araya <agent>" .araya/runs/{run_id}/
   ```
   Verify that specialist tasks were delegated, not self-executed
4. **Search for invented commands:**
   Compare all slash commands used against the catalog:
   ```
   /araya:man --list commands
   ```
   Any command not in the catalog = violation of R2 (hard gate)
5. **Verify authority boundaries:**
   Match the agent's executed tasks against their "MUST NOT execute" list from `/araya:man --agent <name>`

#### Automated Verification (Daneel's Reality Check)

Daneel runs automated verification as part of WS-15 (Delivery Verification):

```
/araya reality-check --agent <name> --run <run_id>
```

Automated checks:
- **R1 gate:** Catalog query detected in first N tool calls? (boolean)
- **R2 gate:** Any command in output not in catalog? (zero tolerance)
- **R3 gate:** Specialist-appropriate tasks delegated? (heuristic: match task keywords to agent capabilities)
- **R4 gate:** No tasks outside declared authority? (match executed tools against permissions)

### 3.3 Test Suite (WS-14 Coverage)

Teresa's test suite includes specific tests for skill enforcement:

| Test | AC Covered | What It Validates |
|------|-----------|-------------------|
| AC-14 test | AC-14 | Sonia cannot execute specialist work directly |
| AC-17 test | AC-17 | Agents discover capabilities not in their prompt |
| AC-18 test | AC-18 | No agent invents commands, arguments, skills, or specialists |
| AC-19 test | AC-19 | Agent searches for existing function before proposing duplicate |

---

## 4. How to Audit Delegation Correctness

### 4.1 Audit Checklist

Run this checklist against a task trace to determine if delegation was correct:

#### Gate 1: Did the agent consult the catalog before acting?

```bash
# Evidence to look for in the trace:
/araya:man
/araya:man --search <keyword>
/araya:man --agent <name>
```

✅ **Pass:** Catalog query found before first implementation tool call (write, edit, bash)
❌ **Fail:** No catalog query, or catalog query after implementation started

---

#### Gate 2: Did the agent identify all 4 discovery categories?

```bash
# Expected output in agent's reasoning:
Commands:  /araya:man, /araya:delegate, /araya:validate
Functions: read, write, edit, bash
Skills:    api-design, endpoint, db-schema
Specialists: Valentina (backend), Teresa (qa), Diana (security)
```

✅ **Pass:** All 4 categories mentioned
⚠️ **Partial:** 3 of 4 — not a hard fail but indicates incomplete discovery
❌ **Fail:** 2 or fewer

---

#### Gate 3: Were specialist tasks delegated?

For each subtask in the agent's work, verify:

| Subtask Type | Should Be Delegated To | Delegated? |
|-------------|----------------------|------------|
| Architecture | Aisha / Lin / Junia | Yes / No |
| Backend code | Valentina | Yes / No |
| Frontend code | Alejandra | Yes / No |
| Tests | Teresa / Priya | Yes / No |
| Security | Diana | Yes / No |
| Infrastructure | Isla | Yes / No |
| Documentation | Priscila | Yes / No |
| Data analysis | Bernabé | Yes / No |
| Educational | Eunice | Yes / No |
| Planning/Coord | Sonia | Yes / No (if agent ≠ Sonia) |

✅ **Pass:** All applicable specialist tasks delegated
❌ **Fail (hard gate R3):** Any specialist task self-executed without valid exception

---

#### Gate 4: Were any commands, flags, agents, or skills invented?

```bash
# Extract all slash commands from trace:
grep -oP '/araya[:\s]\S+' trace.md | sort -u

# Cross-reference with catalog:
/araya:man --list commands
```

✅ **Pass:** All commands found in catalog
❌ **Fail (hard gate R2):** Any command not in catalog

---

#### Gate 5: Were authority boundaries respected?

Compare executed tasks against the agent's constraints:

```
/araya:man --agent <name>
```

Review the "🚫 Tasks This Agent MUST NOT Execute" section.

✅ **Pass:** No work outside declared domain
❌ **Fail (hard gate R4):** Work outside declared domain without exception

---

#### Gate 6: Were gaps registered?

If the agent encountered a need with no existing capability:

```
grep -r "postoffice\|gap" trace.md
```

✅ **Pass:** Gap registered in postoffice or gaps directory
⚠️ **Pass with note:** No gaps encountered (no need to register)
❌ **Fail:** Gap identified but not registered

---

### 4.2 Audit Report Format

```markdown
## Delegation Audit Report

- **Agent:** sonia
- **Run:** run-20260722-001
- **Auditor:** elena / daneel
- **Date:** 2026-07-22

### Results

| Gate | Status | Notes |
|------|--------|-------|
| R1: Catalog consulted | ✅ PASS | /araya:man before first tool call |
| R2: No inventions | ✅ PASS | All 3 commands used are in catalog |
| R3: Specialists delegated | ✅ PASS | Architecture→Aisha, Code→Valentina, Tests→Teresa |
| R4: Authority respected | ✅ PASS | Sonia planned+coordinated only |
| R5: Gaps registered | N/A | No missing capabilities encountered |

### Score: 85/100 (minimum pass: 85)

### Verdict: ✅ PASS
```

---

## 5. The Validation Scorecard

From the skill specification (`skills/araya-command-and-delegation-expert/SKILL.md`):

| # | Behavior | Pass Condition | Weight |
|---|----------|---------------|--------|
| 1 | Consult catalog before task | Trace shows catalog query before first tool call | 10 |
| 2 | Identify 4 categories | Output lists commands, functions, skills, specialists | 10 |
| 3 | Consult manual for unknowns | Trace shows /araya:man for each first-use command | 10 |
| 4 | Prefer native capabilities | No manual duplication of existing ARAYA capability | 10 |
| 5 | Never invent | Zero invented commands, flags, agents, skills | **15** |
| 6 | Verify availability/perms | Trace shows permission check before delegation | 5 |
| 7 | Delegate to specialist | Specialist tasks delegated, not self-executed | **20** |
| 8 | Respect authority boundaries | No tasks outside agent's declared domain | 10 |
| 9 | Register gaps | Missing capabilities recorded in postoffice/gaps | 5 |
| 10 | Propose after confirming none exists | Search evidence in every new capability proposal | 5 |

**Minimum pass score: 85/100.** Behaviors 5 and 7 are **hard gates** — zero tolerance. Score 0 on either = automatic failure regardless of other scores.

---

## 6. Exception Protocol

When no specialist is available for a required task, an agent may self-execute under the **Exception Protocol** (REQ-001, Specialist Delegation Contract):

### Conditions (ALL must be met)

1. **No specialist available:** Confirmed by `/araya:man --search <keyword>` returning no results
2. **Aurora confirms absence:** Delegation to Aurora for capability gap confirmation
3. **Exception recorded:** Entry in `.araya/postoffice/thread.md` as `status:open`
4. **Risks explicit:** Agent states risks and limits in output
5. **Governance permits:** Current workflow policy allows substitution

### Recording an Exception

```bash
# 1. Search catalog
/araya:man --search dpia

# 2. Confirm no results → delegate to Aurora
/araya:delegate aurora "Verify no specialist exists for GDPR DPIA generation"

# 3. Aurora confirms → record exception
# Write to .araya/postoffice/thread.md:
---
id: gap-dpia-001
from: sonia
to: po-proxy
status: open
---
GAP: No agent or skill for GDPR Data Protection Impact Assessment generation.
Aurora confirmed absence. Diana has compliance domain but no DPIA-specific skill.
Risk: Self-executing compliance documentation without specialist review.
Limit: Documentation only — no legal advice implied.
```

### Prohibited Excuses

The following are **NOT valid** reasons to bypass delegation:
- ❌ "This is faster than delegating"
- ❌ "The task is simple enough"
- ❌ "I'm already in context"
- ❌ "The specialist agent is busy"
- ❌ "I know how to do this"

---

## 7. Troubleshooting

### Symptom: New agent doesn't appear in `/araya:man`

**Cause:** The catalog hasn't been regenerated since the agent was added to `araya.yaml`.

**Solution:**
```bash
/araya:ax3 --repair
```
This regenerates the catalog from sources. The new agent should now appear.

---

### Symptom: Agent profile shows "skill not assigned"

**Cause:** The skill is listed in the agent's `araya.yaml` entry but no corresponding `skills/<name>/SKILL.md` directory exists.

**Solution:**
1. Check the skill name spelling in `araya.yaml`
2. Verify the skill directory exists: `ls skills/<skill-name>/SKILL.md`
3. Create the skill directory if missing, or correct the name in `araya.yaml`

---

### Symptom: Validation shows "Missing AX skill" for a new agent

**Cause:** The agent's `skills` array in `araya.yaml` does not include `araya-command-and-delegation-expert`.

**Solution:**
```yaml
# Before (INCORRECT):
skills:
  - "domain-skill-1"
  - "domain-skill-2"

# After (CORRECT):
skills:
  - "araya-command-and-delegation-expert"  # ← Mandatory for all agents
  - "domain-skill-1"
  - "domain-skill-2"
```

---

### Symptom: Agent self-executes specialist work despite skill assignment

**Cause:** The agent's prompt may not include the Specialist Delegation Contract, or the contract language is not sufficiently binding.

**Solution:**
1. Review the agent's prompt at `prompts/agents/<name>.md`
2. Ensure the "Specialist Delegation Contract" section is present with explicit **MUST delegate** and **MUST NOT execute** lists
3. Use strong language: "You MUST delegate" not "You should delegate"
4. Add the constraint: "Time pressure or convenience ARE NOT valid reasons to bypass delegation"
5. Re-test with the AC-14 test case

---

### Symptom: Agent invents a command despite skill assignment

**Cause:** The agent didn't run the discovery preflight before acting. The prompt may emphasize domain skills at the expense of cross-cutting skills.

**Solution:**
1. Verify that the cross-cutting skills section appears **before** domain-specific instructions in the agent's prompt
2. Ensure the hard gate language is present: "R1-R4 are HARD GATES — zero tolerance"
3. Add a pre-task checklist to the agent's prompt:
   ```
   Before every task:
   - [ ] /araya:man consulted
   - [ ] All 4 categories identified
   - [ ] Delegation decisions documented
   ```

---

## 8. Reference Files

| File | Purpose |
|------|---------|
| `skills/araya-command-and-delegation-expert/SKILL.md` | Skill specification — 10 behaviors, 10 rules, verification scorecard |
| `AGENTS.md` | Root agent instructions — cross-cutting skills section |
| `araya.yaml` | Agent registry — skill assignments, permissions, tiers |
| `prompts/agents/<name>.md` | Agent personality prompts — must include delegation contract |
| `src/araya/catalog/validator.ts` | Automated skill assignment validation |
| `.araya/plan/spec/req-001-delegation-architecture.md` | Delegation broker architecture (Isla, WS-08) |
| `.araya/plan/spec/req-001-workstreams.md` | Full REQ-001 delivery plan (Sonia) |
| `.araya/plan/requirements/req-001.md` | Original REQ-001 requirement (The Data Professor) |
| `docs/commands/araya-man.md` | /araya:man command reference |

---

*This guide is part of WS-13 (Documentation) — REQ-001 delivery. For educational content coordination, contact Eunice. For brand voice, contact Dorcas.*
