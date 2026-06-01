# Third Governance Review — Capability & Journey Model

**Reviewer:** R. Daneel Olivaw (Reality Authority)
**Artifact ID:** review-lifecycle-capsule-v3
**Date:** 2026-06-01
**Scope:** Capability Definition + User Journey insertion before ADR-007

---

## Status

**This is the most important correction to the capsule.** The Capability → Journey → Workstream → AWU hierarchy transforms ARAYA from a technical-delivery framework into a human-outcome framework. It directly addresses the failure mode observed in UAT Round 3: APIs green, tests green, AWUs complete, but the human cannot use the feature.

---

## 1. Capability Assessment — ✅ Strong Improvement

### Before (v2)
```
DISCOVERY → WORK BREAKDOWN → DELIVERY WORKSTREAMS → AWU
```
**Problem:** Nothing defines WHAT business outcome the work serves. Workstreams can be technically coherent but deliver no user value.

### After (v3)
```
DISCOVERY → CAPABILITY DEFINITION → USER JOURNEYS → DELIVERY WORKSTREAMS → AWU
```
**Solution:** Capability Definition names the business outcome. User Journey defines the human path. Workstreams and AWUs serve the journey.

### Why This Matters

UAT Round 3 found 5 P0 defects. All 5 were CAPABILITY failures, not AWU failures:

| UAT Defect | Type | Would Journey Have Caught It? |
|------------|------|:---:|
| UAT3-01: Ask AI broken | Journey step failed | ✅ Yes — "User asks question → receives answer" would fail |
| UAT3-02: Consultant creation unvalidatable | Journey incomplete | ✅ Yes — "Admin creates consultant → sees in list" would fail |
| UAT3-03: Navigation broken | Journey step failed | ✅ Yes — "Tenant → breadcrumb → Provider" would fail |
| UAT3-04: Economics no drill-down | Journey step missing | ✅ Yes — "Platform → Provider → Economics" undefined |
| UAT3-05: Provider no identity | Journey expectation unmet | ✅ Yes — "Provider sees branded workspace" would fail |

**Every UAT Round 3 defect was a User Journey failure, not an Atomic Work Unit failure.** The AWUs were complete. The journeys were broken. This is exactly the gap the capsule v3 closes.

---

## 2. Journey Assessment — ✅ Mandatory

### Should User Journey become a mandatory lifecycle artifact?

**YES.** Unambiguously. The evidence from UAT Round 3 is conclusive: AWU completion ≠ capability delivery. User Journey is the bridge between technical completion and human usability.

### Constitutional Basis

| Rule | Alignment |
|------|:----------:|
| USE-001 | "A feature is complete only when it can be used, solves a real problem, can be demonstrated end-to-end, and reduces manual work" | ✅ Journey is the definition of "demonstrated end-to-end" |
| USE-002 | "No agent may claim a feature is usable without reproducible evidence" | ✅ Journey steps are reproducible evidence |
| USE-003 | "Passing technical tests is not sufficient evidence of user usability" | ✅ Journey validates usability, not just test passing |
| GOV-005 | "Delivery completion requires all acceptance criteria met" | ✅ Journey steps ARE the acceptance criteria for capabilities |
| GOV-006 | "UAT entry requires implementation complete, self-review, blocker reviews, tests green" | ✅ UAT entry now includes Journey validation |

---

## 3. Traceability Chain — ✅ Repository Truth

### The Chain
```
Capability → Journey → Workstream → AWU → Evidence → Commit
```

This is a direct implementation of REAL-001 through REAL-010.

### UAT Failure Tracing (Example)

```
UAT Step Fails: "Breadcrumb shows Tenant → Tenant List instead of Tenant → Provider"

Trace:
  Capability: Platform Navigation
  Journey:    Platform → Provider → Tenant drill-down
  Workstream: Context-Aware Breadcrumb
  AWU:        AWU-047: Breadcrumb parent resolution
  Evidence:   test_navigation_context.py — test_breadcrumb_parent_resolution PASSED
  Commit:     4ad9493 — fix(UAT3-01, UAT3-03): Ask AI + navigation context

Finding: Test passed but used wrong parent resolution logic.
         AWU complete. Journey broken. Root cause: AWU-047 implemented
         tenant→tenant_list instead of tenant→provider breadcrumb.
```

**This is the power of the chain.** Without it, UAT finds "breadcrumb broken." With it, UAT finds exactly which AWU and which commit caused the break.

---

## 4. Four-Pillar Alignment — ✅ Preserved

| Phase | Pillar | Question |
|-------|--------|----------|
| INTENT | Manu (Product) | What outcome? |
| DISCOVERY | Manu (Product) | What's the scope? |
| CAPABILITY DEFINITION | Manu (Product) | What business value? |
| USER JOURNEYS | Manu (Product) | What human path? |
| TEST STRATEGY | Manu (Product) | How do we validate? |
| DELIVERY WORKSTREAMS | Sonia (Delivery) | How to organize? |
| ATOMIC WORK UNITS | Sonia (Delivery) | How to decompose? |
| MODEL-AWARE BATCHING | Sonia (Delivery) | How to assign? |
| IMPLEMENTATION | Sonia (Delivery) | Coordinate execution |
| VALIDATION | Sonia (Delivery) | Coordinate validation |
| EVIDENCE | Sonia (Delivery) → Daneel (Truth) | Collect, then verify |
| UAT | Manu (Product) | Does the Journey work? |
| DELIVERY | Manu + Sonia + Priya | Approved, validated, delivered |

