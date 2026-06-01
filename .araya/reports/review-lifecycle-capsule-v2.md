# Second Governance Review — Lifecycle Capsule Authority Boundaries

**Reviewer:** R. Daneel Olivaw (Reality Authority)
**Artifact ID:** review-lifecycle-capsule-v2
**Date:** 2026-06-01
**Scope:** Authority boundary validation before ADR-007 formalization

---

## Status

**The corrected lifecycle preserves the four-pillar constitutional model.** With the DELIVERY WORKSTREAMS insertion and clear Aurora/Sonia boundary definition, the capsule is ready for ADR-007 formalization.

---

## 1. Authority Boundary Assessment — ✅ PASS (with clarifications)

### Lifecycle-to-Pillar Mapping

```
MANU (WHAT)                    SONIA (HOW)                         DANEEL (TRUTH)
───────                        ─────────                          ────────────
INTENT                          WORK BREAKDOWN                     (verifies all)
DISCOVERY                       DELIVERY WORKSTREAMS              
SDD                             ATOMIC WORK UNITS                 
BDD                             COMPLEXITY SCORING                
NFR                             MODEL-AWARE BATCHING              
TEST STRATEGY                   IMPLEMENTATION coordination       
                                CODE REVIEW coordination           
                                VALIDATION coordination            
                                EVIDENCE coordination              
                                UAT coordination                   
                                DELIVERY approval                  
                                LESSONS LEARNED coordination       
                                                                  
AURORA (WHO CAN)                                                     
───────────────                                                      
Capability catalog consultation                                      
Model capability assessment                                          
Agent eligibility determination                                      
Assignment qualification                                            
(Feeds Sonia. Does NOT plan, decompose, schedule, or batch.)       
```

**Boundary clarity:**

| Boundary | Assessment |
|----------|:----------:|
| Manu → Sonia | ✅ Clean. Manu defines WHAT. Sonia determines HOW to break it down. |
| Aurora → Sonia | ✅ Clean if explicit. Aurora provides capability data. Sonia makes delivery decisions. No overlap. |
| Sonia → Daneel | ✅ Clean. Sonia delivers. Daneel verifies independently. |
| Aurora → Manu | ✅ No direct interaction. Manu defines requirements. Aurora assesses who can implement. |
| Aurora → Daneel | ✅ No direct interaction. Daneel verifies capability assessments like any other artifact. |

---

## 2. Complexity Scoring — Belongs to Sonia

**Recommendation: Sonia owns complexity scoring.**

| Why Sonia | Why NOT Aurora |
|-----------|---------------|
| Complexity scoring is a delivery risk assessment, not a capability assessment | Aurora qualifies agents and models. She doesn't assess work risk. |
| Sonia needs to decide "should I force batch size = 1 for this AWU?" | Aurora's question is "which model CAN handle this complexity?" — a different question |
| Scoring dimensions (files touched, security sensitivity, architecture impact) are delivery-domain knowledge | Aurora doesn't track file-level change impact |

**The boundary:**

```
Aurora PROVIDES:                    Sonia DECIDES:
  "Model X: reasoning tier,          "AWU-042: complexity 4 (high).
   100K context, handles              Security-sensitive. Force
   complexity up to level 4."        batch size = 1. Assign to
                                     reasoning-tier model."
```

---

## 3. Model-Aware Batching — Belongs to Sonia

**Recommendation: Sonia owns model-aware batching.**

| Why Sonia | Why NOT Aurora |
|-----------|---------------|
| Batching is a delivery scheduling decision — how many AWUs per model invocation | Aurora qualifies model capability. She doesn't schedule work. |
| Sonia balances risk, complexity, and model capability to determine batch size | Aurora's boundary: "Model X can handle 5 AWUs." Sonia decides: "I'll give it 3." |
| Rule 4 states "Batch size is determined by ARAYA, not by the model" — ARAYA = Delivery Authority for operational decisions | Aurora is Capability Authority, not Delivery Authority |

**The boundary:**

```
Aurora PROVIDES:                    Sonia DECIDES:
  "DeepSeek: balanced tier,          "AWU-011 + AWU-012 + AWU-015:
   50K context, batch capacity       all low complexity, all
   up to 3 AWUs."                    documentation-only. Batch
                                     size = 3. Assign DeepSeek."
```

---

## 4. Delivery Workstreams Insertion — ✅ Improves the Lifecycle

### Before (AWU-only)
```
WORK BREAKDOWN → ATOMIC WORK UNITS → IMPLEMENTATION
```
Risk: Produces technically correct but disconnected outcomes. AWUs have no grouping. No human-comprehensible delivery units.

### After (Workstreams + AWU)
```
WORK BREAKDOWN → DELIVERY WORKSTREAMS → ATOMIC WORK UNITS → IMPLEMENTATION
```
Benefit: Workstreams group AWUs into coherent, testable, human-comprehensible outcomes.

### Example

