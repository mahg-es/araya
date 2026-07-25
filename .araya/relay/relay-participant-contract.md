# ARAYA Relay — Participant Contract

- **Date:** 2026-07-25
- **Author:** Priscila (Technical Writer), per REQ-043 Step 2 — extracted from `ARAYA-agent-and-skill-contract-v1.md` Section 7
- **Version:** 1.0.0
- **Status:** published
- **Canonical home:** `mahg-es/araya` (ARAYA Framework)
- **Applies to:** every Relay-capable ARAYA agent
- **Required skill:** `relay-participant`

---

## 1. Purpose

This contract defines the obligations every Relay participant must fulfill when claiming, executing, and returning a task in the ARAYA Relay protocol. It is the **actor-side** counterpart to the Relay state machine, transition table, and claim contract.

A participant that violates this contract produces invalid Relay events and may cause task state corruption.

---

## 2. The Relay Execution Loop

Every Relay-capable actor MUST follow this sequence:

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

---

## 3. Binding Invariants

### 3.1 Single Active Functional Owner

At all times, a task has **exactly one** functional owner. Only that owner may emit result events for the task. The owner is identified by `task.owner.actor`.

**Check:** `task.owner.actor` is set and non-empty in all functional states.

### 3.2 Controller Isolation

Daneel is the Relay Controller, **never** the functional owner. For all functional states (INTENT through CLOSING), `task.owner.actor != "daneel"`.

**Check:** At event emission, if `actor == "daneel"` and `event_type` is a functional result (DONE, PASS, FAIL, VERIFIED, DISCREPANCY, ACCEPT, REJECT, CLOSE), the event is invalid.

### 3.3 Actor Cannot Choose Next Owner

The participant returns a result event. The controller (Daneel) computes the next state and next owner based on the transition table. The participant MUST NOT set `next_owner` or `next_state`.

**Check:** Result events from non-controller actors must not contain `next_owner` or `next` fields.

### 3.4 Current Task Version Must Match

Before emitting any event, the participant MUST verify that the task version it read matches the current task version on disk. If versions differ, the task was modified by another actor and the participant MUST abort and re-read.

**Check:** `task_version_before` in the event must equal the version the participant read. On write, `task.version` must equal `task_version_before`.

### 3.5 Idempotency Key Is Mandatory

Every event MUST carry an `idempotency_key`. Format: `<actor>-<uuid>`. Replaying an event with the same idempotency key MUST produce no side effects.

**Check:** `event.idempotency_key` is present and matches `^[a-z]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`.

### 3.6 Evidence Is Mandatory for Successful Return

When a participant returns DONE, PASS, VERIFIED, or ACCEPT, the event MUST include the `evidence` array with at least one entry.

**Check:** If `event_type in [DONE, PASS, VERIFIED, ACCEPT]`, then `len(event.evidence) >= 1`.

### 3.7 ASK/BLOCK Preserve Suspended Functional Owner

When a participant returns ASK or BLOCK, the participant remains the functional owner (suspended). The task state transitions to ASK or BLOCKED, but `task.owner.actor` does not change. Daneel dispatches to the authority in `waiting_on.actor`.

**Check:** On ASK/BLOCK, `task.state in [ASK, BLOCKED]` AND `task.owner.actor == <original owner>`.

### 3.8 Self-Test, Self-Verify, Self-Accept Are Forbidden

A participant who has been the functional owner in EXECUTING state MUST NOT subsequently be the functional owner in TESTING, VERIFYING, or ACCEPTING states for the same task.

**Check:** `previous_owner.actor` where `previous_owner.role == SPECIALIST` must not equal `next_owner.actor` where `next_owner.role in [TERESA, ROLANDO, MANU]`.

---

## 4. Allowed Results Per Role

Each agent's canonical profile defines `relay.allowed_results`. The following table shows the standard mapping:

| Role | Allowed Results | Evidence Required |
|---|---|---|
| MANU (Product Authority) | DONE, ACCEPT, REJECT, ASK, BLOCK | DONE, ACCEPT, REJECT |
| AURORA (Capability Authority) | DONE, ASK, BLOCK | DONE |
| SONIA (Planning Authority) | DONE, CLOSE, ASK, BLOCK | DONE |
| SPECIALIST | DONE, ASK, BLOCK | DONE |
| TERESA (Test Gate) | PASS, FAIL, ASK, BLOCK | PASS, FAIL |
| ROLANDO (Reality Authority) | VERIFIED, DISCREPANCY, ASK, BLOCK | VERIFIED, DISCREPANCY |
| DANEEL (Controller) | ASSIGN, CLAIM, ACK, RELEASE, EXPIRE, ESCALATE, RESOLVE, NOTE | (controller events) |

