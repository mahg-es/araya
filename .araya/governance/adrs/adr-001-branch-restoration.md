# ADR-001: Branch Governance Restoration

**Status:** Accepted
**Date:** 2026-05-30
**Decider:** R. Daneel Olivaw
**Authority:** The Data Professor

## Context

ARAYA's branch governance (BRANCH-001 through BRANCH-011) requires:
- `feature/*` → `dev-mahg` → `main`
- Direct commits to `main` are governance violations (BRANCH-002)
- Only `main` and `dev-mahg` are permanent (BRANCH-006)

Between v0.5.9 and v0.6.6, 14 commits were made directly to `main` bypassing
`dev-mahg`. Root cause: PR merges deleted `dev-mahg` (via `--delete-branch`),
and subsequent commits landed on `main` because the working branch was gone.

## Decision

Restore `dev-mahg` from the current `main` tip. All future work must go through
`dev-mahg` → PR → `main`. The `--delete-branch` flag on PR merges is discontinued
to prevent branch deletion.

## Consequences

- `dev-mahg` is restored and synchronized with `main`
- All future commits target `dev-mahg`
- PR merges will NOT delete `dev-mahg`
- Direct commits to `main` are now actively prevented by process

## Evidence

- `dev-mahg` exists locally and remotely: ✅
- 0 stale feature branches: ✅
- Only permanent branches: `main` + `dev-mahg`: ✅
- Branch strategy documented in README and CONTRIBUTING.md: ✅
