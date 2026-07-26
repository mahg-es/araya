---
name: "relay-participant"
description: "Participates in the ARAYA Relay state machine and enforces state ownership, allowed transitions, evidence requirements, and handoffs."
---
# relay-participant

- **Name:** relay-participant
- **Version:** 1.0.0
- **Status:** active
- **Owner:** daneel
- **Description:** Participate in the ARAYA Relay protocol — claim, execute, and return tasks with valid events and evidence.
- **Model Tier:** balanced
- **Risk Level:** high

## Purpose

**Problem:** Agents executing Relay tasks must follow a precise claim → execute → return lifecycle with binding invariants, or they produce invalid events that corrupt task state.

**Outcome:** Valid Relay events with proper evidence, version tracking, idempotency keys, and conformance to the Relay Participant Contract.

## When to Use

- Assigned a Relay task via `.araya/relay/runtime/inbox/<actor>/`
- Task state matches one of `relay.can_receive_states` in the agent's canonical profile
- Preparing to emit a result event (DONE, PASS, FAIL, VERIFIED, DISCREPANCY, ACCEPT, REJECT, ASK, BLOCK)

## When Not to Use

- Agent has no `relay` section in their canonical profile
- Task is not assigned to self (`task.owner.actor != self`)
- A conflicting claim already exists
- The agent is Daneel emitting controller events (ASSIGN, CLAIM, ACK, RELEASE, EXPIRE, ESCALATE, RESOLVE, NOTE)

## Required Skills

- araya-command-and-delegation-expert
- ax-postoffice

## Required Permissions

- `read` — Read inbox messages and task files
- `bash` — Execute flock for claim concurrency
- `write` — Write claim files (not task files directly)

## Required Artifacts

- Agent canonical profile from `araya.yaml` (for `relay.allowed_results`, `relay.can_receive_states`)
- Relay Participant Contract (`.araya/relay/relay-participant-contract.md`)
- Relay task schema (`.araya/relay/task-schema.json`)
- Relay event schema (`.araya/relay/event-schema.json`)

## Conflicts With

- Any manual state transition outside the Relay protocol
- Direct file modification of task state (bypasses event log)

## Inputs (Required)

- `task_file` — Path to the assigned Relay task file
- `actor_profile` — Agent's canonical profile including `relay` section

## Outputs (Required)

- `claim_file` — Valid claim written with flock + version check
- `event_record` — Valid event appended to task event log

## Evidence Required

- `claim_ack` — Claim acknowledged within `ack_timeout_seconds`
- `event_idempotency_key` — Format: `<actor>-<uuid>`
- `event_causation_id` — References the event being responded to
- `task_version_tracking` — `task_version_before` and `task_version_after`
- `execution_evidence` — At least one evidence entry for DONE, PASS, VERIFIED, ACCEPT
- `message` — Required for FAIL, ASK, BLOCK, DISCREPANCY, REJECT

## Side Effects

- Writes claim file to `.araya/relay/runtime/claims/<task_id>/`
- Emits event to task event log
- May delete inbox message on successful ACK
- Task state transitions per Relay state machine

## Failure Modes

- **Claim conflict:** Another actor claimed the task first → report to controller, do not proceed
- **Version mismatch:** Task was modified between read and write → abort and re-read
- **ACK timeout:** Failed to ACK within `ack_timeout_seconds` → claim expires, task released
- **Invalid event type:** Emitting an event not in `relay.allowed_results` → validation failure
- **Missing evidence:** Returning DONE/PASS/VERIFIED/ACCEPT without evidence → event rejected
- **Owner mismatch:** Attempting to claim a task not assigned to self → claim invalid
- **Self-approval:** Attempting to TEST/VERIFY own implementation → role matrix violation

## Rollback Strategy

- Release claim and report to controller (Daneel)
- Abort event emission if version mismatch detected
- Re-read task state from disk before re-attempting

## Handoff To

- **Success:** Emit result event → Daneel (controller) computes next state and owner
- **Relay Result:** Per agent's `relay.allowed_results` (DONE, PASS, FAIL, VERIFIED, DISCREPANCY, ACCEPT, REJECT, ASK, BLOCK)
- **Blocked:** Emit ASK or BLOCK → Daneel dispatches to authority in `waiting_on.actor`

## Acceptance Tests

- Claim-acquire-release lifecycle with concurrent claims
- Version mismatch detection and abort
- Idempotency key uniqueness enforcement
- Evidence validation on required event types
- Allowed_results enforcement (invalid event type rejection)
- ASK/BLOCK owner suspension model verification
- ACK timeout expiration

---

## Execution Loop

