# AGENTS.md — ARAYA Framework

## AX3 Contract Hierarchy

**Before modifying any file in this project, every agent MUST:**

1. Check if `AX3.md` exists at the project root.
2. If it exists → **read it completely.** The root `AX3.md` is the binding contract for the entire repository. It explains the full AX3 system: hierarchy, preflight, postflight, child docs, indexes, and closeout.
3. Identify every file or folder you expect to touch.
4. Walk from the repository root to each target path, reading every `AX3.md` found along the route.
5. Use the nearest `AX3.md` as the local contract and parent docs for repo-wide rules. A child may concretize but never weaken a parent.
6. After meaningful changes → run the AX3 postflight: update affected `AX3.md` files and their Child AX3 Indexes.
7. Do not rely on memory. Re-read the applicable AX3 chain in the current session before editing.

**This instruction applies to ALL agents — ARAYA, Codex, Claude, AGY, pi.dev, and any future adapter.**

The `AX3.md` files themselves are self-describing. Read the root `AX3.md` first and it will tell you everything you need to know.

## ARAYA Cross-Cutting Skills

Every agent in this project MUST apply the following skills on every task:

- **Command & Delegation:** before executing any task, run the `araya-command-and-delegation-expert` preflight and apply its delegation protocol. See `skills/araya-command-and-delegation-expert/SKILL.md`.
- **AX3:** read the AX3.md chain before editing, update after meaningful changes. See `skills/araya-ax3/SKILL.md` (or `skills/ax3/SKILL.md`).
- **Postoffice:** consult `.araya/postoffice/thread.md` at cycle start, append your entry at cycle end (advisory, never a gate). See the `ax-postoffice` skill.
- **Token Efficiency:** optimize token consumption before large tasks. See the `token-efficiency` skill.

## Related Commands

- `/araya:ax3` — reconcile the entire AX3 contract hierarchy
- `/araya:ax3 --check` — detect drift (exit 0 = clean, 1 = drift)
- `/araya:ax3 --dry-run` — preview changes without writing
- `/araya:man` — consult the ARAYA catalog
- `/araya:man --search <term>` — search capabilities by keyword

## Workspace Hygiene (canon-rule-001)

**All Git worktrees MUST be created exclusively under:**

```text
~/github/mahg-es/worktrees/<repository>/<worktree-name>
```

**Never create worktrees alongside repositories** (e.g., `~/github/mahg-es/araya-something`).

Before creating a worktree, run preflight:
```bash
git worktree list
git branch --show-current
mkdir -p ~/github/mahg-es/worktrees/<repo>
```

After completing work:
```bash
git worktree remove <path>
git worktree prune
```

Violations are BLOCK-level incidents.
