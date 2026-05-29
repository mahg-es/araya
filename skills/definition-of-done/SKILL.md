---
name: definition-of-done
description: "Generate Definition of Done (DoD) checklists for every task, phase, and delivery — mandatory verification before marking anything complete."
---

# Definition of Done

Generate and enforce Definition of Done checklists. No task, phase, milestone,
or delivery is complete until ALL DoD criteria are explicitly verified.

## What problem this solves

"Done" means different things to different agents. Without explicit DoD criteria,
work is declared complete based on assumption rather than verification. This
skill produces mandatory DoD checklists that every agent must verify before
claiming completion.

## When to use

Before any task, phase, or delivery begins. The DoD must be defined FIRST,
then verified at completion.

## DoD Levels

| Level | When | Who Defines | Who Verifies |
|-------|------|------------|--------------|
| **Task DoD** | Per individual task | Assigned agent | PM (Sonia) |
| **Phase DoD** | Per SDLC phase (SDD, BDD, TDD, implementation, review, security, validation) | Phase owner agent | PM Auditor (Elena) |
| **Delivery DoD** | Per complete run/feature | Sonia + Manu | Manu (PO) |

## Task DoD Template

```markdown
# Definition of Done — {Task Name}
**Task ID:** {TASK-ID}
**Agent:** {agent name}
**Defined:** {date}

## DoD Criteria (ALL must be verified)

- [ ] Code written and reviewed
- [ ] Unit tests pass (coverage ≥ 80%)
- [ ] Integration tests pass (where applicable)
- [ ] Code review completed by {reviewer}
- [ ] No P0/P1 bugs open
- [ ] Documentation updated (API docs, README, ADR if needed)
- [ ] Feature flag configured (if applicable)
- [ ] Security review passed (if applicable — Diana)
- [ ] Acceptance criteria met (if applicable — Manu verified)

## Verification

**Agent:** ✅ Task complete. All DoD criteria verified.
**PM:** ✅ Confirmed. {date}
```

## Phase DoD Template

```markdown
# Definition of Done — Phase: {phase name}
**Run ID:** {run-id}
**Phase:** {sdd|bdd|tdd|implementation|review|security|validation|documentation}
**Defined:** {date}

## Phase-Specific DoD Criteria

### SDD Phase
- [ ] Vision documented and approved by Manu
- [ ] Requirements formalized (clear, unambiguous, testable)
- [ ] Acceptance criteria defined per requirement
- [ ] Architecture boundaries documented
- [ ] Dependencies mapped
- [ ] Scope boundaries explicit (included + excluded)

### BDD Phase
- [ ] Gherkin scenarios cover all requirements
- [ ] Scenarios cover happy path, edge cases, error conditions
- [ ] Acceptance criteria traceable to scenarios
- [ ] Scenarios reviewed by QA (Teresa/Priya)

### TDD Phase
- [ ] Test cases generated for all scenarios
- [ ] Test framework configured
- [ ] Test execution plan defined
- [ ] Regression test suite identified
- [ ] DoD criteria defined for implementation phase

### Implementation Phase
- [ ] All code committed and pushed
- [ ] Unit tests pass (coverage ≥ 80%)
- [ ] Integration tests pass
- [ ] Code review completed
- [ ] No P0/P1 bugs open
- [ ] Feature flag configured
- [ ] Documentation updated

### Review Phase
- [ ] Architecture reviewed (Aisha/Lin/Junia)
- [ ] Code quality reviewed
- [ ] Performance reviewed
- [ ] Findings documented and resolved

### Security Phase
- [ ] Threat model reviewed (Diana)
- [ ] SAST scan clean (0 critical/high)
- [ ] Dependency audit clean
- [ ] Secrets scan clean
- [ ] Security review signed off

### Validation Phase
- [ ] E2E tests pass
- [ ] Performance tests pass
- [ ] Acceptance criteria verified
- [ ] Manu (PO) validated
- [ ] DoD verification complete

### Documentation Phase
- [ ] API docs updated
- [ ] README updated (if applicable)
- [ ] ADRs written (if applicable)
- [ ] Release notes prepared

## Common DoD (ALL phases)
- [ ] Artifacts saved to .araya/plan/{spec,bdd,tdd}/
- [ ] All agent outputs structured (status, confidence, risks, blockers)
- [ ] Evidence artifacts captured
- [ ] Handoff complete to next phase

## Verification

**Phase Owner:** ✅ Phase complete. All DoD criteria verified. {date}
**PM Auditor (Elena):** ✅ DoD verified. {date}
```

## Delivery DoD Template

```markdown
# Definition of Done — Delivery: {feature name}
**Run ID:** {run-id}
**Delivery Mode:** {full|standard|quick|review|repair}
**Defined:** {date}

## Delivery DoD (ALL must be verified)

- [ ] All phase DoDs verified
- [ ] All acceptance criteria met
- [ ] Manu (PO) validated delivery
- [ ] Traceability matrix complete (request → requirements → AC → delivery)
- [ ] Cross-audit complete (Elena, Diana, Aisha)
- [ ] Delivery vs. Request comparison documented
- [ ] Technical debt documented
- [ ] Deferred decisions documented
- [ ] Release notes prepared
- [ ] Merge to main approved

## Verification

**Sonia (PM):** ✅ Delivery complete. All DoD criteria verified. {date}
**Manu (PO):** ✅ Delivery accepted. {date}
```

## Steps

1. When a task/phase/delivery is assigned, generate the DoD checklist FIRST
2. Share with the assigned agent before work begins
3. Agent works through the DoD as they complete work
4. At completion, agent verifies each DoD item
5. Phase owner or PM auditor cross-checks
6. DoD verification is recorded in the run artifacts

## Rules

- **DoD is defined BEFORE work starts** — not retroactively
- **Every DoD item must be binary** — done or not done, no "partially"
- **DoD is verified by a DIFFERENT agent than the one who did the work**
- **Any unchecked DoD item = NOT DONE** — no exceptions
- **Delivery DoD requires Manu's sign-off** — the PO validates
- **DoD artifacts saved to** `.araya/runs/{run_id}/dod-{phase}.md`
