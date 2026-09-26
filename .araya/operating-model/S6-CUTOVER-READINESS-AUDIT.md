# S6 — Cutover-Readiness Audit (ARAYA v0.5.0 adoption)

Status: READY (readiness evidence compiled)
Generated: 2026-09-26
Runtime: deepseek-v4-pro (Pi runtime-provided)
Authority boundary: E-4 (Stage 3 authorized) — this audit does NOT authorize cutover.

---

## 1. Runtime freshness

```text
ACTIVE_EXTENSION          = origin/dev-mahg @ b9f79d94112545f1e8584f2f5f08da04df55ee2e
EXPECTED_EXTENSION        = origin/dev-mahg @ b9f79d94112545f1e8584f2f5f08da04df55ee2e
RUNTIME_FRESHNESS         = CURRENT
```

The active extension (`~/.pi/agent/extensions/araya/index.ts`) was a broken
symlink into a deleted `/tmp/araya-runtime-refresh.*` directory. The supported
reload mechanism (`install.sh`) was used to re-link it to the canonical
repository source, and `diff -q` confirms byte-identity with the repository
artifact at `b9f79d9`.

## 2. Live-state derivation

```text
TRACKED_MANUAL_STATE_JSON      = NO        (.araya/operating-model/state.json is gitignored, not tracked)
MANUAL_STATE_MAINTENANCE       = 0
SECOND_PERSISTENT_AUTHORITY_STORE = 0
LIVE_STATE_DERIVATION          = PASS
```

Derived fields and their sources:

- `stageAuthorized`  ← stage authority from Approved Plan + current directive chain (E-4)
- `currentNode`      ← furthest completed node from durable evidence (S0→S3b)
- `nextEligibleAction` ← DAG successor of `currentNode` (S4→S5→S6)
- `blocker`          ← absence of unresolved evidence/authority gap

The `state.json` on disk after test execution is a transient, reconstructable,
gitignored cache — not an authority store (see `runtime-enforcement.ts`
`readState`/`deriveState` in `src/araya/operating-model/`).

## 3. Fast Path proof (observed)

```text
LIVE_PRE_DISPOSITION_ENFORCEMENT = PASS   (agent_before_settle hook wired in extensions/araya/index.ts:274)
LIVE_PRE_ACTION_ENFORCEMENT      = PASS   (tool_call hook wired in extensions/araya/index.ts:284)
FAST_PATH_CONTINUATION           = PASS   (premature settlement rejected; continue=true when next eligible)
```

Test evidence (all executed this cycle):

| Suite | Result |
|---|---|
| tests/operating-model-test.js | 24 passed, 0 failed |
| tests/runtime-enforcement-test.js | 5 passed, 0 failed |
| tests/operating-model-integration-test.js | 9 passed, 0 failed |
| tests/installer-state-test.sh | 8 passed, 0 failed |
| tests/bundle-test.sh | 9 passed, 0 failed |

## 4. Stage state

```text
S0  = PASS
S1  = PASS  (subject to live-derivation proof above)
S2  = PASS
S3a = PASS
S3b = PASS  (evidence reused; installer/bundle tests re-run 8+9 passed)
S4  = PASS  (operator documentation completed — see README "Operator Guide — v0.5.0 (Candidate)")
S5  = PASS  (genuinely isolated UAT — see §5 below)
S6  = PASS  (this audit)
```

## 5. S5 isolated UAT evidence

Executed in a genuinely isolated `mktemp -d` root with a fresh `$HOME`:

```text
FRESH_MACHINE_ISOLATION_PROVEN      = YES
FRESH_MACHINE_INSTALL               = PASS   (MISSING → materialized canonical installer)
EXISTING_MACHINE_INSTALL            = PASS   (PRESENT → REUSE, no overwrite)
NEGATIVE_UAT                        = PASS   (wrong external SHA-256 → REJECT, exit 2)
PORTABLE_BUNDLE_UAT                 = PASS   (MANIFEST.sha256 validates; embedded installer byte-identical)
NO_PRODUCER_MACHINE_PATH_DEPENDENCY = PASS   (no /home/… producer path in bundle contents)
```

## 6. Stale verification predicate resolution

Coordinator `Giskard` is retired (2026-07-20; `.araya/governance/retired-agents.json`,
operational authority = none). Active runtime verification is persona-free:

- `verifyCapability` (S1) requires only `producer != verifier` + exact candidate
  SHA + `STOP` + durable evidence — no persona names required.
- `operating-model.verify-capability` handler enforces a `persona_free` check
  rejecting `teresa|rolando|giskard` as verifier identities.
- Remaining `giskard` references in active runtime paths are retirement
  enforcement (test_giskard_retirement.py, co-author trailer exclusion) — not
  coordinator coupling affecting governed execution.

```text
STALE_VERIFICATION_PREDICATE_RESOLVED = YES
GOVERNED_EXECUTION_GISKARD_COUPLING   = NONE
```

## 7. Final state

```text
S0 = PASS
S1 = PASS
S2 = PASS
S3a = PASS
S3b = PASS
S4 = PASS
S5 = PASS
S6 = PASS

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
