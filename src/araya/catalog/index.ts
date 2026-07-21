// ARAYA Catalog Module
// WS-07: Registry Implementation — Canonical catalog populator, validator, and search
// Author: Valentina (Backend Developer)
// Date: 2026-07-22

export * from "./types";
export { populate, populateAndWrite } from "./populator";
export { validate } from "./validator";

import * as fs from "node:fs";
import * as path from "node:path";
import { populate, populateAndWrite } from "./populator";
import { validate } from "./validator";
import { Catalog, ValidationReport, CommandEntry, SkillEntry, AgentEntry } from "./types";

// ─── Runtime Catalog Cache ─────────────────────────────────────────────────

let _catalogCache: Catalog | null = null;
let _cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

/**
 * Generate (or re-generate) the catalog from repository sources and write to
 * .araya/catalog/catalog.json. Returns the generated catalog.
 */
export function populateCatalog(root?: string): Catalog {
  const catalog = populateAndWrite(root);
  _catalogCache = catalog;
  _cacheTime = Date.now();
  return catalog;
}

/**
 * Validate the catalog against current sources. Returns a drift report.
 * Exits with 0 if clean, 1 if drift detected (per contract in §3.3).
 */
export function validateCatalog(root?: string): ValidationReport {
  return validate(root);
}

/**
 * Get the catalog. Loads from file or cache. Does NOT regenerate.
 * Use populateCatalog() if you need a fresh generation.
 */
export function getCatalog(root?: string): Catalog {
  // Return from cache if fresh
  if (_catalogCache && (Date.now() - _cacheTime) < CACHE_TTL) {
    return _catalogCache;
  }

  const arayaRoot = root ?? findRoot();
  const catalogPath = path.resolve(arayaRoot, ".araya", "catalog", "catalog.json");

  if (!fs.existsSync(catalogPath)) {
    throw new Error(
      `No catalog found at ${catalogPath}. Run populateCatalog() to generate one.`
    );
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8")) as Catalog;
  _catalogCache = catalog;
  _cacheTime = Date.now();
  return catalog;
}

/**
 * Search the catalog by keyword, type, domain, or status.
 * Returns entries matching all provided criteria.
 */
export interface SearchOptions {
  query?: string;
  type?: "command" | "skill" | "agent" | "all";
  domain?: string;
  status?: string;
  agent?: string;
}

export interface SearchResult {
  entry: CommandEntry | SkillEntry | AgentEntry;
  relevance: number; // higher = better match
}

export function searchCatalog(options: SearchOptions, root?: string): SearchResult[] {
  const catalog = getCatalog(root);
  const results: SearchResult[] = [];

  const query = options.query?.toLowerCase() ?? "";
  const typeFilter = options.type ?? "all";
  const domainFilter = options.domain?.toLowerCase();
  const statusFilter = options.status?.toLowerCase();
  const agentFilter = options.agent?.toLowerCase();

  const candidateEntries: Array<CommandEntry | SkillEntry | AgentEntry> = [];

  if (typeFilter === "all" || typeFilter === "command") {
    candidateEntries.push(...catalog.commands);
  }
  if (typeFilter === "all" || typeFilter === "skill") {
    candidateEntries.push(...catalog.skills);
  }
  if (typeFilter === "all" || typeFilter === "agent") {
    candidateEntries.push(...catalog.agents);
  }

  for (const entry of candidateEntries) {
    // Filter by domain
    if (domainFilter && entry.domain !== domainFilter) continue;
    // Filter by status
    if (statusFilter && entry.status !== statusFilter) continue;
    // Filter by agent (for skill entries: check assigned_agents)
    if (agentFilter && entry.type === "skill") {
      const se = entry as SkillEntry;
      if (!se.assigned_agents.some(a => a.toLowerCase() === agentFilter)) continue;
    }

    let relevance = 0;

    if (query) {
      // Name match (highest weight)
      if (entry.name.toLowerCase().includes(query)) {
        relevance += 10;
        if (entry.name.toLowerCase() === query) relevance += 5;
      }
      // Keyword match
      for (const kw of entry.keywords) {
        if (kw.toLowerCase().includes(query)) {
          relevance += 3;
          break;
        }
      }
      // Purpose match
      if (entry.purpose.toLowerCase().includes(query)) {
        relevance += 2;
      }
      // Display name match
      if (entry.display_name.toLowerCase().includes(query)) {
        relevance += 2;
      }
      // Skip if no relevance and query is provided
      if (relevance === 0) continue;
    } else {
      relevance = 1; // no query = match all
    }

    results.push({ entry, relevance });
  }

  // Sort by relevance (descending)
  results.sort((a, b) => b.relevance - a.relevance);

  return results;
}

// ─── Internal Helpers ──────────────────────────────────────────────────────

function findRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 15; i++) {
    if (fs.existsSync(path.resolve(dir, "araya.yaml"))) {
      // H3 FIX: Resolve araya.yaml symlink to real repo, validate sentinel
      const realYaml = fs.realpathSync(path.resolve(dir, "araya.yaml"));
      const realDir = path.dirname(realYaml);
      if (!fs.existsSync(path.resolve(realDir, ".araya"))) {
        throw new Error(
          `SECURITY: araya.yaml found at ${dir} but .araya/ sentinel missing. ` +
          `Cowardly refusing to use a potentially symlink-hijacked root.`
        );
      }
      return realDir;
    }
    const parent = path.resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("ARAYA: Cannot find araya.yaml root");
}
