# Aurora Approval Authority — Focused Audit

**Auditor:** R. Daneel Olivaw
**Artifact ID:** audit-aurora-approvals-001
**Date:** 2026-05-31 21:15 +0200
**Scope:** Aurora's approval authorities as Capability Officer

---

## Part 1: Current State

```yaml
aurora:
  permissions:
    can_approve_review: true
```

This is a legacy permission from Aurora's CHRO role. As Capability Officer, her domain shifted from workforce administration to organizational readiness. The question: does organizational readiness include delivery review approval?

---

## Part 2: Approval-by-Approval Analysis

### 1. Capability Approval

**Question:** Should Aurora approve capability assessments and gap analyses?

| Factor | Assessment |
|--------|------------|
| Domain alignment | ✅ Core — she owns the capability registry (HR-006) |
| Conflict with Manu | ❌ None — Manu doesn't assess capabilities |
| Conflict with Sonia | ❌ None — capability assessment is pre-delivery, not delivery |
| Risk if Aurora doesn't approve | Capability assessments have no gatekeeper. Gaps reported without validation. |

**Recommendation: APPROVE.** Aurora should own capability assessment approval. This is her core domain.

---

### 2. Skill Approval

**Question:** Should Aurora approve skill additions, modifications, and retirements?

| Factor | Assessment |
|--------|------------|
| Domain alignment | ✅ Core — she owns the skills lifecycle (AUTH-004) |
| Constitutional basis | HR-009: Aurora proposes, Professor approves |
| Conflict with Manu | ❌ None |
| Conflict with Sonia | ❌ None |

**Recommendation: PROPOSE, NOT APPROVE.** Aurora proposes skill changes. The Data Professor approves (HR-009). This is already correctly modeled.

---

### 3. Agent Activation Approval

**Question:** Should Aurora approve Neo/Trinity activation?

| Factor | Assessment |
|--------|------------|
| Domain alignment | ✅ Core — she controls the capability registry |
| Pipeline model | TMP-008: Aurora is step 1 (assesses gap, proposes activation) |
| Conflict with Sonia | 🟡 If Aurora could unilaterally activate, she'd bypass Sonia's capacity check |
| Conflict with Manu | 🟡 If Aurora could unilaterally activate, she'd bypass Manu's product alignment |

**Recommendation: PIPELINE STEP, NOT UNILATERAL.** Aurora proposes activation (step 1). Sonia and Manu confirm (steps 2, 3). No single approver. Pipeline model preserved.

---

### 4. Workstream Approval

**Question:** Should Aurora approve workstream health reviews and charters?

| Factor | Assessment |
|--------|------------|
| Domain alignment | 🟡 Partial — she conducts capability reviews (HR-007), but workstream governance is Sonia's domain (WSM-004, WSM-007) |
| Conflict with Sonia | ✅ YES — workstream governance belongs to Delivery Authority |
| Risk if Aurora approves | Dual authority over workstreams. Confusion about who workstream leads report to. |

**Recommendation: REJECT.** Sonia owns workstream governance. Aurora assesses workstream capability health and reports to Sonia. Aurora does not approve workstream outputs.

---

### 5. Delivery Approval

**Question:** Should Aurora approve delivery completions?

| Factor | Assessment |
|--------|------------|
| Domain alignment | ❌ None — delivery quality is QA (Priya) and PO (Manu) |
| Constitutional basis | GOV-005: delivery completion requires ACs met + reviews signed + tests green. No mention of capability. |
| Conflict with Priya | ✅ YES — Priya is the QA gatekeeper (HR-005: separation of duties) |
| Conflict with Manu | ✅ YES — Manu owns product acceptance |
| Risk if Aurora approves | Three people approving deliveries. Blurred accountability. |

**Recommendation: REJECT.** Aurora has no role in delivery approval. Priya approves quality. Manu approves product. That's two approvers already — a third adds confusion, not confidence.

---

### 6. UAT Approval

**Question:** Should Aurora approve UAT packages?

