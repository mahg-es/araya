# 005 — REQ-043: Canonical-Source Hierarchy + Agent Alignment
> Capsule ID: 005 | Initiative: req-043 | Status: 🟢 DELIVERED (PR #81)
> Session: 2026-07-26 | Framework HEAD: 0902ac6 | Token budget: ~5500

---

## Executive Summary

REQ-043 established the canonical-source hierarchy for ARAYA's agent/skill system. Executed in 3 steps:

| Step | Owner | Artifact | Status |
|------|-------|----------|--------|
| **Step 1** | Aurora 🌟 | Agent-to-Skill-to-Permission-to-Relay-State Matrix | ✅ COMPLETE (8 findings F-001→F-008) |
| **Step 2** | Aisha 🔷 + Priscila 📚 | 4-Layer Source Hierarchy Architecture + Contract v1.0.0 | ✅ COMPLETE |
| **Step 3** | Sonia + Valentina | Implementation + Runtime Recovery | ✅ DELIVERED (PR #81) |

**Final evidence:** PR #81 merged (0902ac6). 381/381 tests passing. Pi sync verified. All generated agents regenerated with source hashes.

---

## Step 1 — Aurora Matrix (COMPLETE)

**Artifact:** `.araya/plan/spec/req-043-aurora-matrix.md`
**Analysis:** 30 agents × 8 dimensions (registry role, prompt role, runtime role, tier, permissions, declared skills, missing skills, Relay states)

### 8 Findings

| ID | Severity | Summary |
|----|----------|---------|
| **F-001** | ⛔ CRITICAL | Teresa/Clara identity crisis — Relay uses Teresa for TESTING, actual QA is Clara |
| **F-002** | ⛔ HIGH | Aurora missing 4 SKILL.md files (skills-lifecycle, spof-detection, hiring-recommendations, organizational-health) |
| **F-003** | ⛔ HIGH | Giskard operational references in Rolando/Daneel (Giskard retired) |
| **F-004** | ⚠️ MEDIUM | Relay event-schema.json missing CLARA in actor_role enum |
| **F-005** | ⚠️ MEDIUM | 3 bare agents (Neo, Trinity, Sofia) — no domain skills |
| **F-006** | ⚠️ LOW | Daneel can_write_code=true contradicts routing-only charter |
| **F-007** | ℹ️ INFO | Rolando permissions correctly configured ✅ |
| **F-008** | ⛔ HIGH | Teresa prompt stale — still describes QA Engineer, reality = CCO |

> **Detail for each finding:** See Capsule 007 (Audit Findings)

---

## Step 2 — Aisha Architecture + Priscila Contract (COMPLETE)

### Aisha Architecture Spec

**Artifact:** `.araya/plan/spec/req-043-aisha-architecture.md`
**Status:** PENDING Manu SPEC_APPROVED

**4-Layer Hierarchy:**
```
L0: araya.yaml          → Agent config, skills[], permissions
L1: prompts/agents/*.md  → Agent personality, approach, rules
L2: skills/*/SKILL.md    → Skill definitions
L3: GENERATED            → .pi/agents/, catalog.json, capability-registry.yaml
```

**Key guarantees:** Deterministic, idempotent, one-way, drift detectable, fail-closed.

**Commands:** `araya generate`, `araya generate --check`, `araya validate-agents`, `araya validate-skills`, `araya drift`

### Priscila Contract Refinement

**Artifact:** `.araya/governance/standards/ARAYA-agent-and-skill-contract-v1.md`
**Version:** 1.0.0 | **Published:** 2026-07-25

Expanded from 12 to **16 sections**, **12 validation gates**, machine-validatable fields. Extracted Relay Participant Contract to independent document (13 sections).

---

## Step 3 — Implementation + Runtime Recovery (DELIVERED)

### PR #80: Functional Baseline

**Commit:** 582e7b7 → 5a29c7d ("Slice A — Agent Capability, Skill and Runtime Alignment")
**Rolando verification:** DISCREPANCY — 2 defects:
1. Source hash header: 120 errors (generator wrote `unset`, validator rejected non-hex)
2. claude-cli `can_write_code` format: 30 errors (`=` vs `: `)

### PR #81: Runtime Recovery (FINAL)

**Commit:** 3590ef6 → 0902ac6 (merge)
**Fixes applied:**
- Pi sync: exact validation, source hashes, do-not-edit markers
- Clean TS build
- Relay mapping
- Regression fixes
- **381/381 tests passing** ✅

### PR #80 Recovery (ab83811)

Fixes applied in PR #80 before merge:
- Gate 3 drift: hash headers + claude-cli format fixed
- Pi info-level warnings resolved

---

## Files Changed (PR #81)

```
src/araya/generator/        — Generator core (agent prompts, catalog, capability registry)
tests/                      — Test suite (381 tests)
.pi/agents/*.md             — ALL 30 agents regenerated with source hashes
.araya/catalog/catalog.json — Regenerated
.araya/organization/        — Capability registry regenerated
```

---

## Remaining Gaps (Not Blocking Delivery)

| Gap | Severity | Owner |
|-----|----------|-------|
| Manu SPEC_APPROVED for Aisha Architecture | ⚠️ MEDIUM | Manu |
| F-001 (Teresa/Clara) unresolved | ⛔ CRITICAL | Manu + Sonia |
| F-003 (Giskard refs) unresolved | ⛔ HIGH | Manu + Sonia |
| F-002 (Aurora 4 skills) deferred | ⚠️ MEDIUM | Professor decision |
| F-004 (Relay CLARA enum) unresolved | ⚠️ MEDIUM | Sonia |
| F-008 (Teresa prompt stale) | ⛔ HIGH | Sonia |

---

## Traceability

```
REQ-043 (Source Hierarchy)
  ├── Step 1: Aurora Matrix       → req-043-aurora-matrix.md (F-001→F-008)
  ├── Step 2: Aisha Architecture   → req-043-aisha-architecture.md
  ├── Step 2: Priscila Contract    → ARAYA-agent-and-skill-contract-v1.md
  ├── Step 3: PR #80 (Slice A)     → 5a29c7d (DISCREPANCY)
  └── Step 3: PR #81 (Recovery)    → 0902ac6 (DELIVERED, 381/381)
```

---

> **Capsule generated:** 2026-07-26 | Sonia (PM Head Orchestrator)
> **Sources:** req-043-aurora-matrix.md, req-043-aisha-architecture.md, ARAYA-agent-and-skill-contract-v1.md, PR #80/#81 git log, postoffice Rolando entries
