# 01 — Reference Inventory — GISKARD-RETIREMENT-ENFORCEMENT-20260726

Scan: `git grep -ni giskard` on tracked files @ `395f622` (120 matches), semantic classification per ponny-express-10008 FASE 1.

## Summary by class

| Class | Count (approx.) | Items |
|---|---|---|
| HISTORICAL_ALLOWED | ~75 | PE specs (ponny-express-0002/0007/0009/0012, pr-80-reverify, req-043-aurora-matrix, req-001-daneel-verification, rolando-reality-audit-v2), thread.md, v1+v2 capsules, CANONICAL-CONTEXT (retirement-marked), contract v1 Gate 4 text, run records |
| NEGATIVE_TEST_ALLOWED | ~20 | `.araya/relay/acceptance-test-spec.md` (T-030/T-031), `tests/canonical-context-test.js`, `tests/req-043-test.js` (Gate 4), new `tests/test_giskard_retirement.py` |
| SUPERSEDED_ALLOWED | 2 | `.araya/plan/requirements/req-001.md:229` (closed-req template placeholder "Daneel/Giskard"); efficiency capsule session-2026-07-26 (findings record — banner added) |
| OPERATIONAL_INVALID → corrected | 5+2 | (1) `.araya/postoffice/outbox/MSG-20260725-183610-271c5427.md` (`to: giskard`, `status: new`) → SUPERSEDED (FASE 2); (2) `.araya/postoffice/PROTOCOL.md:291` (present-tense "Giskard may not see the report") → rewritten to "the active coordinator (Daneel)"; (3) `.araya/efficiency/capsules/session-2026-07-25.md` (present-tense coordinator claims) → NON-OPERATIONAL banner added; (4–6) `tests/test_postoffice_loop.py`, `tests/test_session_identity.py`, `tests/test_sync_postoffice.py` positive fixtures using Giskard as actor → renamed to active agent (Sonia) |
| AMBIGUOUS → resolved | 0 remaining | — |

## Detailed correction register

| Path | Line(s) | Tracked | Semantic role | Status before | Classification → Correction |
|---|---|---|---|---|---|
| `.araya/postoffice/outbox/MSG-20260725-183610-271c5427.md` | 6 (`to: "giskard"`) | tracked @395f622 (PR #83) | message recipient | `new` (live) | OPERATIONAL_INVALID → `superseded` via new canonical mechanism; replaced by MSG-20260726-083823-4d3ad179 (`to: daneel`) |
| `.araya/postoffice/PROTOCOL.md` | 291 | tracked | protocol doc consumer | present-tense Giskard | OPERATIONAL_INVALID → text corrected; schema extended (superseded status, supersession fields, guard) |
| `.araya/efficiency/capsules/session-2026-07-25.md` | 15, 109, 126-127 | tracked | capsule authority table | present-tense, CANONICAL-marked | OPERATIONAL_INVALID (unmarked) → SUPERSEDED banner prepended (explicit non-operational marking; content untouched) |
| `tests/test_postoffice_loop.py` | 43,63,89,110,131,168,197,216,224,247,271,304,322 | tracked | positive fixtures | `to/from="Giskard"` as normal actor | OPERATIONAL_INVALID (normalizes retired actor as routable) → fixtures renamed to `Sonia` |
| `tests/test_session_identity.py` | 179,198,349 | tracked | positive fixtures | same | same correction |
| `tests/test_sync_postoffice.py` | 93,279,281,295 | tracked | positive fixtures + fixture msg `to: "Giskard"` | same | same correction (fixture ids `MSG-sonia`) |
| `.araya/plan/requirements/req-001.md` | 229 | tracked | closed-req placeholder | `[date by Daneel/Giskard]` | SUPERSEDED_ALLOWED (requirement COMPLETED 2026-07-25; placeholder never activated) — no edit (evidence) |
| `.araya/plan/spec/ponny-express-0012-rolando-verification.md` | 6, 133 | tracked | report addressee | "Report to: Giskard" | HISTORICAL_ALLOWED (closed dated report; pattern eliminated by this cycle's guard) |
| `.araya/plan/spec/pr-80-reverify-rolando-report.md` | 154 | tracked | report addressee | same | HISTORICAL_ALLOWED |
| `.araya/plan/spec/rolando-reality-audit-v2.md` | 500 | tracked | report addressee | same | HISTORICAL_ALLOWED |

## Cross-repo note (portfolio)

Portfolio repo carries the same Python tool + fixtures and governance lines referencing Giskard decisions (e.g. conflict-resolution C-01 "Giskard decides tags by durable delegation" in `index.md`/`REQ-MANIFEST.md`; historical AGENTS.md notes already marked "terminated"). This cycle's PR is framework-only per FASE 6; portfolio remediation is registered in `06-open-questions.md` (Q1) for a follow-up governed PR.
