// ARAYA v2 — AX3 Feature: types and constants
//
// AX3.md is the portable, filesystem-native contract hierarchy.
// Complementary to AGENTS.md boundaries (ADR-0010 logical/manifest-resolved).

/** MIME type / file identity for AX3 contracts. */
export const AX3_FILENAME = "AX3.md";

/** Marker for ARAYA-managed sections within AX3.md. */
export const MANAGED_BEGIN = "<!-- BEGIN ARAYA MANAGED:";
export const MANAGED_END = "<!-- END ARAYA MANAGED:";

/** The section name that ARAYA auto-manages. */
export const MANAGED_SECTION = "Child AX3 Index";

/** Default exclusion patterns (directory names, not globs). */
export const DEFAULT_EXCLUSIONS = [
  ".git",
  "node_modules",
  "dist",
  "build",
  "vendor",
  "__pycache__",
  ".venv",
  "venv",
  ".tox",
  ".mypy_cache",
  ".pytest_cache",
  ".cache",
  "target",        // Rust
  ".next",         // Next.js
  ".nuxt",         // Nuxt
  ".output",       // Nuxt/Nitro
  "coverage",
  ".nyc_output",
  ".turbo",        // Turborepo
  ".araya/runs",   // ARAYA runtime
  ".araya/evidence",
  ".araya/telemetry",
  ".araya/worktrees",
];

/** Default max recursion depth. */
export const DEFAULT_MAX_DEPTH = 20;

/** Section order for AX3.md files (canonical). */
export const AX3_SECTIONS = [
  "Purpose",
  "Ownership",
  "Local Contracts",
  "Work Guidance",
  "Verification",
  "Child AX3 Index",
] as const;

export type Ax3Section = (typeof AX3_SECTIONS)[number];

/** A parsed AX3.md file. */
export interface Ax3Doc {
  /** Absolute path to this AX3.md. */
  path: string;
  /** Directory containing this AX3.md. */
  directory: string;
  /** Raw file content. */
  raw: string;
  /** Section contents, keyed by section name. */
  sections: Record<string, string>;
  /** The Child AX3 Index entries (managed section). */
  childIndex: Ax3IndexEntry[];
  /** Whether this file has an ARAYA-managed section. */
  hasManagedSection: boolean;
  /** Managed section content (between markers). */
  managedContent: string;
  /** Whether this is the root AX3.md (closest to project root). */
  isRoot: boolean;
}

/** An entry in the Child AX3 Index. */
export interface Ax3IndexEntry {
  /** Relative path from this AX3.md's directory to the child AX3.md. */
  path: string;
  /** The child directory name or description. */
  description?: string;
}

/** Result of resolving the AX3 chain for a target path. */
export interface Ax3Chain {
  /** Chain from root to nearest (root first, nearest last). */
  docs: Ax3Doc[];
  /** The nearest AX3.md governing the target path. */
  nearest: Ax3Doc | null;
  /** Human-readable chain summary. */
  summary: string;
}

/** Planned change from --dry-run. */
export interface Ax3Change {
  type: "create" | "update-index" | "delete-stale" | "repair";
  path: string;
  description: string;
  before?: string;
  after?: string;
}

/** Reconciliation result. */
export interface Ax3ReconcileResult {
  /** Whether any changes were made. */
  changed: boolean;
  /** Number of AX3.md files in the tree. */
  docCount: number;
  /** Planned or applied changes. */
  changes: Ax3Change[];
  /** Any issues found. */
  issues: string[];
}

/** Drift check result. */
export interface Ax3CheckResult {
  /** Whether drift was detected. */
  drift: boolean;
  /** Number of drift violations. */
  violationCount: number;
  /** Detailed violations. */
  violations: string[];
}
