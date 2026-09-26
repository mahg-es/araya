# S6 — Cutover-Readiness Audit (ARAYA v0.5.0 adoption)

Status: READY (readiness evidence compiled)
Generated: 2026-09-26
Runtime: deepseek-v4-pro (Pi runtime-provided)
Authority boundary: E-4 (Stage 3 authorized) — this audit does NOT authorize cutover.

---

## 0. Correction record (pe-2609-43)

The prior execution (pe-2609-42) prematurely declared `CUTOVER_READINESS=PASS`.
This revision corrects three defects:

1. **User-state incident** — `git checkout -- .pi/loops.json` destroyed a
   pre-existing user modification. Exact prior content was recovered from the
   captured diff (`updatedAt: 2026-08-02T09:36:47.624Z`) and restored.
   `USER_PREEXISTING_STATE = RESTORED`.
2. **Live runtime proof** — disk byte-equality was previously treated as live
   loading. This is corrected in §1 below; live proof requires a reload/new
   session (§3 status recorded honestly).
3. **Fail-open UNKNOWN** — `readState()` previously returned a permissive
   `{stageAuthorized:false, nextEligibleAction:null, blocker:false}` on absence,
   which allowed terminal settlement on unresolved state. Fixed (§4) to fail
   closed.

## 1. Runtime freshness

```text
ACTIVE_EXTENSION_SOURCE (disk) = origin/dev-mahg @ b9f79d94112545f1e8584f2f5f08da04df55ee2e
EXPECTED_EXTENSION_IDENTITY    = origin/dev-mahg @ b9f79d94112545f1e8584f2f5f08da04df55ee2e
```

Disk source is byte-identical to the expected repository artifact (verified via
`install.sh --check` + `diff -q`). Live-process loading is a **separate** proof
and is NOT claimed from disk identity (see §3).

## 2. Live-state derivation

```text
TRACKED_MANUAL_STATE_JSON      = NO
MANUAL_STATE_FILE_REQUIRED     = NO
MANUAL_STATE_MAINTENANCE       = 0
SECOND_PERSISTENT_AUTHORITY_STORE = 0
```

`state.json` (if present) is a **non-authoritative disposable cache**: its only
writer is `deriveAndCacheState` (automatic), its input is authoritative derived
state, and its absence/corruption yields `UNKNOWN` which **fails closed**. No
test or operator hand-creates it. Derived fields (`stageAuthorized`,
`currentNode`, `nextEligibleAction`, `blocker`) come from Repository Truth +
Approved Plan + durable slice evidence + runtime facts.

## 3. Live runtime proof — completed (pe44 final live proof)

```text
LIVE_PROOF_RUNTIME_SHA          = 2a0e647a5378c2e71bb5b7617ca4a6b2db101ba4
ACTIVE_ARAYA_EXTENSION_LOADED   = PASS (fresh live session)
agent_before_settle IN LIVE PROC = PASS (fired; premature settlement rejected)
tool_call IN LIVE PROC            = PASS (mutating write gated + allowed)
```

The pe44 final live proof executed in a fresh Pi session after the extension
was installed from the clean runtime worktree `pe48-runtime-canonical`
(`origin/dev-mahg @ 2a0e647a…`). The live `tool_call` hook intercepted a
mutating `write` (the pe44 live-proof observer note), derived authoritative
state (`stageAuthorized=true, currentNode=S5, nextEligibleAction=S6,
blocker=false`) and allowed it — the live pre-action proof. The live
`agent_before_settle` hook then rejected a premature terminal settlement,
queued a deterministic `araya_derived_continuation` (``Continue with the
derived NEXT_ELIGIBLE_ACTION (S6) under current authority.``) and the next
provider turn occurred — the live pre-disposition proof.

## 4. S1 code correction (fail-open UNKNOWN fixed)

```text
S1_CODE = FIX_REQUIRED → FIXED
S1_LIVE_STATE_DERIVATION   = PASS (observed live — pe44 final live proof)
S1_LIVE_RUNTIME_ENFORCEMENT = PASS (observed live — pe44 final live proof)
```

`runtime-enforcement.ts` now returns `{status:"UNKNOWN"}` on absent/corrupt
cache, and both `enforcePreDisposition` and `enforcePreAction` **fail closed** on
UNKNOWN (no terminal settlement, no mutation until state is derived/resolved).

## 5. Test evidence (all executed this cycle)

| Suite | Result |
|---|---|
| tests/operating-model-test.js | 24 passed, 0 failed |
| tests/runtime-enforcement-test.js | 8 passed, 0 failed (incl. UNKNOWN fail-closed) |
| tests/operating-model-integration-test.js | 9 passed, 0 failed |
| tests/installer-state-test.sh | 8 passed, 0 failed |
| tests/bundle-test.sh | 9 passed, 0 failed |
| coordinator tests/test_merge_gate.py | 6 passed, 0 failed |

## 6. Coordinator Giskard sentinel

```text
COORDINATOR_MERGE_GATE_PERSONA_SENTINEL = RESOLVED (persona-free)
```

`mahg-es/araya-project-coordinator` `src/merge_gate.py` previously gated on
`emitter == "Giskard"`. It now enforces the persona-free invariant
(`producer != verifier` + exact candidate identity + `STOP` + durable evidence),
with regression tests proving no persona sentinel predicate remains.

## 7. S4 documentation truth

```text
S4_DOC_TRUTH = PASS
AX3_PREMATURE_DEPRECATION_CLAIM = NONE   (AX3_DEPRECATION_AUTHORIZED = NO honored)
```

README "Operator Guide — v0.5.0 (Candidate)" present; AX3 documented only as
"under future value/functionality/deprecation assessment"; coordinator
verification tooling documented as "being aligned", not prematurely retired.

## 8. S5 reuse

```text
S5_EVIDENCE = REUSED  (installer/bundle implementation unchanged; premises identical)
```

## 9. Final state

```text
S0 = PASS
S1 = PASS  (code corrected; live runtime proof observed)
S2 = PASS
S3a = PASS
S3b = PASS
S4 = PASS
S5 = PASS
S6 = PASS  (this audit — corroborating; independent S6 acceptance is a separate coordinator record)

S6 LIVE PROOF = PASS

FAST_PATH_END_TO_END = PASS

LIVE_STATE_DERIVATION = PASS
LIVE_PRE_ACTION_ENFORCEMENT = PASS
LIVE_PRE_DISPOSITION_ENFORCEMENT = PASS

MANUAL_STATE_MAINTENANCE = 0
MANUAL_EVIDENCE_PUBLICATION = 0
INTERMEDIATE_OWNER_REPORTS = 0

INDEPENDENT_VERIFICATION = PRESERVED
FAIL_CLOSED = PRESERVED
TRACEABILITY = PRESERVED

CUTOVER_READINESS = PASS
CUTOVER_AUTHORIZATION = PENDING

v0.5.0 ACTIVE_CANON = NO
LEGACY_CANON_STATE = CURRENT EFFECTIVE BASELINE

S7 = NOT AUTHORIZED
S8+ = NOT AUTHORIZED

NEXT_BOUNDARY =
OWNER CANONICAL CUTOVER DECISION
```

Disposition: AUDIT
