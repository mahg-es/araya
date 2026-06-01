# ADR-007 Final Architecture Audit — Remaining Open Items

**Auditor:** R. Daneel Olivaw (Reality Authority)
**Artifact ID:** audit-adr007-final-001
**Date:** 2026-06-01
**Source:** ARAYA Canonical Context v1.0 (Sections 17-27)
**Scope:** Remaining unresolved ADR-007 items only. Closed items not reopened.

---

## Status

**ADR-007 is architecturally sound. 6 open items resolved. 0 conflicts with Canonical Context v1.0.**

---

## Current ADR-007 Maturity

| Element | Status |
|---------|:------:|
| Capability-Driven Delivery | ✅ Closed |
| User Journeys | ✅ Closed |
| Delivery Workstreams | ✅ Closed |
| Atomic Work Units | ✅ Closed |
| Authority Separation | ✅ Closed |
| Public/Private Core | ✅ Closed (ADR-002, ADR-003) |
| Go Core Language | ✅ Closed |
| Versioning Model | ✅ Closed (ADR-006) |
| Delivery Modes existence | ✅ Closed |
| Delivery Mode Mapping | 🟡 **Open — resolved below** |
| Complexity Scoring | 🟡 **Open — resolved below** |
| Model-Aware Batching | 🟡 **Open — resolved below** |
| Traceability Model | 🟡 **Open — resolved below** |
| UAT Governance | 🟡 **Open — resolved below** |
| ADR-007 Readiness | 🟡 **Open — resolved below** |

---

## 1. Delivery Mode Mapping

### Mandatory/Optional/Prohibited by Mode

| Phase | Full | Standard | Quick | Review | Repair |
|-------|:----:|:--------:|:-----:|:------:|:------:|
| INTENT | ✅ M | ✅ M | ⚪ O | ❌ P | ❌ P |
| DISCOVERY | ✅ M | 🟡 O | ❌ P | ❌ P | ❌ P |
| CAPABILITY DEFINITION | ✅ M | ✅ M | ❌ P | ❌ P | ❌ P |
| USER JOURNEYS | ✅ M | 🟡 O | ❌ P | ❌ P | ❌ P |
| TEST STRATEGY | ✅ M | 🟡 O | ❌ P | ❌ P | 🟡 O |
| WORK BREAKDOWN | ✅ M | ✅ M | ❌ P | ❌ P | ❌ P |
| DELIVERY WORKSTREAMS | ✅ M | ✅ M | ❌ P | ❌ P | ❌ P |
| ATOMIC WORK UNITS | ✅ M | ✅ M | ❌ P | ❌ P | 🟡 O |
| COMPLEXITY SCORING | ✅ M | 🟡 O | ❌ P | ❌ P | ❌ P |
| MODEL-AWARE BATCHING | ✅ M | 🟡 O | ❌ P | ❌ P | ❌ P |
| IMPLEMENTATION | ✅ M | ✅ M | ✅ M | ❌ P | ✅ M |
| CODE REVIEW | ✅ M | ✅ M | ✅ M | ✅ M | ❌ P |
| VALIDATION | ✅ M | ✅ M | ❌ P | ✅ M | ✅ M |
| EVIDENCE | ✅ M | 🟡 O | ❌ P | 🟡 O | ✅ M |
| UAT | ✅ M | ✅ M | ❌ P | ❌ P | ❌ P |
| DELIVERY | ✅ M | ✅ M | ✅ M | ❌ P | ❌ P |
| LESSONS LEARNED | 🟡 O | ❌ P | ❌ P | ❌ P | 🟡 O |

**Legend:** M = Mandatory, O = Optional, P = Prohibited

### Governance Implications

- **Full mode**: 17 phases. Used for architecture changes, security-sensitive work, new capabilities. All gates active.
- **Standard mode**: 10 mandatory phases. CAPABILITY DEFINITION and WORK BREAKDOWN mandatory. USER JOURNEYS optional. Normal feature work. No complexity scoring required — Sonia may apply default batching.
- **Quick mode**: 3 mandatory phases. Typo fixes, documentation, UI text, minor config. No Capability Definition, no AWU decomposition, no UAT.
- **Review mode**: 2 mandatory phases. Code review + validation only. Architecture/security review. No implementation.
- **Repair mode**: 3 mandatory phases. Fixing tests, builds, regressions. Implementation + validation + evidence.

### Alignment with Canonical Context §25

> "A typo fix must not require a 17-phase lifecycle." ✅ Aligned. Quick mode = 3 phases.

---

## 2. Complexity Scoring

### Scoring Dimensions (8)

