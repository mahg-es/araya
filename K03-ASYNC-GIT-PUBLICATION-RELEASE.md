# K03 — Async HOLD, Git, Publication, Release, and Production

**ARAYA AX3 Candidate Governance Version:** 0.5.0
**Baseline Canonical Governance:** 0.4.2
**Status:** ADOPTED / ACTIVE CANONICAL
K03 owns Git safety, asynchronous checks, publication boundaries, merge, release, and production authority.

## 1. Protect canonical main

Significant governed work should not be developed directly on canonical main.

Preferred:

```text
feature/architecture/implementation branch
→ local work
→ validation
→ commit
→ audit
→ push
→ PR
→ checks
→ governed merge
```

Repository-specific governance may define a different sound flow.

## 2. Distinct authority boundaries

Treat these as separate unless explicit authority combines them:

- local commit;
- remote push;
- PR creation;
- Draft → Ready;
- merge;
- canonical-main mutation;
- tag/release;
- preview/demo publication with external effect;
- production deployment/effect;
- irreversible external effect.

Authorization does not leak between boundaries.

Force push is forbidden unless separately governed and explicitly authorized.

## 3. Product evidence environments

These states are distinct:

```text
Mockup / Prototype
Local Preview
Governed Demo
Staging / Pre-production
Production
```

One does not imply another.

Product demonstration authority does not imply push, PR, merge, release, or production authority.

Preview/Demo ≠ Production.
Technical PASS ≠ Product Acceptance.

## 4. PR identity

Before readiness/merge verify as applicable:

- repository;
- PR identity;
- base;
- head;
- exact head SHA;
- canonical base SHA;
- scope;
- required ADR/plan;
- requirement traceability;
- required checks.

## 5. Async checks

Classify asynchronous external checks exactly:

### GREEN

```text
SUCCESS
NEUTRAL
SKIPPED
```

Action: continue.

### TRANSIENT

```text
QUEUED
IN_PROGRESS
PENDING
WAITING
REQUESTED
```

Action:

```text
operational HOLD
→ wait
→ revalidate
→ poll again
```

Transient state alone is never BLOCK.

### FAILED

```text
FAILURE
CANCELLED
TIMED_OUT
ACTION_REQUIRED
STARTUP_FAILURE
```

Action: BLOCK the affected boundary immediately.

## 6. Settlement behavior

Default when Repository Truth does not define another profile:

```text
POLL_INTERVAL_SECONDS=60
MIN_TRANSIENT_REVALIDATION_ITERATIONS=3
```

Do not use one blind wait.

Each iteration revalidates at minimum:

- PR state;
- Draft/Ready;
- base/head;
- head SHA;
- canonical/origin-main SHA;
- reported checks.

When relevant also revalidate mergeability, repository cleanliness, artifact identity, scope, and governance identity.

Material Repository Truth drift may BLOCK even while an external check remains transient.

After the minimum iterations, persistent transient checks produce:

```text
Readiness: HOLD
Checks: PENDING
Merge: NOT PERFORMED
Repository Truth: PRESERVED
Disposition: AUDIT
```

HOLD is operational state, not a final disposition.

## 7. Idempotent resume

Resume from actual Repository Truth. Do not recreate or toggle valid state merely to replay workflow.

Never use:

```text
Ready → Draft → Ready
```

as a waiting mechanism.

## 8. Merge

Merge only when:

- exact approved candidate identity;
- exact canonical base;
- correct PR identity;
- required checks GREEN;
- repository/governance gates PASS;
- required acceptance evidence exists;
- merge authority exists.

No convenience bypass. No admin bypass merely for convenience.

## 9. After merge

Revalidate canonical main.

Do not rewrite canonical history because a later audit finds a problem. Use a separately governed corrective operation.

## 10. Branch cleanup

After successful governed integration, remove obsolete feature branches when safe and consistent with Repository Truth/repository policy.

## 11. Release and production

Merge ≠ Release authorization.
Release ≠ Production authorization.
Product Acceptance ≠ Production authorization.

Production effects require explicit authority unless Repository Truth proves a broader authorization.

### Exact release identity

A release/production transaction must identify the exact candidate artifact or commit being acted upon.

Where Git SHA is the governed source identity, prefer:

```text
SOURCE_SHA=<sha>
```

Do not build or deploy from accidental mutable working-tree state.

Production should expose or persist its actual governed identity, for example:

```text
PRODUCTION_SHA=<sha>
```

Production identity is independent of the current HEAD of canonical main. Main may advance after the deployed candidate.

### Integrated release transaction

Where Repository Truth supports repository-native release automation, a single authorized operation may encapsulate deterministic release substeps.

Recommended conceptual contract:

```text
PRECHECK
→ BUILD / ARTIFACT RESOLUTION
→ REQUIRED TESTS
→ RECORD CURRENT PRODUCTION
→ DEPLOY
→ HEALTH
→ VERIFY DEPLOYED IDENTITY
→ REQUIRED SMOKE / PRODUCT CHECKS
→ EVIDENCE
→ RESULT
```

This operational grouping does not collapse the conceptual distinction between merge, release, production, or irreversible external effect.

Authorization must still cover the applicable boundary.

### Release-contingency rollback

Before mutation, record a known rollback candidate when technically applicable.

A production authorization may explicitly authorize deterministic restoration to that candidate when a mandatory post-mutation gate fails.

Automatic rollback is permitted only to the extent covered by that authorization and Repository Truth.

Tooling must not infer broader production authority merely because a rollback mechanism exists.
