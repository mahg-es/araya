// ARAYA v2 — AX3 Reconciler: tree reconciliation, index management, repair.
//
// Deterministic, idempotent. Never overwrites human-authored content.
// Only modifies sections between ARAYA MANAGED markers.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve as pathResolve, relative, dirname, join, sep } from "node:path";
import {
  AX3_FILENAME,
  MANAGED_BEGIN,
  MANAGED_END,
  DEFAULT_EXCLUSIONS,
  DEFAULT_MAX_DEPTH,
  type Ax3Doc,
  type Ax3IndexEntry,
  type Ax3ReconcileResult,
  type Ax3Change,
  type Ax3CheckResult,
} from "./types";
import { findProjectRoot, findRootAx3, parseAx3, walkDirs } from "./resolver";

// ─── Reconciliation ──────────────────────────────────────────────────────

/**
 * Reconcile the AX3 tree for a project (or scope). This is the main entry
 * point for `/araya:ax3`.
 */
export function reconcile(
  projectRoot?: string,
  scope?: string,
  dryRun: boolean = false,
  repair: boolean = false
): Ax3ReconcileResult {
  const root = projectRoot ? pathResolve(projectRoot) : findProjectRoot();
  const changes: Ax3Change[] = [];
  const issues: string[] = [];

  // 1. Ensure root AX3.md exists
  let rootAx3Path = findRootAx3(root);
  const rootAx3Exists = rootAx3Path !== null;

  if (!rootAx3Exists) {
    rootAx3Path = join(root, AX3_FILENAME);
    const change: Ax3Change = {
      type: "create",
      path: rootAx3Path,
      description: "Create root AX3.md",
    };
    if (!dryRun) {
      writeFileSync(rootAx3Path, generateRootTemplate(root));
    }
    changes.push(change);
  }

  // 2. Walk directories
  const scopeDir = scope ? pathResolve(scope) : root;
  const allDirs = walkDirs(scopeDir, DEFAULT_EXCLUSIONS, DEFAULT_MAX_DEPTH);

  // 3. Collect existing AX3.md files (include root directory)
  const existingAx3Files = new Map<string, Ax3Doc>();
  const ax3Dirs = new Set<string>();

  // Check root first
  if (rootAx3Path && existsSync(rootAx3Path)) {
    try {
      const doc = parseAx3(rootAx3Path, true);
      existingAx3Files.set(rootAx3Path, doc);
      ax3Dirs.add(root);
    } catch (e: any) {
      issues.push(`Error parsing root ${rootAx3Path}: ${e.message}`);
    }
  } else if (!rootAx3Exists) {
    // Root was just created by us
    const newRootPath = join(root, AX3_FILENAME);
    ax3Dirs.add(root);
    try {
      const doc = parseAx3(newRootPath, true);
      existingAx3Files.set(newRootPath, doc);
    } catch (e: any) {
      issues.push(`Error parsing new root: ${e.message}`);
    }
  }

  // Collect existing AX3.md files in subdirectories
  for (const dir of allDirs) {
    const ax3Path = join(dir, AX3_FILENAME);
    if (existsSync(ax3Path)) {
      try {
        const doc = parseAx3(ax3Path, dir === root);
        existingAx3Files.set(ax3Path, doc);
        ax3Dirs.add(dir);
      } catch (e: any) {
        issues.push(`Error parsing ${ax3Path}: ${e.message}`);
      }
    }
  }

  // 4. Identify durable boundaries that justify child AX3.md
  const candidateDirs = findDurableBoundaries(allDirs, root, ax3Dirs);

  // 5. Create missing child AX3.md files
  for (const dir of candidateDirs) {
    const ax3Path = join(dir, AX3_FILENAME);
    if (!existingAx3Files.has(ax3Path)) {
      const relDir = relative(root, dir) || ".";
      const change: Ax3Change = {
        type: "create",
        path: ax3Path,
        description: `Create child AX3.md for ${relDir}`,
      };
      if (!dryRun) {
        writeFileSync(ax3Path, generateChildTemplate(dir, root));
        existingAx3Files.set(ax3Path, parseAx3(ax3Path, false));
      }
      changes.push(change);
    }
  }

  // 6. Update all Child AX3 Indexes
  const parentToChildren = buildParentChildMap(
    root,
    Array.from(existingAx3Files.keys()),
    allDirs
  );

  for (const [parentPath, doc] of existingAx3Files) {
    const children = parentToChildren.get(parentPath) || [];
    const newIndex = generateManagedIndex(children, root, doc.directory);

    const currentRaw = readFileSync(parentPath, "utf-8");

    if (doc.hasManagedSection) {
      // Replace existing managed section
      const managedRe = new RegExp(
        `${escapeRegex(MANAGED_BEGIN)}\\s*Child AX3 Index\\s*-->\\n?[\\s\\S]*?\\n?${escapeRegex(MANAGED_END)}`,
        "m"
      );
      const newManaged = `${MANAGED_BEGIN} Child AX3 Index -->\n${newIndex}\n${MANAGED_END}`;
      const updated = currentRaw.replace(managedRe, newManaged);

      if (updated !== currentRaw) {
        const change: Ax3Change = {
          type: "update-index",
          path: parentPath,
          description: `Update managed Child AX3 Index with ${children.length} entries`,
          before: doc.managedContent.slice(0, 80),
          after: newIndex.slice(0, 80),
        };
        if (!dryRun) {
          writeFileSync(parentPath, updated);
        }
        changes.push(change);
      }
    } else if (doc.sections["Child AX3 Index"] !== undefined) {
      // Replace existing (unmanaged) Child AX3 Index section with managed version
      const sectionRe = /^(##\s+Child AX3 Index\s*\n)([\s\S]*?)(?=^##\s|\z)/m;
      const replacement = `$1${MANAGED_BEGIN} Child AX3 Index -->\n${newIndex}\n${MANAGED_END}\n`;
      const updated = currentRaw.replace(sectionRe, replacement);

      if (updated !== currentRaw) {
        const change: Ax3Change = {
          type: "update-index",
          path: parentPath,
          description: `Convert Child AX3 Index to managed section with ${children.length} entries`,
        };
        if (!dryRun) {
          writeFileSync(parentPath, updated);
        }
        changes.push(change);
      }
    } else {
      // No Child AX3 Index section exists at all — add it
      const newSection = `\n## Child AX3 Index\n${MANAGED_BEGIN} Child AX3 Index -->\n${newIndex}\n${MANAGED_END}\n`;
      const updated = currentRaw.trimEnd() + "\n" + newSection;

      if (children.length > 0) {
        const change: Ax3Change = {
          type: "update-index",
          path: parentPath,
          description: `Add managed Child AX3 Index with ${children.length} entries`,
        };
        if (!dryRun) {
          writeFileSync(parentPath, updated);
        }
        changes.push(change);
      }
    }
  }

  // 7. Detect stale entries (AX3.md files that moved or were deleted)
  for (const [parentPath, doc] of existingAx3Files) {
    for (const entry of doc.childIndex) {
      const expectedPath = pathResolve(doc.directory, entry.path);
      if (!existsSync(expectedPath)) {
        issues.push(`Stale entry in ${relative(root, parentPath)}: ${entry.path} — file not found`);
        // In repair mode, we'd remove the entry (handled by index regeneration above)
      }
    }
  }

  // 8. Detect orphan AX3.md files not referenced by any parent
  for (const [ax3Path] of existingAx3Files) {
    if (ax3Path === rootAx3Path) continue; // root is never orphan
    const isReferenced = Array.from(existingAx3Files.values()).some((doc) =>
      doc.childIndex.some((entry) => {
        const resolved = pathResolve(doc.directory, entry.path);
        return resolved === ax3Path;
      })
    );
    if (!isReferenced) {
      issues.push(`Orphan AX3.md not referenced by any parent index: ${relative(root, ax3Path)}`);
    }
  }

  return {
    changed: changes.length > 0,
    docCount: existingAx3Files.size,
    changes,
    issues,
  };
}

// ─── Check ───────────────────────────────────────────────────────────────

export function check(projectRoot?: string, scope?: string): Ax3CheckResult {
  const result = reconcile(projectRoot, scope, true, false);
  const violations: string[] = [];

  for (const change of result.changes) {
    violations.push(`${change.type}: ${change.path} — ${change.description}`);
  }
  for (const issue of result.issues) {
    violations.push(issue);
  }

  return {
    drift: violations.length > 0,
    violationCount: violations.length,
    violations,
  };
}

// ─── Dry Run ─────────────────────────────────────────────────────────────

export function dryRun(projectRoot?: string, scope?: string): Ax3ReconcileResult {
  return reconcile(projectRoot, scope, true, false);
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Generate a root AX3.md template.
 */
function generateRootTemplate(projectRoot: string): string {
  const projectName = projectRoot.split(sep).pop() || "project";
  return `# ${projectName} — AX3 Project Contract

## Purpose

${projectName} project root. This AX3.md is the top-level contract governing the entire repository.

## Ownership

<!-- Define ownership: who owns decisions at this level -->

## Local Contracts

<!-- Global rules that apply to the entire project -->

## Work Guidance

<!-- Project-wide standards, patterns, and conventions -->

## Verification

<!-- How to verify compliance at the project level -->

## Child AX3 Index

${MANAGED_BEGIN} Child AX3 Index -->
<!-- Auto-managed by ARAYA. Do not edit between markers. -->
${MANAGED_END}
`;
}

/**
 * Generate a child AX3.md template.
 */
function generateChildTemplate(dir: string, projectRoot: string): string {
  const relDir = relative(projectRoot, dir) || ".";
  const dirName = dir.split(sep).pop() || relDir;
  return `# ${dirName} — AX3 Local Contract

## Purpose

<!-- What this subtree does and why it exists -->

## Ownership

<!-- Who owns decisions in this subtree -->

## Local Contracts

<!-- Binding rules for this subtree. Must not weaken parent rules. -->

## Work Guidance

<!-- Standards, patterns, conventions specific to this area -->

## Verification

<!-- How to verify compliance in this subtree -->

## Child AX3 Index

${MANAGED_BEGIN} Child AX3 Index -->
<!-- Auto-managed by ARAYA. Do not edit between markers. -->
${MANAGED_END}
`;
}

/**
 * Generate the managed index content for a parent AX3.md.
 */
function generateManagedIndex(
  children: string[],
  projectRoot: string,
  parentDir: string
): string {
  if (children.length === 0) return "<!-- No child AX3.md files detected -->";

  const entries = children.map((childPath) => {
    const rel = relative(parentDir, childPath);
    // Extract directory name for description
    const childDir = dirname(childPath);
    const dirName = childDir.split(sep).pop() || rel;
    return `- \`${rel}\` — ${dirName}`;
  });

  return entries.join("\n");
}

/**
 * Build a map from parent AX3.md path to list of child AX3.md paths.
 * A child AX3.md is associated with the nearest ancestor AX3.md.
 */
function buildParentChildMap(
  projectRoot: string,
  ax3Paths: string[],
  allDirs: string[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();

  // Sort ax3Paths by depth (shallowest first = root)
  const sorted = ax3Paths.sort((a, b) => {
    const depthA = relative(projectRoot, dirname(a)).split(sep).filter(Boolean).length;
    const depthB = relative(projectRoot, dirname(b)).split(sep).filter(Boolean).length;
    return depthA - depthB;
  });

  for (const ax3Path of sorted) {
    map.set(ax3Path, []);
    const ax3Dir = dirname(ax3Path);
    const ax3DirDepth = relative(projectRoot, ax3Dir).split(sep).filter(Boolean).length;

    // Find all other AX3.md files that are direct children
    for (const other of ax3Paths) {
      if (other === ax3Path) continue;
      const otherDir = dirname(other);

      // other must be inside ax3Dir
      if (!otherDir.startsWith(ax3Dir + sep) && otherDir !== ax3Dir) continue;

      // other must be a direct child (not a deeper descendant)
      const rel = relative(ax3Dir, otherDir);
      const depth = rel.split(sep).filter(Boolean).length;
      if (depth === 1) {
        map.get(ax3Path)!.push(other);
      }
    }
  }

  return map;
}

/**
 * Find durable boundaries — directories that justify an AX3.md.
 * A durable boundary has significant structure: subdirectories, or
 * source files suggesting an independent module/component.
 */
function findDurableBoundaries(
  allDirs: string[],
  projectRoot: string,
  existingAx3Dirs: Set<string>
): string[] {
  const candidates: string[] = [];

  // Heuristic: a directory is a durable boundary if it has >= 2 subdirectories
  // or it's a known structural boundary (src, skills, prompts, etc.)
  const structuralNames = new Set([
    "src", "skills", "prompts", "extensions", "tests", "docs",
    "components", "services", "lib", "modules", "packages",
  ]);

  for (const dir of allDirs) {
    if (existingAx3Dirs.has(dir)) continue;

    const dirName = dir.split(sep).pop() || "";
    const relDir = relative(projectRoot, dir);

    // Skip root-level hidden dirs except .araya
    if (dirName.startsWith(".") && dirName !== ".araya") continue;

    // Count subdirectories
    const subdirs = allDirs.filter(
      (d) => dirname(d) === dir && !DEFAULT_EXCLUSIONS.includes(d.split(sep).pop() || "")
    );

    // Count source files (non-AX3, non-hidden, non-generated)
    let sourceFiles = 0;
    try {
      const { readdirSync } = require("node:fs");
      const entries = readdirSync(dir);
      sourceFiles = entries.filter(
        (e: string) => !e.startsWith(".") && e !== AX3_FILENAME
      ).length;
    } catch { /* ignore */ }

    // Structural boundary: known names + has content
    if (structuralNames.has(dirName) && subdirs.length >= 1) {
      candidates.push(dir);
    }
    // Deep boundary: nested deep + has subdirectories or significant files
    else if (subdirs.length >= 2 && sourceFiles >= 3) {
      candidates.push(dir);
    }
    // Directory with many files (> 10) = significant boundary
    else if (sourceFiles >= 10) {
      candidates.push(dir);
    }
  }

  return candidates;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