**Aurora's role (capability data) unchanged.** Aurora provides model profiles and agent eligibility data to Sonia for batching and assignment decisions.

---

## 5. UAT Quality Improvement — ✅ Significant

### Before (AWU-only model)
```
UAT finds: "Something is broken"
Debug: manual investigation across all AWUs
```

### After (Capability → Journey model)
```
UAT finds: "Journey step 3 fails: breadcrumb shows wrong parent"
Debug: trace Journey → Workstream → AWU-047 → test_breadcrumb → commit 4ad9493
Fix:    AWU-047 breadcrumb parent resolution logic
```

**UAT becomes deterministic, not exploratory.**

---

## 6. Should Capability Become the Primary Planning Unit?

**YES — for Product Authority. NO — for Delivery Authority.**

| Level | Primary Planning Unit | Owner | Why |
|-------|----------------------|-------|-----|
| Product | **Capability** | Manu | Manu thinks in capabilities: "Provider Registration," "Consultant Assignment" |
| Delivery | **Workstream** | Sonia | Sonia manages workstreams: "Registration Flow," "Verification Flow" |
| Execution | **AWU** | Models | Models execute AWUs: "Validate email uniqueness" |

This is not a conflict — it's a hierarchy. Each level serves the level above. Capabilities are the WHAT. Workstreams are the HOW-grouping. AWUs are the HOW-atoms.

---

## 7. Governance Impact — ✅ Compatible

| Rule | Assessment |
|------|:----------:|
| AUTH-002 (Manu owns product) | ✅ Capability + Journey are product definitions |
| AUTH-003 (Sonia owns delivery) | ✅ Workstream + AWU + batching are delivery management |
| AUTH-004 (Aurora owns capability) | ✅ Unchanged — feeds model data to Sonia |
| USE-001 to 003 (Usability) | ✅ Journey directly implements these rules |
| GOV-005 (Delivery completion) | ✅ Enhanced: Journey steps now part of completion criteria |
| GOV-006 (UAT entry) | ✅ Enhanced: UAT now validates Journeys, not just features |
| REAL-001 to 010 (Truth) | ✅ Traceability chain implements reality verification |
| REV-001 to 005 (Review) | 🟡 Journey should have blocker reviewers per REV-002 |

---

## 8. Organizational Impact — ✅ Manageable

| Change | Impact |
|--------|--------|
| Manu defines Capabilities | New deliverable. Aligns with his Product Authority role. |
| Manu defines User Journeys | New deliverable. Manu writes journeys; Sonia estimates effort. |
| Sonia decomposes Journeys into Workstreams | New responsibility. Journey → Workstream mapping. |
| UAT validates Journeys | Enhanced UAT. Steps map to Journey expectations. |
| Daneel traces failures | Enhanced audit. Chain traversal for root cause. |

---

## 9. Conflicts — None

| Check | Result |
|-------|:------:|
| AUTH domain? | ✅ No conflict |
| WSM domain? | ✅ Workstreams remain primary delivery unit |
| Existing ADRs? | ✅ No conflict |
| delivery_modes? | 🟡 Full mode includes Capability + Journey. Quick mode skips to Workstream. Standard mode includes Capability, may skip formal Journey. |

---

## 10. Required Corrections Before ADR-007

| # | Correction | Priority |
|---|-----------|:--------:|
| 1 | **Define Capability Definition as Manu's phase.** Owner: Product Authority. | Critical |
| 2 | **Define User Journey as Manu's phase and mandatory artifact.** Every capability must have at least one journey. | Critical |
| 3 | **Define Journey → Workstream mapping.** How Sonia decomposes a Journey into Workstreams. | Critical |
| 4 | **Define UAT-Journey validation protocol.** UAT steps map to Journey steps. Step failure traces to AWU. | Critical |
| 5 | **Add Journey to GOV-005 completion criteria.** "All Journey steps pass UAT" as delivery requirement. | High |
| 6 | **Add Journey to REV-002 review matrix.** Journeys should have blocker reviewers per capability type. | High |
| 7 | **Define traceability artifact format.** Capability → Journey → Workstream → AWU → Evidence → Commit. | High |
| 8 | **Define phase subsets per delivery mode.** Full includes Capability + Journey. Quick may skip. | Medium |
| 9 | **Connect USE-001 to 003 as constitutional basis for Journey requirement.** | Medium |

---

## 11. Recommendation

**APPROVE CAPABILITY + JOURNEY MODEL. 9 corrections required before ADR-007.**

This is the correction that transforms ARAYA from measuring technical completion to measuring human outcomes. The evidence from UAT Round 3 is conclusive: every P0 defect was a Journey failure, not an AWU failure. The traceability chain (Capability → Journey → Workstream → AWU → Evidence → Commit) gives ARAYA deterministic root-cause analysis for the first time.

The four-pillar model is preserved: Manu defines Capabilities and Journeys (WHAT). Aurora provides capability data (WHO CAN). Sonia manages Workstreams and AWUs (HOW). Daneel verifies the chain (TRUTH).

**Disposition:** AUDIT — capsule v3 approved. 9 corrections required. Ready for ADR-007 formalization on The Data Professor's command.
