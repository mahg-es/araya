# 01 — Existing Surface Inventory — ARAYA-GOVERNED-OPERATIONS-BASELINE-20260726

Source inspection @ framework `5fb822c` (extensions/araya/index.ts, src/cli.ts, src/araya/**, skills/, araya.yaml). PHASE 2 machine-readable inventory (summary).

## Key finding

**ARAYA owned ZERO Pi custom tools (`pi.registerTool()`) before this cycle.** All agent-facing "tools" were slash commands (human-facing), skills (knowledge contracts), CLI commands, or MCP tools. The Pi extension registers 20+ slash commands and one `pi.on("before_agent_start")` hook. This cycle adds the first Pi custom tools (PR-F2).

## Surface classes found

| Class | Examples | Deterministic? | Facing |
|---|---|---|---|
| PI_EXTENSION | extensions/araya/index.ts, araya-notifier.ts, araya-quota-guard.ts, daneel-persona.ts | module | — |
| PI_SLASH_COMMAND | /araya, /araya:man, /araya:validate, /araya:trace, /araya:metrics, /araya:ax3, /araya:delegate*, /araya:compress-context, /araya:spec:* | mixed: some execute code, some delegate to prompts | human |
| PI_EVENT_HOOK | before_agent_start (persona + extension bootstrap) | yes | runtime |
| PI_CUSTOM_TOOL | **none before this cycle** | — | — |
| MCP_TOOL | dor-check, disposition-read, evidence-verify, contract-walk, ledger-read, propose-disposition (src/araya/ax/mcp/) | yes | external MCP |
| ARAYA_SKILL | 128 SKILL.md (incl. araya-operation-runtime added this cycle) | knowledge contracts (not executors) | agent |
| GENERATED_AGENT_PROFILE | .pi/agents/*.md (30), .araya/generated/* (120) | generated | runtime |
| CLI_COMMAND | src/cli.ts (run/validate/capabilities) + new operation/gate/git/test subcommands | yes | human+agent(bash) |
| HELPER_EXECUTABLE | postoffice_loop.py, operational_reference_validator.py, session_identity.py, loop_silence_guard.py, ax_audit.py | yes | agent(bash) |
| CORE_ENGINE | DelegationEngine, broker, AX engines (dor/disposition/verifier/score-ledger), runtime generator | yes | internal |
| PROMPT_DELEGATION | `/araya run` orchestration (prompt-driven phases) | prompt-driven | agent |

## Duplicates / defects registered

- `/araya run` phase map routes `tdd/tests → teresa` (extensions/araya/index.ts:466) — contradicts Clara=TEST_AUTOMATION → corrected in PR-F2 (PHASE 10).
- daneel-persona.ts assigns "Independent Reality Verification Officer" role to Daneel (stale, pre-2026-07-19) and Teresa=CCO — corrected in PR-F2.
- `/araya:trace --validate` contains hardcoded success (`hasOrphans = false`) — corrected in PR-F2.
- `/araya version` hardcodes operational counts — corrected in PR-F2.
- No second catalog created: operations extend the Operation Catalog (operations/*.yaml + registry), `/araya:man` extended in PR-F2.
