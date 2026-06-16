---
change_id: CHG-2026-VAL
title: "araya validate — compliant environment success"
status: draft
owner: manu
created_at: 2026-06-15
updated_at: 2026-06-15
---

# Acceptance Criteria: araya validate — compliant environment success

## Acceptance Criteria

| AC ID | Requirement ID | Description | Validation Method | Expected Result | Status |
|-------|---------------|-------------|------------------|----------------|--------|
| AC-001 | REQ-001 | GIVEN a compliant ARAYA environment (`araya.yaml` at root AND all four required state directories present: `.araya/specs`, `.araya/changes`, `.araya/archive`, `.araya/templates`), WHEN `node <CLI_DIST>/cli.js validate --adapter mock` runs with cwd at the environment root, THEN the command reports validation success and exits with code 0. | Automated Test | Process exits with rc `0` AND stdout contains the substring `Validation successful`. | Pending |

## Validation Methods

- **Manual Review**: Human inspection required
- **Automated Test**: Test suite verifies
- **Code Inspection**: Source code review
- **Document Review**: Documentation verification
- **Security Review**: Security audit required

## Evidence Required

- [ ] Test results
- [ ] Logs or output traces
- [ ] Manu (PO) sign-off

## Validation Result

| AC ID | Result | Evidence Reference | Notes |
|-------|--------|-------------------|-------|
| AC-001 | Pending | tests/robot/validate-command.robot | Robot Framework certification suite asserts rc=0 and stdout contains `Validation successful` against a compliant environment. |

**Status values:** Pending | Passed | Failed | Blocked

## Evidence References

```yaml
evidence:
  - tests/robot/validate-command.robot
```

## Validation Summary

- **Total ACs:** 1
- **Passed:** 0
- **Failed:** 0
- **Pending:** 1
- **Coverage:** 0%

## Delivery Status

- [ ] READY — All ACs passed, evidence complete
- [ ] NOT READY — Pending or failed criteria exist
- [ ] CONDITIONAL — Deviations documented and approved by Manu