| Factor | Assessment |
|--------|------------|
| Domain alignment | ❌ None — UAT validates against acceptance criteria (Manu's domain) and quality standards (Priya's domain) |
| Constitutional basis | GOV-006: UAT entry requires implementation complete + reviews complete + tests green |
| Conflict with Manu | ✅ YES — Manu owns UAT acceptance |
| Conflict with Priya | ✅ YES — Priya owns UAT governance |

**Recommendation: REJECT.** Aurora's role ends when the right people with the right skills are assigned. What they produce is validated by QA and accepted by Product.

---

### 7. Release Approval

**Question:** Should Aurora approve releases?

| Factor | Assessment |
|--------|------------|
| Domain alignment | ❌ None — release is Product (scope) + Delivery (governance) + Quality (validation) |
| Conflict with all | ✅ YES — tri-authority over releases creates confusion |

**Recommendation: REJECT.** Releases are approved by Manu (scope) and Sonia (governance), with Priya (quality gate). Aurora ensures the team was capable of building it — not whether the release should ship.

---

## Part 3: Summary Matrix

| Approval Type | Aurora's Role | Who Approves |
|---------------|:------------:|--------------|
| Capability assessment | ✅ **Owner** | Aurora |
| Skill changes | 🟡 Proposes | Professor approves (HR-009) |
| Agent activation | 🟡 Step 1 | Pipeline: Aurora → Sonia → Manu |
| Workstream governance | ❌ None | Sonia (Delivery Authority) |
| Delivery completion | ❌ None | Priya (QA) + Manu (PO) |
| UAT acceptance | ❌ None | Manu (PO) + Priya (QA) |
| Release | ❌ None | Manu + Sonia + Priya |

---

## Part 4: The Core Principle

Aurora's question is: **"Do we have the right people with the right skills?"**

She answers this BEFORE delivery starts — through capability assessment, gap analysis, hiring recommendations, and dynamic agent activation.

Once delivery starts, her job is done. The people are assigned. Now Sonia governs how they work. Priya validates what they produce. Manu accepts whether it meets the need.

Aurora approving delivery reviews would violate this boundary. It would insert the Capability Authority into the Delivery Authority's operational domain.

---

## Part 5: Recommendation

### Aurora's Approval Authorities

| Permission | Current | Proposed | Reason |
|-----------|:------:|:--------:|--------|
| `can_approve_review: true` | ✅ | **❌** | Capability Officer does not approve delivery reviews |
| Capability assessment approval | 🟡 Implicit | **✅ Explicit** | Core domain (AUTH-004) |
| Skill change proposal | 🟡 Implicit | **✅ Explicit** | HR-009 pipeline to Professor |
| Agent activation proposal | 🟡 Implicit | **✅ Explicit** | TMP-008 pipeline step 1 |

### What This Prevents

| Problem | Resolution |
|---------|------------|
| Aurora + Priya + Manu all approving deliveries | Only Priya + Manu. Clear accountability. |
| Aurora overruling Sonia on workstream governance | Aurora reports capability health to Sonia. Sonia governs workstreams. |
| Capability assessments with no owner | Aurora owns and approves all capability assessments. |
| Confusion about who approves what | Four pillars, four questions. No overlap. |

### Constitutional Impact

No new rules required. Existing rules already define the boundaries:

- AUTH-003: Sonia owns delivery governance → delivery approval is Sonia's domain
- AUTH-004: Aurora owns capability → capability approval is Aurora's domain
- HR-005: Separation of duties → QA approves quality; PO approves product
- GOV-005: Delivery completion criteria → capability is not a criterion

---

## Part 6: Final Recommendation

**Change `can_approve_review: true` → `false`.**

Aurora's authority is pre-delivery (who can build it), not delivery (is it built right) or post-delivery (should we ship it). Giving her delivery review approval blurs the four-pillar boundaries and creates confusion with Priya (QA), Sonia (delivery governance), and Manu (product acceptance).

Aurora approves capability. Priya approves quality. Manu approves product. Sonia approves governance. Four questions, four approvers, no overlap.

**Disposition:** AUDIT — `can_approve_review: false` recommended. Ready for your decision, Professor.
