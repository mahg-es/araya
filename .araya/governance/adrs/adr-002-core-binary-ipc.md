# ADR-002: Core Binary Contract & IPC Specification

**Status:** Locked
**Date:** 2026-06-01
**Decider:** R. Daneel Olivaw (Architecture)
**Authority:** The Data Professor
**Related:** ADR-003 (Public/Private Boundary), ADR-006 (Version Compatibility Model)

> **Provenance note.** This decision was reached and locked in the prior
> (Antigravity) architecture session; that session reached quota before the ADR
> was persisted. This file records the locked decision from the session summary
> and the on-disk design docs (phase 3.5 provider architecture, phase 3.7
> terminal adapter). The *decision* is locked; payload-schema details below
> marked _(to ratify in Slice 1)_ are the implementation surface to be fixed
> when `araya version` lands.

## Context

The Private ARAYA Core requires a stable, language-agnostic contract so the
Public layer can invoke privileged Core capabilities without depending on Core
internals. The Core is implemented in **Go** (locked decision) and must present
one durable invocation and data-exchange contract.

## Decision

**1. Core packaging — single Go binary, multiple subcommands.**
The Private Core ships as **one statically-linked Go binary** named `araya`,
exposing capabilities as **subcommands** (`araya <subcommand> [args]`). No
per-capability binaries. This is the "one binary / multi-package" model
(source organization detailed in the Closure Report).

**2. IPC transport — stateless process invocation over stdio.**
Each capability is invoked as a subcommand process. The contract is:

- **Input:** arguments + a JSON request envelope on **stdin**.
- **Output:** a JSON response envelope on **stdout** (machine-readable).
- **Diagnostics:** human-readable logs on **stderr** (never mixed into stdout).
- **Exit codes:** `0` success · `1` validation/contract failure · `2` usage
  error · `≥3` reserved for capability-specific failures.
- **Statelessness:** each invocation is self-contained. No long-lived daemon,
  no shared in-process state between invocations (daemon mode is **deferred**).

**3. IPC envelope — versioned and self-describing.** _(to ratify in Slice 1)_
Every response envelope carries the **IPC contract version** (ADR-006), e.g.:

```json
{
  "ipc_contract_version": 1,
  "ok": true,
  "command": "version",
  "data": { },
  "error": null
}
```

**4. Compatibility is contract-versioned, not product-versioned.**
Per ADR-006, the boundary uses `ipc_contract_version` (a monotonic integer) for
compatibility, decoupled from the product `MAJOR.REVISION.HOTFIX` version.
`araya version` is the canonical handshake that publishes both.

## Consequences

- The Public layer integrates with Core through a frozen stdio/JSON contract and
  is insulated from Go internals.
- Any language could replace Core later without breaking the Public layer, as
  long as the IPC contract is honored.
- The envelope schema is the highest-leverage artifact; it is ratified by
  implementing `araya version` first (Slice 1).

## Evidence

- Go single-binary / multi-subcommand decision recorded: ✅
- stdio/JSON contract with exit-code and stream-separation rules defined: ✅
- Envelope carries `ipc_contract_version` per ADR-006: ✅
- No daemon / long-lived process assumed (daemon mode deferred): ✅
