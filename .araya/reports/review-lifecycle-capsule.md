# Governance & Reality Review — ARAYA Lifecycle Capsule

**Reviewer:** R. Daneel Olivaw (Reality Authority)
**Artifact ID:** review-lifecycle-capsule-001
**Date:** 2026-06-01
**Scope:** Capsule v0.1 — "End-to-End Lifecycle, Granularity and Model-Aware Execution"
**Author of Capsule:** Manuel (The Data Professor)

---

## Status

**The capsule is directionally correct but operationally incomplete.** The core principle — decomposition and execution are separate — is sound. The lifecycle phases are well-defined individually. But the capsule omits ARAYA's existing operational reality: 5 delivery modes, agent-to-phase mapping, parallel execution, workstream structure, and the four-pillar organizational model. Adoption as-is would conflict with the current `/araya run` pipeline.

---

## Current ARAYA Model

```
User request → Sonia plans → Agent delegation → Phases execute → Delivery
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
      SDD       BDD       TDD
        │         │         │
        └─────────┼─────────┘
                  ▼
           Implementation
                  │
          Review → Validation → Delivery

5 modes: full (8 phases), standard (5), quick (1), review (2), repair (2)
Phase-to-agent mapping: sdd→Sonia, bdd→Sonia, tdd→Teresa, implementation→Valentina, review→Aisha, security→Diana, validation→Priya, documentation→Priscila
Decomposition: pm-decompose (Sonia) — sprint-level task breakdown
No complexity scoring. No model-aware batching. No atomic work units.
```

---

## Proposed Capsule Model

```
INTENT → DISCOVERY → SDD → BDD → NFR → TEST STRATEGY → WORK BREAKDOWN
→ ATOMIC WORK UNITS → COMPLEXITY SCORING → MODEL-AWARE BATCHING
→ IMPLEMENTATION → CODE REVIEW → VALIDATION → EVIDENCE → UAT → DELIVERY
→ LESSONS LEARNED

17 sequential phases. No mode differentiation.
All work decomposed to atomic units before execution.
Complexity scored. Batch size determined by ARAYA, not model.
```

---

## Compatibility Assessment

### 1. Organizational Impact — 🟡 Partial Compatibility

| Element | Current | Capsule | Gap |
|---------|---------|---------|-----|
| Who decomposes? | Sonia (pm-decompose) | "ARAYA is responsible" | Capsule doesn't specify which agent or workstream |
| Who scores complexity? | Nobody | Required, undefined | New capability needed |
| Who determines batch size? | Nobody | ARAYA | New capability needed |
| Who owns DISCOVERY? | Manu (implicitly) | New phase, no owner | Manu needs discovery skill or phase owner |
| Who owns NFR? | Diana (security) + Isla (infra) | New phase, fragmented ownership | Needs unified NFR ownership |
| Who owns LESSONS LEARNED? | Esteban (trajectories) | New phase | Aligns with Esteban's domain |

**Impact:** At least 3 new capabilities required (complexity scoring, model-aware batching, atomic decomposition). Existing agents don't cover these.

---

### 2. Governance Impact — 🟡 Partial Compatibility

| Rule | Capsule Alignment | Issue |
|------|:---:|-------|
| Constitution (167 rules) | ✅ Principle aligns with ENG, GOV, REV | No conflict |
| AUTH-001 to 009 (Four Pillars) | ❌ Not referenced | Who owns decomposition? Delivery Authority (Sonia)? Who owns model selection? |
| WSM-001 to 010 (Workstreams) | ❌ Not referenced | Which workstream owns each phase? |
| REV-001 to 005 (Review Matrix) | 🟡 CODE REVIEW mentioned | But REVIEW is separate from VALIDATION — where do blocker reviewers fit? |
| ART-001 to 010 (Artifacts) | ✅ EVIDENCE mandatory | Aligns. Each phase should produce named artifacts. |
| ENG-004 (Engineering Excellence) | ✅ Atomic Work Units = "do one thing well" | Compatible |
| AMB-001 (Ambiguity) | ❌ Not addressed | What if DISCOVERY reveals ambiguity? Escalation path not defined. |

