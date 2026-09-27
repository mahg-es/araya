# K08 — Templates: ADR and Implementation Plan

**ARAYA AX3 Candidate Governance Version:** 0.6.0
**Baseline Canonical Governance:** 0.5.0
**Status:** ADOPTED / ACTIVE CANONICAL
Templates are forms, not authority. Populate them from Repository Truth and approved authority. Never invent missing facts to fill a field.

# Template — ADR

```text
# ADR-<repository-defined-id-or-placeholder> — <Decision Title>

Status: Proposed

## Authority / Requirement Source
- Requirement:
- Repository Requirement ID: <ID or NOT PRESENT>
- Human authorization:
- Related governance:

## Repository Truth Baseline
- Repository:
- Branch:
- Commit SHA:
- Relevant paths:
- Existing ADRs:

## Intended Audience / Decision Authority
- Intended Audience:
- Decision Authority:

## Business / Product Impact
- User-visible behavior:
- Operator-visible behavior:
- Business invariant:
- Money/loss-control impact:
- Product Evidence required:

## Context
<problem to resolve>

## Locked Decisions
- ...

## Out of Scope
- ...

## Decision Classification
LOCK / DECIDE-BY-BEST-PRACTICE / ESCALATE-AUTHORITY / BLOCK-EVIDENCE-GAP

## Decision
<exact architectural decision>

## Alternatives Considered
- Option A:
- Option B:
- Option C:

## Consequences
### Positive
### Cost / Negative

## Security / Compliance

## Persistence / Data Ownership

## Compatibility / Migration

## Rollback / Recovery

## Implementation Boundary
This ADR does not authorize implementation unless separately authorized.

## Acceptance Criteria
1.
2.

## Evidence
- ...

## Related Artifacts
- Plan:
- Requirements:
- PR:

Disposition: AUDIT
```

Use `N/A` only when genuinely not applicable. Do not create an ADR for trivial implementation detail.

# Template — Implementation Plan

```text
# Implementation Plan — <Outcome>

Status: Draft

## Authority
- Human planning authorization:
- Requirement source:
- Repository Requirement ID: <ID or NOT PRESENT>
- Accepted ADRs:

## Repository Truth Baseline
- Repository:
- Canonical branch:
- Canonical SHA:
- Relevant paths:
- Working-tree assumptions:

## Scope
### Must Have
### Should Have
### Could Have
### Future

## Explicit Out of Scope
- ...

## Locked Decisions
- ...

## Product Delivery State
- Artifact/reference:
- Product vision/workflow references:
- Implemented capabilities:
- Missing Must Have capabilities:
- Repository capabilities to reuse:
- Known failure guards:
- Next human-observable increment:

## Product Increment Strategy

### First Human-Observable Evidence
- Intended audience:
- Observable outcome:
- Why earliest safe/viable:
- Proven dependencies:
- Product acceptance:
- Engineering verification:

### Product Increment 1
- Product/business outcome:
- Target user/operator:
- Observable behavior:
- Contributing slices:
- Dependencies:
- Product acceptance criteria:
- Product Evidence:
- Engineering Evidence:
- Rollback/containment:

## Automated UAT
- Applicability:
- Robot Framework flow(s):
- Acceptance criteria covered:
- Browser automation: Browser Library/Playwright / N/A / repository alternative
- Deterministic dataset/fixture:
- STRICT assertions:
- SEMANTIC assertions:
- Allowed VOLATILE values:
- Backend evidence:
- Evidence artifacts:
- Product Review required:

## Horizontal Slice Justification
For each technical-only slice:
- Slice:
- Proven dependency:
- Product Increment enabled:
- Why precedence is required:
- Bounded acceptance:

## Dependency DAG

### Lane / Slice A
- Inputs:
- Outputs:
- Mutable roots:
- Dependencies:

### Lane / Slice B
- Inputs:
- Outputs:
- Mutable roots:
- Dependencies:

## Execution Capabilities / Orchestration
- Applicable:
- Capability evidence:
- Capabilities to reuse:
- Parallel lanes:
- Independent read-only lanes:
- Mutable lanes:
- Isolation required:
- One-writer boundary:
- Expected benefit of parallelism:
- Revalidation triggers:

Omit or mark not applicable when external execution capabilities or material parallel orchestration do not affect the plan.

## Execution Granularity
- Implementation Slices:
- Execution Group(s):
- Independent execution required:
- Separation reason if applicable:
  authority / dependency / containment / rollback /
  Product Evidence / concurrency / security / auditability
- Repo-native operational capability reused:
- Avoidable human operations:

## Implementation Slices

### Slice 1
- Objective:
- Paths/resources:
- Migration:
- Acceptance:
- Rollback:
- Evidence:

## Persistence Impact
- SQLite / PostgreSQL / MongoDB Community / existing / none:
- Reason:
- Data ownership:
- Schema/collection/file boundary:
- Integrity/transaction boundary:
- Migration:
- Compatibility:
- Rollback/recovery:
- Backup/restore:
- Secrets/configuration:
- Monitoring/version management when applicable:
- Acceptance:
- Production acceptance boundary:

## Runtime Reuse
- Existing runtime/tool fingerprint:
- Reuse decision:
- Rebuild trigger if any:

## Test Strategy
- unit:
- integration:
- migration:
- regression:
- security:
- Automated UAT:
- Product Evidence:
- Docker/Compose:
- repository gates:

## User Operations Required
- Authority decisions:
- Product reviews:
- Environment/manual operations:
- Repeated/recovery operations:
- Why each human operation is required:
- Why automation or grouping is not sufficient for each requested human operation:

## Visible-Value Stop-Loss
- Meaningful work-cycle boundary:
- Expected Product Evidence:
- Proven dependency if no Product Evidence:
- Strategy-change trigger:

## Recovery Mode
- Explicit deadline/budget:
- Trigger:
- Scope freeze:
- Prohibited optional work:
- Exit condition:

## Release Transaction
- Applicable:
- Exact candidate identity:
- Current production identity mechanism:
- Previous production candidate:
- Release mechanism:
- Health verification:
- Smoke verification:
- Rollback mechanism:
- Evidence:

Omit or mark not applicable when release/production is outside the plan.

## Publication Strategy
- local commit:
- push:
- PR:
- Ready:
- merge:
- release:
- production:

Each boundary requires explicit authority unless Repository Truth proves otherwise.

## Risks
- ...

## Acceptance Criteria
1.
2.

## Next Boundary
Plan approval does not authorize implementation.

Disposition: AUDIT
```
