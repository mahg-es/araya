# Neo & Trinity — Activation Governance Model Review

**Reviewer:** R. Daneel Olivaw
**Artifact ID:** review-activation-governance-001
**Date:** 2026-05-31 20:30 +0200
**Scope:** Activation approval model for Dynamic Capability Agents

---

## Part 1: Proposed Model Analysis

### The 2-of-3 Model

| Voter | Role | Question they answer |
|-------|------|---------------------|
| Aurora | Capability Officer | "Is this a genuine capability gap?" |
| Sonia | Program Director | "Do we have delivery capacity and a mission?" |
| Manu | Product Owner | "Does this align with product priorities?" |

**Rule:** 2 of 3 approvals. Board (Honorary) advises, doesn't vote.

### Voting Outcomes

| Aurora | Sonia | Manu | Result | Problem? |
|:------:|:-----:|:----:|:------:|----------|
| ✅ | ✅ | ✅ | Approved | ✅ Ideal |
| ✅ | ✅ | ❌ | Approved | 🟡 Manu dissents: activating agent for non-priority work |
| ✅ | ❌ | ✅ | Approved | 🔴 Sonia dissents: agent activated but no mission sponsor |
| ❌ | ✅ | ✅ | Approved | 🟡 Aurora dissents: capability gap disputed; should this be a hire? |
| ✅ | ❌ | ❌ | Rejected | ✅ Correct — no capacity and no priority |
| ❌ | ✅ | ❌ | Rejected | ✅ Correct |
| ❌ | ❌ | ✅ | Rejected | ✅ Correct |
| ❌ | ❌ | ❌ | Rejected | ✅ Correct |

### Critical Failure Mode

**Aurora ✅ + Manu ✅ + Sonia ❌ = APPROVED.**

This is the most dangerous outcome. Sonia votes no on delivery capacity, but the agent is activated anyway. Who sponsors the mission? Who assigns the work? The agent is active with no purpose.

---

## Part 2: Governance Soundness Assessment

### What the 2-of-3 model protects against

| Protection | Effective? |
|------------|:----------:|
| Reckless activation by single voter | ✅ Two votes required |
| Complete deadlock | ✅ No single voter can block alone |
| Speed of activation | ✅ Fast — only two approvals needed |

### What the 2-of-3 model fails to protect against

| Failure | Why |
|---------|-----|
| Activation without mission sponsor | Sonia can be overruled — agent activates with no one to assign work |
| Activation without product alignment | Manu can be overruled — agent works on non-priority tasks |
| Capability gap denial | Aurora can be overruled — agent activates despite Aurora saying "this should be a hire" |

### Separation of Duties

| Duty | Owner | Can be overruled? |
|------|-------|:--:|
| Capability assessment | Aurora | Yes (by Sonia + Manu) |
| Mission assignment | Sonia | **Yes (by Aurora + Manu)** ⚠️ |
| Product alignment | Manu | Yes (by Aurora + Sonia) |

**Finding:** The 2-of-3 model allows any single voter to be overruled. This includes Sonia — whose mission assignment is operationally required for the agent to function. An agent activated without Sonia's approval has no work and no sponsor.

---

## Part 3: Alternative Voting Models

### Model A: Unanimous (3 of 3)

| Pro | Con |
|-----|-----|
| All questions answered affirmatively | Any voter can deadlock |
| No activation without mission | Slowest — requires all three available |
| Strongest governance | Could prevent urgent capability gap filling |

**Verdict:** Too slow. A single unavailable voter blocks all activations. But it's the safest.

### Model B: Simple Majority (2 of 3) — The Proposal

| Pro | Con |
|-----|-----|
| Fast | Sonia can be overruled (no mission sponsor) |
| Resilient to single-voter unavailability | Aurora can be overruled (capability gap unquestioned) |
| Balanced | Manu can be overruled (non-priority work activated) |

**Verdict:** Too permissive. Allows activation without mission sponsor.

### Model C: Pipeline Model (Sequential, not Voting)

```
Aurora PROPOSES → Sonia CONFIRMS → Manu APPROVES
```

Each step is a different question. Each step must pass. Not a vote — a pipeline.

| Step | Owner | Question | Can block? |
|------|-------|----------|:----------:|
| 1 | Aurora | "Is this a genuine capability gap that justifies activation?" | ✅ |
| 2 | Sonia | "Do we have delivery capacity? Who is the mission sponsor?" | ✅ |
| 3 | Manu | "Does this align with product priorities?" | ✅ |

