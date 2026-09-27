# Legacy capability inventory

> **Superseded for the skills corpus.** The full per-skill disposition now lives
> in `docs/legacy-skills-review.md` (human) + `docs/legacy-skills-review.json`
> (machine-readable). This document is kept for the non-skill capability groups
> (operations, CLI, relay, runtime) and is superseded for skills.

The legacy ARAYA runtime was archived (see the `archive/araya-legacy-*` Git
branches). This inventory lists its capability groups and their current
disposition. Nothing is reintroduced automatically — each capability returns
only after an individual product-value review.

## Recovered (in the capability foundation)

Recovered as clean, reusable, agent-first code — with authority/runtime
coupling removed:

1. **Operations catalog** (`operations/`) — deterministic git operations
   (repository sanity, merge gate, feature PR gate, feature start) with a
   minimal `list`/`describe`/`resolve`/`execute` API. No pre-task lookup, no
   OPERATION_GAP, no global preflight.
2. **CLI** (`cli/`) — agent-first, stdlib-only, `--json`, stable exit codes.
3. **Skills** (progressive disclosure) — a small curated set
   (`adr-write`, `tdd-execute`, `git-publication`, `postoffice`, `ponyexpress`)
   with metadata-always-discoverable → full-instructions-on-selection.
4. **PostOffice** (`communications/postoffice/`) — agent ↔ agent messaging +
   trace; explicitly not an authority/ledger/state machine.
5. **PonyExpress** (`communications/ponyexpress/`) — Professor → agent channel
   with correlation; not an authority database.
6. **Relay handoff (L07 only)** — handoff, correlation, delivery,
   acknowledgement, trace. No T0–T11/T12 state machine.
7. **Runtime utilities** (`runtime/`) — read-only model-context, opt-in quota,
   cycle, notifier.
8. **Delegation** (`delegation/`) — capability resolver + ephemeral agent
   factory. No sovereign runtime, no durable workflow state.

## Still deferred (not yet reviewed)

| Capability group | Legacy location | Notes | Candidate disposition |
|---|---|---|---|
| Agent personas (roster) | `prompts/agents/`, `.pi/agents/` | Elena, Sonia, Aisha, … | drop (ephemeral agents replace the roster) |
| Skills library (~127 remaining) | `skills/` | bulk of ~132 skills not yet reviewed | skill / reimplement later / drop |
| Orchestration engines | `src/araya/` | workflow/model/quality/budget/circuit | reimplement later / drop |
| Relay state machine (T0–T11/T12) | `src/araya/relay/` | full state machine; only L07 recovered | drop |
| Global Pi extensions | `extensions/araya`, `araya-notifier`, `araya-quota-guard`, `daneel-persona` | global hooks (removed) | drop |
| AX ledger / authority | `.araya/ax`, `.araya/operating-model` | authority/state store | drop |
| MCP adapter | `src/araya/v2/mcp/` | only where interoperability justifies | reimplement later |

## Disposition policy

Each future capability receives exactly one disposition:

```text
skill
agent
CLI capability
library
reimplement later
drop
```

A capability is reintroduced only after an individual product-value review.
