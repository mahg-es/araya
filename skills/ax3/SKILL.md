---
name: ax3
description: AX3 contract hierarchy — read AX3.md chain before editing, update after meaningful changes, reconcile the AX3 tree. This is an ARAYA AX (cross-cutting) feature.
---

# AX3 — ARAYA AX Feature: Agent Execution Contract Hierarchy

## What Problem

AI agents editing files without understanding project context, local rules, or
hierarchical constraints. Without a binding contract system, agents operate
blindly — leading to drift, inconsistency, and broken contracts.

AX3 provides a lightweight, file-system-native contract hierarchy (`AX3.md`
files) that all ARAYA agents read before editing and update after meaningful
changes.

## When to Use

- **Preflight**: Before any agent modifies files, load the AX3 chain from root
  to the nearest `AX3.md` governing the target paths.
- **Postflight**: After meaningful changes (purpose, scope, structure, contracts,
  workflows, ownership, or `AX3.md` creation/deletion/move), update affected
  `AX3.md` files and their Child AX3 Indexes.
- **Reconciliation**: Run `/araya:ax3` to build, repair, or verify the entire
  AX3 tree for a project.
- **CI/Pre-commit**: Run `/araya:ax3 --check` to detect drift without writing.

## Input

- A repository root (auto-detected via `araya.yaml` or git root)
- Optional: `--scope <path>`, `--check`, `--dry-run`, `--repair`
- Optional: configuration for exclusions, max depth

## Output

- A valid AX3.md hierarchy (root + children with indexes)
- For `--check`: exit code 0 (clean) or 1 (drift detected)
- For `--dry-run`: planned changes displayed, no writes
- For reconciliation: updated AX3.md files, regenerated indexes

## Contract Architecture

### Relationship to AGENTS.md Boundaries (ADR-0010)

AX3 (`AX3.md`) and AGENTS.md boundaries are **complementary**:

| Aspect | AGENTS.md (ADR-0010) | AX3.md |
|--------|---------------------|--------|
| Identity | Logical boundary IDs | Physical directory hierarchy |
| Resolution | Manifest (.araya/contracts/*.json) | Filesystem walk |
| Frontmatter | YAML (`boundary:`, `parent:`) | None (markdown-only) |
| Use case | Governed internal boundaries | Project-wide + external compatibility |
| Portability | Manifest-swap for external projects | Self-contained, copy-paste |

Both are supported. An agent SHOULD check both mechanisms. AX3 provides the
simpler, portable contract that works across all AI coding tools (Codex, Claude
CLI, AGY, pi.dev). The AGENTS.md boundary system provides stricter governance
for internal ARAYA boundaries.

### AX3.md Section Order

1. **Purpose** — what this subtree does, why it exists
2. **Ownership** — who owns decisions in this subtree
3. **Local Contracts** — binding rules for this subtree (must not weaken parents)
4. **Work Guidance** — standards, patterns, conventions
5. **Verification** — how to verify compliance in this subtree
6. **Child AX3 Index** — managed list of child AX3.md files

## Steps

### /araya:ax3 (default — reconcile entire project)

1. Detect project root (git root or araya.yaml location)
2. If no root `AX3.md` exists, create it from template
3. Walk directory tree recursively, respecting exclusions
4. Identify durable boundaries that justify child `AX3.md` files
5. Create missing child `AX3.md` files where needed
6. Update all `Child AX3 Index` sections
7. Detect stale entries (moved, deleted, renamed)
8. Preserve human-authored content; only modify managed sections

### /araya:ax3 --check

1. Walk the tree as above
2. Compare current state against what reconciliation would produce
3. Report drift as violations (missing indexes, stale entries, orphans)
4. Exit 0 if clean, exit 1 if drift detected

### /araya:ax3 --dry-run

1. Same as reconciliation but write nothing
2. Display planned changes as a readable diff

### /araya:ax3 --scope <path>

1. Reconcile only the subtree rooted at `<path>`
2. Update parent indexes that reference the scoped path

### /araya:ax3 --repair

1. Fix safe inconsistencies automatically (missing indexes, stale entries)
2. Report ambiguities that need human decision
3. Never overwrite human-authored content

## Rules

- **Preflight is mandatory**: Before any agent modifies files, it MUST read the
  applicable AX3 chain from root to nearest `AX3.md` governing target paths.
- **Postflight is mandatory**: After meaningful changes, the agent MUST update
  affected `AX3.md` files and their indexes.
- **Child never weakens parent**: Local rules may concretize but never weaken
  rules from parent `AX3.md` files.
- **Idempotent**: Reconciling a clean tree produces no changes.
- **Non-destructive**: Never overwrite human-authored sections. Only modify
  clearly managed sections (Child AX3 Index, generated descriptive blocks).
- **Path safety**: Reject paths that escape the repository via symlinks, `../`,
  or absolute paths pointing outside the project root.
- **Exclusions**: Always ignore `.git`, `node_modules`, `dist`, `vendor`,
  `__pycache__`, `.venv`, caches, and generated artifacts by default.
- **Section markers**: Managed sections use `<!-- BEGIN ARAYA MANAGED: ... -->`
  and `<!-- END ARAYA MANAGED: ... -->` markers. Content between these markers is
  auto-generated and may be overwritten. Content outside is human-authored and
  preserved.