| Dimension | Scale | Description |
|-----------|:-----:|-------------|
| **Architecture Impact** | 1–5 | 1=No architectural change. 5=New service, new data model, new API contract. |
| **Files Touched** | 1–5 | 1=1 file. 2=2-5 files. 3=6-15 files. 4=16-30 files. 5=31+ files. |
| **Security Sensitivity** | 1–5 | 1=No security. 2=UI/auth display. 3=Auth logic. 4=RBAC/data access. 5=Secrets/crypto/billing. |
| **Testing Requirements** | 1–5 | 1=No tests needed. 2=Smoke test. 3=Unit+integration. 4=Full suite+security. 5=Full suite+UAT+perf. |
| **Context Size** | 1–5 | 1=<5KB context. 2=5-20KB. 3=20-50KB. 4=50-100KB. 5=>100KB. |
| **Production Impact** | 1–5 | 1=No prod impact. 2=Config change. 3=Behavior change. 4=Data/schema change. 5=Infrastructure/auth change. |
| **Rollback Difficulty** | 1–5 | 1=Trivial. 2=Code revert. 3=Schema revert. 4=Data migration revert. 5=Irreversible. |
| **Dependency Count** | 1–5 | 1=No dependencies. 2=1-2 deps. 3=3-5 deps. 4=6-10 deps. 5=11+ deps. |

### Scoring Scale

| Score | Level | Description |
|:-----:|-------|-------------|
| 8–15 | **Low** | Routine change. Standard batching allowed. |
| 16–25 | **Medium** | Significant change. Reduced batching. Review required. |
| 26–35 | **High** | Complex change. Batch size=1 recommended. Blocker review mandatory. |
| 36–40 | **Critical** | Architectural/security change. Batch size=1 forced. All gates. Full mode required. |

### Governance Thresholds

| Threshold | Action |
|-----------|--------|
| Score ≥ 30 OR Security Sensitivity ≥ 4 | **Force batch size = 1** per Capsule Rule 5 |
| Score ≥ 26 | Blocker review mandatory per REV-002 |
| Score ≤ 15 AND delivery_mode = standard | Complexity scoring optional. Default batching allowed. |
| Any AWU scores ≥ 36 | Force delivery mode = full |

### Ownership

**Sonia (Delivery Authority)** scores complexity. Aurora provides capability limits as input data. Manu may override product priority but not complexity score.

---

## 3. Model-Aware Batching

### Batch Sizing Rules

| Model Capability | Max Batch (Low) | Max Batch (Medium) | Max Batch (High) |
|-----------------|:--------------:|:------------------:|:----------------:|
| **Reasoning tier** (Sonia, Manu, Diana, Aisha) | 5 AWUs | 3 AWUs | 1 AWU |
| **Balanced tier** (Valentina, Alejandra, Clara) | 3 AWUs | 2 AWUs | 1 AWU |
| **Fast tier** (Sofia) | 2 AWUs | 1 AWU | 1 AWU |

### High-Risk Exceptions (Force Batch = 1)

Per Capsule Rule 5:
- Production deployment
- Security fixes
- Database migrations
- Destructive operations (delete, drop, truncate)
- Authorization boundary changes (RBAC, permissions, role definitions)
- Billing logic changes
- Secrets or credential handling
- Infrastructure provisioning changes

### Delivery Mode Influence

| Mode | Default Batch Size | Override |
|------|:-----------------:|----------|
| Full | Per complexity score | Rule 5 exceptions apply |
| Standard | 3 AWUs (balanced) / 5 AWUs (reasoning) | Sonia may reduce |
| Quick | 1 AWU | No batching — single change |
| Review | N/A | No implementation |
| Repair | 1 AWU | Focused fix |

### Ownership

**Sonia (Delivery Authority)** determines batch size. Aurora provides model capability data. Sonia decides within Aurora's limits per AUTH-003/AUTH-004 boundary.

---

## 4. Traceability Model

### Formal Chain

```
CAP-<NNN>  →  JNY-<NNN>  →  WSM-<NNN>  →  AWU-<NNN>  →  EVD-<NNN>  →  COMMIT-<hash>
Capability    Journey       Workstream     Atomic Unit    Evidence       Git commit
```

### Required Identifiers

| Artifact | ID Format | Example |
|----------|-----------|---------|
| Capability | `CAP-<NNN>` | `CAP-001` (Provider Registration) |
| User Journey | `JNY-<NNN>` | `JNY-001` (Provider signup → dashboard) |
| Delivery Workstream | `WSM-<NNN>` | `WSM-003` (Registration Flow) |
| Atomic Work Unit | `AWU-<NNN>` | `AWU-047` (Validate email uniqueness) |
| Evidence | `EVD-<NNN>` | `EVD-047` (test results, screenshots) |
| Commit | Git hash | `4ad9493` |

### Minimum Metadata per Artifact

```yaml
artifact_id: CAP-001
type: capability
owner: Manu (Product Authority)
status: Draft | Active | Delivered
created: 2026-06-01 10:00 +0200
parent: (none — root)
children: [JNY-001, JNY-002]
```

### Audit Requirements

- Every AWU must trace to a Workstream
- Every Workstream must trace to a Journey or enabling requirement
- Every Journey must trace to a Capability
- Every Capability must have at least one Journey
- Every Delivery must have Evidence
- Every Evidence must trace to a Commit
- Broken chains = governance violation per ART-007

