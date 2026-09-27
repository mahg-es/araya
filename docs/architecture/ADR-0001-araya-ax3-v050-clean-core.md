# ADR-0001 — ARAYA AX3 v0.5.0 clean core: host-scoped integration and canonical kernel

Status: Accepted
Date: 2026-09-27

## Context

The legacy ARAYA integration globally intercepted Pi (lifecycle hooks, shell
gate, auto-continuation) and interfered with unrelated projects. The legacy
runtime is archived and not repaired. This ADR records the durable architecture
for the replacement product.

## Decision

1. AX3 v0.5.0 is the ARAYA operating-model core (kernel + K01–K10).
2. Pi is a host, not something ARAYA globally owns.
3. Normal Pi remains normal Pi.
4. ARAYA Pi integration is explicit/scoped.
5. No global Pi lifecycle interception by default.
6. No global shell gate.
7. No automatic NEXT_ELIGIBLE_ACTION continuation in unrelated Pi sessions.
8. The ChatGPT bundle and the Pi adapter consume the same core.
9. Legacy capabilities return only after individual product-value review.
10. No new orchestration engine.
11. No second durable authority/state store.

## Consequences

- Plain `pi` is unaffected by ARAYA.
- ARAYA work is opened explicitly: `/araya` in a project with the opt-in
  adapter, or a ChatGPT instance loaded from the bundle.
- The canonical kernel files remain byte-identical to the v0.5.0 canon.