**A participant must never emit an event type not in their `relay.allowed_results`.** Emitting an invalid event type is a validation failure (Gate 12 of the Agent and Skill Contract).

---

## 5. The ASK/BLOCK Protocol

### 5.1 When to ASK or BLOCK

| Condition | Event |
|---|---|
| Missing information needed to proceed | ASK |
| External dependency unavailable | ASK |
| Ambiguous requirements | ASK |
| Authority decision required | ASK |
| Irreconcilable conflict | BLOCK |
| Security vulnerability blocks progress | BLOCK |
| Attempt or replanning limit exceeded | BLOCK (controller-triggered) |

### 5.2 ASK/BLOCK Message Requirements

The `message` field is REQUIRED for ASK and BLOCK events and must contain:

1. **What** the participant needs or what blocks them.
2. **Why** the participant cannot proceed without it.
3. **Who** the participant believes can resolve it (advisory; Daneel makes final determination).

### 5.3 Owner Suspension Model

```yaml
# Before ASK/BLOCK
task:
  state: EXECUTING
  owner:
    actor: valentina  # functional owner

# After valentina emits ASK
task:
  state: ASK
  owner:
    actor: valentina  # STILL the functional owner, but suspended
  waiting_on:
    actor: sonia      # authority Daneel dispatches to
  suspended_from_state: EXECUTING
```

**Daneel does NOT become the owner.** The suspended owner remains `task.owner.actor`.

### 5.4 Resolution

When the authority responds:

1. Daneel emits RESOLVE event.
2. Task returns to `suspended_from_state` (e.g., EXECUTING).
3. Owner is restored to the suspended functional owner.
4. The suspended owner continues from where they left off.

---

## 6. Claim Lifecycle (Participant View)

The participant interacts with claims as follows:

```text
[Inbox message received]
    │
    ▼
[CLAIM task] ── error ──→ [Report to controller, do not proceed]
    │ success
    ▼
[ACK claim] ── timeout ──→ [Claim expires; task released]
    │ acked
    ▼
[EXECUTE work]
    │
    ▼
[RETURN result + evidence]
    │
    ▼
[RELEASE claim]
    │
    ▼
[Task moves to next owner via controller]
```

### 6.1 Claim Constraints

- A participant may only claim a task where `task.owner.actor == self`.
- A participant may not claim a task already claimed by another actor.
- A participant may not re-claim a task after release unless re-assigned by controller.
- The ACK must arrive within `ack_timeout_seconds` (default: 300s).
- If the participant does not ACK, the claim expires and the task is released.

---

## 7. Evidence Requirements

### 7.1 Evidence Types

| Type | Description | Required For |
|---|---|---|
| `commit` | Git commit SHA | DONE (all specialists) |
| `test_report` | Test execution report | PASS, FAIL |
| `audit_log` | Verification audit trail | VERIFIED, DISCREPANCY |
| `file_diff` | Changed files list or diff | DONE |
| `acceptance_letter` | Formal acceptance record | ACCEPT |
| `screenshot` | Visual evidence | (optional, any) |
| `log_output` | Execution log | (optional, any) |

### 7.2 Evidence Format

```json
{
  "evidence": [
    {
      "type": "commit",
      "ref": "abc123def456",
      "description": "Implemented GET /api/users endpoint"
    },
    {
      "type": "test_report",
      "ref": "evidence/relay-001-test-report.txt",
      "description": "Full test suite: 12/12 passed"
    }
  ]
}
```

The `ref` must be resolvable — a commit SHA, a file path relative to the project root, or a URI.

---

## 8. Participant Responsibilities

### 8.1 Before Execution

1. Verify the task is assigned to self (`task.owner.actor == self`).
2. Verify the task state matches one of `relay.can_receive_states`.
3. Verify no conflicting claim exists.
4. Read the task's full event log to understand history.
5. Claim the task with proper concurrency control (flock + version check).
6. ACK the claim within `ack_timeout_seconds`.

### 8.2 During Execution

1. Stay within `boundaries.must_not`.
2. Consult `boundaries.consult` when crossing domain boundaries.
3. Produce evidence as specified by the skill contract.
4. Do not modify `task.next_owner` or `task.next_state`.
5. If blocked or uncertain, ASK or BLOCK — do not guess.

### 8.3 After Execution

