# ARAYA Relay — Acceptance Test Specification

Canonical home: `mahg-es/araya` (ARAYA Framework).
Status: MVP design (standard-delivery only).
Motor status: not yet implemented.

## 1. Structural Tests

### T-001 — Single active owner
**Given** task RELAY-001 in EXECUTING with owner valentina (SPECIALIST) and active claim by valentina
**When** agent alejandra attempts to claim RELAY-001
**Then** claim is rejected: "task already claimed by valentina"
**And** task state remains EXECUTING
**And** task version is unchanged

### T-002 — Controller is never functional owner
**Given** any task in any functional state (INTENT through CLOSING)
**When** the task owner is inspected
**Then** `task.owner.actor != "daneel"` for all functional states
**And** `task.relay_controller.actor == "daneel"` is always true

### T-003 — No state skip
**Given** task RELAY-001 in INTENT
**When** agent sonia attempts to emit DONE for RELAY-001
**Then** event rejected: "actor sonia is not current owner (manu)"
**And** task version unchanged
**And** no event appended

### T-004 — No self-approval: implementer cannot test
**Given** task RELAY-001 in EXECUTING with owner valentina (SPECIALIST)
**When** valentina returns DONE
**Then** transition to TESTING with next_owner teresa
**And** teresa ≠ valentina

### T-005 — No self-approval: implementer cannot verify
**Given** task RELAY-001 where valentina was the previous specialist
**When** task reaches VERIFYING and controller computes next_owner
**Then** next_owner == rolando (not valentina)

### T-006 — Daneel cannot substitute functional owner
**Given** task RELAY-001 in VERIFYING
**When** daneel attempts to emit VERIFIED
**Then** event rejected: "daneel is relay_controller, not functional owner"

### T-007 — ASK/BLOCK: Daneel does not become owner
**Given** task RELAY-001 in EXECUTING with owner valentina
**When** valentina emits ASK
**Then** task.state == "ASK"
**And** task.owner.actor == "valentina" (suspended, not replaced)
**And** task.waiting_on.actor is set to authority
**And** task.suspended_from_state == "EXECUTING"
**And** task.relay_controller.actor == "daneel"

## 2. Happy Path Tests

### T-008 — Complete happy path
**Given** new task RELAY-001 with workflow standard-delivery
**When** all agents emit the expected event at each state
**Then** task flows: INTENT → ROUTING → PLANNING → EXECUTING → TESTING → VERIFYING → ACCEPTING → CLOSING → CLOSED
**And** 9 events in events.jsonl (one per transition)
**And** task.state == "CLOSED"
**And** task.version == 10

### T-009 — Teresa FAIL returns ball to same specialist
**Given** task RELAY-001 in TESTING, previous specialist valentina
**When** teresa returns FAIL
**Then** task transitions to EXECUTING
**And** task.owner.actor == valentina
**And** task.attempts.current == 2

### T-010 — Max attempts exceeded causes BLOCKED
**Given** task RELAY-001 with attempts.current == 2, attempts.max == 2
**When** teresa returns FAIL
**Then** task transitions to BLOCKED
**And** task.waiting_on.actor == "sonia"
**And** task.suspended_from_state == "EXECUTING"

### T-011 — Rolando DISCREPANCY returns ball to Sonia
**Given** task RELAY-001 in VERIFYING
**When** rolando returns DISCREPANCY with evidence
**Then** task transitions to PLANNING
**And** task.owner.actor == sonia
**And** task.replanning.current incremented

### T-012 — Max replanning exceeded causes BLOCKED
**Given** task RELAY-001 with replanning.current == 2, replanning.max == 2
**When** rolando returns DISCREPANCY
**Then** task transitions to BLOCKED
**And** task.waiting_on.actor == "professor"

### T-013 — Manu REJECT returns ball to Sonia
**Given** task RELAY-001 in ACCEPTING
**When** manu returns REJECT with reason
**Then** task transitions to PLANNING
**And** task.owner.actor == sonia

### T-014 — ASK → RESOLVE → returns to suspended state
**Given** task RELAY-001 in ASK, suspended_from_state = EXECUTING, owner = valentina
**When** Daneel emits RESOLVE
**Then** task transitions to EXECUTING
**And** task.owner.actor == valentina

## 3. Claim Tests

