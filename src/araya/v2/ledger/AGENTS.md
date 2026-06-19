---
boundary: ax:boundary:araya/v2/ledger
parent: ax:boundary:araya/v2
adr: ADR-0003
---
# AGENTS.md — the AX ledger boundary

The append-only two-ledger record (score + arbiter). Its logical identity is the
`boundary:` id above; its physical location is resolved per managed project via
the boundary manifest — never derived from this file's path.

## Prescriptive

_What MUST hold at this boundary. Authored as governance; changed only via the
ADR named in frontmatter. May only tighten the Constitution, never weaken it._

- **P1 — Append-only.** Entries are appended, never edited or deleted in place; a
  correction is a new entry, not a rewrite of a prior line (ADR-0003).
- **P2 — Location-agnostic.** The ledger path is supplied by the caller; this
  boundary hardcodes no absolute path and holds no knowledge of which repository
  it writes into (ADR-0003, ADR-0006).
- **P3 — Authoritative identity columns.** Every recorded move carries `producer`,
  `emitter`, and `disposition`; a success move requires an `emitter` distinct from
  the `producer` (producer-not-emitter, ADR-0004).
- **P4 — Committed, never git-ignored.** Both ledgers (`score.ndjson`,
  `arbiter.ndjson`) live under a committed path, never beneath a git-ignored root
  (ADR-0003).

## Descriptive

_The current factual state of this boundary. Generated/observed by tooling — do
not hand-edit; edits here are overwritten on regeneration._

<!-- BEGIN GENERATED: descriptive — do not edit by hand -->
_Generated from `v2/ledger` — observed state, do not edit._

- `arbiter-ledger.ts` (3861 bytes) — exports: Severity, ViolationType, ArbiterAction, ArbiterEntry, ArbiterLedger, resolveArbiterLedgerPath
- `score-ledger.ts` (3269 bytes) — exports: ScoreEntry, ScoreLedger, resolveScoreLedgerPath
<!-- END GENERATED: descriptive -->
