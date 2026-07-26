# 02 — Active Message Audit — GISKARD-RETIREMENT-ENFORCEMENT-20260726

## 2.1 Preservation (pre-existing)

| Field | Value |
|---|---|
| Original path | `.araya/postoffice/outbox/MSG-20260725-183610-271c5427.md` |
| SHA-256 | `76f94228dfdabdc9e0c85d711a9409ecb8514cea39732347e8c22a9ae51302d0` |
| created_at | 2026-07-25T18:36:10Z |
| sender | rolando |
| recipient | giskard (**retired 2026-07-20**) |
| status (before) | `new` (live/operational) |
| payload | Reality Audit v2 — 4 BLOCKs (PE-0007 B1–B4) |
| Invalidity reason | recipient retired; retired agents have zero message eligibility |
| Preservation | byte-identical in git since PR #83 (merge `395f622`); inventory SHA-256 in `.araya/runs/BATCH-TRUTH-CONTINUITY-20260726/01-evidence-inventory.md` |

Preservation does NOT validate the dispatch. Body untouched by this cycle (only frontmatter status/metadata changed).

## 2.2 Canonical mechanism discovery

Reviewed contract (`.araya/postoffice/PROTOCOL.md`) and tool (`src/postoffice_loop.py`, 1589 lines):

- Statuses: `new, claimed, read, replied, archived, blocked`. Transitions: 11 pairs.
- **No cancel / supersede / invalidate / tombstone / reroute mechanism existed.**
- `archive` unreachable from `new` (transitions only from replied/blocked/read) and semantically wrong (archival ≠ invalidation).

Conclusion (per FASE 2.3): implement minimal explicit supersession.

## 2.3 Implemented mechanism

- New status `superseded` — terminal, NOT in `LIVE_STATUSES` (never claimable, never in `pending`).
- Transitions added: `new|claimed|read|blocked → superseded`.
- New event type `supersede`; new command:
  `postoffice_loop.py supersede <id> [--by <replacement-id>] --reason <text>` (reason required; replacement must exist, be routable, not itself superseded).
- New optional frontmatter: `supersedes`, `superseded_by`, `supersede_reason`, `original_sender`, `original_recipient`, `reroute_reason`, `payload_integrity`, `source_evidence_sha256`.
- Central guard: `is_retired_agent()` / `assert_routable_actor()` reading `.araya/governance/retired-agents.json` (fallback `{"giskard"}`, fail closed); fires in `create_message` (to+from) and `supersede --by` BEFORE any write; error code `RETIRED_OPERATIONAL_ACTOR`, exit 1.
- Fail-closed: empty `to`/`from` rejected (`ValidationFailure`).
- Latent defects fixed en route (required for the mechanism to operate on this repo's state): annotation records without frontmatter no longer crash record scans; `allocate_seq` fail-safe against stale `.seq_counter` (was `0` while seq 1 existed → collision).

## 2.4 Treatment executed (in this branch, via the tool)

1. Replacement created: **MSG-20260726-083823-4d3ad179** — `from: rolando` (audit author preserved), `to: daneel`, `supersedes: MSG-20260725-183610-271c5427`, `original_sender: rolando`, `original_recipient: giskard`, `reroute_reason: recipient retired and operationally forbidden`, `payload_integrity: preserved`, `source_evidence_sha256: 76f94228…02d0`. Body: 4 BLOCKs + remediation state + Daneel routing map.
2. Original superseded: `status: superseded`, `superseded_by: MSG-20260726-083823-4d3ad179`, `supersede_reason` set. Event recorded in `index.jsonl`; `thread.md` rebuilt by the tool.
3. Proof: `pending --to daneel` returns exactly the replacement; `post --to giskard` exits 1 with `RETIRED_OPERATIONAL_ACTOR` and writes nothing; `operational_reference_validator.py` → PASS (zero active retired-agent references).

## 2.5 Re-routing (FASE 2.4)

Daneel routing per authority type (encoded in the replacement body; test 13):

| BLOCK | Matter | Route | Rationale |
|---|---|---|---|
| B1 /tmp worktrees | reality/process | Rolando | closure re-verification of the remediation |
| B2 hooks activation | strategic | Professor | activation on canonical checkouts is a strategic decision |
| B3 empty AX3 | planning/process | Rolando | closure confirmation (PR #295) |
| B4 canon-rule-001 tracking | planning/process | Rolando | closure confirmation (PR #295) |

No BLOCK sent directly to the Professor except the genuinely strategic B2. PE-0007 formal closure: Rolando re-evaluation.
