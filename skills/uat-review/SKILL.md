---
name: uat-review
description: "Review and validate UAT packages — verify completeness, coverage, traceability, and acceptance readiness before customer submission."
---

# UAT Review

Validate UAT packages for completeness, coverage, and traceability before
presenting to the customer for formal acceptance.

## What problem this solves

UAT packages generated automatically may have gaps in coverage or incomplete
traceability. This skill validates the UAT artifact before customer review.

## When to Use

After UAT generation, before customer submission.

## Input

UAT ID and the full UAT package.

## Steps

1. Verify every requirement has at least one acceptance criterion
2. Verify every acceptance criterion has at least one UAT test case
3. Check traceability completeness: all links present and valid
4. Validate test steps are executable and expected results are measurable
5. Verify coverage matrix accurately reflects the test case inventory
6. Ensure findings register is properly structured
7. Confirm acceptance decision options are clear
8. Report gaps: "UAT ready" or "UAT incomplete — N gaps found"

## Review Report Format

```markdown
# UAT Review — {uat-id}
- Requirements covered: X/Y (Z%)
- AC covered: X/Y (Z%)
- Traceability gaps: N
- Recommendation: READY | NEEDS FIXES | REJECTED
- Gaps: ...
```

## Done Criteria

- [ ] All requirements have ACs
- [ ] All ACs have UAT test cases
- [ ] Traceability chain complete
- [ ] Coverage ≥ target threshold
- [ ] UAT ready for customer review
