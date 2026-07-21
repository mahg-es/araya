# AX3 — Implementation Review Report
## Valentina (Backend Developer) — Runtime & Command Review

**Date**: 2026-06-16
**Confidence**: 0.90
**Status**: ✅ APPROVED with 3 findings

---

## 1. Runtime Hooks: `preflight()` and `postflight()`

### Assessment: ✅ WELL-IMPLEMENTED

**`preflight(targetPaths, projectRoot?)`** — `src/araya/v2/ax3/index.ts:19`:
```typescript
export function preflight(targetPaths: string[], projectRoot?: string): Ax3Chain {
  const root = projectRoot ?? findProjectRoot();
  return resolveAx3Chain(root, targetPaths);
}
```
- Clean delegation to resolver. No side effects. ✅
- Optional `projectRoot` for testing. ✅
- Returns full chain (root → nearest), not just nearest. ✅

**`postflight(scope?, dryRun?, projectRoot?)`** — `src/araya/v2/ax3/index.ts:31`:
```typescript
export function postflight(scope?, dryRun?, projectRoot?): Ax3ReconcileResult {
  const root = projectRoot ?? findProjectRoot();
  return reconcile(root, scope, dryRun, false);
}
```
- Delegates to reconciler with `repair=false`. ✅
- `dryRun` parameter correctly controls write behavior. ✅

### Finding 1: Missing `repair` parameter in postflight
`postflight()` hardcodes `repair=false`. Should accept `repair?: boolean` to enable postflight repair mode.

**Severity**: Low | **Recommendation**: Add `repair?: boolean` parameter

---

## 2. Command Registration: `/araya:ax3`

### Assessment: ✅ CORRECTLY REGISTERED

**Location**: `extensions/araya/index.ts:1994`
**Registration pattern**: Matches other ARAYA commands (`pi.registerCommand("araya:ax3", {...})`)

**Flag parsing** (lines 2000-2012):
```typescript
const flags: Record<string, string> = {};
const parts = trimmed.split(/\s+/);
let scope: string | undefined;
for (let i = 0; i < parts.length; i++) {
  if (part === "--check") flags.check = "true";
  else if (part === "--dry-run") flags["dry-run"] = "true";
  else if (part === "--repair") flags.repair = "true";
  else if (part === "--scope") { scope = parts[i + 1]; i++; }
}
```

### Finding 2: Flag parsing fragile for combined flags
`/araya:ax3 --check --scope src` would parse scope correctly, but `/araya:ax3 --scope src --check` would set `scope = "src"` and then also set `flags.check = "true"` (correct), but `scope` assignment logic is fragile: `else if (!part.startsWith("--")) { if (!scope && !flags.check && !flags["dry-run"] && !flags.repair) scope = part; }` — this could accidentally treat a non-flag word as scope.

**Severity**: Low | **Recommendation**: Use a proper argument parser or validate scope path exists

### Finding 3: Dynamic import path
`await import("../../src/araya/v2/ax3")` — This path is relative to `extensions/araya/index.ts`. It resolves to `src/araya/v2/ax3/index.ts` correctly, but only works in the dev/build environment where extensions and src are siblings. In a published package, this might break.

**Severity**: Low | **Recommendation**: Document this coupling; consider path alias in tsconfig

---

## 3. Resolver Implementation

### Assessment: ✅ SOLID

**`findProjectRoot()`**: Walks up looking for `araya.yaml` or `.git`. Correctly bounded (30 levels). ✅

**`findRootAx3()`**: Walks up from startDir collecting AX3.md candidates, returns highest. Correctly distinguishes between root and children. ✅

**`parseAx3()`**: Extracts sections via regex, detects managed markers, parses index entries. Handles both managed and unmanaged sections. ✅

**`resolveAx3Chain()`**: Walks from root toward each target path, collects AX3.md files, sorts by depth. Correctly handles paths outside project root. ✅

**`walkDirs()`**: Recursive walk with exclusions, max depth, symlink resolution, dedup via normalized paths. ✅

### Edge Cases Handled:
- Broken symlinks → skipped (try/catch) ✅
- Path traversal via symlinks → `norm.startsWith(normalize(root))` check ✅
- Permission denied → `readdirSafe()` returns empty array ✅
- Max depth exceeded → stops recursion ✅

---

## 4. Reconciler Implementation

### Assessment: ✅ CORRECT with minor issues

**Core algorithm** (7 steps):
1. Ensure root AX3.md exists → ✅
2. Walk directories → ✅
3. Collect existing AX3.md → ✅
4. Identify durable boundaries → ✅
5. Create missing children → ✅
6. Update indexes → ✅
7. Detect stale/orphan entries → ✅

**Template generation**: `generateRootTemplate()` and `generateChildTemplate()` produce valid AX3.md with all 6 canonical sections. ✅

**Managed section replacement**: Uses regex to replace content between markers. The regex handles the BEGIN/END pattern correctly. ✅

**Human content preservation**: Only modifies content between `<!-- BEGIN/END ARAYA MANAGED -->` markers. Human-authored sections (Purpose, Ownership, etc.) are never touched by managed section replacement. ✅

**`buildParentChildMap()`**: Correctly identifies direct children by depth calculation. ✅

**`findDurableBoundaries()`**: Heuristic-based (structural names, subdirectory count, file count). Good default behavior. ✅

---

## 5. TypeScript Correctness

### Assessment: ✅ TYPE-SAFE

- All exported types have explicit interfaces ✅
- No `any` usage in core logic (only in catch blocks for errors) ✅
- Function signatures are fully typed ✅
- Return types are explicit ✅

---

## 6. Error Handling

### Assessment: ⚠️ ADEQUATE (non-critical gaps)

| Scenario | Handled? | Mechanism |
|----------|----------|-----------|
| Missing project root | ✅ | `findProjectRoot()` throws descriptive error |
| Missing AX3.md | ✅ | Returns null or empty chain |
| Permission denied | ✅ | `readdirSafe()` returns [] |
| Broken symlink | ✅ | try/catch in `walkDirs()` |
| Parse error | ✅ | try/catch in `reconcile()`, added to issues |
| Invalid path (outside root) | ✅ | `relTarget.startsWith("..")` check |
| Empty directory | ✅ | Returns empty result |
| Concurrent writes | ❌ | No file locking |
| Extremely large repo (>10K dirs) | ⚠️ | No progress callback; could timeout |

**Note**: Concurrent writes and large repo performance are out of scope per req-001.md.

---

## Summary

| Area | Status | Issues |
|------|--------|--------|
| preflight/postflight | ✅ APPROVED | Add `repair` param (Finding 1) |
| Command registration | ✅ APPROVED | Flag parsing (Finding 2), import path (Finding 3) |
| Resolver | ✅ APPROVED | — |
| Reconciler | ✅ APPROVED | — |
| TypeScript | ✅ APPROVED | — |
| Error handling | ✅ APPROVED | — |

**Overall**: APPROVED. Three low-severity findings. None blocking.
