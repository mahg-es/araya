# K09 — Templates: Repository Audit, Product Delivery, UAT, and Traceability

**ARAYA AX3 Candidate Governance Version:** 0.5.0
**Baseline Canonical Governance:** 0.4.2
**Status:** ADOPTED / ACTIVE CANONICAL
Templates structure evidence. Filled fields are not proof unless referenced evidence exists.

# Template — Repository Audit

```text
# Repository Audit — <Purpose>

## Audit Contract
- Repository:
- Expected branch:
- Expected local SHA:
- Expected remote/canonical SHA:
- Expected scope:
- Required ADR:
- Required plan:
- Requirement source:

## Repository Truth
- Actual branch:
- Actual local SHA:
- Actual remote SHA:
- Working tree:
- Worktrees:
- Relevant files:

## Governance Gates
- Authority:
- ADR:
- Plan:
- Scope:
- Traceability:
- Version:

## Product Delivery Gates
- Intended Audience:
- Decision Authority:
- Must Have scope preserved:
- Product Delivery State current:
- Repository capability map current:
- First Product Evidence identified:
- Vertical strategy:
- Horizontal work justified:
- Visible-value stop-loss status:
- Recovery Mode status:
- Execution granularity: JUSTIFIED / OVER-ATOMIZED / N/A
- Execution Groups traceable: PASS / FAIL / N/A
- Avoidable human operations: NONE / PRESENT

## Automated UAT Gates
- Applicable:
- Framework/tooling:
- Flow identity:
- Candidate SHA/artifact:
- Environment:
- Dataset/fixture:
- Acceptance criteria covered:
- Result:
  AUTOMATED_UAT_PASS /
  AUTOMATED_UAT_FAIL /
  AUTOMATED_UAT_NOT_RUN /
  AUTOMATED_UAT_NOT_APPLICABLE
- UAT Evidence:

## Product Acceptance
- Product Evidence Status:
  PRODUCT_EVIDENCE_PRESENT /
  PRODUCT_EVIDENCE_MISSING /
  PRODUCT_EVIDENCE_NOT_APPLICABLE
- Product Authority:
- Product Review Status:
  PENDING /
  ACCEPTED /
  REJECTED /
  NOT_APPLICABLE

## User-Time / Failure Guards
- User Operations Required:
- Avoidable manual operations:
- Known failure guards respected:
- Repeated failure mode detected:
- Diagnosis performed before repeat corrective mutation: PASS / FAIL / N/A

## Execution Capability / Orchestration Gates
- Applicable:
- Capability evidence sufficient:
- Baseline identities:
- Parallel lanes independent:
- Mutable workers isolated:
- Shared mutable state:
- Agent/tool outputs reconciled:
- Failed workers contained:
- Secrets exposed: NO / FAIL

## Technical Gates
- unit/integration:
- static checks:
- migrations:
- security:
- Docker/runtime cleanup:
- repository gates:
- Release identity when applicable:
  - SOURCE_SHA:
  - PREVIOUS_PRODUCTION:
  - PRODUCTION_SHA:
  - ROLLBACK_READY:
  - HEALTH:
  - SMOKE:

## Async Status
- GREEN / HOLD / BLOCK
- Poll evidence:

## Findings

## Risks

## Result
PASS / FAIL / HOLD

Disposition: AUDIT
```

# Template — Requirement Traceability Record

```text
# Requirement Traceability Record — <Outcome>

## Requirement Source
- Type:
- Exact source:
- Repository Requirement ID: <ID or NOT PRESENT>

## Scope
- Initiative:
- ADR:
- Plan:
- Product Increment:
- Slice:

## Product Acceptance
- Acceptance criteria:
- Product Evidence:
- Product Evidence Status:
  PRODUCT_EVIDENCE_PRESENT /
  PRODUCT_EVIDENCE_MISSING /
  PRODUCT_EVIDENCE_NOT_APPLICABLE
- Product Review Status:
  PENDING / ACCEPTED / REJECTED / NOT_APPLICABLE

## Automated UAT
- Applicable:
- Flow:
- Acceptance criteria mapped:
- Candidate identity:
- Environment:
- Dataset/fixture:
- Result:
- Evidence:

## Engineering Acceptance
- Engineering Evidence:

## Implementation Evidence
- Branch:
- SHA:
- Paths/resources:
- Artifact:

## Verification Evidence
- Tests:
- Audit:
- PR/checks:
- Publication candidate:

## Classification
- TRACEABLE
- REQUIREMENT_TRACEABILITY_GAP
- REQUIREMENT_TRACEABILITY_BREACH

## Recovery State if needed
DETECTED / CLASSIFIED / CONTAINED / RECONCILED / VERIFIED / CLOSED

## Blast Radius
- requirement:
- slice:
- branch:
- PR:
- publication:
- dependent descendants:

## Result

Disposition: AUDIT
```

# Template — Failure Guard

```text
# Failure Guard — <Failure Signature>

- Observed evidence:
- Root cause:
- Affected method/tool:
- Mitigation:
- Re-entry condition:
- Verification evidence:
- Status: ACTIVE / CLEARED

Disposition: AUDIT
```
