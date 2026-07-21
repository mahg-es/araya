// ARAYA Catalog Validator
// WS-07: Compares fresh generation vs stored catalog.json. Classifies drift.
// Author: Valentina (Backend Developer)
// Date: 2026-07-22

import * as fs from "node:fs";
import * as path from "node:path";
import { populate } from "./populator";
import {
  Catalog,
  CommandEntry,
  SkillEntry,
  AgentEntry,
  CrossReference,
  ValidationReport,
  DriftEntry,
  DriftSeverity,
} from "./types";

// ─── Helpers ───────────────────────────────────────────────────────────────

function findArayaRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 15; i++) {
    if (fs.existsSync(path.resolve(dir, "araya.yaml"))) return dir;
    const parent = path.resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("ARAYA: Cannot find araya.yaml root from " + __dirname);
}

// ─── Severity Classification ───────────────────────────────────────────────

function classifySeverity(field: string | undefined, changeType: "ADDED" | "REMOVED" | "MODIFIED"): DriftSeverity {
  const critical = new Set([
    "permissions", "agent_status", "status", "delegated_agent",
    "can_write_code", "can_approve_review", "can_merge_pr",
    "model_tier", "primary_provider",
  ]);
  const high = new Set([
    "skills", "skill_count", "capabilities", "slash_command",
    "handler_type", "registration_method",
  ]);
  const medium = new Set([
    "purpose", "keywords", "name", "display_name", "description",
    "short_help", "long_help", "problem_solved", "when_to_use",
    "examples", "flags", "arguments",
  ]);

  if (changeType === "ADDED" || changeType === "REMOVED") {
    return "CRITICAL"; // Adding/removing entries is always critical
  }

  if (field && critical.has(field)) return "CRITICAL";
  if (field && high.has(field)) return "HIGH";
  if (field && medium.has(field)) return "MEDIUM";
  return "LOW";
}

// ─── Deep Comparison ──────────────────────────────────────────────────────

function deepCompare(a: any, b: any, prefix: string = ""): Array<{ field: string; old: any; new: any }> {
  const diffs: Array<{ field: string; old: any; new: any }> = [];

  if (a === b) return diffs;
  if (a === null || b === null || typeof a !== typeof b) {
    diffs.push({ field: prefix || "value", old: a, new: b });
    return diffs;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    // Compare arrays (order-insensitive for string arrays)
    const aStrings = a.filter((x: any) => typeof x === "string").sort();
    const bStrings = b.filter((x: any) => typeof x === "string").sort();
    const aObjects = a.filter((x: any) => typeof x !== "string");
    const bObjects = b.filter((x: any) => typeof x !== "string");

    if (JSON.stringify(aStrings) !== JSON.stringify(bStrings)) {
      diffs.push({ field: prefix || "array", old: aStrings, new: bStrings });
    }
    if (aObjects.length !== bObjects.length) {
      diffs.push({ field: prefix + ".length", old: aObjects.length, new: bObjects.length });
    } else {
      for (let i = 0; i < aObjects.length; i++) {
        const subDiffs = deepCompare(aObjects[i], bObjects[i], `${prefix}[${i}]`);
        diffs.push(...subDiffs);
      }
    }
    return diffs;
  }

  if (typeof a === "object" && a !== null && b !== null) {
    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of allKeys) {
      const fieldKey = prefix ? `${prefix}.${key}` : key;
      // Treat undefined values as equivalent to missing keys
      const aVal = key in a ? a[key] : undefined;
      const bVal = key in b ? b[key] : undefined;
      if (aVal === undefined && bVal === undefined) continue;
      if (aVal === undefined || bVal === undefined) {
        if (aVal !== bVal) {
          diffs.push({ field: fieldKey, old: aVal, new: bVal });
        }
        continue;
      }
      const subDiffs = deepCompare(aVal, bVal, fieldKey);
      diffs.push(...subDiffs);
    }
    return diffs;
  }

  if (a !== b) {
    diffs.push({ field: prefix || "value", old: a, new: b });
  }

  return diffs;
}

// ─── Main Validation ──────────────────────────────────────────────────────

