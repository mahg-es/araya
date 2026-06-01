# ADR-007 — Capability-Driven Delivery with Model-Aware Execution

**Status:** Accepted
**Date:** 2026-06-01
**Decider:** The Data Professor (per 4 governance reviews)
**Supersedes:** ADR-007 Lifecycle Capsule v0.1, v0.2, v0.3 (drafts)
**Superseded by:** None
**Compatible with:** ADR-002, ADR-003, ADR-006, ARAYA Canonical Context v1.0
**Artifact ID:** adr-007

---

## 1. Context

ARAYA currently assigns raw user requests to AI models through agent delegation. There is no formal decomposition pipeline, no complexity scoring, no model-aware batching, and no structured traceability from user intent to delivered capability.

UAT Round 3 on MAHG-PMS demonstrated the failure mode: all 5 P0 defects were User Journey failures, not Atomic Work Unit failures. APIs were complete. Tests were green. But humans could not use the features. The platform had no concept of "capability delivered" beyond "all tasks marked done."

ARAYA Canonical Context v1.0 (Sections 16–27) defines the target operating model: Capability-Driven Delivery with Model-Aware Execution. This ADR formalizes that model.

---

## 2. Problem Statement

ARAYA must answer:

1. How does a user request become a delivered capability?
2. How is work decomposed into units appropriate for AI model execution?
3. How is complexity scored before assignment?
4. How are work units batched per model capability?
5. How is delivery traced from intent to commit?
6. How is UAT validated against human journeys, not technical metrics?
7. How are authority boundaries preserved throughout the lifecycle?

---

## 3. Decision

ARAYA SHALL adopt a Capability-Driven Delivery model with Model-Aware Execution.

The lifecycle SHALL decompose user intent through Capabilities → User Journeys → Delivery Workstreams → Atomic Work Units. Complexity SHALL be scored before assignment. Work units SHALL be batched per model capability. Delivery SHALL be traced from Capability to Commit. UAT SHALL validate User Journeys, not technical metrics.

Authority boundaries SHALL be preserved: Manu (Product) owns WHAT. Aurora (Capability) owns WHO CAN. Sonia (Delivery) owns HOW. Daneel (Reality) owns TRUTH.

---

## 4. Delivery Hierarchy

The canonical delivery hierarchy SHALL be:

```
INTENT → DISCOVERY → CAPABILITY DEFINITION → USER JOURNEYS →
TEST STRATEGY → WORK BREAKDOWN → DELIVERY WORKSTREAMS →
ATOMIC WORK UNITS → DEPENDENCY ANALYSIS → PARALLEL GROUPING →
COMPLEXITY SCORING → MODEL-AWARE BATCHING → IMPLEMENTATION →
CODE REVIEW → VALIDATION → EVIDENCE → UAT → DELIVERY →
LESSONS LEARNED
```

This full hierarchy SHALL apply to the `full` delivery mode. Other modes SHALL activate subsets per Section 12. Simple tasks MUST NOT be forced through the full 17-phase lifecycle.

---

## 5. Capability Definition

A Capability is a business outcome that provides value to a user.

A Capability MUST have:
- A unique identifier (`CAP-NNN`)
- A human-readable name
- At least one User Journey
- A defined owner (Manu, Product Authority)

A Capability is NOT delivered until its User Journey passes UAT.

Examples: Provider Registration, Consultant Assignment, Credential Verification.

---

## 6. User Journey Definition

A User Journey is the end-to-end path a human follows to consume a Capability.

A User Journey MUST:
- Have a unique identifier (`JNY-NNN`)
- Reference a parent Capability
- Consist of human-comprehensible steps
- Be validated by UAT

UAT MUST validate User Journeys using human-comprehensible steps, not technical assertions.

---

## 7. Delivery Workstream Definition

A Delivery Workstream is a coherent delivery slice focused on a Capability or part of a Capability.

A Delivery Workstream MUST:
- Have a unique identifier (`WSM-NNN`)
- Reference a parent User Journey or enabling requirement
- Group related Atomic Work Units
- Be coherent, testable, independently reviewable

A Delivery Workstream is NOT delivered until all its Atomic Work Units pass validation.

---

## 8. Atomic Work Unit Definition

An Atomic Work Unit is the smallest independently executable engineering unit.

An Atomic Work Unit MUST:
- Have a unique identifier (`AWU-NNN`)
- Reference a parent Delivery Workstream
- Have one primary purpose
- Have one primary expected behavior
- Have a clear validation path
- Have limited implementation scope
- Be independently reviewable

Completion rule:

```
AWU Complete ≠ Workstream Delivered
Workstream Delivered ≠ Capability Delivered
Capability Delivered = User Journey Passes UAT
```