```text
┌─────────────────────────────────────────────────────┐
│                  RELAY EXECUTION LOOP                │
├─────────────────────────────────────────────────────┤
│  1. READ INBOX                                       │
│     └─ Poll .araya/relay/runtime/inbox/<actor>/     │
│     └─ Read pending task assignment messages         │
│                                                      │
│  2. CLAIM ASSIGNED TASK                              │
│     └─ Acquire flock on task file                    │
│     └─ Verify task.owner.actor == self               │
│     └─ Verify no other active claim exists           │
│     └─ Write claim with status=active                │
│     └─ Release flock                                 │
│     └─ Emit CLAIM event                              │
│                                                      │
│  3. ACK CLAIM                                        │
│     └─ Confirm receipt of task                       │
│     └─ Update claim status to acknowledged           │
│     └─ Emit ACK event                                │
│     └─ Delete inbox message                          │
│                                                      │
│  4. EXECUTE CURRENT AUTHORITY                        │
│     └─ Perform work per skill contracts              │
│     └─ Produce required evidence                     │
│     └─ Respect boundaries.must_not                   │
│     └─ Consult boundaries.consult as needed          │
│                                                      │
│  5. RETURN ALLOWED RESULT + EVIDENCE                 │
│     └─ Select result from relay.allowed_results      │
│     └─ Attach evidence if evidence_required          │
│     └─ Emit result event with evidence references    │
│     └─ Release claim                                 │
│     └─ Do NOT select next owner or next state        │
└─────────────────────────────────────────────────────┘
```

## Binding Invariants

1. **Single Active Functional Owner:** At all times, a task has exactly one functional owner (`task.owner.actor`).
2. **Controller Isolation:** Daneel is the Relay Controller, never the functional owner.
3. **Actor Cannot Choose Next Owner:** The participant returns a result event; the controller computes next state and owner.
4. **Version Must Match:** Before emitting, verify `task_version` matches what was read. On mismatch, abort and re-read.
5. **Idempotency Key Mandatory:** Every event carries `idempotency_key` in format `<actor>-<uuid>`.
6. **Evidence Mandatory for Success:** DONE, PASS, VERIFIED, ACCEPT require `evidence` array with ≥1 entries.
7. **ASK/BLOCK Preserves Owner:** On ASK/BLOCK, the participant remains functional owner (suspended). `task.owner.actor` does not change.
8. **Self-Test/Self-Verify/Self-Accept Forbidden:** An EXECUTING owner must not be owner in TESTING, VERIFYING, or ACCEPTING for the same task.

## Allowed Results Per Role

| Role | Allowed Results | Evidence Required |
|---|---|---|
| MANU (Product Authority) | DONE, ACCEPT, REJECT, ASK, BLOCK | DONE, ACCEPT, REJECT |
| AURORA (Capability Authority) | DONE, ASK, BLOCK | DONE |
| SONIA (Planning Authority) | DONE, CLOSE, ASK, BLOCK | DONE |
| SPECIALIST | DONE, ASK, BLOCK | DONE |
| TERESA (Test Gate) | PASS, FAIL, ASK, BLOCK | PASS, FAIL |
| ROLANDO (Reality Authority) | VERIFIED, DISCREPANCY, ASK, BLOCK | VERIFIED, DISCREPANCY |
| DANEEL (Controller) | ASSIGN, CLAIM, ACK, RELEASE, EXPIRE, ESCALATE, RESOLVE, NOTE | (controller events) |

## ASK/BLOCK Protocol

| Condition | Event |
|---|---|
| Missing information needed to proceed | ASK |
| External dependency unavailable | ASK |
| Ambiguous requirements | ASK |
| Authority decision required | ASK |
| Irreconcilable conflict | BLOCK |
| Security vulnerability blocks progress | BLOCK |

The `message` field is REQUIRED for ASK and BLOCK and must contain what, why, and who (advisory).

## Evidence Types

| Type | Description | Required For |
|---|---|---|
| `commit` | Git commit SHA | DONE (all specialists) |
| `test_report` | Test execution report | PASS, FAIL |
| `audit_log` | Verification audit trail | VERIFIED, DISCREPANCY |
| `file_diff` | Changed files list or diff | DONE |
| `acceptance_letter` | Formal acceptance record | ACCEPT |

## Prohibited Actions

- Emitting DONE without evidence
- Emitting PASS for own implementation
- Setting `next_owner` on result event
- Claiming another actor's task
- Emitting RESOLVE (controller-only)
- Emitting CLOSE without authority (Sonia-only)
- Modifying event log (append-only)
- Proceeding after claim expiry

## Cross-References

- **Relay Participant Contract:** `.araya/relay/relay-participant-contract.md`
- **Agent and Skill Contract:** `.araya/governance/standards/ARAYA-agent-and-skill-contract-v1.md`
- **Relay State Machine:** `.araya/relay/state-machine.md`
- **Relay Claim Contract:** `.araya/relay/claim-contract.md`
- **Relay Task Schema:** `.araya/relay/task-schema.json`
- **Relay Event Schema:** `.araya/relay/event-schema.json`
