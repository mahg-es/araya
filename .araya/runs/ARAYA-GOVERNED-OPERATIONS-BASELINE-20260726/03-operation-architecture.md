# 03 — Operation Architecture — ARAYA-GOVERNED-OPERATIONS-BASELINE-20260726

```
operations/*.yaml                  ← versioned contracts (source of truth)
        │
src/araya/operations/
├── types.ts        — OperationDefinition / OperationResult / handler types
├── contract.ts     — definition + result validation (boolean contract enforced)
├── result.ts       — buildResult (assembles + validates OperationResult)
├── helpers.ts      — run/runCaptured/git/check (exit-code based)
├── git-handlers.ts — git.merge-gate, git.repository-sanity, git.sync-integration,
│                     git.feature-start, git.feature-pr-gate
├── misc-handlers.ts— test.relay-* (5 wrappers), operation.resolve,
│                     operational-acceptance.entry-gate
├── registry.ts     — OperationRegistry: load/validate/list/describe/resolve/search/execute
└── cli.ts          — CLI adapter (thin): argv → registry/handler → JSON, exit = passed
```

Binding rule honored: **one governed operation, one canonical implementation, multiple thin adapters.** CLI adapter contains no gate logic. Pi adapters (PR-F2) delegate to the same registry/handlers.

OperationResult: `passed` boolean mandatory, true only when every blocking check passed (contract-enforced in `buildResult` and re-validated by `validateOperationResult`).

Design-only future contracts (non-writing, zero adapters, required_authority=professor): git.promote-dev-to-main-gate, release.readiness-gate, release.tag-plan, release.release-plan, git.stale-branch-audit, git.stale-branch-cleanup.
