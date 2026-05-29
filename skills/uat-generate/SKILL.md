---
name: uat-generate
description: "Generate User Acceptance Testing (UAT) packages from requirements, acceptance criteria, SDD, BDD, and TDD — formal customer validation before delivery acceptance."
---

# UAT — User Acceptance Testing Package

Generate a complete UAT package that enables the customer or Product Owner
to formally validate a delivery against requirements and acceptance criteria.

## What problem this solves

Today delivery ends at QA validation — no structured mechanism for the
customer to formally accept. UAT transforms subjective feedback into
traceable, auditable, requirement-driven acceptance.

## When to Use

- After QA validation and before delivery acceptance
- When Manu or the customer needs to validate a delivery
- Before any delivery is marked complete

## Input

Delivery ID, approved requirements, acceptance criteria, BDD scenarios,
TDD definitions, and delivery metadata.

## Steps

1. Generate UAT header: UAT ID, delivery ID, project, version, customer, PO, date
2. Build delivery summary: features delivered, scope included/excluded, known limitations
3. Create requirements traceability matrix: requirement → AC → UAT test case
4. Generate UAT test cases: one per acceptance criterion, with preconditions, steps, expected results
5. Build coverage matrix: % requirements tested, % ACs tested, pass rate
6. Create findings register template (to be filled by customer)
7. Add acceptance decision section with sign-off fields
8. Save to `.araya/reviews/uat/uat-{delivery-id}.md`

## UAT Package Format

```markdown
# UAT Package — {delivery-id}

## Delivery Summary
- Features delivered: ...
- Scope: ...
- Known limitations: ...

## Requirements Traceability
| Req ID | Description | AC ID | UAT Test |
|--------|-------------|-------|----------|
| REQ-001 | ... | AC-001 | UAT-TC-001 |

## UAT Test Cases
| Test ID | Req ID | AC ID | Scenario | Steps | Expected | Actual | Status |
|---------|--------|-------|----------|-------|----------|--------|--------|
| UAT-TC-001 | REQ-001 | AC-001 | ... | ... | ... | | PENDING |

## Coverage Matrix
- Requirements tested: X/Y (Z%)
- Acceptance criteria tested: X/Y (Z%)

## Findings Register
| ID | Severity | Category | Description | Recommendation |
|----|----------|----------|-------------|---------------|

## Acceptance Decision
- [ ] ACCEPTED
- [ ] ACCEPTED WITH CONDITIONS
- [ ] REJECTED

Customer comments: ...
Sign-off: Name / Role / Date
```

## Done Criteria

- [ ] Every acceptance criterion has at least one UAT test case
- [ ] Traceability matrix complete (req → AC → UAT)
- [ ] Coverage matrix calculated
- [ ] Findings register template included
- [ ] Acceptance decision fields present
- [ ] Saved to `.araya/reviews/uat/`
