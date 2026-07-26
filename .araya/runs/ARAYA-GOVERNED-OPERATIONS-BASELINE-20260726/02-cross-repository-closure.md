# 02 — Cross-Repository Closure — ARAYA-GOVERNED-OPERATIONS-BASELINE-20260726

PHASE 1 (portfolio PR #296, merge `e1963b7`).

## Mandated end-state counts (gate-verified)

| Count | Value | Evidence |
|---|---|---|
| active Portfolio routes to Giskard | 0 | validator PASS; Teresa PASS; Rolando VERIFIED @ `8a62f6c` |
| active Portfolio assignments to Giskard | 0 | same |
| active Portfolio governance authority for Giskard | 0 | C-01 rewritten (Professor-only tag/release authority; no agent transfer) |
| Framework/Portfolio PostOffice drift | 0 | sync manifest + `test_postoffice_canonical_sync.py` (local hash == recorded; canonical-at-SHA check) |
| installed helper drift | pending PHASE 13 | libexec sync after all source merges |

## Actions

1. C-01 corrected in `index.md` + `REQ-MANIFEST.md` (same change, per convention).
2. PostOffice canonical ownership: **Framework owns** (`mahg-es/araya src/postoffice_loop.py` @ `5fb822c`); Portfolio consumes synchronized derivative. Pre-sync delta: 2 cosmetic lines (deliberate reconciliation, recorded in `.araya/governance/postoffice-canonical-source.json`).
3. Queue invalidation: **127** live giskard-recipient/sender messages superseded (collective carrier MSG-20260726-103024-98a5407e; two-pass 68+59 after 3 legacy non-canonical IDs bypassed `find_message` via direct frontmatter rewrite — recorded); **26** completed exchanges archived. Rolando reconciled 124 index events + 3 legacy = 127.
4. Fixtures renamed (3 suites) — Giskard no longer an ordinary actor.
5. `retired-agents.json` + `operational_reference_validator.py` synchronized into portfolio; `test_retired_agent_guard.py` (6 tests).
6. REQ-046 registered (Governed Operations) + indices updated (28 professor-authored / 52 total).

## Gates

Teresa **PASS**, Rolando **VERIFIED** on `8a62f6c87bf788cd1ba6c7a6e7a1e31bf5f6d861`. Merge `e1963b7`.
