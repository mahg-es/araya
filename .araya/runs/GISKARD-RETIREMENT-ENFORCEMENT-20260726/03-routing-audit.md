# 03 — Routing Audit — GISKARD-RETIREMENT-ENFORCEMENT-20260726

FASE 3: every component capable of choosing a recipient, audited and guarded.

| Component | Audit result | Guard |
|---|---|---|
| Relay transition table / workflow.yaml | CLEAN — no Giskard in any state/event/role (PE-0009 verified) | frozen by `scan_relay` in validator + generator guard |
| `event-schema.json` / `task-schema.json` | CLEAN — enums carry no GISKARD/giskard | validator `scan_relay` fails on any retired id outside acceptance-test-spec.md |
| PostOffice dispatch (`create_message`) | WAS UNGUARDED → **guard added** (`assert_routable_actor` on to+from, pre-write) | `RETIRED_OPERATIONAL_ACTOR`, exit 1, no file |
| PostOffice replacement routing (`supersede --by`) | NEW mechanism | rejects retired recipients in replacements |
| PostOffice queue validation | NEW | `operational_reference_validator.py` — live-status + retired-actor structural check |
| Session identity (`session_identity.py`) | CLEAN (only fixtures referenced Giskard) | fixtures renamed; suite green |
| Loop scripts (`loop_silence_guard.py`) | CLEAN (docstring history only) | — |
| Agent registry (`araya.yaml`) | CLEAN since PR #80 (0 retired refs) | TS guard `findOperationalRetiredReferences` scans fields + prose |
| Generated profiles (`.pi/agents/`, `.araya/generated/`) | CLEAN (regenerated from clean sources) | generator `--check` exits 1 on any operational retired reference BEFORE writing |
| Catalog (`catalog.json`) | CLEAN (derived) | regenerated artifacts covered by generator guard |
| Runtime adapters (pi/codex/claude-cli/agy) | CLEAN | same generator guard, all 4 adapters |
| Slash commands | derived from araya.yaml (clean) | same |
| Test fixtures | 3 suites used Giskard as normal actor → **renamed to Sonia** | negative fixtures only in `tests/` scope with guard vocabulary |
| Fallback routing / default recipient | none exists in tool (no silent fallback) | fail-closed on empty recipient added |
| pre-commit hook (`.araya/hooks/pre-commit`) | Rule 7 added: `python3 src/operational_reference_validator.py --staged` | active only after Professor activates hooks (still pending) |
| Generator `--check` | **guard integrated** (Step 2.5, fail closed pre-write) | tested (test 05) |

## Central guard contract (implemented)

```
is_retired_agent("giskard") == true            # postoffice_loop.py + retired-agents.ts
route_to("giskard") → reject
  → error code RETIRED_OPERATIONAL_ACTOR
  → exit 1 / throw RetiredOperationalActorError (disposition BLOCK)
  → nothing persisted
```

Single data source: `.araya/governance/retired-agents.json` (read by Python tool AND TS guard; both fail closed to `{"giskard"}` if unreadable). No silent fallback to `daneel`: re-routing requires an explicit superseding message with provenance fields (supersedes, original_sender, original_recipient, reroute_reason, source_evidence_sha256).