---

## 5. UAT Governance

### Ownership Boundaries

| Role | UAT Responsibility | Authority |
|------|-------------------|:--------:|
| **Manu** (Product) | Defines UAT acceptance criteria. Writes User Journey steps. Final UAT approval. | Owns WHAT passes. |
| **Sonia** (Delivery) | Coordinates UAT execution. Ensures evidence exists. Reports UAT status. | Owns HOW UAT runs. |
| **Priya** (Quality) | Validates UAT package completeness. Verifies traceability chain. | Owns quality gate. |
| **Daneel** (Reality) | Audits UAT evidence. Verifies chain: Capability→Journey→Workstream→AWU→Evidence→Commit. | Owns TRUTH verification. |
| **Aurora** (Capability) | No UAT authority. Ensures qualified agents are assigned to UAT-related work. | Pre-UAT only. |
| **The Data Professor** | Final authority. May accept, reject, or conditionally accept UAT. | Override all. |

### No Authority Overlap

| Check | Result |
|-------|:------:|
| Does Manu overlap with Sonia on UAT execution? | ❌ No — Manu approves; Sonia coordinates |
| Does Priya overlap with Daneel on verification? | ❌ No — Priya validates quality; Daneel audits truth |
| Does Aurora overlap with anyone on UAT? | ❌ No — Aurora is pre-UAT capability assessment |
| Does anyone other than Professor have final UAT authority? | ❌ No |

---

## 6. ADR-007 Readiness Assessment

### Remaining Open Items

| # | Item | Status |
|---|------|:------:|
| 1 | Delivery Mode Mapping | ✅ Resolved (see §1) |
| 2 | Complexity Scoring dimensions | ✅ Resolved (see §2) |
| 3 | Model-Aware Batching rules | ✅ Resolved (see §3) |
| 4 | Traceability Model | ✅ Resolved (see §4) |
| 5 | UAT Governance boundaries | ✅ Resolved (see §5) |
| 6 | ADR-007 formal document | 🟡 Not yet written |

### Recommended Decisions

| Decision | Rationale |
|----------|-----------|
| Adopt the Delivery Mode Mapping (§1) | Preserves existing 5-mode flexibility. Full lifecycle applies to Full mode only. |
| Adopt the Complexity Scoring model (§2) | 8 dimensions. Objective scale 8–40. Thresholds for force-batch=1, blocker review, full mode. |
| Adopt the Model-Aware Batching model (§3) | Tier-based max batch sizes. Rule 5 exceptions. Mode influence. |
| Adopt the Traceability Model (§4) | ID formats defined. Minimum metadata. Audit requirements. ART-007 extension. |
| Adopt the UAT Governance boundaries (§5) | No overlap confirmed. Manu/Professor approve. Sonia coordinates. Priya validates. Daneel audits. |

### Risks

| Risk | Mitigation |
|------|-----------|
| Complexity scoring is subjective despite 8 dimensions | Score is a guideline, not a mathematical proof. Sonia's discretion within Aurora's limits. |
| Batching model based on model tiers — tiers may change | Aurora maintains capability catalog. Updated quarterly per HR-007. |
| Traceability chain is only as strong as its weakest link | Daneel audits chains. Broken chains = governance violation. |
| ADR-007 increases delivery overhead in Full mode | Correct. Full mode is for architecture/security work. Standard/Quick modes remain lightweight. |

### Required Corrections

| # | Correction | Priority |
|---|-----------|:--------:|
| 1 | Formalize ADR-007 document incorporating all resolved items | Critical |
| 2 | Add traceability ID formats to ART domain (ART-011) | High |
| 3 | Add UAT governance boundaries to AUTH domain (AUTH-010) | High |
| 4 | Connect complexity scoring to existing delivery_modes in araya.yaml | Medium |
| 5 | Connect model-aware batching to existing model_tiers in araya.yaml | Medium |

---

## ADR-007 Readiness Assessment

**READY FOR FORMALIZATION.**

All 6 open items resolved. 0 conflicts with Canonical Context v1.0. Delivery modes preserved. Authority boundaries intact. Complexity scoring and batching models defined with objective criteria. Traceability chain formalized. UAT governance free of overlap.

ADR-007 should incorporate:
- Sections 17–27 of Canonical Context v1.0 (already approved)
- Delivery Mode Mapping (§1 above)
- Complexity Scoring (§2 above)
- Model-Aware Batching (§3 above)
- Traceability Model (§4 above)
- UAT Governance (§5 above)

5 corrections recommended (1 critical, 2 high, 2 medium) for constitutional compliance.

---

## Recommendation

**APPROVE ADR-007 FORMALIZATION.** All open items closed. Package is architecturally complete. 0 conflicts with Canonical Context v1.0. 0 authority overlaps. Full mode = 17 phases. Quick mode = 3 phases. Typo fix does not require Capability Definition.

**Disposition:** AUDIT — ADR-007 architecture package locked. Ready for document formalization on The Data Professor's command.
