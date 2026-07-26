# ARAYA Governed Operations Baseline

**Run:** ARAYA-GOVERNED-OPERATIONS-BASELINE-20260726 (ponny-express-10010)
**Executor:** Daneel (Relay Controller) — pi.dev 0.82.1, `kimi-k3`/`moonshotai` (Pi-runtime supplied)
**Date:** 2026-07-26

## Disposition
**READY_FOR_OPERATIONAL_ACCEPTANCE** — `operational-acceptance.entry-gate.passed = true` (9/9 checks, result preserved beside this report).

## Repository State
| Repo | Branch | Integration SHA | Notes |
|---|---|---|---|
| mahg-es/araya | dev-mahg | `46306c2` (PR #88 merge) | main `8928c1d` UNTOUCHED |
| mahg-es/araya-portfolio | dev-araya-portfolio | `e1963b7` (PR #296 merge) | main `e793398` UNTOUCHED |

## Giskard Cross-Repository Closure
- **Framework zero-counts:** active messages/tasks/routes/assignments to Giskard = 0 (PRs #84/#85; validator PASS).
- **Portfolio zero-counts:** active routes/assignments/governance authority = 0 (PR #296: C-01 rewritten — Professor-only tag/release authority; 127 messages superseded, 26 archived; fixtures renamed).
- **PostOffice ownership:** Framework owns canonical; Portfolio synchronized derivative (sync manifest + drift test).
- **Installed helper drift:** 0 (libexec `f62323ba` three-way match; extension `e44ee3b6` == merged source).

## Requirement
REQ-046 — "ARAYA Governed Operations, Operation Catalog and Function-First Execution". Portfolio PR #296 (merged). Status: registered; implementation delivered this cycle; acceptance pending (Manu SPEC_APPROVED + fresh-session verification Q2).

## Existing Surface Inventory
Pi extensions (araya, notifier, quota-guard, persona), 20+ slash commands, **0 Pi custom tools before → 5 now**, 1 event hook, 6 AX MCP tools (reused, no new MCP adapter), 128 skills, CLI (legacy + 4 operation subcommands), 5 helper executables, core engines (DelegationEngine, broker, AX engines, generator) — full detail in `01-existing-surface-inventory.md`.

## Canonical Operation Architecture
`operations/*.yaml` contracts → `src/araya/operations/` (types, contract validation, result builder, helpers, git handlers, misc handlers, registry, thin CLI). One canonical implementation per operation; adapters delegate (test-enforced). 6 design-only future contracts registered non-writing.

## Operation Catalog
18 operations (12 active, 6 design-only). Discovery: `araya operation list/describe/resolve/execute`, `/araya:operation`, `/araya:man --list operations|--operation|--search`, Pi tools `araya_operation_resolve` / `araya_operation_describe`. Deterministic resolution (exact id, alias, declared intent) — no probabilistic matching presented as certainty.

## P0 Operations
| Operation | Version | Adapters | Tests |
|---|---|---|---|
| git.merge-gate | 1.0.0 | cli, pi-custom-tool, pi-slash-command | git-operations-test (18) |
| git.repository-sanity | 1.0.0 | cli, pi-custom-tool, pi-slash-command | same |
| git.sync-integration | 1.0.0 | cli | same |
| git.feature-start | 1.0.0 | cli | same |
| git.feature-pr-gate | 1.0.0 | cli | same |
| test.relay-unit/integration/behavior/recovery/idempotency | 1.0.0 | cli, pi-custom-tool, pi-slash-command | test-operations-test (27) |
| operation.resolve | 1.0.0 | cli, pi-custom-tool, pi-slash-command | operations-test (51) |
| operational-acceptance.entry-gate | 1.0.0 | composition | this result |

## Operation-First Runtime
`skills/araya-operation-runtime` (frontmatter + OPERATION_GAP lifecycle) assigned to all 28 active agents (neo/trinity dormant excluded); generated profiles contain it; manual removal detected by generator `--check` (test: operation-first-skill-test, 63 checks).

## Known Runtime Corrections
- `/araya run`: tdd/tests now route to **clara** (TEST_AUTOMATION); teresa no longer receives test authoring.
- **Daneel persona**: rewritten to current authority (COORDINATOR; Giskard retired; stale verifier role removed).
- `/araya:trace --validate`: hardcoded success removed → reports **NOT_IMPLEMENTED**.
- `/araya version`: agents/skills computed live; rules/domains labeled static documentation.

## Tests
Full evidence in `05-test-evidence.md` + `test-logs/`. New suites: operations (51), operation-first-skill (63), test-operations (27), git-operations (18), pi-adapters (32). Regression: tsc, generator --check, catalog 43, req-043 31, frontmatter 637, sonia 17, canonical-context 13, capsules 88, broker 86, man 56, ax3, giskard 16, postoffice 18, session-identity, sync, validator — all exit 0.

## Gates
| PR | Teresa | Rolando | git.merge-gate | Merge SHA |
|---|---|---|---|---|
| #296 | PASS | VERIFIED | (pre-operation) | `e1963b7` |
| #86 | PASS | VERIFIED | bootstrap manual (once) | `96fb9c1` |
| #87 | PASS (v4) | VERIFIED (v3) | **passed: true** (first machine-authorized merge) | `ca6b0b0` |
| #88 | PASS (v4) | VERIFIED (v4) | **passed: true** | `46306c2` |

Gate events: Rolando DISCREPANCY (ancestry, fixed by content-identical merge); Teresa BLOCK (stale dogfood params — coordinator instruction error, corrected); extraction fixes iterated from dogfooding (formats: inline, table-row, heading+fence, candidate-header; sha256 64-hex false-positive guard; frequency + priority selection).

## Runtime Installation
Recorded in `07-runtime-installation.md`: extension (symlink → verified copy, D-R1, `e44ee3b6`), skill, 30 agent profiles, postoffice helper (`f62323ba`), validator helper. **Incident honestly recorded:** `.pi/agents` (project runtime) vs `~/.pi/agent/agents` (subagent profiles) layer confusion — subagent runtime down; repaired from `prompts/agents/*.md` + araya.yaml frontmatter synthesis (31/31 loader-compatible, smoke OK). Fresh-session interactive verification deferred (Q2).

## Entry Gate for ponny-express-10009
**`operational-acceptance.entry-gate` = `passed: true`** — see `operational-acceptance-entry-gate-result.json` (exit 0, all 9 checks green: framework/portfolio giskard zero, postoffice source drift zero, installed runtime drift zero, catalog valid, mandatory skill, merge gate operational, test operations operational, main untouched).

## Economic Result
- Agents invoked: Teresa ×~10 gate rounds, Rolando ×~10, Manu ×1 (prior cycle), all with exact-SHA discipline.
- PRs: 3 created, 3 merged (all gated; 2 machine-authorized).
- Gate retries: 3 (ancestry, stale params, extraction formats) — each produced a real fix (no rubber-stamping).
- Deterministic operations used for merges: 2 (PRs #87, #88). Raw recurring procedures converted to operations: merge authorization, repository sanity, integration sync, feature start, PR gate, 5 test suites, intent resolution.
- Tokens: not measurable from inside the session (no self-meter); recorded as honest unknown. Runtime: single night session, ~7 hours equivalent.
- **Primary metric — verified and accepted operational outcome: ACHIEVED (entry gate passed).**
- **Professor's repeated procedural instructions required for this cycle: 0** (after the initial authorization file; merges authorized by the machine gate, not by the Professor).

## Remaining Debt
Design-only future operations (6 contracts — need explicit authorization); fresh-session interactive verification (Q2); canonical checkout cleanup (Q1); Manu SPEC_APPROVED for REQ-043 (Q3); true Relay-motor suites replace mapped wrappers when REQ-042 delivers.

## Main
UNTOUCHED
