# 04 — Operation Catalog — ARAYA-GOVERNED-OPERATIONS-BASELINE-20260726

Canonical catalog: `operations/*.yaml` + `src/araya/operations/registry.ts` (not a second general catalog — domain catalog consumed by CLI `/araya:man` extension in PR-F2).

## Registered operations (18)

| Operation | Status | Adapters | Purpose |
|---|---|---|---|
| git.merge-gate | active | cli, pi-custom-tool, pi-slash-command | PR merge predicate |
| git.repository-sanity | active | cli, pi-custom-tool, pi-slash-command | read-only repo inspection |
| git.sync-integration | active | cli | ff-only integration sync (fail closed) |
| git.feature-start | active | cli | authorized worktree+branch (dry-run) |
| git.feature-pr-gate | active | cli | pre-PR validation |
| test.relay-unit | active | cli, pi-custom-tool, pi-slash-command | postoffice unit suite |
| test.relay-integration | active | cli, pi-custom-tool, pi-slash-command | session/sync integration suites |
| test.relay-behavior | active | cli, pi-custom-tool, pi-slash-command | behavior lifecycle suite |
| test.relay-recovery | active | cli, pi-custom-tool, pi-slash-command | interruption/recovery suite |
| test.relay-idempotency | active | cli, pi-custom-tool, pi-slash-command | duplicate-protection suites |
| operation.resolve | active | cli, pi-custom-tool, pi-slash-command | deterministic intent resolution |
| operational-acceptance.entry-gate | active | cli | PHASE 14 composition gate |
| git.promote-dev-to-main-gate | design-only | — | future, non-writing |
| release.readiness-gate | design-only | — | future, non-writing |
| release.tag-plan | design-only | — | future, non-writing |
| release.release-plan | design-only | — | future, non-writing |
| git.stale-branch-audit | design-only | — | future, non-writing |
| git.stale-branch-cleanup | design-only | — | future, non-writing |

## Discovery paths

- `araya operation list|describe|resolve|execute --json` (CLI adapter)
- `/araya:man --list operations`, `/araya:man --operation <id>`, `/araya:man --search <intent>` (PR-F2 slash adapter)
- `araya_operation_resolve`, `araya_operation_describe` Pi custom tools (PR-F2)

## Canonical test.suite mapping (until REQ-042 delivers true Relay motor suites)

| Operation | Suite command(s) |
|---|---|
| test.relay-unit | `python3 tests/test_postoffice_loop.py` |
| test.relay-integration | `python3 tests/test_session_identity.py && python3 tests/test_sync_postoffice.py` |
| test.relay-behavior | `python3 tests/test_giskard_retirement.py` |
| test.relay-recovery | `python3 tests/test_sync_postoffice.py` |
| test.relay-idempotency | `python3 tests/test_postoffice_loop.py && python3 tests/test_giskard_retirement.py` |

Recorded mapping decision: PostOffice/session/retirement suites are the operational backbone of Relay messaging until the Relay Motor exists (REQ-042). Not presented as Relay-motor tests.
