# AX3 — Functional & Non-Functional Requirements
## Manu (Product Owner) — Formal Specification

**Date**: 2026-06-16
**Status**: Approved for BDD/TDD
**Confidence**: 0.93
**Traceability**: Derived from `.araya/plan/spec/ax3-vision.md`

---

## Functional Requirements

### RF-01: Root Discovery
**Priority**: High
**Description**: The system MUST detect the project root by walking up from the current working directory, looking for `araya.yaml` or `.git`. If neither is found within 30 levels, the system MUST throw a descriptive error.
**Acceptance Criteria**:
1. Given a project with `araya.yaml` at root, `findProjectRoot()` returns the correct absolute path
2. Given a project with only `.git`, `findProjectRoot()` returns the correct absolute path
3. Given neither `araya.yaml` nor `.git` within 30 parent levels, an error is thrown with message "Cannot find project root"
4. The function works when called from a subdirectory (not just the root)

### RF-02: AX3.md Parsing
**Priority**: High
**Description**: The system MUST parse `AX3.md` files into a structured `Ax3Doc` object containing: path, directory, raw content, sections (keyed by section name), child index entries, managed section detection, and root flag.
**Acceptance Criteria**:
1. A valid AX3.md with all 6 canonical sections parses into an `Ax3Doc` with all sections extracted
2. Sections are correctly delimited by `## Section Name` headers
3. The Child AX3 Index section is parsed into `Ax3IndexEntry[]` with paths and descriptions
4. Managed markers (`<!-- BEGIN/END ARAYA MANAGED -->`) are correctly detected
5. Files without managed sections have `hasManagedSection: false`

### RF-03: AX3 Chain Resolution
**Priority**: High
**Description**: Given one or more target file paths, the system MUST resolve the AX3 chain from root to the nearest AX3.md governing those paths. The chain is ordered root-first, nearest-last.
**Acceptance Criteria**:
1. Given a project with root AX3.md, `src/AX3.md`, and `src/components/AX3.md`, resolving a path in `src/components/` returns all 3 docs in order
2. The `nearest` field returns the deepest AX3.md in the ancestry chain
3. Paths outside the project root are skipped (no error)
4. If no AX3.md exists, a descriptive summary is returned

### RF-04: Reconciliation — Root Creation
**Priority**: High
**Description**: `/araya:ax3` (default mode) MUST detect or create the root `AX3.md` when it does not exist, populating it with the canonical template.
**Acceptance Criteria**:
1. Given a project with no AX3.md, reconciliation creates root `AX3.md` at the project root
2. The created file contains all 6 canonical sections
3. The Child AX3 Index section uses managed markers
4. The creation is reported in the changes list with type "create"

### RF-05: Reconciliation — Child Creation
**Priority**: High
**Description**: The reconciler MUST walk the directory tree recursively, identify durable boundaries (significant subdirectories or source files), and create child `AX3.md` files where justified.
**Acceptance Criteria**:
1. `src/`, `skills/`, `tests/`, `extensions/`, `prompts/` with subdirectories get child AX3.md files
2. Directories with ≥ 10 source files get child AX3.md files
3. Nested directories with ≥ 2 subdirectories and ≥ 3 source files get child AX3.md files
4. New child AX3.md uses the child template (not root template)

### RF-06: Reconciliation — Index Management
**Priority**: High
**Description**: After creating or updating AX3.md files, the reconciler MUST update all `Child AX3 Index` sections to reflect the current hierarchy.
**Acceptance Criteria**:
1. A parent AX3.md lists all direct child AX3.md files in its managed index
2. Existing managed sections are replaced with updated content
3. Unmanaged Child AX3 Index sections are converted to managed sections
4. AX3.md files without a Child AX3 Index section get one added (managed)
5. Second reconciliation of a clean tree produces zero changes (idempotence)

### RF-07: `--check` Flag
**Priority**: High
**Description**: `/araya:ax3 --check` MUST detect drift without writing any files. Returns exit code 0 (clean) or 1 (drift detected) via `Ax3CheckResult.drift`.
**Acceptance Criteria**:
1. On a clean tree, `check()` returns `drift: false` with 0 violations
2. When root AX3.md is missing, `check()` returns `drift: true` with ≥ 1 violations
3. When a child AX3.md exists but is not in the parent index, it's reported as drift
4. No files are created or modified during `--check`

