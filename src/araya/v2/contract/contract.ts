// ARAYA v2.0 — AX Contract Tree: boundary declaration, manifest, resolution (Slice 6).
//
// Per Accepted ADR-0010. Boundary identity is LOGICAL and DECLARED, never
// physical/directory-based (§3.1): an AGENTS.md declares the logical boundary it
// governs in frontmatter, and a project-scoped resolver manifest maps that
// logical id to a physical root AT RUNTIME — so the same contract tree is
// portable to the external projects .araya runs as a PMO. Nothing here derives a
// boundary id from a directory path.

import { load } from "js-yaml";
import { readFileSync, existsSync } from "node:fs";
import { resolve as pathResolve, join, dirname } from "node:path";

/** Markers that fence the generator-owned region of the descriptive layer. */
export const DESCRIPTIVE_BEGIN = "<!-- BEGIN GENERATED: descriptive — do not edit by hand -->";
export const DESCRIPTIVE_END = "<!-- END GENERATED: descriptive -->";

/** A project-scoped logical→physical map. Each managed project supplies its own. */
export interface BoundaryManifest {
  /** The managed project this manifest resolves boundaries for. */
  project: string;
  /** Physical base the roots are relative to (the project checkout root). */
  base: string;
  /** logical boundary id -> physical root (relative to base). */
  roots: Record<string, string>;
}

export interface BoundaryFrontmatter {
  /** The logical boundary id this contract governs (e.g. "ax:boundary:araya/v2/ledger"). */
  boundary: string;
  /** The parent logical boundary id, forming the logical tree (§3.3). */
  parent?: string;
  /** The ADR that governs prescriptive changes to this boundary. */
  adr?: string;
  /** Boundary kind. "published-interface" marks the ADR-0012 overlay. */
  kind?: string;
  /** Published-interface overlay (ADR-0012): the pinned interface version
   *  (MAJOR.REVISION.HOTFIX, reusing the araya.yaml standard). */
  interfaceVersion?: string;
  /** Published-interface overlay: the project-base-relative source file whose
   *  exported surface is the promised contract. A declared pointer, not the
   *  boundary identity (which stays logical). */
  interfaceSource?: string;
}

export interface ParsedContract {
  frontmatter: BoundaryFrontmatter;
  /** Text of the ## Prescriptive section (authored; excludes the heading). */
  prescriptive: string;
  /** Text inside the generated descriptive markers (generated/observed). */
  descriptive: string;
  /** The whole file, verbatim. */
  raw: string;
}

/**
 * Resolve a LOGICAL boundary id to a physical root via a manifest. The manifest
 * is the only thing that knows physical locations; swap the manifest and the
 * same logical id resolves elsewhere (portability proof). Never path-derives.
 */
export class BoundaryResolver {
  constructor(private readonly manifest: BoundaryManifest) {}

  static fromFile(manifestPath: string): BoundaryResolver {
    const m = JSON.parse(readFileSync(manifestPath, "utf-8")) as BoundaryManifest;
    // `base` is stored relative to the manifest's own directory, so the manifest
    // is portable (never cwd-dependent): resolve it against the manifest path.
    m.base = pathResolve(dirname(manifestPath), m.base);
    return new BoundaryResolver(m);
  }

  /** True when this manifest knows where the boundary physically lives. */
  knows(boundaryId: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.manifest.roots, boundaryId);
  }

  /** Absolute physical root for a logical boundary id, or null if unmapped. */
  resolveRoot(boundaryId: string): string | null {
    const rel = this.manifest.roots[boundaryId];
    if (rel === undefined) return null;
    return pathResolve(this.manifest.base, rel);
  }

  /** Absolute path to a boundary's AGENTS.md, or null if unmapped. */
  resolveContractPath(boundaryId: string): string | null {
    const root = this.resolveRoot(boundaryId);
    return root === null ? null : join(root, "AGENTS.md");
  }

  /** The project this resolver serves (for diagnostics). */
  get project(): string {
    return this.manifest.project;
  }

  /** Resolve a project-base-relative path (e.g. a declared interface_source) to
   *  an absolute path via the manifest base — portable, never cwd-derived. */
  resolveFromBase(relPath: string): string {
    return pathResolve(this.manifest.base, relPath);
  }
}

/** Split an AGENTS.md string into frontmatter + the two layers. */
export function parseContract(raw: string): ParsedContract {
  const fm = parseFrontmatter(raw);
  return {
    frontmatter: fm,
    prescriptive: extractSection(raw, "Prescriptive").trim(),
    descriptive: extractGenerated(raw).trim(),
    raw,
  };
}

/** Load + parse a boundary's AGENTS.md by logical id via the resolver. */
export function loadContract(boundaryId: string, resolver: BoundaryResolver): ParsedContract | null {
  const path = resolver.resolveContractPath(boundaryId);
  if (path === null || !existsSync(path)) return null;
  return parseContract(readFileSync(path, "utf-8"));
}

function parseFrontmatter(raw: string): BoundaryFrontmatter {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error("AGENTS.md missing YAML frontmatter");
  const data = (load(m[1]) ?? {}) as Record<string, unknown>;
  if (typeof data.boundary !== "string" || !data.boundary) {
    throw new Error("AGENTS.md frontmatter must declare a logical `boundary:` id");
  }
  return {
    boundary: data.boundary,
    parent: typeof data.parent === "string" ? data.parent : undefined,
    adr: typeof data.adr === "string" ? data.adr : undefined,
    kind: typeof data.kind === "string" ? data.kind : undefined,
    interfaceVersion: typeof data.interface_version === "string" ? data.interface_version : undefined,
    interfaceSource: typeof data.interface_source === "string" ? data.interface_source : undefined,
  };
}

/** Text of a `## <name>` section up to the next `## ` heading (or EOF). */
function extractSection(raw: string, name: string): string {
  const headRe = new RegExp(`^##\\s+${name}\\s*$`, "m");
  const head = raw.match(headRe);
  if (!head || head.index === undefined) return "";
  const bodyStart = head.index + head[0].length;
  const rest = raw.slice(bodyStart);
  const next = rest.search(/^##\s/m);
  return next === -1 ? rest : rest.slice(0, next);
}

/** Text fenced by the descriptive generated markers (excludes the markers). */
function extractGenerated(raw: string): string {
  const start = raw.indexOf(DESCRIPTIVE_BEGIN);
  const end = raw.indexOf(DESCRIPTIVE_END);
  if (start === -1 || end === -1 || end < start) return "";
  return raw.slice(start + DESCRIPTIVE_BEGIN.length, end);
}
