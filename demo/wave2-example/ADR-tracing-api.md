# ADR-0003 — PostOffice Tracing API as advisory, non-authority messaging channel with correlation IDs

Status: Accepted
Date: 2026-09-27

## Context

ARAYA AX3 v0.5.0 recovers the PostOffice as agent-to-agent messaging +
historical trace (ADR-0002). The PostOffice library — `cli/araya_lib/postoffice.py`
— persists append-only JSONL records at `.araya/postoffice/thread.jsonl` with
fields `id` (`msg-<hex>` / `ack-<hex>`), `sender`, `recipient`, `timestamp`,
`correlation_id`, `message_type`, `subject`, `body`, `acknowledged`, and
`acknowledged_at`. Acknowledgement is append-only: a new `ack-<hex>` record is
created rather than mutating the original.

PonyExpress (`cli/araya_lib/ponyexpress.py`) is the Professor's explicit
channel toward the agent system, storing at `.araya/ponyexpress/inbox.jsonl`.
The two channels correlate: a Professor instruction (correlation id `P123`)
flows → Daneel → PostOffice handoff → Ephemeral Agent, and every delegation
and result carries the same `correlation_id`, so the instruction can be
followed end-to-end.

The PostOffice must be exposed over HTTP so that Ephemeral Specialist Workers
(which are outside the local Pi host) can send, retrieve, acknowledge, trace,
and list messages — but the advisory, non-authority nature of the channel must
be preserved in the API contract.

## Decision

1. Expose the PostOffice as a versioned HTTP API (`/v1`) — the *PostOffice
   Tracing API* — with five endpoints that map 1:1 to the library methods:
   - `POST /v1/send` → `PostOffice.send`
   - `GET /v1/messages/{messageId}` → `PostOffice.get`
   - `POST /v1/messages/{messageId}/ack` → `PostOffice.ack`
   - `GET /v1/trace/{correlationId}` → `PostOffice.trace`
   - `GET /v1/messages` → `PostOffice.read_all` (paginated)
2. Bearer JWT authentication is required on every request; the token controls
   *who may read/write the trace*, not *what is authoritative*.
3. Record IDs are `msg-<hex>` / `ack-<hex>` (12 hex chars, cryptographic
   random — never auto-incremented) to prevent enumeration.
4. The API surfaces the append-only semantics: `ack` returns `201` with a new
   `ack-<hex>` record; it never mutates the original message in-place.
5. Every response schema includes the advisory framing (the API is trace, not
   authority). Governance acts (approvals, acceptances, declarations of done)
   are documented as out of scope for this channel.

## Options Considered

- **Option A — Full CRUD REST API with state machine semantics.**
  Model the PostOffice as an authoritative message bus with status transitions
  (`draft → sent → acknowledged → accepted`), PUT/PATCH for updates, and
  DELETE for removal.
  - *Rejected.* Contradicts ADR-0001 and ADR-0002: PostOffice must not be an
    authority, a workflow state machine, or an automatic continuation
    controller. CRUD semantics would invite consumers to treat the channel as
    authoritative and to block work on message state.

- **Option B — Advisory tracing API with correlation IDs (chosen).**
  HTTP endpoints wrapping the append-only library methods; JWT auth for
  access control only; IDs are random hex; ack is append-only; trace by
  `correlation_id` links PonyExpress instructions through delegation to
  results.
  - *Chosen.* Faithful to Repository Truth (`postoffice.py`,
    `ponyexpress.py`, `relay.py`), ADR-0001, and ADR-0002. Preserves the
    advisory boundary while giving Ephemeral Agents a network-readable
    contract.

- **Option C — No HTTP API; CLI / local-library access only.**
  Require all agents to run within the same host process that owns the
  `.araya` store.
  - *Rejected.* Prevents Ephemeral Specialist Workers from participating
    from outside the local host, undermining the agent-first, disposable-worker
    model. The tracing API is read/write, not orchestration — it does not
    violate "no global Pi lifecycle interception" (ADR-0001).

## Consequences

### Positive
- Ephemeral agents can participate in the PostOffice channel from outside the
  local host, enabling distributed agent-to-agent coordination.
- The correlation-ID flow (Professor → PonyExpress → Daneel → PostOffice →
  Agent → PostOffice) is fully observable and debuggable over HTTP.
- Append-only semantics are preserved and visible: no in-place mutation, no
  state machine, no authority.

### Cost / Negative
- HTTP exposure introduces an availability and security surface that the
  local CLI does not have. *Mitigation:* JWT bearer auth, rate limiting, TLS
  termination, and explicit documentation that the API is advisory.
- Consumers may misinterpret the channel as authoritative. *Mitigation:* every
  schema and every error response carries the advisory framing; governance
  acts are explicitly out of scope.
- Random hex IDs (no auto-increment) prevent enumeration but are not
  UUIDv4. *Mitigation:* IDs are still 96 bits of entropy (`token_hex(6)` in
  `store.py`), sufficient for non-cryptographic anti-enumeration.

## Security / Compliance
- JWT bearer tokens required on every request; credentials never appear in
  responses (api-design rule).
- The API does not store secrets; it writes only to append-only JSONL.
- No governance acts (approvals, acceptances) are transmitted or stored.

## Persistence / Data Ownership
- Data persists in `.araya/postoffice/thread.jsonl` under the project root,
  owned by the PostOffice library. The API is a thin HTTP adapter; it does not
  own or duplicate the store.

## Compatibility / Migration
- This is a new, non-breaking API surface. No existing clients are affected.

## Rollback / Recovery
- If the Tracing API proves unsuitable, it can be removed without affecting
  the underlying PostOffice library or store. The `.araya` JSONL files remain
  the source of truth.

## Implementation Boundary
This ADR does not authorize implementation unless separately authorized.

## Acceptance Criteria
1. OpenAPI 3.1 spec (`demo/wave2-example/openapi.yaml`) with 5 operationIds,
   every endpoint having success + error responses, Bearer JWT auth, and
   schemas (Message, MessageSendRequest, AckRequest, MessageList, Error).
2. C4 Context architecture diagram (`demo/wave2-example/architecture.mmd`)
   showing Professor, Daneel, Ephemeral Agent, PostOffice, Tracing API,
   `.araya` store, and PonyExpress with labeled protocol + payload flows.
3. This ADR (`demo/wave2-example/ADR-tracing-api.md`) accepted and consistent
   with ADR-0001 and ADR-0002.

## Related Artifacts
- ADR-0001: ARAYA AX3 v0.5.0 clean core (Pi as host, no global takeover)
- ADR-0002: ARAYA capability foundation (PostOffice as advisory messaging,
  PonyExpress as transport, Relay as L07 handoff-only)
- Repository Truth: `cli/araya_lib/postoffice.py`, `cli/araya_lib/store.py`,
  `cli/araya_lib/ponyexpress.py`, `cli/araya_lib/relay.py`
- `communications/postoffice/README.md`, `communications/ponyexpress/README.md`
