# ARAYA Relay — Claim Contract

Canonical home: `mahg-es/araya` (ARAYA Framework).
Status: MVP design.

## Purpose

Define how a single agent claims exclusive ownership of a task for a bounded time window, guaranteeing that exactly one agent operates on a task at any moment.

## Claim Lifecycle

```text
[UNCLAIMED]
    │ CLAIM event (actor requests claim)
    ▼
[ACTIVE] ─────────────── timeout ──→ [EXPIRED]
    │ ACK event (actor acknowledges)
    ▼
[ACKNOWLEDGED]
    │ RELEASE event (actor or controller releases)
    │ EXPIRE event (lease time exceeded)
    ▼
[RELEASED] / [EXPIRED]
    │ New CLAIM from different actor
    ▼
[ACTIVE] (new claim)
```

## Claim States

| Status | Description |
|---|---|
| `active` | Claim filed, awaiting ACK from claimant |
| `acknowledged` | Claimant ACK'd; claim is locked and valid |
| `released` | Voluntarily released by claimant or force-released by controller |
| `expired` | Lease time exceeded without activity |
| `superseded` | Replaced by a newer claim (controller action) |

## Concurrency Guarantee

A task can have **at most one** active or acknowledged claim at any time. The guarantee is enforced by three mechanisms applied in order:

### 1. File Lock (`flock`)

```text
Before reading or writing task file:
  acquire exclusive flock on .araya/relay/tasks/<task-id>.json
  (blocking with timeout)

After read/write complete:
  release flock
```

The file lock serializes all access to the task file. No two processes can read-modify-write concurrently.

### 2. Optimistic Version Check

```text
Every write operation includes:
  expected_version = task.version (as read)

On write:
  if current_task.version != expected_version:
    reject with CONCURRENT_MODIFICATION
    (another writer changed the task since we read it)
  else:
    proceed with write
```

The version check catches logical races where a writer reads, another writer modifies, and the first writer tries to write stale data. The file lock alone does not prevent this because the lock is released between read and write.

### 3. Atomic Temporary-Write-and-Rename

```text
write path:  .araya/relay/tasks/<task-id>.json.tmp.<uuid>
target path: .araya/relay/tasks/<task-id>.json

1. Write complete new task state to .tmp file
2. fsync the .tmp file
3. rename(.tmp, target)   ← atomic on same filesystem
```

The rename is atomic on POSIX filesystems. Readers always see either the old complete file or the new complete file — never a partial write.

### Combined Protocol

```text
claim_task(task_id, actor):
  1. flock(task_file, LOCK_EX, timeout=30s)
  2. task = read_and_parse(task_file)
  3. if task.claim and task.claim.status in [active, acknowledged]:
       if task.claim.actor == actor:
         return error: "already claimed by you"
       else:
         return error: "already claimed by {task.claim.actor}"
  4. if task.owner.actor != actor:
       return error: "not your task to claim"
  5. task.version += 1
  6. task.claim = { id, actor, status: active, ... }
  7. tmp = task_file + ".tmp." + uuid()
  8. write(tmp, json(task))
  9. fsync(tmp)
  10. rename(tmp, task_file)
  11. flock(task_file, LOCK_UN)
  12. emit CLAIM event
```

## Claim Rules

1. A task can have at most one active or acknowledged claim.
2. A claim requires ACK within `ack_timeout_seconds` (default: 300s).
3. An expired claim releases the task for re-claim by any eligible owner.
4. The previous claimant cannot re-claim until the controller resets.
5. The controller can force-release an abandoned claim (no ACK after 2× ack_timeout).
6. A released claim does not lose evidence; the event log preserves everything.
7. When a task transitions to a new owner, any active claim is automatically released.

## Claim Schema (embedded in task)

```json
{
  "claim": {
    "id": "CLM-001",
    "actor": "valentina",
    "status": "acknowledged",
    "claimed_at": "2026-07-25T12:55:00Z",
    "acknowledged_at": "2026-07-25T12:55:30Z",
    "lease_seconds": 3600,
    "expires_at": "2026-07-25T13:55:30Z"
  }
}
```

## Timeouts

| Parameter | Default | Description |
|---|---|---|
| `claim_timeout_seconds` | 3600 | Maximum lease duration |
| `ack_timeout_seconds` | 300 | Time to acknowledge after claim |
| `lock_timeout_seconds` | 30 | Max wait for file lock |

## Attribution

Generated-by: R. Daneel Olivaw
Model: deepseek-v4-pro/DeepSeek | runtime-reported
Repository: mahg-es/araya (ARAYA Framework)