export function validate(root?: string): ValidationReport {
  const arayaRoot = root ?? findArayaRoot();
  const catalogPath = path.resolve(arayaRoot, ".araya", "catalog", "catalog.json");
  const driftEntries: DriftEntry[] = [];

  // Generate fresh catalog (in-memory, no write)
  let fresh: Catalog;
  try {
    fresh = populate(arayaRoot);
  } catch (e: any) {
    return {
      valid: false,
      drift_count: 1,
      drift_entries: [{
        id: "populator",
        type: "MODIFIED",
        severity: "CRITICAL",
        message: `Populator error: ${e.message}`,
      }],
      sources_hash_match: false,
      message: `Cannot generate fresh catalog: ${e.message}`,
    };
  }

  // Read existing catalog
  if (!fs.existsSync(catalogPath)) {
    return {
      valid: false,
      drift_count: 1,
      drift_entries: [{
        id: "catalog",
        type: "MODIFIED",
        severity: "CRITICAL",
        message: "No catalog.json exists — run the populator to generate one",
      }],
      sources_hash_match: false,
      message: "Catalog file not found. Run populateCatalog() to generate it.",
    };
  }

  let stored: Catalog;
  try {
    stored = JSON.parse(fs.readFileSync(catalogPath, "utf-8")) as Catalog;
  } catch (e: any) {
    return {
      valid: false,
      drift_count: 1,
      drift_entries: [{
        id: "catalog",
        type: "MODIFIED",
        severity: "CRITICAL",
        message: `Cannot parse catalog.json: ${e.message}`,
      }],
      sources_hash_match: false,
      message: `Invalid catalog.json: ${e.message}`,
    };
  }

  // Check sources_hash
  const hashMatch = fresh.sources_hash === stored.sources_hash;
  if (!hashMatch) {
    driftEntries.push({
      id: "sources_hash",
      type: "MODIFIED",
      severity: "HIGH",
      field: "sources_hash",
      old_value: stored.sources_hash,
      new_value: fresh.sources_hash,
      message: "Sources have changed since last catalog generation. Catalog needs regeneration.",
    });
  }

  // ── Compare agents ──
  const storedAgents = new Map<string, AgentEntry>();
  for (const a of stored.agents) storedAgents.set(a.id, a);
  const freshAgents = new Map<string, AgentEntry>();
  for (const a of fresh.agents) freshAgents.set(a.id, a);

  // Agents in fresh but not stored → ADDED
  for (const [id, agent] of freshAgents) {
    if (!storedAgents.has(id)) {
      driftEntries.push({
        id,
        type: "ADDED",
        severity: "CRITICAL",
        message: `Agent '${agent.name}' added to catalog`,
      });
    }
  }

  // Agents in stored but not fresh → REMOVED
  for (const [id, agent] of storedAgents) {
    if (!freshAgents.has(id)) {
      driftEntries.push({
        id,
        type: "REMOVED",
        severity: "CRITICAL",
        message: `Agent '${agent.name}' removed from catalog`,
      });
    }
  }

  // Modified agents (field-level diff)
  for (const [id, freshAgent] of freshAgents) {
    const storedAgent = storedAgents.get(id);
    if (!storedAgent) continue;

    const diffs = deepCompare(storedAgent, freshAgent, "");
    for (const diff of diffs) {
      driftEntries.push({
        id,
        type: "MODIFIED",
        severity: classifySeverity(diff.field, "MODIFIED"),
        field: diff.field,
        old_value: diff.old,
        new_value: diff.new,
        message: `Agent '${freshAgent.name}': ${diff.field} changed`,
      });
    }
  }

  // ── Compare skills ──
  const storedSkills = new Map<string, SkillEntry>();
  for (const s of stored.skills) storedSkills.set(s.id, s);
  const freshSkills = new Map<string, SkillEntry>();
  for (const s of fresh.skills) freshSkills.set(s.id, s);

  for (const [id, skill] of freshSkills) {
    if (!storedSkills.has(id)) {
      driftEntries.push({
        id,
        type: "ADDED",
        severity: "CRITICAL",
        message: `Skill '${skill.name}' added to catalog`,
      });
    }
  }

  for (const [id, skill] of storedSkills) {
    if (!freshSkills.has(id)) {
      driftEntries.push({
        id,
        type: "REMOVED",
        severity: "CRITICAL",
        message: `Skill '${skill.name}' removed from catalog`,
      });
    }
  }

  for (const [id, freshSkill] of freshSkills) {
    const storedSkill = storedSkills.get(id);
    if (!storedSkill) continue;

    // Only compare stable fields (skip last_validated, dynamic counts)
    const stableFields = ["name", "display_name", "purpose", "status", "domain",
      "is_orphan", "is_undeclared", "assigned_agent_count", "has_skilling_md",
      "problem_solved", "when_to_use", "input_description", "output_description"];
    for (const field of stableFields) {
      if (JSON.stringify((storedSkill as any)[field]) !== JSON.stringify((freshSkill as any)[field])) {
        driftEntries.push({
          id,
          type: "MODIFIED",
          severity: classifySeverity(field, "MODIFIED"),
          field,
          old_value: (storedSkill as any)[field],
          new_value: (freshSkill as any)[field],
          message: `Skill '${freshSkill.name}': ${field} changed`,
        });
      }
    }
  }

  // ── Compare commands ──
  const storedCmds = new Map<string, CommandEntry>();
  for (const c of stored.commands) storedCmds.set(c.id, c);
  const freshCmds = new Map<string, CommandEntry>();
  for (const c of fresh.commands) freshCmds.set(c.id, c);

  for (const [id, cmd] of freshCmds) {
    if (!storedCmds.has(id)) {
      driftEntries.push({
        id,
        type: "ADDED",
        severity: "CRITICAL",
        message: `Command '${cmd.name}' added to catalog`,
      });
    }
  }

  for (const [id, cmd] of storedCmds) {
    if (!freshCmds.has(id)) {
      driftEntries.push({
        id,
        type: "REMOVED",
        severity: "CRITICAL",
        message: `Command '${cmd.name}' removed from catalog`,
      });
    }
  }

  for (const [id, freshCmd] of freshCmds) {
    const storedCmd = storedCmds.get(id);
    if (!storedCmd) continue;

    const stableFields = ["name", "slash_command", "purpose", "status", "delegated_agent",
      "handler_type", "short_help", "registration_method", "parent_command"];
    for (const field of stableFields) {
      if (JSON.stringify((storedCmd as any)[field]) !== JSON.stringify((freshCmd as any)[field])) {
        driftEntries.push({
          id,
          type: "MODIFIED",
          severity: classifySeverity(field, "MODIFIED"),
          field,
          old_value: (storedCmd as any)[field],
          new_value: (freshCmd as any)[field],
          message: `Command '${freshCmd.name}': ${field} changed`,
        });
      }
    }
  }

  // ── Compare cross_refs ──
  const storedRefs = new Set(stored.cross_refs.map(r => `${r.from_id}→${r.to_id}(${r.relationship})`));
  const freshRefs = new Set(fresh.cross_refs.map(r => `${r.from_id}→${r.to_id}(${r.relationship})`));
  const refsAdded = [...freshRefs].filter(r => !storedRefs.has(r));
  const refsRemoved = [...storedRefs].filter(r => !freshRefs.has(r));
  for (const ref of refsAdded) {
    driftEntries.push({
      id: `xref:${ref.slice(0, 60)}`,
      type: "ADDED",
      severity: "MEDIUM",
      message: `Cross-reference added: ${ref}`,
    });
  }
  for (const ref of refsRemoved) {
    driftEntries.push({
      id: `xref:${ref.slice(0, 60)}`,
      type: "REMOVED",
      severity: "MEDIUM",
      message: `Cross-reference removed: ${ref}`,
    });
  }

  // ── Compute stats diff ──
  if (stored.stats.total_entries !== fresh.stats.total_entries) {
    driftEntries.push({
      id: "stats",
      type: "MODIFIED",
      severity: "HIGH",
      field: "total_entries",
      old_value: stored.stats.total_entries,
      new_value: fresh.stats.total_entries,
      message: `Total entries: ${stored.stats.total_entries} → ${fresh.stats.total_entries}`,
    });
  }

  const valid = driftEntries.length === 0;

  return {
    valid,
    drift_count: driftEntries.length,
    drift_entries: driftEntries,
    sources_hash_match: hashMatch,
    message: valid
      ? "✅ Catalog is up-to-date. No drift detected."
      : `🔴 Drift detected: ${driftEntries.length} divergence(s). Run populateCatalog() to regenerate.`,
  };
}