**Verdict:** Strongest governance. Sequential accountability. Each voter answers their unique question. No one is overruled — each has a distinct gate.

### Model D: Weighted Approval (2 of 3 with Sonia Veto)

| Voter | Weight |
|-------|:------:|
| Aurora | 1 vote (capability assessment) |
| Sonia | 1 vote + **veto** (mission assignment cannot be overruled) |
| Manu | 1 vote (product alignment) |

**Rule:** 2 of 3 required. Sonia's no vote = veto regardless of count.

**Verdict:** Pragmatic compromise. Preserves speed but prevents activation without mission sponsor.

---

## Part 4: Constitutional Compatibility

### TMP-008 Current Text

> The Capability Officer (Aurora) SHALL control activation. The Program Director (Sonia) SHALL assign missions.

### Issue

TMP-008 gives Aurora "control activation" and Sonia "assign missions" — but the 2-of-3 voting model means Aurora can be overruled (losing control) and Sonia can be overruled (losing mission assignment authority). The voting model contradicts the constitutional rule.

### Resolution

Either:
1. Change the voting model to respect TMP-008 (Sonia's mission assignment is non-overridable)
2. Change TMP-008 to match the voting model
3. Adopt a model where each role has a distinct, non-overridable gate

---

## Part 5: Abuse & Failure Analysis

### With 2-of-3 Model

| Scenario | Outcome |
|----------|---------|
| Aurora + Manu activate without Sonia | Agent has no mission. Wasted activation. Governance violation of TMP-008. |
| Sonia + Aurora activate without Manu | Agent works on non-priority items. Product drift. |
| Sonia + Manu activate without Aurora | Capability gap not validated. Could bypass three-activation rule. Aurora's registry undermined. |

### With Pipeline Model

| Scenario | Outcome |
|----------|---------|
| Any voter disagrees | Pipeline stops at that gate. Clear accountability for the block. |
| Aurora blocks | "This is not a genuine gap." Reason documented. |
| Sonia blocks | "No capacity or mission sponsor." Reason documented. |
| Manu blocks | "Not a product priority." Reason documented. |

---

## Part 6: Recommendation

### Recommended Model: Pipeline with Sonia Veto

```
Aurora assesses → Sonia confirms → Manu approves → Agent activated
       │                  │                  │
       ▼                  ▼                  ▼
   "Genuine gap?"    "Capacity +        "Product
    If no → STOP      sponsor?"          priority?"
                      If no → STOP       If no → STOP
```

### Why Pipeline over Voting

| Concern | Pipeline | Voting |
|---------|:--------:|:------:|
| Activation without mission sponsor | ❌ Impossible | ✅ Possible |
| Activation without product alignment | ❌ Impossible | ✅ Possible |
| Activation without capability validation | ❌ Impossible | ✅ Possible |
| Speed | 🟡 Slower (3 sequential) | ✅ Faster (any 2) |
| Accountability | ✅ Clear who blocked and why | ❌ Voting blurs responsibility |
| Constitutional compatibility | ✅ Respects TMP-008 | ❌ Contradicts TMP-008 |

The speed difference is minimal — all three voters are ARAYA agents available on demand. Pipeline adds seconds to activation time while eliminating the "agent with no mission" failure mode.

### Constitutional Update Required

| Rule | Change |
|------|--------|
| TMP-008 | Replace "Aurora SHALL control activation. Sonia SHALL assign missions." with full pipeline definition |

### Revised TMP-008

> TMP-008 | OBLIGATION | Dynamic Capability Agent activation SHALL follow the pipeline: (1) Aurora assesses capability gap and proposes activation, (2) Sonia confirms delivery capacity and assigns mission sponsor, (3) Manu confirms product alignment. Each step MAY block activation. Pipeline SHALL be documented with rationale at each gate.

---

## Part 7: Final Recommendation

**REJECT the 2-of-3 voting model. ADOPT the Pipeline model.**

The voting model allows activation without mission sponsor — an agent with no work. The pipeline model gives each voter a distinct, non-overridable question. Speed difference is negligible (seconds). Accountability is clear (who blocked, why, documented).

**Disposition:** AUDIT — pipeline model recommended. 2-of-3 voting model rejected. Ready for your decision, Professor.
