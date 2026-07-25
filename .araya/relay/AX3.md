# .araya/relay — AX3 Local Contract

## Purpose

Canonical home of the ARAYA Relay protocol. Defines the state machine, schemas, contracts, and acceptance tests that govern task flow across all ARAYA-governed projects. This is part of the ARAYA Framework — not the Portfolio.

## Ownership

The Data Professor (Manuel Alejandro Hernández Giuliani) — all architectural decisions.
R. Daneel Olivaw — Relay Controller, protocol steward.

## Local Contracts

- All canonical Relay artifacts live here. No other repository defines Relay schemas or state machines.
- The ARAYA Project Coordinator (araya-portfolio) consumes Relay as a consumer — it does not define it.
- Each governed project stores its own runtime state under `.araya/relay/runtime/`.
- The Framework defines the protocol; projects store the state; Portfolio aggregates views.
- MVP scope: `standard-delivery` workflow only. `governance-delivery` and `quick-fix` deferred.
- The motor implementation will live in this repository (or migrate to ARAYA Private Core) — the protocol contract remains public and stable.

## Work Guidance

- Schemas: JSON Schema Draft 2020-12, validatable with standard tooling.
- Events: append-only JSONL, one file per task.
- Tasks: single JSON file per task, versioned for optimistic concurrency.
- Concurrency: file lock (flock) + optimistic version check + atomic tmp-write-and-rename.
- ASK/BLOCK: Daneel dispatches, never becomes functional owner.

## Verification

- Validate task-schema.json and event-schema.json against JSON Schema 2020-12 meta-schema.
- Verify transition table completeness against state machine.
- Verify claim contract against concurrency requirements.
- Validate participant contract against agent relay profiles.
- Acceptance tests in acceptance-test-spec.md define motor compliance criteria.

## Child AX3 Index

<!-- BEGIN ARAYA MANAGED: Child AX3 Index -->
(no children — this is a leaf contract)
<!-- END ARAYA MANAGED: Child AX3 Index -->