### RF-08: `--dry-run` Flag
**Priority**: Medium
**Description**: `/araya:ax3 --dry-run` MUST report planned changes without writing any files.
**Acceptance Criteria**:
1. `dryRun()` returns a changes list with all planned operations
2. No files on disk are created or modified
3. The changes list includes type, path, and description for each planned change

### RF-09: `--scope` Flag
**Priority**: Medium
**Description**: `/araya:ax3 --scope <path>` MUST reconcile only the specified subtree, updating parent indexes that reference it.
**Acceptance Criteria**:
1. Scoped reconciliation only creates/updates AX3.md files within the scope
2. Parent indexes outside the scope are still updated to reflect scoped changes
3. Directories outside the scope are not walked

### RF-10: `--repair` Flag
**Priority**: Medium
**Description**: `/araya:ax3 --repair` MUST fix safe inconsistencies (missing indexes, stale entries) without overwriting human-authored content.
**Acceptance Criteria**:
1. Stale index entries (pointing to non-existent files) are removed
2. Missing index entries are added
3. Human-authored sections outside managed markers are preserved
4. Ambiguities are reported as issues, not silently fixed

### RF-11: Preflight Hook
**Priority**: High
**Description**: Before any agent modifies files, the preflight hook MUST resolve and return the AX3 chain governing the target paths.
**Acceptance Criteria**:
1. `preflight(targetPaths)` returns the full AX3 chain
2. The chain includes root AX3.md at minimum
3. If no AX3.md exists, the chain summary indicates this clearly
4. The hook is called by the agent adapter, not by each agent individually

### RF-12: Postflight Hook
**Priority**: High
**Description**: After meaningful changes (purpose, scope, structure, contracts, workflows, ownership, AX3.md creation/deletion/move), the postflight hook MUST reconcile affected AX3.md files.
**Acceptance Criteria**:
1. `postflight(scope, dryRun)` runs reconciliation on the affected scope
2. Returns `Ax3ReconcileResult` with changes and issues
3. In dryRun mode, no writes occur
4. Postflight is called by the agent adapter, not by each agent individually

### RF-13: Exclusion Configuration
**Priority**: High
**Description**: The reconciler MUST exclude `.git`, `node_modules`, `dist`, `build`, `vendor`, `__pycache__`, `.venv`, caches, and generated artifacts by default.
**Acceptance Criteria**:
1. `node_modules/` and its subdirectories never get AX3.md files
2. Hidden directories (except `.araya`) are excluded
3. `.git/` is never walked
4. `.araya/runs`, `.araya/evidence`, `.araya/telemetry`, `.araya/worktrees` are excluded
5. Default exclusions can be overridden via configuration

### RF-14: Symlink Safety
**Priority**: Critical
**Description**: The system MUST block path traversal via symlinks. Symlinks pointing outside the project root MUST NOT be followed, and no AX3.md files may be created outside the project root.
**Acceptance Criteria**:
1. Symlinks pointing outside project root are detected and skipped
2. No AX3.md is created at a symlink target outside project root
3. Broken symlinks are handled gracefully (skipped, no crash)
4. Symlink cycles are detected and avoided

### RF-15: Managed Section Markers
**Priority**: High
**Description**: ARAYA-managed content MUST be wrapped in `<!-- BEGIN ARAYA MANAGED: Section Name -->` and `<!-- END ARAYA MANAGED: Section Name -->` markers. Content outside markers is human-authored and preserved.
**Acceptance Criteria**:
1. Managed sections are clearly delimited with HTML comment markers
2. Reconciler only modifies content between markers
3. Human-authored content (Purpose, Ownership, etc.) is never overwritten
4. Converting an unmanaged section to managed adds markers around the existing content

---

## Non-Functional Requirements

### RNF-01: Performance — Reconciliation Speed
**Category**: Performance | **Priority**: High
**Description**: Reconciliation MUST complete in under 5 seconds for repositories with fewer than 1000 directories.
**Measurement**: Timed reconciliation on a repository with 500 dirs must be < 3s; with 1000 dirs < 5s.

