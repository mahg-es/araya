# REQ-042 Laguna Evaluation — 01-laguna-evaluation

## Model and Provider
- Model: poolside/laguna-s-2.1
- Provider: poolside
- Runtime source: Pi ExtensionContext.ctx.model (Pi-runtime supplied)

## Workspace
- Repository: /home/thedataprofessor/github/mahg-es/araya
- Worktree: /home/thedataprofessor/github/mahg-es/worktrees/araya/req-042-laguna-evaluation
- Evaluation branch: feature/req-042-relay-motor-laguna-eval

## Starting State
- Preservation SHA: ebb629dac50ed5c080f835b3f4f65d9cadc8086a
- Initial reproduced result: 64 passed, 6 failed, 70 total
- Compilation: exit 0 (`npx tsc --skipLibCheck`)

## Diagnosis

### Failure 1: T-001 second claim rejected
- Classification: TEST_EXPECTATION_DEFECT
- Root cause: The acceptance specification (T-001) states the task is in EXECUTING with owner valentina and an active claim by valentina. The test setup `toExecuting()` advanced the task to EXECUTING but did not create a claim by valentina. Without a claim, alejandra's claim attempt was rejected by owner-match (AUTHORITY_VIOLATION) instead of claim-availability (ALREADY_CLAIMED).
- Contract evidence: `.araya/relay/acceptance-test-spec.md` T-001: "Given task RELAY-001 in EXECUTING with owner valentina (SPECIALIST) and active claim by valentina". `.araya/relay/claim-contract.md`: claim availability precedes owner-match.
- Correction: Added `claimAck(dir, "RELAY-001", "valentina")` after `toExecuting(dir)` in the T-001 test block, creating the active claim required by the spec.

### Failure 2: T-001 version unchanged
- Classification: TEST_EXPECTATION_DEFECT
- Root cause: The test asserted `version === 4`. After the ASSIGN event bumps version 1→2 during init, the correct post-transition version after toExecuting (init→ASSIGN, manu DONE, aurora DONE, sonia DONE) is 5, not 4. The assertion was written pre-fix when ASSIGN did not bump version.
- Contract evidence: `.araya/relay/event-schema.json`: state-changing events increment version; `task_version_after == task_version_before + 1`. `motor.ts init()`: ASSIGN event with `task_version_before: 1, task_version_after: 2`.
- Correction: Changed assertion from `version === 4` to `version === 5`.

### Failure 3: T-003 version unchanged
- Classification: TEST_EXPECTATION_DEFECT
- Root cause: The test asserted `version === 1` after init. After the ASSIGN event bumps version 1→2 during init, the correct version is 2, not 1.
- Contract evidence: Same as Failure 2 — ASSIGN event increments version 1→2.
- Correction: Changed assertion from `version === 1` to `version === 2`.

### Failure 4: T-008 9 transition events
- Classification: TEST_EXPECTATION_DEFECT
- Root cause: The test filtered events for `["DONE", "PASS", "VERIFIED", "ACCEPT", "CLOSE"]` which yields 8 events. The acceptance specification (T-008) states "9 events in events.jsonl (one per transition)". The spec's 9 events include ASSIGN (creation) + 8 functional transitions. The filter excluded ASSIGN.
- Contract evidence: `.araya/relay/acceptance-test-spec.md` T-008: "9 events in events.jsonl (one per transition)" and "task.version == 10". `event-schema.json`: ASSIGN is a valid event_type.
- Correction: Added "ASSIGN" to the filter array: `["ASSIGN", "DONE", "PASS", "VERIFIED", "ACCEPT", "CLOSE"]`.

### Failure 5: NEG evidence modification detectable (exactly -1)
- Classification: TEST_EXPECTATION_DEFECT
- Root cause: The test removed two lines from the event log (once in an IIFE, once in a separate block) but expected `countAfter === countBefore - 1`. The double removal produced `countBefore - 2`, failing the assertion.
- Contract evidence: `.araya/relay/acceptance-test-spec.md` T-023: "Event log is append-only" — tampering is detectable. The test's intent is to show that removing exactly one event is detectable.
- Correction: Removed the second line-removal block, keeping only the IIFE that removes exactly one event.

### Failure 6: T-025 motor rejects appending after gap
- Classification: TEST_HARNESS_DEFECT
- Root cause: The store probe script used `await import()` at the top level with `npx tsx -e`. tsx compiles with CJS output format, which does not support top-level await. The probe script failed with `ERROR: Top-level await is currently not supported with the "cjs" output format` before reaching the `appendEvent` call. The store implementation (`store.ts appendEvent`) correctly checks for sequence gaps and throws `SEQUENCE_GAP`, but the probe never executed it.
- Contract evidence: `.araya/relay/acceptance-test-spec.md` T-025: "sequence gap detected: expected 4, got 5". `store.ts appendEvent()`: `const expectedSeq = events.length + 1; if (event.sequence !== expectedSeq) throw new RelayError("SEQUENCE_GAP", ...)`.
- Correction: Changed `await import(...)` to `require(...)` in the storeScript, which is supported by tsx's CJS output format.

## Iterations Performed
- Iteration 1: Applied all six test corrections (5 test-expectation defects + 1 test-harness defect). Ran acceptance suite: 70/70.

## Files Changed
- `tests/relay-motor-acceptance-test.js` — 5 insertions, 6 deletions

## Test Changes and Justification
1. T-001: Added `claimAck(dir, "RELAY-001", "valentina")` — creates the active claim required by acceptance-test-spec.md T-001.
2. T-001: Changed `version === 4` → `version === 5` — post-ASSIGN baseline per event-schema.json versioning rules.
3. T-003: Changed `version === 1` → `version === 2` — post-ASSIGN baseline per event-schema.json versioning rules.
4. T-008: Added "ASSIGN" to event filter — spec T-008 requires 9 events including ASSIGN.
5. NEG: Removed duplicate line-removal — test expects exactly -1, not -2.
6. T-025: Changed `await import()` to `require()` — CJS compatibility with tsx.

No source files (`src/`) were modified. No implementation changes were needed — all failures were test defects.

## Commands and Exit Codes
| Command | Exit Code |
|---|---|
| `npx tsc --skipLibCheck` | 0 |
| `node tests/relay-motor-acceptance-test.js` | 0 (70/70) |
| `node tests/test-operations-test.js` | 0 (27/27) |
| `node tests/req-043-test.js` | 0 (31/31) |
| `git diff --check` | 0 |

## Final Acceptance Result
- 70 passed, 0 failed, 70 total

## Final Regression Result
- test-operations-test.js: 27 passed, 0 failed
- req-043-test.js: 31 passed, 0 failed

## git diff --check Result
- exit 0 (clean)

## Unrelated Modifications
- None. Only `tests/relay-motor-acceptance-test.js` was modified.

## Remaining Discrepancies
- None. All 70 acceptance assertions pass. TypeScript compilation passes. All relevant regression suites pass.

## Pi Runtime and Consumption
- PI_PROVIDER: poolside
- PI_MODEL: poolside/laguna-s-2.1
- PI_REASONING_LEVEL: off
- PI_SESSION_ID: 019f9eb8-3147-78a7-bed2-fc51ec69e71e
- PI_CODING_AGENT: true
