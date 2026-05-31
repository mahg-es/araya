# ARAYA Proposal: Covey-Inspired Organizational Excellence Commands

**Timestamp:** 2026-05-31 12:00 +0200
**Author:** R. Daneel Olivaw
**Requested by:** The Data Professor
**Target Version:** v0.8.0

---

## 1. Evaluation — Do These Belong in Canon?

**Answer: Yes, unequivocally.**

ARAYA currently has 27 delivery-focused commands. Adding 7 organizational commands transforms ARAYA from a static framework into a self-improving organization. This is the "Sharpen the Saw" layer — the meta-process that makes every other process better.

| Criterion | Assessment |
|-----------|-----------|
| Belongs in canonical command set? | ✅ Yes — organizational governance is ARAYA's reason for existing |
| Standalone or aliases? | **Standalone** — each has distinct behavior, agent ownership, and artifact output |
| Aligns with Constitution? | ✅ Extends existing rules (AMB-001 → understand, REAL-001-010 → anticipate) |
| Duplicates existing commands? | ❌ No — validate/review-delivery are delivery-gate; these are organizational-meta |

---

## 2. Agent Ownership

| Command | Primary Agent | Secondary Agents | Constitutional Rule |
|---------|--------------|-----------------|---------------------|
| `/araya anticipate` | **Sonia** (PM) | Elena (Scrum Master), Aurora (CHRO) | REAL-004, TOPO-002 |
| `/araya align` | **Manu** (PO) | Sonia (PM) | GOV-001, GOV-002 |
| `/araya prioritize` | **Sonia** (PM) | Manu (PO) | FIN-001, ENG-002 |
| `/araya harmonize` | **Manu** (PO) | Sonia (PM), Diana (Security) | AMB-001 |
| `/araya understand` | **Manu** (PO) | Sonia (PM) | AMB-001, DOC-005 |
| `/araya roundtable` | **Sonia** (PM) | Domain leads | TOPO-003, HR-002 |
| `/araya sharpen` | **Esteban** (CKO) | Aurora (CHRO), Sonia (PM) | KNW-001, KNW-002 |

---

## 3. Constitutional Rules (New)

| ID | Type | Rule |
|----|------|------|
| ORG-001 | OBLIGATION | Organizational excellence commands must be executable on ARAYA itself and on every ARAYA-governed project |
| ORG-002 | OBLIGATION | Proactive risk and drift detection is mandatory before each planning cycle |
| ORG-003 | OBLIGATION | Alignment verification must precede implementation approval |
| ORG-004 | OBLIGATION | Competing objectives must be surfaced as tradeoffs with documented rationale — harmonize before executing |
| ORG-005 | OBLIGATION | Discovery must precede execution — understand before implement |
| ORG-006 | OBLIGATION | Collaborative review must be available for architecture, security, and delivery decisions |
| ORG-007 | OBLIGATION | Institutional learning is mandatory — ARAYA must continuously improve itself |

---

## 4. Artifact Structure

Each command writes to `.araya/excellence/`:

```
.araya/excellence/
├── anticipate/
│   ├── risk-register.md
│   ├── tech-debt-register.md
│   └── governance-drift.md
├── align/
│   └── alignment-report.md
├── prioritize/
│   ├── priority-matrix.md
│   └── critical-path.md
├── harmonize/
│   └── tradeoff-decisions.md
├── understand/
│   ├── assumption-register.md
│   └── clarification-questions.md
├── roundtable/
│   └── roundtable-{date}.md
└── sharpen/
    ├── skills-review.md
    ├── agents-review.md
    └── governance-review.md
```

---

## 5. Interaction with Existing Governance

| Existing System | How Excellence Commands Interact |
|----------------|----------------------------------|
| **Constitution** | ORG-001 through ORG-007 added; sharpen can propose new constitutional rules |
| **Repository Truth (REAL-001-010)** | anticipate validates repository state against claims |
| **Reconstitution** | understand feeds into reconstitution baseline |
| **Compact** | anticipate and sharpen findings included in context capsule |
| **Handoff** | roundtable outputs referenced in agent handoff |
| **AMB-001 (Ambiguity)** | understand is the proactive form of AMB-001 — find ambiguity before it blocks |
| **DOC-005 (Timestamps)** | All excellence artifacts carry timestamps |
| **ENG-004 (Engineering Excellence)** | sharpen reviews engineering standard compliance |
| **Trajectories** | sharpen produces improvement trajectories |
| **ADR system** | harmonize decisions become ADRs |

---

## 6. Continuous Improvement Loop

```text
  ┌──────────┐
  │anticipate│ ← What could go wrong?
  └────┬─────┘
       ▼
  ┌──────────┐
  │  align   │ ← Are we building the right thing?
  └────┬─────┘
       ▼
  ┌──────────┐
  │prioritize│ ← Are we working on what matters most?
  └────┬─────┘
       ▼
  ┌──────────┐
  │harmonize │ ← Are our tradeoffs explicit?
  └────┬─────┘
       ▼
  ┌──────────┐
  │understand│ ← Do we know enough to start?
  └────┬─────┘
       ▼
  ┌──────────┐
  │roundtable│ ← Did we leverage collective intelligence?
  └────┬─────┘
       ▼
  ┌──────────┐
  │ sharpen  │ ← What did we learn?
  └────┬─────┘
       │
       └──────→ back to anticipate
```

---

## 7. Periodic Execution

| Scope | Frequency | Trigger |
|-------|-----------|---------|
| Project-level | Weekly | `/araya anticipate` at sprint start |
| Governance | Monthly | `/araya sharpen --scope governance` |
| Skills & Agents | Quarterly | `/araya sharpen --scope skills` + `--scope agents` |
| Architecture | Quarterly | `/araya sharpen --scope architecture` |
| Delivery Process | Per sprint | `/araya sharpen --scope delivery` at retrospective |

---

## 8. Implementation Plan

### Phase 1 — Core Commands (v0.8.0)

1. Add ORG-001 through ORG-007 to the ARAYA Constitution
2. Add SUBCOMMAND_ROUTES entries for all 7 commands
3. Each command delegates to its primary agent via `buildAgentPrompt`
4. Update `/araya help` with new "ORGANIZATIONAL EXCELLENCE" section
5. Update README with new command reference
6. Bump version to 0.8.0, tag, release

### Phase 2 — Artifact Persistence (v0.8.1)

7. Each command writes structured output to `.araya/excellence/`
8. `/araya compact` includes latest excellence findings

### Phase 3 — Periodic Automation (v0.8.2)

9. `/araya sharpen` with `--scope` flag
10. Automated reminders via notifier extension

---

## 9. Recommendation

**Proceed with Phase 1 immediately.** The 7 commands fill a genuine gap — ARAYA can deliver, but cannot currently improve itself systematically. This is the "Sharpen the Saw" habit and it belongs at the organizational level.

The constitutional rules (ORG-001 through ORG-007) make organizational excellence mandatory, not optional. The continuous loop ensures ARAYA never stagnates.

**Estimated effort:** 2-3 hours for full Phase 1 implementation.
**Risk:** Low — these are meta-commands that delegate to existing agents; no new agent logic required.
