---
name: reality-verification
description: "ARAYA Reality Verification Layer — 5-tier delivery state model, independent verification, governance enforcement, reality scoring."
---

# Reality Verification

ARAYA must prove what it claims. No gap between reported reality
and repository reality.

## 5-Tier Delivery State Model

| State | Definition | Evidence Required |
|-------|-----------|-------------------|
| **Configured** | Artifacts exist | File presence |
| **Implemented** | Code exists | Source files |
| **Running** | Executable and validated | Test results |
| **Operational** | User workflow succeeds | End-to-end evidence |
| **Independently Verified** | External evidence confirms | Third-party validation |

CON-001: Configured is not Operational.
REAL-002: Operational is not Independently Verified.

## Commands

- `/araya reality-check` — compare claims vs. repository evidence
- `/araya governance-check` — validate branch strategy, run records, traceability
- `/araya deployment-check` — validate Docker, Traefik, secrets, health checks, readiness

## Reality Confidence Score

```
Configured         100%  (files exist)
Implemented        100%  (code exists)
Running             70%  (tests pass, not deployed)
Operational          50%  (no production verification)
Independent Verify   20%  (no external audit)

Reality Confidence: 68%
```

## Rules

- Claim only what evidence supports (REAL-001)
- Configured ≠ Operational (REAL-002)
- Operational ≠ Independently Verified (REAL-003)
- Work without run records = violation (REAL-004)
- Governance rules must be measurable (REAL-005)
