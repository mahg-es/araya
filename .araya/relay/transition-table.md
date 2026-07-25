# ARAYA Relay — Transition Table

Canonical home: `mahg-es/araya` (ARAYA Framework).
Status: MVP design (standard-delivery only).

## Complete Transition Table (standard-delivery)

| From | Event | To | Next Owner | Constraints |
|---|---|---|---|---|
| `INTENT` | DONE | `ROUTING` | Aurora | Manu must provide classification evidence |
| `INTENT` | ASK | `ASK` | (suspended: Manu) | waiting_on = authority; suspended_from_state = INTENT |
| `INTENT` | BLOCK | `BLOCKED` | (suspended: Manu) | waiting_on = authority; suspended_from_state = INTENT |
| `ROUTING` | DONE | `PLANNING` | Sonia | Aurora must confirm eligibility |
| `ROUTING` | ASK | `ASK` | (suspended: Aurora) | waiting_on = authority |
| `ROUTING` | BLOCK | `BLOCKED` | (suspended: Aurora) | waiting_on = authority |
| `PLANNING` | DONE | `EXECUTING` | Specialist | Sonia must assign specific specialist |
| `PLANNING` | ASK | `ASK` | (suspended: Sonia) | waiting_on = authority |
| `PLANNING` | BLOCK | `BLOCKED` | (suspended: Sonia) | waiting_on = authority |
| `EXECUTING` | DONE | `TESTING` | Teresa | Specialist provides evidence |
| `EXECUTING` | ASK | `ASK` | (suspended: Specialist) | waiting_on = authority |
| `EXECUTING` | BLOCK | `BLOCKED` | (suspended: Specialist) | waiting_on = authority |
| `TESTING` | PASS | `VERIFYING` | Rolando | Teresa provides test evidence |
| `TESTING` | FAIL | `EXECUTING` | (same Specialist) | Increment attempts counter; message required |
| `TESTING` | ASK | `ASK` | (suspended: Teresa) | waiting_on = authority |
| `TESTING` | BLOCK | `BLOCKED` | (suspended: Teresa) | waiting_on = authority |
| `VERIFYING` | VERIFIED | `ACCEPTING` | Manu | Rolando provides audit evidence |
| `VERIFYING` | DISCREPANCY | `PLANNING` | Sonia | Message required; increment replanning counter; notify Daneel |
| `VERIFYING` | ASK | `ASK` | (suspended: Rolando) | waiting_on = authority |
| `VERIFYING` | BLOCK | `BLOCKED` | (suspended: Rolando) | waiting_on = authority |
| `ACCEPTING` | ACCEPT | `CLOSING` | Sonia | Manu acceptance recorded with evidence |
| `ACCEPTING` | REJECT | `PLANNING` | Sonia | Manu provides rejection reason; increment replanning counter |
| `ACCEPTING` | ASK | `ASK` | (suspended: Manu) | waiting_on = authority |
| `ACCEPTING` | BLOCK | `BLOCKED` | (suspended: Manu) | waiting_on = authority |
| `CLOSING` | CLOSE | `CLOSED` | (none) | Sonia cleanup complete; Daneel sends report |
| `CLOSED` | (none) | — | — | Terminal state; no transitions out |
| `ASK` | RESOLVE | (suspended_from_state) | (suspended owner) | Daneel returns ball to suspended functional owner |
| `ASK` | ESCALATE | `BLOCKED` | (suspended: same) | Daneel escalates to Professor; waiting_on = professor |
| `BLOCKED` | RESOLVE | (suspended_from_state) | (suspended owner) | Daneel returns ball to suspended functional owner |
| `BLOCKED` | ESCALATE | `BLOCKED` | (suspended: same) | Daneel escalates upward; waiting_on updated |

## Exceptional Transition Rules

### FAIL → EXECUTING
- Same specialist (previous owner with role SPECIALIST)
- Increments `attempts.current`
- If `attempts.current >= attempts.max`: transition to BLOCKED instead; Daneel dispatches to Sonia

### DISCREPANCY → PLANNING
- Owner = Sonia
- Increments `replanning.current`
- Daneel notified
- If `replanning.current >= replanning.max`: transition to BLOCKED instead; Daneel dispatches to Professor

### REJECT → PLANNING
- Owner = Sonia
- Increments `replanning.current`
- Same max check as DISCREPANCY

### ASK/BLOCK → ASK/BLOCKED
- Functional owner is suspended (remains in `owner.actor`)
- Daneel determines `waiting_on.actor`
- `suspended_from_state` records where the ball was when ASK/BLOCK fired
- RESOLVE returns ball to `suspended_from_state` with the suspended owner

## Self-Approval Prevention

| Conflict | Check |
|---|---|
| Specialist cannot test own work | At EXECUTING→TESTING: next_owner ≠ previous specialist |
| Specialist cannot verify own work | At VERIFYING: Rolando must not be previous specialist |
| Tester cannot verify same work | Teresa ≠ Rolando (always true, structural) |
| Verifier cannot accept | Rolando ≠ Manu (always true, structural) |
| Controller never functional owner | At all states: owner.actor ≠ "daneel" |

## Attempts and Replanning Limits

```yaml
standard-delivery:
  max_attempts: 2
  max_replanning: 2
```

When limits exceeded:
- Task transitions to BLOCKED
- Daneel dispatches to appropriate authority
- Evidence trail preserved in event log

## Attribution

Generated-by: R. Daneel Olivaw
Model: deepseek-v4-pro/DeepSeek | runtime-reported
Repository: mahg-es/araya (ARAYA Framework)
