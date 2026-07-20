# PostOffice Loop MVP Protocol

Status: Operational MVP.

This protocol defines the local PostOffice loop for ARAYA Project Coordinator.

## Canonical Path

The only canonical path for this MVP is:

```text
.araya/postoffice/
```

Forbidden paths:

```text
.araya/.postoffice/
.postoffice/
```

## Structure

```text
.araya/postoffice/
  README.md
  PROTOCOL.md
  thread.md
  index.jsonl
  .seq_counter
  inbox/
  outbox/
  archive/
  archived-threads/
```

## Message Files

Messages are Markdown files with YAML frontmatter.

Inbox messages:

```text
.araya/postoffice/inbox/MSG-YYYYMMDD-HHMMSS-<shortid>.md
```

Outbox messages:

```text
.araya/postoffice/outbox/MSG-YYYYMMDD-HHMMSS-<shortid>.md
```

## Required Frontmatter

Each message must include:

```yaml
id: MSG-YYYYMMDD-HHMMSS-<shortid>
seq: 1
created_at: 2026-07-01T00:00:00Z
from: ChatGPT
to: Codex
subject: Example subject
status: new
claimed_by: null
claimed_at: null
direction: inbound
related_branch: null
related_pr: null
body_sha256: null
model: unknown
model_source: unknown
```

Allowed `status` values:

- `new`
- `claimed`
- `read`
- `replied`
- `archived`
- `blocked`

Historical messages may lack `seq`, `claimed_by`, or `claimed_at`; tools must continue to read them without rewriting history.

`seq` is a monotonic human-readable PostOffice sequence number assigned at `post` time. The latest assigned sequence is stored in `.araya/postoffice/.seq_counter`. New sequence assignment must fail with a structured error if a duplicate sequence is detected.

`claimed_by` and `claimed_at` are set only by `mark-claimed`; they remain `null` for unclaimed messages.

Allowed `direction` values:

- `inbound`
- `outbound`

## Direction Rule

The MVP derives direction from recipient:

- `to: Codex` writes to `inbox/` with `direction: inbound`
- all other recipients write to `outbox/` with `direction: outbound`

## Body Integrity

`body_sha256` is the SHA-256 digest of the Markdown message body after the frontmatter separator.

## Body Input

The MVP supports two mutually exclusive body input modes:

- `--body-file <path>` reads a body from a repository-local file.
- `--body-stdin` reads a body from stdin.

Exactly one body input mode is required for `post`.

`--body-file` must remain repository-confined. It must not read files outside the repository root.

`--body-stdin` is the preferred manual ChatGPT-to-Codex workflow when the message body starts outside the repository. It reads bytes from stdin only, applies the same 65536-byte size limit as `--body-file`, does not interpret stdin as a path, and never executes stdin content.

Example stdin smoke test:

```text
cat <<'EOF' | python3 src/postoffice_loop.py post \
  --from ChatGPT \
  --to Codex \
  --subject "stdin smoke test" \
  --model Codex \
  --model-source user-declared \
  --body-stdin
MVP stdin smoke test message.
EOF
```

## Active Thread Model

`thread.md` is the live human-readable view of the PostOffice.

Agents must not read `thread.md` by default.

Default agent workflow:

1. `inspect`
2. `summary`
3. `list`
4. `pending --to <role>`
5. `read <message-id>` for each pending message

`thread.md` only contains non-archived activity.

Messages with status:

- `new`
- `claimed`
- `read`
- `replied`
- `blocked`

may remain visible in `thread.md`.

Archived messages must disappear from `thread.md` during `archive` or `compact`.

`thread.md` is not:

- a governance ledger
- an approval channel
- an execution queue
- repository truth by itself

## Archived Thread History

Archived thread history is stored in:

```text
.araya/postoffice/archived-threads/YYYY-MM.md
```

When a message is archived, its human-readable block and lifecycle event block are moved out of `thread.md` and into the relevant monthly archive thread file.

`archived-threads/` is audit history only.

## Technical Event Index

`index.jsonl` is the compact technical event log for tools.

Each line is one JSON object with at least:

- `event_id`
- `event_at`
- `event_type`
- `message_id`
- `message_path`
- `from`
- `to`
- `subject`
- `status`
- `direction`
- `actor`
- `body_sha256` when available

`index.jsonl` is append-only and is for tools, not routine human reading.

## Lifecycle Commands

The MVP supports lifecycle commands through `src/postoffice_loop.py`:

```text
pending --to <role>
mark-read <message-id>
mark-claimed <message-id> [--claimed-by <name>]
mark-replied <message-id>
mark-blocked <message-id> --reason <text>
archive <message-id>
sweep [--include-read]
```

Status transition commands update YAML frontmatter only. Archive commands move message files to the archive path. No lifecycle command changes the message body or `body_sha256`.

`pending --to <role>` lists live `new` messages addressed to a role, oldest first, including each message's `seq` when available. Claimed messages are no longer pending.

`mark-claimed` performs an atomic claim transition from `new` to `claimed`, sets `claimed_by` and `claimed_at`, and fails with structured `AlreadyClaimed` output if the message is no longer `new`.

`sweep` batch-archives processed outbox messages: `replied` by default, and `read` only when `--include-read` is explicitly supplied.

Allowed status transitions:

- `new -> read`
- `new -> claimed`
- `claimed -> replied`
- `claimed -> blocked`
- `read -> replied`
- `new -> replied`
- `new -> blocked`
- `read -> blocked`
- `replied -> archived`
- `blocked -> archived`
- `read -> archived`

There is intentionally no direct `claimed -> archived` transition; a claimed message must become `replied` or `blocked` first.

Invalid transitions must fail with structured `ValidationFailure` or `SecurityBlocked` output.

## Lifecycle Examples

Mark a message read:

```text
python3 src/postoffice_loop.py mark-read MSG-20260701-101419-9aea994e
```

Claim a message:

```text
python3 src/postoffice_loop.py mark-claimed MSG-20260701-101419-9aea994e --claimed-by "Daneel-Codex"
```

Mark a message blocked:

```text
python3 src/postoffice_loop.py mark-blocked MSG-20260701-101419-9aea994e --reason "Needs human review"
```

Archive a replied message:

```text
python3 src/postoffice_loop.py archive MSG-20260701-101513-d8ddb218
```

## Summary and Compact

`summary` reports concise current PostOffice state without dumping `thread.md`.

`model-stats` summarizes `.araya/ax/ledger/score.ndjson` by `model`, `model_source`, `disposition`, and model/disposition pair so model effectiveness reports can be generated without scanning free text.

`compact` rebuilds the live thread view from the current repository state, moves archived content into `archived-threads/YYYY-MM.md`, and keeps evidence files intact.

## Safety Rules

The MVP tool must:

- only write under `.araya/postoffice/`
- refuse path traversal
- refuse symlink escapes
- refuse absolute output paths
- refuse oversized body files
- refuse oversized stdin bodies
- use UTC timestamps
- never execute message content
- never modify Git state
- never call network
- never read secrets

Live PostOffice state writes must be run from the shared checkout, not from an isolated `git worktree` or feature-branch-only checkout. This applies to `post`, `mark-read`, `mark-replied`, `mark-blocked`, `archive`, `sweep`, and `compact`. The PostOffice is a live coordination channel, not just a record that becomes visible after a PR merge; if an agent posts from an isolated worktree, Giskard may not see the report for hours or days unless that branch is fetched or merged manually.

## Size Limit

The maximum body file size is 65536 bytes.

Larger messages must be summarized or split manually before posting.