---

## 9. Complexity Scoring Model

Complexity Scoring SHALL be owned by Sonia (Delivery Authority). Aurora SHALL provide model capability limits as input data.

### Scoring Dimensions

| Dimension | Scale | Description |
|-----------|:-----:|-------------|
| Architecture Impact | 1–5 | 1=No change. 5=New service/data model/API contract |
| Files Touched | 1–5 | 1=1 file. 5=31+ files |
| Security Sensitivity | 1–5 | 1=None. 5=Secrets/crypto/billing |
| Testing Requirements | 1–5 | 1=None. 5=Full suite+UAT+perf |
| Context Size | 1–5 | 1=<5KB. 5=>100KB |
| Production Impact | 1–5 | 1=None. 5=Infrastructure/auth change |
| Rollback Difficulty | 1–5 | 1=Trivial. 5=Irreversible |
| Dependency Count | 1–5 | 1=None. 5=11+ |

### Scoring Scale

| Score | Level | Action |
|:-----:|-------|--------|
| 8–15 | Low | Default batching allowed |
| 16–25 | Medium | Reduced batching. Review required |
| 26–35 | High | Batch size=1 recommended. Blocker review mandatory |
| 36–40 | Critical | Batch size=1 forced. Full mode required |

### Governance Thresholds

| Threshold | Action |
|-----------|--------|
| Score ≥ 30 OR Security Sensitivity ≥ 4 | Force batch size = 1 |
| Score ≥ 26 | Blocker review mandatory per REV-002 |
| Score ≥ 36 | Force delivery mode = full |

---

## 10. Model-Aware Batching Model

Model-Aware Batching SHALL be owned by Sonia (Delivery Authority). Aurora SHALL provide model capability profiles as input data.

### Batch Sizes by Model Tier

| Tier | Low (8–15) | Medium (16–25) | High (26–40) |
|------|:----------:|:--------------:|:------------:|
| Reasoning | 5 AWUs | 3 AWUs | 1 AWU |
| Balanced | 3 AWUs | 2 AWUs | 1 AWU |
| Fast | 2 AWUs | 1 AWU | 1 AWU |

### High-Risk Exceptions (Force Batch = 1)

The following SHALL force batch size = 1 regardless of complexity score:
- Production deployment
- Security fixes
- Database migrations
- Destructive operations
- Authorization boundary changes
- Billing logic changes
- Secrets or credential handling

---

## 11. Delivery Mode Mapping

The 17-phase lifecycle SHALL activate subsets per delivery mode.

| Phase | Full | Standard | Quick | Review | Repair |
|-------|:----:|:--------:|:-----:|:------:|:------:|
| INTENT | M | M | O | — | — |
| DISCOVERY | M | O | — | — | — |
| CAPABILITY DEFINITION | M | M | — | — | — |
| USER JOURNEYS | M | O | — | — | — |
| TEST STRATEGY | M | O | — | — | O |
| WORK BREAKDOWN | M | M | — | — | — |
| DELIVERY WORKSTREAMS | M | M | — | — | — |
| ATOMIC WORK UNITS | M | M | — | — | O |
| COMPLEXITY SCORING | M | O | — | — | — |
| MODEL-AWARE BATCHING | M | O | — | — | — |
| IMPLEMENTATION | M | M | M | — | M |
| CODE REVIEW | M | M | M | M | — |
| VALIDATION | M | M | — | M | M |
| EVIDENCE | M | O | — | O | M |
| UAT | M | M | — | — | — |
| DELIVERY | M | M | M | — | — |
| LESSONS LEARNED | O | — | — | — | O |

M = Mandatory. O = Optional. — = Prohibited.

---

## 12. UAT Philosophy

UAT MUST be capability-centric, not implementation-centric.

UAT steps MUST describe human-comprehensible outcomes.

UAT MUST NOT describe technical assertions.

When a UAT step fails, ARAYA SHALL trace: Capability → User Journey → Workstream → AWU → Evidence → Commit.

UAT approval SHALL follow these authority boundaries:
- Manu (Product Authority): Defines UAT criteria. Final UAT approval.
- Sonia (Delivery Authority): Coordinates UAT execution.
- Priya (Quality Lead): Validates UAT package completeness.
- Daneel (Reality Authority): Audits evidence chain.
- Professor: Final authority. May accept, reject, or conditionally accept.

---

## 13. Traceability Model

Every artifact SHALL carry:
- A unique identifier per its type (`CAP-NNN`, `JNY-NNN`, `WSM-NNN`, `AWU-NNN`, `EVD-NNN`)
- A parent reference (except Capabilities)
- An owner
- A status (Draft, Active, Delivered)
- Timestamps per DOC-005

