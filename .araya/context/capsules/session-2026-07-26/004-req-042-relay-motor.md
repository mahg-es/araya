# 004 — REQ-042: Relay Motor MVP
> Capsule ID: 004 | Initiative: req-042 | Status: REGISTERED (unblocked)
> Session: 2026-07-26 | Framework HEAD: 0902ac6 | Token budget: ~2000

---

## Status: 🟡 REGISTERED — Motor NOT built

**Registration:** PR #291 (`mahg-es/araya-portfolio`) — MERGED
**Merge commit:** `af0c2b5cc944d48c85aa159e2366cb85cf9e7b19`
**Verification:** Rolando PE-0012: 4/4 VERIFIED

---

## Requirement File

**Location:** `portfolio/projects/araya-portfolio/requirements/req-042-araya-relay-motor-mvp.md`
**Size:** 57 lines | **Status:** `new`

The requirement registers the need to build the Relay Motor: the runtime engine that executes the Relay state machine, manages claims/concurrency (flock+version+atomic rename), dispatches events, enforces invariants, and provides the inbox/outbox infrastructure for agent task routing.

---

## Dependencies

| Dependency | Status | Blocker? |
|-----------|--------|----------|
| Relay Protocol design | ✅ IMPLEMENTATION-READY (PR #78→#79, 33 tests) | — |
| REQ-043 (Source hierarchy) | ✅ DELIVERED (PR #81) | — |
| Agent & Skill Contract v1.0.0 | ✅ PUBLISHED | — |
| Relay Participant Contract v1.0.0 | ✅ PUBLISHED | — |
| Teresa/Clara identity (F-001) | 🔴 NOT RESOLVED | 🟡 Blocks TESTING state in motor |
| Giskard references (F-003) | 🔴 NOT RESOLVED | 🔴 Blocks Relay T-030 |

---

## What the Motor Must Implement

From the 33 acceptance tests in `.araya/relay/acceptance-test-spec.md`:

1. **Task lifecycle:** Create → INTENT → ROUTING → PLANNING → EXECUTING → TESTING → VERIFYING → ACCEPTING → CLOSING → CLOSED
2. **Claim system:** flock, version check, ACK timeout (300s), force-release
3. **Concurrency:** atomic rename, idempotency keys, version tracking
4. **ASK/BLOCK:** owner suspension, Daneel dispatch, RESOLVE → return to suspended state
5. **Self-approval prevention:** 5 conflict checks
6. **Evidence gates:** DONE/PASS/VERIFIED/ACCEPT must carry evidence
7. **Event store:** append-only, immutable, JSON Schema 2020-12 validated
8. **Inbox/Outbox:** per-agent directories under `.araya/relay/runtime/`

---

## Completion Criteria (estimated)

| Criterion | Status |
|-----------|--------|
| Requirement registered | ✅ PR #291 merged |
| Relay protocol design approved | ✅ VERIFIED WITH OBSERVATION |
| Blockers resolved (F-001, F-003, PE-0007) | 🔴 PENDING |
| Motor implemented | 🔴 NOT STARTED |
| Acceptance tests (33) all passing | 🔴 NOT STARTED |
| Rolando verification | 🔴 PENDING |

**Estimated completion:** ~10% (registration + design only)

---

> **Capsule generated:** 2026-07-26 | Sonia (PM Head Orchestrator)
> **Sources:** PE-0012 Rolando verification, session-2026-07-26 capsule, relay/acceptance-test-spec.md
