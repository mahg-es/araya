# 00 — Preflight — BATCH-TRUTH-CONTINUITY-20260726

**Batch authorization:** ponny-express-10007 (Professor, night batch, autonomous)
**Executor:** Daneel (Relay Controller) — pi.dev 0.82.1, model `kimi-k3` / `moonshotai` (Pi-runtime supplied)
**Date:** 2026-07-26 (post-fetch)
**Rule:** no work inside canonical checkouts; untracked files there are read/copied only, never modified or cleaned.

## Framework — `mahg-es/araya` (`/home/thedataprofessor/github/mahg-es/araya`)

| Item | Value |
|---|---|
| Local branch | `dev-mahg` |
| Local SHA | `0902ac6d6a8b0e3756c222575f1506f9c76dd724` |
| Remote SHA (`origin/dev-mahg`) | `0902ac6` (in sync, fetched this session) |
| ahead/behind | 0 / 0 |
| `main` / `origin/main` | `8928c1d` (PR #81 NOT in main; dev-mahg ahead 21) |
| Cleanliness | DIRTY: `M .pi/loops.json` (timestamp-only), `M skills/relay-participant/SKILL.md` (Pi 0.82.1 frontmatter fix, uncommitted) |
| Untracked (11 paths) | `.araya/context/`, `.araya/efficiency/`, 8 files in `.araya/plan/spec/`, `.araya/postoffice/outbox/MSG-20260725-183610-271c5427.md` |
| Worktrees (before batch) | only canonical checkout |
| Fetch notes | pruned deleted remote branches `feature/req-043-functional-baseline`, `feature/req-043-runtime-recovery` (merged; BRANCH-005 compliant). Local stale feature branches remain — registered as open question, not deleted (not authorized). |

## Portfolio — `mahg-es/araya-portfolio` (`/home/thedataprofessor/github/mahg-es/araya-project-coordinator`)

| Item | Value |
|---|---|
| Local branch | `dev-araya-portfolio` |
| Local SHA | `59dfa17` |
| Remote SHA (`origin/dev-araya-portfolio`) | `f9689af` (fetched this session) |
| ahead/behind | 0 / **6 behind** |
| Missing commits | `00063c0`+`af0c2b5` (PR #291 REQ-042), `1e84210`+`125c53a` (PR #292 REQ-043), `cb71346`+`f9689af` (PR #293 REQ-044/045) |
| Cleanliness | 53 untracked entries (26 AX3.md, requirements incl. REQ-042/043/044/045 copies, ponny-express-10001→10006, others). Canonical checkout NOT reset per batch rule. |
| Worktrees | 3 in `/tmp` (canon-rule-001 violation, PE-0007-B1): `git-opmodel-worktree` `3f0b307` [feature/git-operating-model], `verify-git-opmodel` `3f0b307` detached, `verify-opmodel` `f467b18` detached; 1 canonical: `~/github/mahg-es/worktrees/araya-project-coordinator/req-044-045-register` `cb71346` |
| Fetch notes | remote `feature/req-043-register` and `feature/req-044-045-register` deleted after merge (BRANCH-005 ✅) |

## Key preflight conclusions

1. REQ-042/043/044/045 registrations are ALL merged on `origin/dev-araya-portfolio` (`f9689af`). FASE 2 becomes traceability + metadata verification, not re-registration.
2. Framework clean at `0902ac6` = PR #81 merge; REQ-043 delivered on dev, NOT released on main (BRANCH-010).
3. Subagent profiles for Teresa, Rolando, Manu exist at `~/.pi/agent/agents/` (30) — gates invocable.
4. PE-0007 BLOCKs re-verified pre-batch: B1 (3 /tmp worktrees) ACTIVE, B2 (`.git/hooks/` no active hooks in framework) ACTIVE, B3 (25/26 near-empty untracked AX3.md in portfolio) ACTIVE, B4 (`portfolio/projects/araya/canon-rule-001.md` untracked) ACTIVE.

## Worktrees created by this batch (authorized paths only)

| Worktree | Branch | Base | Purpose |
|---|---|---|---|
| `~/github/mahg-es/worktrees/araya/evidence-and-context-preservation` | `feature/evidence-and-context-preservation` | `origin/dev-mahg` `0902ac6` | FASE 1 evidence + run dir + FASE 4 capsules v2 (PR-F2) |
