# ARAYA Relay — Filesystem Layout

Canonical home: `mahg-es/araya` (ARAYA Framework).
Status: MVP design.

## Framework (mahg-es/araya) — Canonical Artifacts

```text
.araya/relay/
├── AX3.md                      # Local AX3 contract
├── state-machine.md            # Canonical state machine definition
├── task-schema.json            # JSON Schema 2020-12 for task files
├── event-schema.json           # JSON Schema 2020-12 for event records
├── transition-table.md         # Complete transition matrix
├── claim-contract.md           # Claim and lease specification
├── filesystem-layout.md        # This file
├── acceptance-test-spec.md     # Acceptance test specification
└── workflow.yaml               # Workflow definition (standard-delivery)
```

## Governed Project — Runtime State

Each project under ARAYA governance carries:

```text
.araya/relay/
├── config.yaml                 # Project-specific Relay config (committed)
└── runtime/                    # Mutable runtime state (GITIGNORED)
    ├── tasks/                  # Task state files: <task-id>.json
    ├── events/                 # Event logs: <task-id>.jsonl
    ├── claims/                 # Claim registry (derived from tasks, cached)
    └── inbox/                  # Agent inboxes: <actor-id>/
        ├── sonia/
        ├── manu/
        ├── teresa/
        └── rolando/
```

### `.araya/relay/config.yaml`

```yaml
# Project-level Relay configuration
project: mahg-pms
framework_ref: mahg-es/araya  # Canonical Relay source

workflows:
  standard-delivery:
    max_attempts: 2
    max_replanning: 2
    claim_timeout_seconds: 3600
    ack_timeout_seconds: 300

routing:
  controller: daneel
  inbox_poll_interval_seconds: 30
```

### `.araya/relay/runtime/` — Gitignore

```gitignore
# .araya/relay/runtime/ is mutable operational state
.araya/relay/runtime/
```

### Evidence on Close

When a task reaches CLOSED, an evidence receipt is generated:

```text
.araya/evidence/relay/<task-id>/receipt.json
```

This receipt and its evidence ARE committed via feature branch and PR.

## Inbox Contract

Each agent's inbox is a directory of pending messages:

```text
.araya/relay/runtime/inbox/<actor-id>/
├── MSG-20260725-001.json   # Pending message
└── MSG-20260725-002.json   # Pending message
```

**Message schema:**

```json
{
  "message_id": "MSG-20260725-001",
  "task_id": "RELAY-001",
  "from_actor": "daneel",
  "from_role": "COORDINATOR",
  "to_actor": "teresa",
  "event_expected": "PASS",
  "current_state": "TESTING",
  "deadline": "2026-07-25T17:00:00Z",
  "created_at": "2026-07-25T16:00:00Z",
  "acknowledged": false
}
```

Messages are deleted when the agent ACKs or the task transitions away from them.

## Separation from PostOffice

| Concern | PostOffice | Relay Inbox |
|---|---|---|
| Purpose | Agent-to-agent communication | Task handoff notifications |
| Content | Free-form messages | Structured task assignments |
| Lifecycle | Archived on read | Deleted on ACK or transition |
| Authority | Advisory | Operational (derived from task state) |

PostOffice is never the primary state source. Relay inbox is derived from task state.

## Separation from Portfolio

```text
ARAYA Framework (.araya/relay/)     ← Canonical schemas, state machine, contracts
        │
        │ defines protocol
        ▼
Project (.araya/relay/runtime/)     ← Runtime state, tasks, events
        │
        │ aggregates (read-only)
        ▼
Portfolio (views, dashboards)       ← Cross-project dispatch, aggregated views
```

Portfolio reads project state — it never stores or substitutes it.

## Attribution

Generated-by: R. Daneel Olivaw
Model: deepseek-v4-pro/DeepSeek | runtime-reported
Repository: mahg-es/araya (ARAYA Framework)
