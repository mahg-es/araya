# 07 — Runtime Installation and Synchronization — ARAYA-GOVERNED-OPERATIONS-BASELINE-20260726

PHASE 13 (after all source merges: PRs #86 `96fb9c1`, #87 `ca6b0b0`; portfolio PR #296 `e1963b7`).

## Installed artifacts (source → installed, hash-verified)

| Artifact | Source (repo/path/SHA) | Installed path | Installed SHA-256 | Method |
|---|---|---|---|---|
| Pi extension | mahg-es/araya `extensions/araya/index.ts` @ `ca6b0b0` | `~/.pi/agent/extensions/araya/index.ts` | `e44ee3b641b8ed61c726475e150ae4ccff561212cc69bfc68c93a4fbf1ad3de6` | symlink replaced with verified copy (see decision D-R1) |
| Skill | `skills/araya-operation-runtime/` @ `96fb9c1` | `~/.pi/agent/skills/araya/araya-operation-runtime/` | (dir copy, file diff clean) | `cp -r` |
| Agent profiles | `.pi/agents/*.md` (30) @ `ca6b0b0` | `~/.pi/agent/agents/` | diff clean (daneel verified) | `cp` |
| PostOffice helper | `src/postoffice_loop.py` @ `5fb822c` canonical | `~/.pi/agent/libexec/araya/postoffice_loop.py` | `f62323ba3faf1a5b3e3baaa6c7c221dd2096c1926e56f8d3844025bf052e8c8b` == portfolio sync-manifest record | `cp` |
| Validator helper | `src/operational_reference_validator.py` @ `ca6b0b0` | `~/.pi/agent/libexec/araya/operational_reference_validator.py` | (copied with helper set) | `cp` |

## Decision D-R1 — extension symlink replacement

The installed extension was a **symlink into the canonical checkout** (`~/github/mahg-es/araya/extensions/araya/index.ts`). The canonical checkout is intentionally stale (Q5 — cleanup is the Professor's decision; it also contains pre-existing untracked files that must not be cleaned by agents). The runtime therefore executed the PRE-cycle extension. Options: [a] leave stale (blocks PHASE 13/14), [b] replace symlink with a verified copy of the merged source, [c] clean+ff the canonical checkout (forbidden). Chosen: **[b]** — fully recorded, reversible: restore by re-creating the symlink to `/home/thedataprofessor/github/mahg-es/araya/extensions/araya/index.ts`. Source and installed hashes recorded above. No manual patching: installed == merged source byte-for-byte.

## Verification commands and results

| Check | Command | Result |
|---|---|---|
| Extension hash match | `sha256sum` source vs installed | identical `e44ee3b6` |
| Tool registrations present | `grep -c araya_operation_resolve/araya_git_merge_gate/araya_test_run installed` | 6 hits |
| PHASE 10 clara mapping present | `grep -c 'tdd: "clara"' installed` | 1 |
| PostOffice helper guard live-fire | `post --to giskard` from libexec | exit 1, `RETIRED_OPERATIONAL_ACTOR` |
| PostOffice helper drift | hash == framework canonical == portfolio sync record | `f62323ba` (three-way match) |
| Skill valid | present in session skill list + frontmatter (name/description) | ✓ |
| Agent profiles contain mandatory skill | `.pi/agent/agents/*` == repo `.pi/agents/*` | ✓ (28 active carry it) |
| Fresh-session slash/tool verification | **deferred to the Professor's next interactive session** — cannot be exercised from inside this session; the installed file's registrations are statically verified and identical to the gate-tested source | recorded honestly |

## Runtime drift

- Framework/Portfolio PostOffice implementations: **0** (hash match + sync manifest + drift test in portfolio suite).
- Installed helper drift: **0** (hash match recorded).
- Installed skills drift: **0** for relay-participant (prior) and araya-operation-runtime (new); full-tree sync recommended next install cycle.
- Canonical checkout (framework): remains stale by design — **Q5, Professor decision**; runtime no longer depends on it for the extension (D-R1).
