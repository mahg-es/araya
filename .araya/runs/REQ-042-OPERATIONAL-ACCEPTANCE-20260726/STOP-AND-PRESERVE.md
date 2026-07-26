# STOP-AND-PRESERVE — REQ-042 Operational Acceptance

**Authorized by:** ponny-express-10012 (STOP_AND_PRESERVE)
**Recorded:** 2026-07-26
**Executor:** Daneel (Relay Controller) — pi.dev 0.82.1, `kimi-k3`/`moonshotai` (Pi-runtime supplied)

## ⚠️ WIP — UNACCEPTED — MUST NOT BE MERGED

This checkpoint preserves **work in progress**. It has **no gates** (no Clara DONE, no Teresa PASS, no Rolando VERIFIED), **no PR**, and is **not acceptable for merge**. The acceptance suite is **64/70 — 6 tests still failing**. Any future merge of this branch requires completing the failing tests and the full REQ-042 FASE 3-9 protocol.

## Branch and HEAD

- Branch: `feature/req-042-relay-motor-mvp`
- HEAD before this commit: `4ed9347` (chore(gates): preserve PR #89 v2 gate evidence — merged via PR #89 as `1997164`)
- Remote base: `origin/dev-mahg` = `1997164`

## Files preserved (staged in this commit)

Modified:
- `src/cli.ts` (+4: relay subcommand route)

Untracked (new):
- `src/araya/relay/types.ts` — Task/Event/Claim types per `.araya/relay/` schemas; LIMITS; RelayError
- `src/araya/relay/workflow-standard-delivery.ts` — executable twin of `workflow.yaml` (standard-delivery, 9 states)
- `src/araya/relay/store.ts` — persistence: O_EXCL flock + stale reclaim, optimistic version, atomic rename, append-only JSONL with sequence-gap + idempotency dedup
- `src/araya/relay/motor.ts` — state machine: init/inbox/claim/ack/returnBall/control/status; authority registry (active/dormant/retired; professor built-in); evidence/message gates; ASK/BLOCK suspension + RESOLVE; attempts(1/2) & replanning(0/2) limits → BLOCKED; dispatchAuthority map; owner-match enforcement; CLAIM/ACK excluded from events.jsonl (claim lifecycle in task.claim + notifications); ASSIGN bumps version 1→2
- `src/araya/relay/cli.ts` — the six canonical commands: init, inbox, claim, ack, return, status (+ control for RESOLVE/ESCALATE/RELEASE/NOTE)
- `tests/relay-motor-acceptance-test.js` — executable acceptance suite T-001..T-033 + FASE 3 negative cases (70 assertions)

## Implemented components (status)

| Component | State |
|---|---|
| Relay state machine (9 states + ASK/BLOCKED) | implemented, compiling |
| Claim system (active/acknowledged/released/expired, ack timeout 300s, lease 3600s, force-release, abandoned guard) | implemented |
| Concurrency (flock, optimistic version, atomic rename) | implemented |
| Evidence gates (DONE/PASS/VERIFIED/ACCEPT; ASK/BLOCK/FAIL/DISCREPANCY/REJECT messages) | implemented |
| Idempotency (idempotency_key dedup) | implemented + T-024 passing |
| Sequence monotonic no-gaps (append-level) | implemented + store-level test |
| Retired-agent rejection pre-persistence (giskard) | implemented + T-030 passing |
| Dormant/unknown actor rejection (fail closed) | implemented + passing |
| Authority enforcement (owner match per state; daneel never owner) | implemented + T-002/T-006 passing |
| CLI six commands + JSON output | implemented |
| TSC build | **last successful: `npx tsc --skipLibCheck` — exit 0 (2026-07-26, before this commit)** |

## Last acceptance result

`node tests/relay-motor-acceptance-test.js` → **64 passed, 6 failed, 70 total** (2026-07-26).

## The six failing tests (exact)

1. **T-001 second claim rejected** — error class mismatch after reordering claim checks (availability BEFORE owner-match): alejandra's claim now fails owner-match (`AUTHORITY_VIOLATION`) instead of the spec's `ALREADY_CLAIMED`; ordering needs review (spec expects the claim-availability rejection to fire first for the assigned owner's claim — but alejandra is not the assigned owner; semantics to decide: check availability against ANY claimant first, owner-match second — current code does that, so the first claim by valentina must be re-examined: likely the FIRST claim failed because `assertCanActOnState` requires actor === task.owner.actor and manu was claiming at INTENT where owner IS manu — should pass; needs debugging).
2. **T-001 version unchanged** — asserts `version === 4` but contract-correct flow now bumps ASSIGN 1→2 (pre-fix constant); assertion must be updated to the corrected baseline (was written pre-fix).
3. **T-003 version unchanged** — same stale baseline: asserts `version === 1`, contract now creates at version 2 after ASSIGN.
4. **T-008 9 transition events** — filter counts `[DONE,PASS,VERIFIED,ACCEPT,CLOSE]` = 8; spec's "9 events" includes ASSIGN (creation) + 8 transitions; assertion/filter must include ASSIGN, or version expectation must be re-derived from the contract (ASSIGN bumps to 2, then 8 transitions → 10 ✓ version was already correct at 10 after fix; the count assertion is the stale one).
5. **T-025 motor rejects appending after gap** — `npx tsx -e` harness output carries `npm notice` noise; the SEQUENCE_GAP check is correct (store-level) but the assertion reads polluted stdout; harness must isolate the eval output (or write the probe as a temp .ts file and run it).
6. **NEG evidence modification detectable (exactly -1)** — count arithmetic after re-ordering the tamper-read sequence; `countBefore`/`countAfter` comparison off by one of the read points (the events listing route recomputes sequences? verify whether `status --events` reads raw log or rebuilt view).

## Remaining mandatory phases (ponny-express-10009)

1. Fix the 6 failing tests (suite exit 0).
2. Run records 00-entry-gate, 01-acceptance-matrix, 02-implementation-plan.
3. FASE 3 full battery + regression; commit; push; candidate X.
4. FASE 6 PR: Clara DONE, Teresa PASS, Rolando VERIFIED on X; evidence-only Y; merge to dev-mahg; post-merge audit.
5. FASE 4/5 pilot ARAYA-E2E-ACCEPTANCE-20260726 (full agent lifecycle to DONE + demos 5.1-5.8).
6. FASE 7 portfolio PR `feature/araya-e2e-operational-acceptance` + gates + merge to dev-araya-portfolio.
7. FASE 8 certificate `06-operational-certificate.md`.
8. FASE 9 `07-pms-handoff.md` + `NEXT-PROMPT-MAHG-PMS.md`.
9. Final report in mandated format.

## Known semantic uncertainties (to resolve on resume)

- **attempts semantics**: implemented as `attempts.current` starts at 1, FAIL increments, BLOCKED when current > max (2). Matches T-009 (current==2 after first FAIL) and T-010 (BLOCKED at third FAIL). Re-confirm against Sonia/contract if challenged.
- **CLAIM/ACK in events.jsonl**: excluded (claim lifecycle in task.claim + notifications) to satisfy T-008 "9 events" (ASSIGN + 8 transitions). EXPIRE/RELEASE/ESCALATE remain in the log as controller events without version bump. Confirm this reading of workflow.yaml's event model.
- **ASSIGN version bump (1→2)**: chosen to make T-008 `version == 10` consistent with 9 logged events. If the contract intends version == event-count + 1, current implementation is right; verify at gates.
- **T-001 error class**: spec text "task already claimed by valentina" vs owner-match AUTHORITY_VIOLATION when a non-owner claims an unclaimed-but-assigned task. Decide which check fires first for each case and update test or motor accordingly.
- **REQUIRE "T-020 optimistic version"** coverage: currently asserted indirectly (T-022); a direct store-level concurrent-write test may be needed at gates.

## Commands required to resume

```bash
cd /home/thedataprofessor/github/mahg-es/araya
git worktree list  # confirm worktree
cd /home/thedataprofessor/github/mahg-es/worktrees/araya/req-042-motor
git status
npm ci                       # if node_modules was cleaned
npx tsc --skipLibCheck       # expect exit 0
node tests/relay-motor-acceptance-test.js   # currently 64/70 — fix the 6 listed above
# then follow "Remaining mandatory phases" 2→9 under ponny-express-10009
```

## Explicit non-merge statement

This WIP commit exists ONLY to preserve work. It is **not gated, not accepted, not complete** (64/70), and **MUST NOT be merged** into `dev-mahg` or any other branch until the six failing tests pass and the complete REQ-042 protocol (FASE 3-9, gates on exact SHA, evidence-only diffs) is satisfied.
