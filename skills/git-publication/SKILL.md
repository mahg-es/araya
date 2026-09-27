---
name: git-publication
description: "Branch, commit, PR, and merge discipline backed by deterministic git operations (repository-sanity, feature-start, feature-pr-gate, merge-gate)."
---

# Git Publication

Branch, commit, PR, and merge discipline. The heavy checks are deterministic
operations, invoked explicitly — do not re-derive them by reasoning each time.

## Deterministic operations (prefer invoking over re-deriving)

- `git.repository-sanity` — read-only repository state inspection.
- `git.feature-start` — authorized worktree + feature branch (supports dry-run).
- `git.feature-pr-gate` — validate a feature branch before PR creation.
- `git.merge-gate` — predicate: may this PR merge into an integration branch?

Invoke via the CLI:

```bash
araya git sanity --repo /path/to/repo
araya git merge-gate --pr 123 --candidate <sha> --base dev-mahg
araya git feature-pr-gate --base origin/dev-mahg
araya git feature-start --name my-feature --authorized-root /path/to/worktrees --dry-run
```

## Discipline

- Work on an isolated branch/worktree, never a dirty shared checkout.
- Base branches are integration branches (never `main` as a PR target).
- Run `git diff --check`; keep commits free of AI co-author trailers.
- Verify against live remote state; never trust memory over the repository.
- A merge gate is a predicate — it does not perform the merge.

## Done criteria

- [ ] Branch/PR validated by the corresponding deterministic operation
- [ ] Merge gate invoked before any merge claim
- [ ] Evidence from real git/GitHub state, not assumptions
