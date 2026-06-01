# ADR-003: Public / Private Boundary

**Status:** Approved (directional) — confirmed non-conflicting with ADR-002
**Date:** 2026-06-01
**Decider:** R. Daneel Olivaw (Architecture)
**Authority:** The Data Professor
**Related:** ADR-002 (Core Binary Contract & IPC), ADR-006 (Version Compatibility Model)

> **Provenance note.** Directionally approved in the prior (Antigravity) session;
> persisted here as part of architecture closure. Recorded from the session
> summary and on-disk design docs.

## Context

ARAYA has an open, conversational, governance-facing surface and a set of
privileged/proprietary capabilities that must not be exposed as source. A
durable line between the two is required so each can evolve independently.

## Decision

**1. Two zones.**

| Zone | Contents | Distribution |
|------|----------|--------------|
| **Public ARAYA** | Conversational OS, intent routing, agents/personas, skills, governance docs, ADRs, `araya.yaml`, orchestration shell | Open |
| **Private ARAYA Core** | The Go `araya` binary: privileged/proprietary capabilities (validation engine, repo-truth, version handshake, future privileged ops) | Closed (binary only) |

**2. The boundary is crossed in exactly one way.**
Public ARAYA invokes Private Core **only** through the ADR-002 IPC contract
(stdio + JSON envelope + exit codes). There is no other sanctioned coupling:
no shared library linkage, no import of Core source, no reaching into Core
internals.

**3. Direction of dependency.**
Public depends on Core's **contract**, never on Core's **implementation**. Core
depends on nothing in Public. The contract — not the product version — is the
compatibility unit (ADR-006).

## Conflict review against ADR-002

Required deliverable: confirm ADR-003 does not conflict with ADR-002.

| Dimension | ADR-002 (Core/IPC) | ADR-003 (Boundary) | Conflict? |
|-----------|--------------------|--------------------|-----------|
| Coupling mechanism | stdio + JSON envelope | "only via the IPC contract" | None — 003 names 002 as the sole crossing |
| Packaging | single Go binary, subcommands | Private zone = that binary | None — same artifact |
| Compatibility unit | `ipc_contract_version` | contract, not product version | None — both defer to ADR-006 |
| Statefulness | stateless invocation, no daemon | (no claim) | None |
| Dependency direction | Core self-contained | Public→contract, Core→nothing | None — consistent |

**Result: no conflict.** ADR-003 is strictly the boundary policy; ADR-002 is the
mechanism that policy points to. They are complementary, not overlapping.

## Consequences

- Core can be re-implemented or re-licensed without touching Public, as long as
  the IPC contract holds.
- Reviews can mechanically check the boundary: any Public→Core path that is not
  an IPC invocation is a violation.
- Proprietary logic stays in the binary; the open surface stays fully open.

## Evidence

- Single sanctioned crossing (IPC contract) defined: ✅
- Explicit conflict review vs ADR-002 — no conflicts found: ✅
- Compatibility delegated to ADR-006 in both ADRs: ✅
