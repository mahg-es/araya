// ARAYA Runtime Generator — Drift Validator
// REQ-043 Slice A: Validate generated vs canonical sources
// Author: Valentina (Backend Developer)
// Date: 2026-07-25

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import {
  DriftReport,
  DriftEntry,
  CanonicalAgent,
  CanonicalSkill,
  SourceManifest,
} from "./types";

// ─── Constants ─────────────────────────────────────────────────────────────

const GENERATED_MARKER = "# GENERATED — DO NOT EDIT";
const SOURCE_HASH_PREFIX = "# Source hash: ";
const GEN_TIMESTAMP_PREFIX = "# Generated at: ";

// ─── Source Manifest ───────────────────────────────────────────────────────

/** Compute a combined SHA-256 hash over all canonical source files */
export function computeSourceHash(root: string, sourceFiles: string[]): string {
  const hash = crypto.createHash("sha256");
  const sorted = [...sourceFiles].sort();

  for (const file of sorted) {
    const filePath = path.resolve(root, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Source file missing: ${file}`);
    }
    const content = fs.readFileSync(filePath, "utf-8");
    hash.update(file);       // include path for ordering safety
    hash.update("\x00");
    hash.update(content);
    hash.update("\x00");
  }

  return hash.digest("hex");
}

/** Build a full source manifest */
export function buildSourceManifest(root: string, sourceFiles: string[]): SourceManifest {
  const sorted = [...sourceFiles].sort();
  const hashes: Record<string, string> = {};
  const hash = crypto.createHash("sha256");

  for (const file of sorted) {
    const filePath = path.resolve(root, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const fileHash = crypto.createHash("sha256").update(content).digest("hex");
    hashes[file] = fileHash;
    hash.update(file);
    hash.update("\x00");
    hash.update(content);
    hash.update("\x00");
  }

  return {
    files: sorted,
    hashes,
    combined_hash: hash.digest("hex"),
    generated_at: new Date().toISOString(),
  };
}

// ─── Drift Detection ──────────────────────────────────────────────────────

/** Validator function type */
export type ValidatorFn = (
  canonical: CanonicalAgent[],
  canonicalSkills: CanonicalSkill[],
  generatedDir: string,
  adapter: string,
) => DriftEntry[];

/**
 * Validate all generated profiles against canonical sources.
 * Returns a DriftReport with exit-style: clean=true means no drift.
 */
export function validateProfiles(
  canonicalAgents: CanonicalAgent[],
  canonicalSkills: CanonicalSkill[],
  generatedDir: string,
  adapter: string,
  sourceManifest: SourceManifest,
  validators?: ValidatorFn[],
): DriftReport {
  const entries: DriftEntry[] = [];
  const adapterDir = path.join(generatedDir, adapter);

  if (!fs.existsSync(adapterDir)) {
    entries.push({
      agent: "*",
      adapter,
      field: "directory",
      canonical_value: `Expected directory: ${adapterDir}`,
      generated_value: "(missing)",
      severity: "error",
    });
    return {
      clean: false,
      entries,
      source_hash_canonical: sourceManifest.combined_hash,
      source_hash_generated: "(missing)",
    };
  }

  // Read generated hash for this adapter
  let generatedHash = "";
  const hashFile = path.join(adapterDir, ".source-hash");
  if (fs.existsSync(hashFile)) {
    generatedHash = fs.readFileSync(hashFile, "utf-8").trim();
  }

  // For each canonical agent with this adapter as a target, check the generated file
  for (const agent of canonicalAgents) {
    if (!agent.runtime.targets.includes(adapter)) continue;

    const agentFile = path.join(adapterDir, `${agent.name}.md`);
    if (!fs.existsSync(agentFile)) {
      entries.push({
        agent: agent.name,
        adapter,
        field: "file",
        canonical_value: `Agent targets include ${adapter}`,
        generated_value: "(missing)",
        severity: "error",
      });
      continue;
    }

    const content = fs.readFileSync(agentFile, "utf-8");

    // Check for generated marker
    if (!content.includes(GENERATED_MARKER)) {
      entries.push({
        agent: agent.name,
        adapter,
        field: "generated_marker",
        canonical_value: GENERATED_MARKER,
        generated_value: "(missing do-not-edit marker)",
        severity: "error",
      });
    }

    // Check for source hash
    const hashMatch = content.match(/^# Source hash: ([a-f0-9]+)$/m);
    if (!hashMatch) {
      entries.push({
        agent: agent.name,
        adapter,
        field: "source_hash_header",
        canonical_value: sourceManifest.combined_hash,
        generated_value: "(missing hash header)",
        severity: "error",
      });
    } else if (hashMatch[1] !== sourceManifest.combined_hash) {
      entries.push({
        agent: agent.name,
        adapter,
        field: "source_hash",
        canonical_value: sourceManifest.combined_hash,
        generated_value: hashMatch[1],
        severity: "error",
      });
    }

    // Validate agent fields in the generated content
    validateAgentFields(agent, content, adapter, entries);

    // Validate skill references
    validateSkillRefs(agent, content, canonicalSkills, adapter, entries);
  }

  // Run custom validators
  if (validators) {
    for (const validator of validators) {
      entries.push(...validator(canonicalAgents, canonicalSkills, generatedDir, adapter));
    }
  }

  return {
    clean: !entries.some(e => e.severity === "error" || e.severity === "warning"),
    entries,
    source_hash_canonical: sourceManifest.combined_hash,
    source_hash_generated: generatedHash || "(missing)",
  };
}

// ─── Field-Level Validation ───────────────────────────────────────────────

function validateAgentFields(
  agent: CanonicalAgent,
  content: string,
  adapter: string,
  entries: DriftEntry[],
): void {
  // Check role title appears
  if (!content.includes(agent.role.title)) {
    entries.push({
      agent: agent.name,
      adapter,
      field: "role.title",
      canonical_value: agent.role.title,
      generated_value: "(missing from profile)",
      severity: "error",
    });
  }

  // Check permissions
  if (agent.permissions.can_write_code !== undefined) {
    const expected = String(agent.permissions.can_write_code);
    if (!content.includes(`can_write_code: ${expected}`) &&
        !content.includes(`canWriteCode: ${expected}`)) {
      entries.push({
        agent: agent.name,
        adapter,
        field: "permissions.can_write_code",
        canonical_value: agent.permissions.can_write_code,
        generated_value: "(missing or mismatched)",
        severity: "error",
      });
    }
  }
}

function validateSkillRefs(
  agent: CanonicalAgent,
  content: string,
  canonicalSkills: CanonicalSkill[],
  adapter: string,
  entries: DriftEntry[],
): void {
  const skillNames = new Set(canonicalSkills.map(s => s.name));

  for (const skill of agent.skills) {
    if (!skillNames.has(skill)) {
      entries.push({
        agent: agent.name,
        adapter,
        field: `skill.${skill}`,
        canonical_value: `exists in skills/${skill}/SKILL.md`,
        generated_value: "(referenced skill not found)",
        severity: "error",
      });
      continue;
    }

    if (!content.includes(skill)) {
      entries.push({
        agent: agent.name,
        adapter,
        field: `skill.${skill}`,
        canonical_value: skill,
        generated_value: "(skill not referenced in generated profile)",
        severity: "warning",  // pi_runtime_file — required for pi target
      });
    }
  }
}

// ─── Adapter-Specific Validators ──────────────────────────────────────────

/** Pi adapter validator: checks .pi/agents/<name>.md format */
export function piAdapterValidator(
  canonical: CanonicalAgent[],
  _skills: CanonicalSkill[],
  generatedDir: string,
  adapter: string,
): DriftEntry[] {
  if (adapter !== "pi") return [];
  const entries: DriftEntry[] = [];

  // Pi profiles are in .pi/agents/, not .araya/generated/pi/
  // But for consistency, check both locations
  const root = path.resolve(generatedDir, "..", "..");

  for (const agent of canonical) {
    if (!agent.runtime.targets.includes("pi")) continue;

    const piAgentPath = path.join(root, ".pi", "agents", `${agent.name}.md`);
    if (!fs.existsSync(piAgentPath)) {
      entries.push({
        agent: agent.name,
        adapter: "pi",
        field: "pi_runtime_file",
        canonical_value: `.pi/agents/${agent.name}.md`,
        generated_value: "(missing)",
        severity: "info", // Non-blocking
      });
    }
  }

  return entries;
}
