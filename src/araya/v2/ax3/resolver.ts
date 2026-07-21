// ARAYA v2 — AX3 Resolver: root discovery, chain resolution, AX3.md parsing.
//
// Physical directory-based contract hierarchy. No manifest required.
// Complementary to AGENTS.md logical boundary system (ADR-0010).

import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { resolve as pathResolve, dirname, relative, sep, join, normalize } from "node:path";
import {
  AX3_FILENAME,
  MANAGED_BEGIN,
  MANAGED_END,
  AX3_SECTIONS,
  DEFAULT_EXCLUSIONS,
  type Ax3Doc,
  type Ax3IndexEntry,
  type Ax3Chain,
} from "./types";

// ─── Root Discovery ──────────────────────────────────────────────────────

/**
 * Find the project root by walking up from cwd (or explicit start) looking for
 * araya.yaml or .git. Returns the absolute project root path.
 */
export function findProjectRoot(startDir?: string): string {
  let dir = startDir ? pathResolve(startDir) : process.cwd();
  for (let i = 0; i < 30; i++) {
    if (existsSync(join(dir, "araya.yaml"))) return dir;
    if (existsSync(join(dir, ".git"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("AX3: Cannot find project root (no araya.yaml or .git found walking up)");
}

/**
 * Find the root AX3.md by walking up from startDir. Returns the absolute path
 * to the highest AX3.md found within the project root, or null.
 */
export function findRootAx3(projectRoot: string, startDir?: string): string | null {
  let dir = startDir ? pathResolve(startDir) : projectRoot;
  const normalizedRoot = pathResolve(projectRoot);

  // Walk UP from startDir to projectRoot, collecting AX3.md files
  const candidates: string[] = [];
  let current = dir;
  for (let i = 0; i < 30; i++) {
    const ax3Path = join(current, AX3_FILENAME);
    if (existsSync(ax3Path)) {
      candidates.push(pathResolve(ax3Path));
    }
    if (current === normalizedRoot) break;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  // The highest one (closest to root) is the root AX3.md
  return candidates.length > 0 ? candidates[candidates.length - 1] : null;
}

// ─── AX3.md Parsing ─────────────────────────────────────────────────────

/**
 * Parse an AX3.md file into an Ax3Doc structure.
 */
export function parseAx3(ax3Path: string, isRoot: boolean): Ax3Doc {
  const raw = readFileSync(ax3Path, "utf-8");
  const directory = dirname(pathResolve(ax3Path));
  const sections = extractSections(raw);
  const { childIndex, hasManagedSection, managedContent } = extractChildIndex(raw);

  return {
    path: pathResolve(ax3Path),
    directory,
    raw,
    sections,
    childIndex,
    hasManagedSection,
    managedContent,
    isRoot,
  };
}

/**
 * Load an AX3.md file if it exists, returning Ax3Doc or null.
 */
export function loadAx3(ax3Path: string, isRoot: boolean): Ax3Doc | null {
  const abs = pathResolve(ax3Path);
  if (!existsSync(abs)) return null;
  return parseAx3(abs, isRoot);
}

/**
 * Parse a ## Section from markdown body.
 */
function extractSections(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  const sectionRe = /^##\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  const starts: { name: string; index: number }[] = [];

  while ((match = sectionRe.exec(raw)) !== null) {
    starts.push({ name: match[1].trim(), index: match.index });
  }

  for (let i = 0; i < starts.length; i++) {
    const name = starts[i].name;
    const bodyStart = starts[i].index + starts[i].name.length + 3; // "## " + name
    const bodyEnd = i + 1 < starts.length ? starts[i + 1].index : raw.length;
    result[name] = raw.slice(bodyStart, bodyEnd).trim();
  }

  return result;
}

/**
 * Extract the Child AX3 Index from raw text, detecting managed markers.
 */
function extractChildIndex(raw: string): {
  childIndex: Ax3IndexEntry[];
  hasManagedSection: boolean;
  managedContent: string;
} {
  // Check for managed section markers
  const managedMatch = new RegExp(
    `${escapeRegex(MANAGED_BEGIN)}\\s*${escapeRegex("Child AX3 Index")}\\s*-->\\n?([\\s\\S]*?)\\n?${escapeRegex(MANAGED_END)}`,
    "m"
  ).exec(raw);

  let indexText = "";
  let hasManagedSection = false;
  let managedContent = "";

  if (managedMatch) {
    hasManagedSection = true;
    managedContent = managedMatch[1].trim();
    indexText = managedContent;
  } else {
    // Try to find the Child AX3 Index section
    const sectionMatch = /^##\s+Child AX3 Index\s*\n?([\s\S]*?)(?=^##\s|$)/m.exec(raw);
    if (sectionMatch) {
      indexText = sectionMatch[1].trim();
    }
  }

  const entries = parseIndexEntries(indexText);
  return { childIndex: entries, hasManagedSection, managedContent: indexText };
}

/**
 * Parse Child AX3 Index entries (markdown list items).
 */
function parseIndexEntries(text: string): Ax3IndexEntry[] {
  if (!text) return [];
  const entries: Ax3IndexEntry[] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Match "- `path/to/file.md`" or "- path/to" or "- **name** — desc"
    const listMatch = trimmed.match(/^[-*]\s+(?:`([^`]+)`|(\S+))(?:\s*[-—–]\s*(.+))?/);
    if (listMatch) {
      const path = (listMatch[1] || listMatch[2] || "").trim();
      const desc = (listMatch[3] || "").trim();
      if (path) {
        entries.push({ path, description: desc || undefined });
      }
    }
  }
  return entries;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Chain Resolution ───────────────────────────────────────────────────

/**
 * Resolve the AX3 chain for a set of target paths.
 *
 * Algorithm:
 * 1. Find the root AX3.md
 * 2. For each target path, walk from project root toward the target,
 *    collecting every AX3.md along the path.
 * 3. The nearest AX3.md is the one whose directory is deepest within the
 *    target path's ancestry.
 * 4. Chain = root → ... → nearest (all AX3.md ancestors).
 */
export function resolveAx3Chain(
  projectRoot: string,
  targetPaths: string[]
): Ax3Chain {
  const normalizedRoot = pathResolve(projectRoot);
  const rootAx3 = findRootAx3(normalizedRoot);

  if (!rootAx3) {
    return { docs: [], nearest: null, summary: "No AX3.md found in project." };
  }

  const rootDoc = parseAx3(rootAx3, true);

  // For each target path, find the chain
  const allDocs = new Map<string, Ax3Doc>();
  allDocs.set(rootDoc.path, rootDoc);

  let deepestDoc: Ax3Doc = rootDoc;
  let deepestDepth = 0;

  for (const target of targetPaths) {
    const absTarget = pathResolve(target);
    const relTarget = relative(normalizedRoot, absTarget);

    if (relTarget.startsWith("..")) {
      // Target outside project root — skip
      continue;
    }

    // Walk from root toward target, collecting AX3.md files
    const parts = relTarget.split(sep);
    let currentDir = normalizedRoot;

    for (const part of parts) {
      currentDir = join(currentDir, part);
      const candidate = join(currentDir, AX3_FILENAME);
      if (existsSync(candidate)) {
        const absCandidate = pathResolve(candidate);
        if (!allDocs.has(absCandidate)) {
          allDocs.set(absCandidate, parseAx3(absCandidate, false));
        }
        const depth = relative(normalizedRoot, currentDir).split(sep).filter(Boolean).length;
        if (depth > deepestDepth) {
          deepestDepth = depth;
          deepestDoc = allDocs.get(absCandidate)!;
        }
      }
    }
  }

  // Build ordered chain: root → ... → deepest
  // Sort by directory depth
  const chain = Array.from(allDocs.values()).sort((a, b) => {
    const depthA = relative(normalizedRoot, a.directory).split(sep).filter(Boolean).length;
    const depthB = relative(normalizedRoot, b.directory).split(sep).filter(Boolean).length;
    return depthA - depthB;
  });

  const nearest = deepestDoc !== rootDoc ? deepestDoc : rootDoc;

  const summary = chain.map((d) => {
    const rel = relative(normalizedRoot, d.path);
    return d.isRoot ? `ROOT: ${rel}` : `  └─ ${rel}`;
  }).join("\n");

  return { docs: chain, nearest, summary };
}

// ─── Directory Walk ──────────────────────────────────────────────────────

/**
 * Walk a directory tree, collecting all directories (not files),
 * respecting exclusions and max depth. Used by the reconciler.
 */
export function walkDirs(
  root: string,
  exclusions: string[] = DEFAULT_EXCLUSIONS,
  maxDepth: number = 20
): string[] {
  const dirs: string[] = [];
  const seen = new Set<string>();

  function walk(dir: string, depth: number): void {
    if (depth > maxDepth) return;

    let entries;
    try {
      entries = readdirSafe(dir);
    } catch {
      return; // permission denied or not a directory
    }

    for (const entry of entries) {
      if (exclusions.includes(entry)) continue;
      if (entry.startsWith(".") && entry !== ".araya") continue; // skip hidden except .araya

      const fullPath = join(dir, entry);
      let resolvedPath = fullPath;
      try {
        resolvedPath = realpathSync(fullPath);
      } catch {
        continue; // broken symlink or inaccessible
      }

      // Normalize for dedup
      const norm = normalize(resolvedPath);
      if (seen.has(norm)) continue;
      seen.add(norm);

      // Check symlink doesn't escape root
      if (!norm.startsWith(normalize(root))) continue;

      let st;
      try {
        st = statSync(fullPath);
      } catch {
        continue;
      }

      if (st.isDirectory()) {
        dirs.push(norm);
        walk(fullPath, depth + 1);
      }
    }
  }

  walk(root, 0);
  return dirs;
}

/**
 * Safe readdir that returns an empty array on error (permission denied, etc.).
 */
function readdirSafe(dir: string): string[] {
  const { readdirSync } = require("node:fs");
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}