1. Select the appropriate result event from `relay.allowed_results`.
2. Attach all required evidence.
3. If FAIL, DISCREPANCY, or REJECT: include a descriptive `message`.
4. Emit the event with proper `idempotency_key`, `causation_id`, and version tracking.
5. Release the claim.
6. Delete the inbox message (if applicable).

---

## 9. Prohibited Actions

| Action | Why Forbidden | Enforcement |
|---|---|---|
| Emitting DONE without evidence | Evidence required by contract | Event schema validation |
| Emitting PASS for own implementation | Self-approval conflict | Role matrix (Section 9 of Agent Contract) |
| Setting `next_owner` on result event | Controller privilege | Event schema validation |
| Claiming another actor's task | Ownership violation | Claim contract (flock + version check) |
| Emitting RESOLVE | Controller-only event | Role → allowed_results mapping |
| Emitting CLOSE without authority | Sonia-only event | Role → allowed_results mapping |
| Modifying event log | Events are append-only | Filesystem permissions + audit |
| Proceeding after claim expiry | No valid claim | Claim contract timeout enforcement |

---

## 10. Machine-Validatable Fields

| Field | Source | Type | Validation Rule |
|---|---|---|---|
| `actor` | Event | `string` | Must be a valid agent name in `araya.yaml` |
| `actor_role` | Event | `enum` | Must match agent's `role.authority` |
| `event_type` | Event | `enum` | Must be in agent's `relay.allowed_results` |
| `idempotency_key` | Event | `string` | Must match `^[a-z]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$` |
| `task_version_before` | Event | `integer` | Must match task version at time of read |
| `task_version_after` | Event | `integer` | For state-changing events: `== task_version_before + 1` |
| `evidence` | Event | `array` | Required when `event_type in [DONE, PASS, VERIFIED, ACCEPT]` |
| `message` | Event | `string` | Required when `event_type in [FAIL, ASK, BLOCK, DISCREPANCY, REJECT]` |
| `claim.actor` | Task | `string` | Must equal `task.owner.actor` |
| `claim.status` | Task | `enum` | `active`, `acknowledged`, `released`, `expired`, `superseded` |

---

## 11. Required Skill: relay-participant

Every agent with a `relay` section in their canonical profile MUST carry the `relay-participant` skill. This skill teaches the agent how to:

1. Read the Relay inbox.
2. Execute the claim lifecycle.
3. Follow the execution loop.
4. Emit valid events with evidence.
5. Handle ASK/BLOCK correctly.
6. Stay within boundaries.

**Skill location:** `skills/relay-participant/SKILL.md`

**Validation:** Gate 8 of the Agent and Skill Contract (`ARAYA-agent-and-skill-contract-v1.md`).

---

## 12. Cross-References

| Artifact | Path | Purpose |
|---|---|---|
| Agent and Skill Contract | `.araya/governance/standards/ARAYA-agent-and-skill-contract-v1.md` | Schema-of-schemas; defines agent/skill profiles |
| Relay State Machine | `.araya/relay/state-machine.md` | States, transitions, invariants |
| Relay Transition Table | `.araya/relay/transition-table.md` | Complete transition matrix |
| Relay Claim Contract | `.araya/relay/claim-contract.md` | Claim lifecycle, concurrency, timeouts |
| Relay Task Schema | `.araya/relay/task-schema.json` | JSON Schema 2020-12 for task files |
| Relay Event Schema | `.araya/relay/event-schema.json` | JSON Schema 2020-12 for event records |
| Relay Workflow | `.araya/relay/workflow.yaml` | Workflow definition (standard-delivery) |
| Relay Acceptance Tests | `.araya/relay/acceptance-test-spec.md` | Motor compliance criteria |
| Relay Filesystem Layout | `.araya/relay/filesystem-layout.md` | Directory structure |

---

## 13. Version Compatibility

- This contract versions independently. A v2 may add invariants but MUST NOT weaken v1 invariants.
- Participant contracts are **accumulative**: a v2 participant must satisfy all v1 and v2 invariants.
- Motor implementations are tested against acceptance tests, not against this contract directly. This contract defines what participants must do; the acceptance tests verify the motor enforces it.

---

## Attribution

- **Extracted from:** `ARAYA-agent-and-skill-contract-v1.md` Section 7, per REQ-043 Step 2
- **Author:** Priscila (Technical Writer)
- **Approved by:** The Data Professor, Manuel Alejandro Hernández Giuliani
- **Repository:** `mahg-es/araya` (ARAYA Framework)