### RNF-02: Performance — Memory Footprint
**Category**: Performance | **Priority**: Medium
**Description**: Reconciliation MUST NOT exceed 100MB heap usage for repositories with fewer than 1000 directories.
**Measurement**: Peak heap usage during reconciliation measured via `process.memoryUsage()`.

### RNF-03: Reliability — Idempotence
**Category**: Reliability | **Priority**: Critical
**Description**: Reconciling a clean tree (no changes needed) MUST produce zero changes on every invocation. Reconciling the same tree twice MUST produce identical results.
**Measurement**: 100 consecutive reconciliation calls on a clean tree → zero changes each time.

### RNF-04: Reliability — Determinism
**Category**: Reliability | **Priority**: High
**Description**: Given identical input state, reconciliation MUST produce identical output (same files, same content, same change list order).
**Measurement**: Run reconciliation on the same repo 10 times, compare outputs bit-for-bit.

### RNF-05: Security — Path Traversal Prevention
**Category**: Security | **Priority**: Critical
**Description**: No path (absolute, relative with `../`, or via symlink) may allow AX3 to read or write files outside the project root.
**Measurement**: Diana's security test suite verifies all traversal vectors are blocked.

### RNF-06: Security — Write Containment
**Category**: Security | **Priority**: Critical
**Description**: AX3 MUST only write to `AX3.md` files within the project root. It MUST NOT modify any other file type.
**Measurement**: Code audit confirms only `.endsWith('AX3.md')` paths are written.

### RNF-07: Maintainability — Module Structure
**Category**: Maintainability | **Priority**: Medium
**Description**: AX3 code MUST be organized into `types.ts`, `resolver.ts`, `reconciler.ts`, and `index.ts` within `src/araya/v2/ax3/`.
**Measurement**: File listing confirms expected module structure.

### RNF-08: Maintainability — Test Coverage
**Category**: Maintainability | **Priority**: High
**Description**: AX3 MUST have ≥ 90% code coverage across unit, integration, and regression tests covering all 15 functional requirements.
**Measurement**: Teresa reports coverage metrics after test execution.

### RNF-09: Compatibility — Existing Features
**Category**: Compatibility | **Priority**: Critical
**Description**: AX3 integration MUST NOT break existing commands (`/araya run`, agent slash commands), existing agents, or the existing test suite (MVP2 smoke test).
**Measurement**: Full test suite passes before and after AX3 integration.

### RNF-10: Portability — Node.js Only
**Category**: Portability | **Priority**: Medium
**Description**: AX3 MUST use only Node.js standard library (`fs`, `path`) with no native dependencies or external packages.
**Measurement**: `npm ls --prod` shows no new dependencies for AX3.

---

## Acceptance Criteria Summary (for Manu's Pre-Delivery Validation)

| AC # | Description | Source RF |
|------|-------------|-----------|
| AC-01 | `/araya:ax3` on a clean project builds a valid hierarchy | RF-04, RF-05 |
| AC-02 | Second execution produces no unnecessary changes (idempotence) | RF-06, RNF-03 |
| AC-03 | Before editing a path, agent reads the applicable AX3 chain | RF-11 |
| AC-04 | Nearest AX3.md controls local details without weakening root | RF-03 |
| AC-05 | Meaningful changes trigger postflight AX3 update | RF-12 |
| AC-06 | Indexes update correctly after create/move/delete boundaries | RF-06 |
| AC-07 | Existing human content is preserved | RF-15 |
| AC-08 | `--check` does not write and detects drift via exit code | RF-07 |
| AC-09 | `--dry-run` does not write and shows comprehensible diff | RF-08 |
| AC-10 | Exclusions and symlinks do not allow escaping the repository | RF-13, RF-14, RNF-05 |
| AC-11 | Tests cover root, children, monorepo, drift, idempotence, moves, exclusions, conflicts, errors | RF-01–15, RNF-08 |
| AC-12 | Feature documented in README, command reference, and agent docs | (Docs requirement) |
| AC-13 | Integration does not break existing commands, agents, or tests | RNF-09 |
| AC-14 | Traceability from requirements to tests, commits, and evidence exists | (Governance) |
| AC-15 | Daneel can independently verify all claims | (Audit) |
