# ARAYA Relay — State Machine

Canonical home: `mahg-es/araya` (ARAYA Framework).
Status: MVP design (standard-delivery only).
Part of: ponny-express-0008 (PR B — Framework Relay Protocol).

## 1. States

### Active States (standard-delivery)

| State | Description | Owner (role) |
|---|---|---|
| `INTENT` | Requirement received, awaiting Manu classification | Manu |
| `ROUTING` | Manu classified, Aurora confirms eligibility | Aurora |
| `PLANNING` | Aurora confirmed, Sonia decomposes into AWUs | Sonia |
| `EXECUTING` | Specialist produces artifacts | Specialist |
| `TESTING` | Teresa validates deliverables | Teresa |
| `VERIFYING` | Rolando audits evidence against repository truth | Rolando |
| `ACCEPTING` | Manu reviews and accepts or rejects | Manu |
| `CLOSING` | Sonia performs cleanup and archiving | Sonia |
| `CLOSED` | Terminal state | (none) |

### Exceptional States

| State | Description | Owner |
|---|---|---|
| `ASK` | Pending decision. Functional owner suspended; Daneel dispatches to authority | Functional owner suspended; waiting_on = authority |
| `BLOCKED` | Cannot proceed. Functional owner suspended; Daneel dispatches to authority | Functional owner suspended; waiting_on = authority |

**ASK/BLOCK owner model (binding):**

```yaml
state: ASK
owner:
  actor: <owner funcional suspendido>
waiting_on:
  actor: <manu|aurora|sonia|professor>
relay_controller:
  actor: daneel
suspended_from_state: EXECUTING
```

Daneel:
- Receives the ASK/BLOCK event
- Determines the correct authority (who can resolve)
- Dispatches the query to waiting_on.actor
- Monitors the response
- Returns the ball to the suspended functional owner upon resolution

Daneel does NOT occupy the ball nor respond on behalf of the authority.

## 2. Transitions

### Happy Path (standard-delivery)

```text
INTENT
  │ Manu DONE
  ▼
ROUTING
  │ Aurora DONE
  ▼
PLANNING
  │ Sonia DONE
  ▼
EXECUTING
  │ Specialist DONE
  ▼
TESTING
  │ Teresa PASS
  ▼
VERIFYING
  │ Rolando VERIFIED
  ▼
ACCEPTING
  │ Manu ACCEPT
  ▼
CLOSING
  │ Sonia CLOSE
  ▼
CLOSED
```

### Exceptional Transitions

```text
TESTING ── Teresa FAIL ──→ EXECUTING (same specialist, increment attempts)
VERIFYING ── Rolando DISCREPANCY ──→ PLANNING (Sonia)
ACCEPTING ── Manu REJECT ──→ PLANNING (Sonia)

Any state ── ASK ──→ ASK (ball held by controller, dispatched to authority)
Any state ── BLOCK ──→ BLOCKED (ball held by controller, dispatched to authority)
```

## 3. Invariants

1. Single active owner: `len(active_claims) <= 1` at all times.
2. No self-approval: `previous_owner != next_owner` where roles conflict (implementer ≠ tester, implementer ≠ verifier, tester ≠ verifier, verifier ≠ accepter).
3. No state skip: transitions only via defined edges.
4. Controller isolation: `controller.actor != task.owner.actor` for all functional states.
5. Evidence required: DONE, PASS, VERIFIED, ACCEPT events must carry evidence references.
6. Immutable events: events are append-only, never updated or deleted.
7. Daneel never is functional owner of ASK or BLOCKED — the suspended functional owner remains `owner.actor`.

## 4. Attempts and Cycles

```yaml
attempts:
  max: 2                    # Max TESTING → FAIL → EXECUTING cycles
  counter: 1                # Current attempt number

replanning:
  max: 2                    # Max REPLANNING cycles before escalation
  counter: 0
```

When `attempts.counter > attempts.max` at FAIL:
- Controller marks task as BLOCKED
- Daneel dispatches to Sonia (planning authority)

When `replanning.counter > replanning.max`:
- Controller marks task as BLOCKED
- Daneel dispatches to Professor

## Attribution

Generated-by: R. Daneel Olivaw
Model: deepseek-v4-pro/DeepSeek | runtime-reported
Repository: mahg-es/araya (ARAYA Framework)
