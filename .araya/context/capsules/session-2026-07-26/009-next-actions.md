# 009 — Next Actions (Prioritized Roadmap)
> Capsule ID: 009 | Initiative: next-actions | Status: LIVE
> Session: 2026-07-26 | Framework HEAD: 0902ac6 | Token budget: ~3000

---

## Priority 1 — CRITICAL (Blocks Relay + REQ-042)

### Action 1: Manu SPEC_APPROVED for REQ-043 Architecture
**Owner:** 👑 Manu | **Blocks:** REQ-043 Step 3 formal closure, REQ-042 Motor

Manu must review and approve:
- Aisha's 4-layer source hierarchy spec (`.araya/plan/spec/req-043-aisha-architecture.md`)
- Aurora Matrix findings F-001→F-008 (`.araya/plan/spec/req-043-aurora-matrix.md`)
- Contract v1.0.0 (`.araya/governance/standards/ARAYA-agent-and-skill-contract-v1.md`)

**Decision points for Professor:**
- [1] Approve all as-is
- [2] Approve with modifications (specify)
- [3] Request revisions

---

### Action 2: Resolve F-001 (Teresa/Clara Identity Crisis)
**Owner:** 👑 Manu + 👩‍💼 Sonia | **Blocks:** Relay TESTING state, REQ-042 Motor

6-item fix list (see Capsule 007 §F-001). Key decisions:
- Who executes TESTING in Relay: Clara (per skills) or keep TERESA role label mapped to Clara?
- Teresa's CCO prompt: rewritten to reflect board-level advisory role
- Sonia's roster: updated to deploy Clara for tdd/tests

---

### Action 3: Resolve F-003 (Giskard Operational References)
**Owner:** 👑 Manu + 👩‍💼 Sonia | **Blocks:** Relay T-030, REQ-042 Motor

Remove all "reports to Giskard" from Rolando/Daneel in araya.yaml + prompts.
Define new chain of command:
- [A] Rolando/Daneel → Sonia (operational)
- [B] Rolando/Daneel → Professor (governance)
- [C] Rolando → Professor (governance), Daneel → Sonia (operational)

---

## Priority 2 — HIGH (Unblocks Portfolio Governance)

### Action 4: Resolve PE-0007 BLOCKs
**Owner:** 🔨 Daneel | **Blocks:** Portfolio governance

| BLOCK | Action |
|-------|--------|
| B1: /tmp worktrees | `git worktree remove` all 3; `git worktree prune` |
| B2: Hook inactive | Install pre-commit and commit-msg hooks from `branch-governance.md` §6 |
| B3: Empty AX3.md | Fill or remove 26 zero-content AX3.md files |
| B4: Portfolio governance | Track canon-rule-001 spec in portfolio |

---

### Action 5: Resolve F-008 (Teresa Prompt Stale)
**Owner:** 👩‍💼 Sonia | **Blocks:** Teresa correct operation

Rewrite `prompts/agents/teresa.md`:
- Role: Chief Culinary Officer (CCO)
- Skills: uat-review, token-efficiency
- Board-level advisory. Professor's mother-in-law.
- History: formerly QA Engineer, promoted to CCO
- Clara now executes all QA/testing work

---

### Action 6: Resolve F-004 (Relay CLARA Enum)
**Owner:** 👩‍💼 Sonia | **Blocks:** Relay event validation for TESTING

Add CLARA to `event-schema.json` actor_role enum, or map TERESA as functional role label.

---

## Priority 3 — MEDIUM (Decisions Needed)

### Action 7: Decide F-002 (Aurora Missing Skills)
**Owner:** 👑 Professor | **Blocks:** Aurora full capability

Options:
- [A] Create 4 SKILL.md files (skills-lifecycle, spof-detection, hiring-recommendations, organizational-health)
- [B] Remove 4 skills from `araya.yaml` (aspirational, not yet needed)
- [C] Defer as technical debt — Aurora operates with 8/12 installed skills

---

### Action 8: Decide F-006 (Daneel can_write_code)
**Owner:** 👑 Professor | **Risk:** Governance gap

Daneel's `can_write_code: true` contradicts routing-only charter. Relay invariants block functional ownership but don't prevent code writing outside Relay.
- [A] Set `can_write_code: false` to enforce routing-only at permission level
- [B] Keep `true` with charter enforcement via review process

---

## Sequencing (Optimal Order)

```
Week 1:
  Action 1 → Manu SPEC_APPROVED (unlocks everything)
  Action 7 → Professor decision on F-002

Week 2:
  Action 2 → F-001 resolution (Relay TESTING)
  Action 3 → F-003 resolution (Giskard refs)
  Action 5 → F-008 (Teresa prompt)

Week 3:
  Action 4 → PE-0007 BLOCK resolution
  Action 6 → F-004 (Relay CLARA enum)

Week 4:
  Action 8 → F-006 decision
  REQ-042 → Motor implementation begins (if all blockers cleared)
```

---

## Dependency Chain

```
Manu SPEC_APPROVED
    ├──→ F-001 + F-003 + F-008 resolution
    │       ├──→ Relay TESTING operational
    │       └──→ Relay T-030 clear
    │
    ├──→ PE-0007 BLOCK resolution
    │       └──→ Portfolio self-governing
    │
    └──→ F-002 decision
            └──→ Aurora full capability

ALL ABOVE → REQ-042 Motor MVP implementation
```

---

> **Capsule generated:** 2026-07-26 | Sonia (PM Head Orchestrator)
> **Sources:** All findings, PE statuses, initiative dashboard, dependency analysis
