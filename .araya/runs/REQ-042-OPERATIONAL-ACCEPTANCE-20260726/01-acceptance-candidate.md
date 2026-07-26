# REQ-042 Relay Motor — Acceptance Candidate

## Entry Condition and Starting SHAs
- Kimi preservation SHA: ebb629dac50ed5c080f835b3f4f65d9cadc8086a
- Preservation commit message: `wip(relay): preserve REQ-042 motor checkpoint — 64/70 acceptance`
- Initial acceptance result: 64 passed, 6 failed, 70 total
- Entry condition: preserved WIP on `feature/req-042-relay-motor-mvp`, no gates, no PR, not accepted for merge

## REQ-042 Contract Sources Used
- `.araya/relay/acceptance-test-spec.md` — T-001 through T-033 acceptance criteria
- `.araya/relay/workflow.yaml` — standard-delivery workflow (9 functional states + ASK/BLOCKED)
- `.araya/relay/task-schema.json` — JSON Schema 2020-12 task definition
- `.araya/relay/event-schema.json` — JSON Schema 2020-12 event definition
- `.araya/relay/claim-contract.md` — claim lifecycle, concurrency, timeouts
- `.araya/relay/state-machine.md` — state machine semantics
- `.araya/relay/transition-table.md` — transition completeness
- `.araya/relay/relay-participant-contract.md` — agent role semantics
- `.araya/relay/filesystem-layout.md` — runtime state layout
- `.araya/relay/AX3.md` — Relay protocol ownership and rules

## Implemented Relay Components
| Component | State |
|---|---|
| Relay state machine (9 functional states + ASK/BLOCKED) | implemented, compiling |
| Claim system (active/acknowledged/released/expired/superseded; ack timeout 300s; lease 3600s; force-release) | implemented |
| Concurrency (O_EXCL lockfile + stale reclaim, optimistic version, atomic rename) | implemented |
| Evidence gates (DONE/PASS/VERIFIED/ACCEPT require evidence; ASK/BLOCK/FAIL/DISCREPANCY/REJECT require message) | implemented |
| Idempotency (idempotency_key dedup) | implemented |
| Sequence monotonic no-gaps (append-level) | implemented |
| Retired-agent rejection pre-persistence (giskard) | implemented |
| Dormant/unknown actor rejection (fail closed) | implemented |
| Authority enforcement (owner match per state; daneel never functional owner) | implemented |
| CLI six commands + JSON output | implemented |

## Acceptance Result
- **70 passed, 0 failed, 70 total**

## Compilation Result
- `npx tsc --skipLibCheck` — exit 0

## Regression Results
- `tests/test-operations-test.js` — 27 passed, 0 failed
- `tests/req-043-test.js` — 31 passed, 0 failed

## Files Included in the Candidate
Complete PR file inventory (11 files total, verified against `git diff --name-status origin/dev-mahg...HEAD` and `gh pr diff 90 --name-only`):

**Source files (6):**
- `src/cli.ts` — relay subcommand route (+4 lines) (modified)
- `src/araya/relay/types.ts` — Task/Event/Claim types, LIMITS, RelayError
- `src/araya/relay/workflow-standard-delivery.ts` — executable twin of workflow.yaml
- `src/araya/relay/store.ts` — persistence: O_EXCL flock + stale reclaim, optimistic version, atomic rename, append-only JSONL with sequence-gap + idempotency dedup
- `src/araya/relay/motor.ts` — state machine: init/inbox/claim/ack/returnBall/control/status
- `src/araya/relay/cli.ts` — six canonical commands: init, inbox, claim, ack, return, status (+ control)

**Test files (1):**
- `tests/relay-motor-acceptance-test.js` — executable acceptance suite T-001..T-033 + FASE 3 negative cases

**Evidence files (4):**
- `.araya/runs/REQ-042-OPERATIONAL-ACCEPTANCE-20260726/STOP-AND-PRESERVE.md` — preservation checkpoint
- `.araya/runs/REQ-042-OPERATIONAL-ACCEPTANCE-20260726/01-acceptance-candidate.md` — this record
- `.araya/runs/REQ-042-LAGUNA-CONFIG-VALIDATION-20260726/01-config-validation.md` — Laguna configuration validation record (corrected by ponny-express-10016)
- `.araya/runs/REQ-042-LAGUNA-EVALUATION-20260726/01-laguna-evaluation.md` — Laguna evaluation record

**Documentation files:** 0
**Deleted files:** 0

## Known Limitations
- MVP scope: standard-delivery workflow only. governance-delivery and quick-fix deferred.
- ASSIGN/ACK events are excluded from events.jsonl (claim lifecycle tracked in task.claim + notifications).
- ASSIGN bumps version 1→2 at task creation.
- attempts semantics: attempts.current starts at 1, FAIL increments, BLOCKED when current > max (2).
- No production-grade E2E agent lifecycle test (deferred to REQ-042 FASE 4/5).

## Governed Gates Status
- Clara (DONE gate): NOT RUN
- Teresa (PASS gate): NOT RUN
- Rolando (VERIFIED gate): NOT RUN
- Manu acceptance: NOT RUN

## Merge Restriction
This PR is ready for governed review but MUST NOT be merged until the required ARAYA gates pass on the exact candidate SHA.