The traceability chain SHALL be:

```
CAP-NNN → JNY-NNN → WSM-NNN → AWU-NNN → EVD-NNN → COMMIT-hash
```

Broken chains SHALL be governance violations.

---

## 14. Authority Boundaries

| Phase | Authority | Question |
|-------|-----------|----------|
| INTENT → USER JOURNEYS | Manu (Product) | WHAT outcome? WHAT path? |
| WORK BREAKDOWN → DELIVERY | Sonia (Delivery) | HOW to deliver? |
| Capability data | Aurora (Capability) | WHO CAN execute? |
| Evidence verification | Daneel (Reality) | IS IT TRUE? |

Aurora SHALL qualify. Sonia SHALL decide.

Aurora SHALL NOT plan, decompose, schedule, or batch.
Sonia SHALL NOT determine agent or model eligibility.
Manu SHALL NOT sequence delivery.
Daneel SHALL NOT own delivery.

---

## 15. Governance Rules

| Rule | Text |
|------|------|
| ADR7-001 | No model SHALL receive raw user requests directly |
| ADR7-002 | All implementation work MUST originate from Atomic Work Units |
| ADR7-003 | Complexity scoring MUST occur before assignment |
| ADR7-004 | Batch size SHALL be determined by ARAYA, not by the model |
| ADR7-005 | High-risk work MAY force batch size = 1 |
| ADR7-006 | Documentation-only work MAY use larger batches |
| ADR7-007 | Evidence SHALL be required before delivery |
| ADR7-008 | A typo fix MUST NOT require a 17-phase lifecycle |
| ADR7-009 | A capability SHALL NOT be reported as delivered until its User Journey passes UAT |
| ADR7-010 | Every artifact SHALL be traceable through the Capability → Commit chain |

---

## 16. Consequences

### Positive
- UAT validates human journeys, not technical metrics — catches the class of defects found in UAT Round 3 before delivery
- Traceability chain enables deterministic root-cause analysis
- Complexity scoring prevents high-risk work from being batched carelessly
- Model-aware batching matches work size to model capability
- Authority boundaries preserved — no overlap between pillars
- Delivery modes preserved — Quick mode remains lightweight

### Negative
- Full mode adds overhead (17 phases) for complex work — intentional
- Complexity scoring requires Sonia to develop scoring judgment
- Traceability chain requires discipline in artifact creation
- Model capability data requires Aurora's ongoing maintenance

---

## 17. Examples

### Full Mode — New Capability

```
CAP-003: Consultant Lifecycle Management
  JNY-003: Admin creates and manages consultants
    WSM-007: Consultant CRUD Operations
      AWU-031: Create consultant endpoint
      AWU-032: List consultants with filtering
      AWU-033: Update consultant status
    WSM-008: Consultant-Tenant Assignment
      AWU-034: Assign consultant to tenant
      AWU-035: Validate provider-tenant ownership

Complexity: AWU-031=12 (Low), AWU-032=10 (Low), AWU-033=14 (Low),
            AWU-034=22 (Medium), AWU-035=28 (High)

Batching: AWU-031+032+033 → batch of 3 for balanced tier
          AWU-034 → batch of 1 (Medium, reduced)
          AWU-035 → batch of 1 (High, forced)

UAT: Journey step "Admin creates consultant → sees in list" passes.
     Capability delivered.
```

### Quick Mode — Typo Fix

```
IMPLEMENTATION → CODE REVIEW → DELIVERY
No Capability Definition. No AWU decomposition. No UAT.
```

---

## 18. Migration Notes

- Existing `/araya run` delivery modes remain functional
- Phase-agent mapping in araya.yaml extended with new phases per delivery mode
- Complexity scoring and batching are new capabilities for Sonia
- Aurora's capability catalog extended with model profiles for batching
- Traceability chain identifiers are new — existing artifacts retroactively identified as migration proceeds
- No breaking changes to existing delivery workflow

---

## 19. Compatibility

### ADR-002 (IPC Contract)
Compatible. The private Go core enforces lifecycle gates via exit codes. GOVERNANCE_FAILED (exit 4) applies to traceability chain violations.

### ADR-003 (Public/Private Boundary)
Compatible. Lifecycle governance remains public. Private core enforces traceability, scoring thresholds, and batching rules without defining them.

### ADR-006 (Version Compatibility)
Compatible. ADR-007 uses ARAYA versioning (Major.Revision.Hotfix). Minor lifecycle adjustments are hotfix-compatible. New phases or scoring dimensions are revision-level changes.
