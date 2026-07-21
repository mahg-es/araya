# AX3 — Architecture Review Report
## Aisha (Backend Architect) — Contract & Module Validation

**Date**: 2026-06-16
**Confidence**: 0.88
**Status**: ✅ APPROVED with 2 recommendations

---

## 1. Module Placement: `src/araya/v2/ax3/`

### Assessment: ✅ CORRECT

The AX3 feature is correctly placed as a cross-cutting (AX) feature within the ARAYA v2 engine:

```
src/araya/v2/ax3/
  ├── types.ts       — Contract definitions, constants, interfaces
  ├── resolver.ts    — Root discovery, parsing, chain resolution, dir walk
  ├── reconciler.ts  — Tree reconciliation, index management, check/dry-run
  └── index.ts       — Public API: preflight, postflight, re-exports
```

**Rationale**: 
- `types.ts` as contract layer — pure types, zero logic. ✅
- `resolver.ts` as read-only discovery — no writes. ✅
- `reconciler.ts` as write operations — mutations isolated. ✅
- `index.ts` as public facade — clean barrel export. ✅

**Module cohesion**: Each module has a single responsibility. The resolver never writes; the reconciler never parses raw strings beyond what the resolver provides. This is clean separation.

### Recommendation 1: Consider splitting reconciler.ts
`reconciler.ts` is ~300 lines and handles 4 distinct concerns: (a) reconciliation orchestration, (b) template generation, (c) parent-child mapping, (d) durable boundary detection. For long-term maintainability, consider extracting template generation to `templates.ts` and boundary detection to `boundaries.ts`.

**Priority**: Low | **Effort**: Small | **Risk**: None

---

## 2. Contract Correctness: `types.ts`

### Assessment: ✅ SOUND

The type definitions are complete and well-structured:

| Type | Purpose | Assessment |
|------|---------|-----------|
| `Ax3Doc` | Parsed AX3.md representation | ✅ Covers all needed fields |
| `Ax3IndexEntry` | Child index entry | ✅ Path + optional description |
| `Ax3Chain` | Resolution result | ✅ Ordered chain + nearest + summary |
| `Ax3Change` | Planned/applied change | ✅ Type, path, description, before/after |
| `Ax3ReconcileResult` | Reconciliation output | ✅ Changed flag, doc count, changes, issues |
| `Ax3CheckResult` | Drift check output | ✅ Drift flag, violation count, violations |

**Constants**: `AX3_FILENAME`, `MANAGED_BEGIN`, `MANAGED_END`, `AX3_SECTIONS`, `DEFAULT_EXCLUSIONS`, `DEFAULT_MAX_DEPTH` — all well-defined.

### Recommendation 2: Add `Ax3Config` type
The reconciler currently uses hardcoded `DEFAULT_EXCLUSIONS` and `DEFAULT_MAX_DEPTH`. An `Ax3Config` interface would allow per-project customization:

```typescript
interface Ax3Config {
  exclusions: string[];
  maxDepth: number;
  structuralNames: string[];
  autoCreate: boolean;
}
```

**Priority**: Medium | **Effort**: Small | **Risk**: None (backward compatible)

---

## 3. API Surface: `index.ts`

### Assessment: ✅ CLEAN

The public API exposes exactly 4 functions:

| Function | Signature | Purpose |
|----------|-----------|---------|
| `preflight` | `(targetPaths, projectRoot?) → Ax3Chain` | Mandatory pre-write hook |
| `postflight` | `(scope?, dryRun?, projectRoot?) → Ax3ReconcileResult` | Post-write reconciliation |
| `reconcile` | `(projectRoot?, scope?, dryRun?, repair?) → Ax3ReconcileResult` | Full reconciliation |
| `check` | `(projectRoot?, scope?) → Ax3CheckResult` | Drift detection |
| `dryRun` | `(projectRoot?, scope?) → Ax3ReconcileResult` | Preview |

Re-exports from resolver.ts and reconciler.ts are correctly selective. ✅

---

## 4. Relationship to AGENTS.md Boundaries (ADR-0010)

### Assessment: ✅ COMPLEMENTARY (no conflict)

The SKILL.md correctly documents the complementary relationship:

| Aspect | AGENTS.md | AX3.md |
|--------|-----------|--------|
| Identity | Logical boundary IDs | Physical directory hierarchy |
| Resolution | Manifest (.araya/contracts/*.json) | Filesystem walk |
| Frontmatter | YAML | None (markdown-only) |
| Use case | Governed internal boundaries | Project-wide + external compatibility |
| Portability | Manifest-swap | Self-contained, copy-paste |

**ADR-0010 status**: The ADR file (`adr-007-capability-delivery.md`) references capability delivery, not AGENTS.md boundaries specifically. AX3 does not conflict with any existing ADR.

**Precedence**: AX3.md does NOT override AGENTS.md. An agent SHOULD check both. If both exist and conflict, AGENTS.md takes precedence for governed boundaries.

---

## 5. Command Registration Integration

### Assessment: ✅ CORRECT

`/araya:ax3` is registered in `extensions/araya/index.ts` (line 1994) following the same pattern as other ARAYA commands. The handler:
- Parses flags correctly (`--check`, `--dry-run`, `--repair`, `--scope`)
- Uses dynamic `import()` for lazy loading (performance)
- Provides rich UI feedback via `ctx.ui.notify()`
- Handles errors gracefully

**Integration point**: The command uses `await import("../../src/araya/v2/ax3")` — this resolves correctly from `extensions/araya/index.ts` to `src/araya/v2/ax3/index.ts`.

---

## 6. Adapter Integration

### Assessment: ✅ DESIGNED CORRECTLY

The preflight/postflight pattern is adapter-agnostic:
- `preflight(targetPaths)` — any adapter calls this before writing
- `postflight(scope)` — any adapter calls this after meaningful changes

This works for Codex, Claude CLI, AGY, pi.dev, and future adapters without modification.

---

## Summary

| Area | Status | Issues |
|------|--------|--------|
| Module Placement | ✅ APPROVED | — |
| Contract (types.ts) | ✅ APPROVED | Add Ax3Config (recommendation) |
| API Surface | ✅ APPROVED | — |
| AGENTS.md Relationship | ✅ COMPATIBLE | — |
| Command Integration | ✅ APPROVED | — |
| Adapter Integration | ✅ APPROVED | — |

**Overall**: APPROVED. The architecture is sound. Two non-blocking recommendations for future enhancement.