### T-015 — Claim requires ACK within timeout
**Given** task RELAY-001 with claim by valentina, status = active
**When** ack_timeout_seconds (300s) elapses without ACK
**Then** claim.status == "expired"
**And** task available for re-claim

### T-016 — Expired claim releases task
**Given** task with expired claim by valentina
**When** controller sweep runs
**Then** claim released; task available for new claim

### T-017 — Controller force-releases abandoned claim
**Given** task with active claim, no ACK for 600s (> 2× ack_timeout)
**When** Daneel invokes force-release
**Then** claim released; notification sent to valentina

### T-018 — Previous owner cannot re-claim after release
**Given** task where valentina's claim was released
**When** valentina attempts to re-claim
**Then** rejected: "previously abandoned — re-assignment required"

## 4. Concurrency Tests

### T-019 — File lock prevents concurrent writes
**Given** two writers attempt to claim the same task simultaneously
**When** writer A acquires flock first
**Then** writer B blocks until A releases
**And** writer B reads updated task state (writer A's claim visible)
**And** writer B's claim attempt is rejected (task already claimed)

### T-020 — Optimistic version check detects stale writes
**Given** task RELAY-001 at version 5
**When** writer A reads version 5, writer B modifies to version 6, writer A tries to write with expected_version=5
**Then** writer A's write rejected: CONCURRENT_MODIFICATION
**And** task remains at version 6

### T-021 — Atomic rename prevents partial reads
**Given** writer writing task to .tmp file
**When** reader opens task file during write
**Then** reader sees either old complete file or new complete file
**And** never sees partial/torn write

## 5. Event Integrity Tests

### T-022 — Invalid event does not change version
**Given** task RELAY-001 in TESTING, version 6
**When** invalid event received (e.g., DONE from wrong actor)
**Then** event rejected
**And** task.version remains 6
**And** task.state remains TESTING
**And** no event appended to events.jsonl

### T-023 — Event log is append-only
**Given** events.jsonl with N events
**When** any operation attempts to modify or delete existing event
**Then** operation rejected: "event log is append-only"

### T-024 — Idempotency key prevents replay
**Given** event with idempotency_key "valentina-abc123" already processed
**When** same idempotency_key arrives again
**Then** event recognized as duplicate
**And** no state change
**And** no new event appended
**And** original event_id returned

### T-025 — Sequence numbers are monotonic
**Given** events with sequences [1, 2, 3] for task RELAY-001
**When** new event arrives with sequence 5 (gap)
**Then** event rejected: "sequence gap detected: expected 4, got 5"

## 6. Evidence Tests

### T-026 — DONE requires evidence
**Given** task in EXECUTING
**When** specialist returns DONE with empty evidence
**Then** rejected: "DONE requires at least one evidence reference"

### T-027 — PASS requires test evidence
**Given** task in TESTING
**When** teresa returns PASS with no evidence
**Then** rejected: "PASS requires test report evidence"

### T-028 — VERIFIED requires audit evidence
**Given** task in VERIFYING
**When** rolando returns VERIFIED with no evidence
**Then** rejected: "VERIFIED requires audit evidence"

### T-029 — ASK/BLOCK require message
**Given** task in any state
**When** actor emits ASK with empty message
**Then** rejected: "ASK requires a message describing the decision needed"

## 7. Giskard Tests

### T-030 — Operational Giskard reference causes BLOCK
**Given** any task, any state
**When** event references actor "giskard" in operational capacity
**Then** controller BLOCKs: "Giskard is retired — no operational role"

### T-031 — Historical Giskard reference allowed
**Given** evidence file referencing Giskard historically
**When** task processes normally
**Then** no BLOCK triggered

## 8. Cross-Repo Independence Tests

### T-032 — Framework defines protocol; project stores state
**Given** task RELAY-001 in mahg-pms
**When** task state is read
**Then** `.araya/relay/runtime/tasks/RELAY-001.json` in mahg-pms is authoritative
**And** `mahg-es/araya` contains the canonical schema, not the task state

### T-033 — Portfolio reads, never stores task state
**Given** project mahg-pms with task RELAY-001
**When** Portfolio aggregates task view
**Then** Portfolio reads from project state
**And** Portfolio has no local copy of task state
**And** if Portfolio and project disagree, project wins

## Attribution

Generated-by: R. Daneel Olivaw
Model: deepseek-v4-pro/DeepSeek | runtime-reported
Repository: mahg-es/araya (ARAYA Framework)