**Impact:** Capsule needs to reference AUTH, WSM, REV domains and define ownership per phase.

---

### 3. Changes Required to Sonia — 🟡 Significant

| Current | Proposed | Gap |
|---------|----------|-----|
| pm-decompose (sprint-level tasks) | ATOMIC WORK UNITS (granular) | Sonia needs AWU decomposition capability |
| pm-plan, pm-dependencies | COMPLEXITY SCORING | New skill: complexity scoring per AWU |
| Direct agent assignment | MODEL-AWARE BATCHING | New skill: batch size calculation per model capability |
| Delivery mode selection | Single 17-phase pipeline | Sonia must map 5 modes to which phases apply |

**Skills to add:** atomic-decomposition, complexity-scoring, batch-sizing. Or delegate to new specialist.

---

### 4. Changes Required to Manu — 🟡 Moderate

| Current | Proposed | Gap |
|---------|----------|-----|
| SDD-vision, SDD-requirements | DISCOVERY → SDD → BDD | DISCOVERY is new. Manu does SDD, but DISCOVERY is broader (scope, assumptions, stakeholders, risks) |
| BDD-feature | BDD (unchanged) | Fine |
| No NFR ownership | NFR mandatory | Manu should own NFR gate for product requirements |

**Skills to add:** discovery. Or NFR ownership could go to Diana (security NFR) + Isla (infra NFR) + new NFR coordinator.

---

### 5. Changes Required to PM Decomposition — 🔴 Fundamental

| Current | Proposed |
|---------|----------|
| Task-level: "Build provider registration endpoint" | AWU: "Validate email uniqueness in registration" |
| Sprint-level grouping | Complexity-scored + model-batched |
| Sonia does it manually | Requires automated or semi-automated decomposition |

**This is the biggest operational change.** The capsule transforms decomposition from a planning activity to an engineering activity. Atomic Work Units are closer to implementation tasks than sprint stories. This changes Sonia's role from "what should we build this sprint?" to "how should the model execute this unit?"

---

### 6. Compatibility with Repository Truth — ✅ Compatible

REAL-001 through REAL-010 require evidence, branch verification, and repository truth. The capsule's EVIDENCE phase and mandatory evidence before delivery align perfectly.

---

### 7. Compatibility with Atomic Work Units — ✅ Internally Consistent

The definition of AWU is clear and internally consistent. One purpose, one behavior, one validation path, independent review, limited scope. These properties are testable.

**Gap:** No defined maximum AWU size. No defined minimum. No tooling to verify AWU compliance.

---

### 8. Compatibility with Model-Aware Batching — 🟡 Concept Sound, Implementation Missing

The concept is valid: larger models get more units. But:
- No batching algorithm defined
- No per-model capability data (context window, reasoning depth, tool access)
- No connection to existing model_tiers in araya.yaml
- The examples mention Claude, GPT, Gemini, Codex — but ARAYA primarily uses pi.dev models

---

### 9. Risks

| Risk | Severity | Detail |
|------|:--------:|--------|
| **Overhead on simple tasks** | 🔴 High | A 17-phase lifecycle for a typo fix is absurd. Must support mode differentiation. |
| **Decomposition bottleneck** | 🔴 High | If Sonia decomposes EVERY request to AWUs, she becomes the bottleneck. Need tooling or delegation. |
| **Complexity scoring subjectivity** | 🟡 Medium | Without objective scoring criteria, different agents score the same unit differently. Need scoring rubric. |
| **Model capability drift** | 🟡 Medium | Model capabilities change weekly. Batching decisions based on stale data produce wrong batch sizes. |
| **Phase explosion** | 🟡 Medium | 17 phases × multiple AWUs = combinatorial overhead. Need to define which phases apply when. |
| **Loss of delivery mode flexibility** | 🔴 High | Current 5 modes give speed/fidelity tradeoff. Single pipeline removes this. |