| WITHOUT Workstreams | WITH Workstreams → AWU |
|---------------------|------------------------|
| AWU-001: Validate email uniqueness | **Workstream: Provider Registration Flow** |
| AWU-002: Hash password | → AWU-001: Validate email uniqueness |
| AWU-003: Create provider record | → AWU-002: Hash password |
| AWU-004: Add to Authelia users | → AWU-003: Create provider record |
| AWU-005: Render registration form | → AWU-004: Add to Authelia users |
| (flat list, no grouping) | → AWU-005: Render registration form |
| | (coherent workstream, parallelizable, human-readable) |

**Why this matters:**
- Workstreams connect to WSM-001 to 010 (workstream governance)
- Workstreams enable parallel execution planning (two independent workstreams can run simultaneously)
- Workstreams are the level at which Manu (Product Authority) thinks about delivery
- Workstreams are the level at which Sonia (Delivery Authority) assigns accountability
- AWUs are the level at which models execute

---

## 5. Governance Impact — ✅ Compatible

| Rule | Assessment |
|------|:----------:|
| AUTH-001 to 009 (Four Pillars) | ✅ Preserved. Capsule now respects WHAT/WHO/HOW/TRUTH boundaries |
| AUTH-004 (Aurora owns capability) | ✅ Aurora qualifies. Does not plan, decompose, or batch. |
| AUTH-003 (Sonia owns delivery) | ✅ Sonia decomposes, scores, batches, coordinates. |
| AUTH-002 (Manu owns product) | ✅ Manu owns INTENT through TEST STRATEGY. |
| AUTH-005 (Daneel verifies) | ✅ Daneel verifies EVIDENCE before DELIVERY. Independent. |
| WSM-001 to 010 (Workstreams) | ✅ DELIVERY WORKSTREAMS phase aligns with WSM domain |
| REV-001 to 005 (Review Matrix) | 🟡 CODE REVIEW exists but blocker review not explicit |
| ENG-004 (Engineering Excellence) | ✅ AWU = "do one thing well" |

---

## 6. Organizational Impact — ✅ Manageable

| Change | Impact |
|--------|--------|
| Sonia gains complexity scoring | New capability. Reasoning tier appropriate. Training needed. |
| Sonia gains model-aware batching | New capability. Consumes Aurora's model data. |
| Aurora provides model capability data | New deliverable. Capability catalog extended with model profiles. |
| DELIVERY WORKSTREAMS inserted | Sonia groups AWUs. Existing WSM domain supports this. |
| Daneel verifies lifecycle compliance | New audit checklist. Independent verification of each phase. |

---

## 7. Conflicts — None

| Check | Result |
|-------|:------:|
| Conflict with AUTH domain? | ✅ No |
| Conflict with existing ADRs? | ✅ No |
| Conflict with delivery_modes in araya.yaml? | 🟡 Capsule defines FULL mode. Must specify which phases apply to Standard, Quick, Review, Repair. |
| Conflict with phase-agent mapping? | 🟡 Capsule doesn't define per-phase agent assignment. Must be added. |

---

## 8. Required Corrections Before ADR-007

| # | Correction | Priority |
|---|-----------|:--------:|
| 1 | **Define Aurora's data flow into Sonia's batching.** Explicit: "Sonia consumes capability data from Aurora's capability catalog when making batching decisions." | Critical |
| 2 | **Define phase subsets per delivery mode.** Full = all 17. Standard = which subset? Quick = which subset? | Critical |
| 3 | **Map phases to agents.** Who executes DISCOVERY? Who executes NFR? Who executes COMPLEXITY SCORING? | Critical |
| 4 | **Add REVIEW MATRIX CHECK** as explicit gate between IMPLEMENTATION and DELIVERY per REV-002 | High |
| 5 | **Define Daneel's verification points.** At which phases does Daneel audit? Minimum: after EVIDENCE, before DELIVERY. | High |
| 6 | **Define AWU size boundaries.** Maximum complexity for a single AWU. Minimum meaningful scope. | Medium |
| 7 | **Connect LESSONS LEARNED to Esteban's trajectory management.** | Medium |

---

## 9. Recommendation

**APPROVE FOR ADR-007 FORMALIZATION. 7 corrections required.**

The corrected lifecycle preserves the four-pillar constitutional model:
- Manu owns WHAT (INTENT through TEST STRATEGY)
- Aurora owns WHO CAN (capability data, model profiles, agent eligibility)
- Sonia owns HOW (WORK BREAKDOWN through DELIVERY, consuming Aurora's data)
- Daneel owns TRUTH (independent verification of evidence)

The DELIVERY WORKSTREAMS insertion improves the model by providing human-comprehensible grouping between task breakdown and atomic execution. It connects to the existing WSM constitutional domain.

The Aurora/Sonia boundary is the most important clarification: Aurora qualifies. Sonia decides. Aurora says "Model X can handle 5 AWUs." Sonia says "I'll give it 3." This preserves separation of duties while enabling data-informed delivery decisions.

**Disposition:** AUDIT — ready for ADR-007. 7 corrections required. Capsule v0.2 recommended.
