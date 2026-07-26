# 007 — Audit Findings (Complete Register)
> Capsule ID: 007 | Initiative: audit-findings | Status: OPEN (3 CRITICAL, 4 HIGH)
> Session: 2026-07-26 | Framework HEAD: 0902ac6 | Token budget: ~4000

---

## Aurora Matrix Findings (REQ-043 Step 1)

### F-001 ⛔ CRITICAL — Teresa/Clara Identity Crisis

**Blocks:** Relay TESTING state operation

Three sources give three different views:

| Source | Teresa's Role | Teresa's Skills |
|--------|--------------|-----------------|
| `araya.yaml` | CCO | uat-review, token-efficiency |
| `prompts/agents/teresa.md` | **QA Engineer** (STALE) | unit-test, integration-test, tdd-generate... |
| Sonia's prompt roster | **QA Engineer** | unit-test... (deploys her for tdd/tests) |
| Relay state-machine | TESTING owner | references "Teresa" as TESTING gate |
| Relay workflow.yaml | `owner_role: TERESA` | for TESTING state |

**Actual QA Engineer:** Clara has all QA skills (unit-test through uat-generate) but Relay never references her.

**Required fixes (6 items):**
1. Update Relay state-machine: rename TESTING owner to Clara
2. Update Relay workflow: `owner_role: TERESA` → `owner_role: CLARA`
3. Rewrite `prompts/agents/teresa.md` to CCO role
4. Update `prompts/agents/sonia.md` roster: replace Teresa (QA) with Clara (QA), add Teresa (CCO)
5. Update `araya.yaml`: Clara capabilities include `testing_execution`
6. Relay event-schema: assess `TERESA` role label → `CLARA`

---

### F-002 ⛔ HIGH — Aurora Missing 4 SKILL.md Files

**Blocks:** Aurora's full operational capability

| Skill | Status |
|-------|--------|
| skills-lifecycle | not_installed |
| spof-detection | not_installed |
| hiring-recommendations | not_installed |
| organizational-health | not_installed |

**Options:** [A] Create SKILL.md files, [B] Remove from araya.yaml, [C] Defer as tech debt.

---

### F-003 ⛔ HIGH — Giskard Operational References

**Blocks:** Relay T-030 (operational Giskard references cause BLOCK)

| Agent | Source | References |
|-------|--------|-----------|
| Rolando | araya.yaml + prompt | "reports to Giskard, not delivery ops" |
| Daneel | araya.yaml + prompt | "reports to Giskard", "receive requests from Giskard" |

**Giskard:** No araya.yaml entry, no prompt, no skills, no Relay role. RETIRED.

**Required:** Remove all Giskard references. Define new chain: → Sonia (operational) or Professor (governance).

---

### F-004 ⚠️ MEDIUM — Relay Schema Missing CLARA

`event-schema.json` `actor_role` enum: `["PROFESSOR", "MANU", "AURORA", "SONIA", "SPECIALIST", "TERESA", "ROLANDO", "DANEEL"]` — no `CLARA`.

If Clara executes TESTING, event schema rejects.

---

### F-005 ⚠️ MEDIUM — 3 Bare Agents

| Agent | Skills | Status | Gap |
|-------|--------|--------|-----|
| Neo | AX only | dormant | Bare by design (dynamic activation) |
| Trinity | AX only | dormant | Bare by design |
| Sofia | AX only | active | Can triage/delegate but no domain execution |

---

### F-006 ⚠️ LOW — Daneel can_write_code=true

Contradicts charter: "you route tasks — do not execute specialist work." Relay invariants block him as functional owner but don't prevent code writing outside Relay.

---

### F-007 ℹ️ INFO — Rolando Permissions Correct ✅

| Permission | Value | Assessment |
|-----------|-------|------------|
| can_write_code | false | ✅ |
| can_produce_deliverables | false | ✅ |
| can_emit_binding | true | ✅ |
| can_approve_review | true | ✅ |

---

### F-008 ⛔ HIGH — Teresa Prompt Stale (CCO)

`prompts/agents/teresa.md` describes QA Engineer with unit-test skills, but araya.yaml says CCO with uat-review, token-efficiency. Prompt file is stale. Any invocation produces incorrect behavior.

---

## Violations (Historical)

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| **VIO-001** | HIGH | 14 direct commits to main (May 2026) | RESOLVED — branch-governance.md enacted |
| **VIO-002** | HIGH | Divergence reality vs reported | RESOLVED — Rolando established as Reality Authority |
| **VIO-003** | HIGH | No run records | RESOLVED — `.araya/runs/` established |

---

## PE-0007 Active BLOCKs

| ID | Severity | Description |
|----|----------|-------------|
| PE-0007-B1 | CRITICAL | 3 worktrees in /tmp (canon-rule-001) |
| PE-0007-B2 | CRITICAL | Hook not active (REAL-002) |
| PE-0007-B3 | HIGH | 26 AX3.md with zero domain content |
| PE-0007-B4 | HIGH | Portfolio not self-governing |

---

## PR #80 DISCREPANCY Findings (Resolved in PR #81)

| Finding | Errors | Resolution |
|---------|--------|------------|
| Source hash header `unset` → non-hex | 120 across 4 adapters | Fixed: hash computation, pi + claude-cli format |
| claude-cli `can_write_code` format (`=` vs `:`) | 30 claude-cli files | Fixed: format normalized |

---

## Catalog Drift (Noted)

- `catalog.json` reports `drift_detected: false` — FALSE NEGATIVE
- Teresa/Clara identity crisis, Giskard references, Aurora missing skills all constitute drift
- Catalog should detect these as schema validation failures per Contract v1 Gates 8 and 11

---

> **Capsule generated:** 2026-07-26 | Sonia (PM Head Orchestrator)
> **Sources:** req-043-aurora-matrix.md, VIO files, PE-0007 spec, postoffice Rolando PR #80 re-verify