---

### 10. Missing Lifecycle Phases

| Missing | Why Important |
|---------|---------------|
| **Mode selection** | Not every request needs 17 phases. Quick mode exists for a reason. |
| **Review matrix check** | REV-002 requires blocker review before UAT. Where does it fit? |
| **Parallelism analysis** | Current DAG analyzer identifies parallel work. Capsule is purely sequential. |
| **Context capsule** | Compact/handoff between phases. Missing. |
| **Artifact naming** | ART-002 requires named artifacts per phase. Not addressed. |
| **Reconstitution checkpoint** | Long lifecycles need state persistence. Not addressed. |

---

### 11. Conflicts with Existing Documents

| Document | Conflict | Resolution |
|----------|----------|------------|
| `araya.yaml` delivery_modes | Capsule has 1 mode (17 phases). ARAYA has 5 modes. | Capsule must define which phases apply per mode, not replace modes. |
| `araya.yaml` phase-agent mapping | Capsule doesn't map phases to agents | Add phase ownership per AUTH and WSM domains |
| Constitution AUTH domain | Capsule doesn't reference four-pillar model | Define which pillar owns decomposition (Delivery Authority) and which owns execution (Delivery Authority delegates) |
| Constitution WSM domain | Capsule doesn't reference workstreams | Map phases to workstreams (e.g., NFR → Security, SDD → Architecture) |
| Constitution REV domain | CODE REVIEW mentioned, but blocker review missing | Add REVIEW MATRIX CHECK phase or embed in CODE REVIEW |
| `/araya run` extension code | Capsule lifecycle incompatible with current phase-to-agent mapping | Extension must be extended, not replaced |

---

## Required Corrections (Minimal — Preserve Capsule Direction)

| # | Correction | Rationale |
|---|-----------|-----------|
| 1 | **Add mode differentiation.** The 17-phase lifecycle is the FULL mode. Standard, Quick, Review, Repair should use subsets. | Prevents overhead on simple tasks. Maintains existing capability. |
| 2 | **Define phase ownership per AUTH domain.** DISCOVERY→Product Authority. WORK BREAKDOWN→Delivery Authority. NFR→Security+Platform+Product. | Prevents ownership ambiguity. Aligns with four-pillar model. |
| 3 | **Add DISCOVERY to Manu's skill set.** Currently Manu does SDD but not explicit discovery. | Capsule requires discovery as distinct phase. |
| 4 | **Define complexity scoring dimensions objectively.** Add scoring rubric. | Prevents subjective scoring. Enables automation. |
| 5 | **Connect model-aware batching to model_tiers in araya.yaml.** | Uses existing configuration. Avoids duplication. |
| 6 | **Add REVIEW MATRIX CHECK phase or embed in CODE REVIEW.** | REV-002 compliance. Prevents UAT escapes. |
| 7 | **Reference existing delivery_modes as phase subsets.** | Preserves `/araya run --mode quick` functionality. |
| 8 | **Define AWU size boundaries.** Max and min. | Prevents over-decomposition and under-decomposition. |

---

## Recommendation

**APPROVE DIRECTION. REQUIRE 8 CORRECTIONS BEFORE FORMALIZATION.**

The capsule's core principle — decomposition and execution are separate, with ARAYA decomposing and models executing — is strategically correct. The lifecycle phases are well-defined. The Atomic Work Unit concept is an important evolution of the current task-based model.

But the capsule must be integrated with ARAYA's existing operational reality: 5 delivery modes, phase-to-agent mapping, parallel execution, workstream and pillar ownership, and the review matrix. Adopting the capsule as-is would break `/araya run`, overload Sonia, and remove the speed/fidelity tradeoffs that make quick and standard modes useful.

The 8 corrections are minimal — they preserve the capsule's direction while connecting it to what ARAYA already does.

**Disposition:** AUDIT — direction approved. 8 corrections required. Ready for capsule v0.2.
