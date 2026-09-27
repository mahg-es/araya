# ADR-0002 — ARAYA capability foundation: agent-first, authority-free

Status: Accepted
Date: 2026-09-27

## Context

The legacy ARAYA runtime (global Pi hooks, orchestration engines, agent roster,
authority ledgers, relay state machine) is archived. The clean AX3 v0.5.0 core
plus host adapters is in place. This increment recovers the highest-value legacy
capabilities as a clean, reusable, agent-first foundation — without restoring
the legacy runtime, global takeover, authority ledgers, or orchestration
machinery.

## Decision

1. Skills are the primary unit of reusable procedural specialization, with
   progressive disclosure (metadata always discoverable → full instructions on
   selection → resources only when needed). The full library is never loaded
   into every context. Legacy skills are reviewed selectively, not bulk-migrated.
2. Reusable deterministic code is promoted: if an agent repeatedly solves the
   same deterministic problem by reasoning, that solution becomes reusable
   parametrized code, and the agent invokes it rather than reconstructing it.
3. Operations are reusable deterministic capabilities with a minimal API:
   list, describe, resolve, execute. No mandatory pre-task lookup, no
   OPERATION_GAP ceremony, no global preflight, no authority/state ownership.
4. The CLI is agent-first (stable commands, structured parameters, `--json`,
   stable exit codes, non-interactive, compact, dry-run where useful,
   idempotency where feasible, namespaced commands, machine-readable discovery).
   The shared library is the single implementation; the CLI is a thin adapter.
5. PostOffice is agent-to-agent messaging + trace. It is never an authority, an
   approval ledger, a workflow state machine, canonical repository truth, or an
   automatic continuation controller.
6. PonyExpress is the Professor's explicit channel toward the agent system. It
   is a transport, never an authority database. PostOffice and PonyExpress
   correlate so an instruction can be followed through delegation to results.
7. Relay is recovered only as L07: handoff, correlation, delivery,
   acknowledgement, trace. The historical T0–T11/T12 relay state machine and
   lifecycle authority are not restored.
8. Git operation gates (sanity, merge-gate, feature-pr-gate, feature-start) are
   explicitly-invoked deterministic operations — no global shell gate.
9. Runtime utilities (notifier, quota, model-context, cycle) are small
   non-invasive helpers. model-context is read-only runtime metadata, not
   Daneel's operating model. No global takeover, no governance cycles.
10. Delegation is a capability resolver + ephemeral agent factory, not a
    sovereign runtime and not an orchestration engine. Specialist agents are
    ephemeral; their randomly-assigned display names have no architectural
    meaning. Daneel is the persistent exception and remains outside ARAYA.
11. No new orchestration engine. No second durable authority/state store.

## Consequences

- Deterministic engineering problems are solved once, in code, and invoked.
- Specialist capacity is composed from skills/operations rather than a roster.
- The product remains host-scoped: no global Pi hooks, no global shell gate.
- `DANEEL != ARAYA` remains in force; ARAYA never owns or generates Daneel.
