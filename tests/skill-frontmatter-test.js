#!/usr/bin/env node
// ARAYA Skill Frontmatter Validation Tests
// Per Pi 0.82.1 skill contract (ponny-express-10007 FASE 3.1):
// every skills/<name>/SKILL.md MUST carry YAML frontmatter with a non-empty
// `name` and `description`, plus non-empty body content. A SKILL.md without
// `description` MUST fail validation.
// Author: Daneel (Relay Controller) — BATCH-TRUTH-CONTINUITY-20260726

const fs = require("node:fs");
const path = require("node:path");

const SKILLS_DIR = path.join(__dirname, "..", "skills");

let passed = 0;
let failed = 0;
const failures = [];

function check(label, cond, detail) {
  if (cond) {
    passed++;
  } else {
    failed++;
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  return { fm: m[1], body: m[2] };
}

function fmValue(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*(.+)\\s*$`, "m"));
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
const skillDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

console.log("Skill Frontmatter Validation");
console.log("============================");

// Suite 1 — every skill directory has SKILL.md with valid frontmatter
for (const dir of skillDirs) {
  const p = path.join(SKILLS_DIR, dir, "SKILL.md");
  check(`${dir}: SKILL.md exists`, fs.existsSync(p));
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, "utf-8");
  const parsed = parseFrontmatter(text);
  check(`${dir}: has YAML frontmatter`, parsed !== null);
  if (!parsed) continue;
  const name = fmValue(parsed.fm, "name");
  const desc = fmValue(parsed.fm, "description");
  check(`${dir}: name present and non-empty`, !!name && name.length > 0);
  check(`${dir}: description present and non-empty`, !!desc && desc.length > 0);
  check(`${dir}: body content non-empty`, parsed.body.trim().length >= 20);
}

// Suite 2 — structural invariants
check("skill count > 100 (registry not truncated)", skillDirs.length > 100, `found ${skillDirs.length}`);

// Suite 3 — negative control: a description-less sample MUST fail validation
const sampleBad = "---\nname: sample\n---\nbody content here, long enough to pass body check.\n";
const parsedBad = parseFrontmatter(sampleBad);
check(
  "negative control: SKILL.md without description is rejected",
  parsedBad !== null && !fmValue(parsedBad.fm, "description")
);

console.log(`\nSkills scanned: ${skillDirs.length}`);
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f}`);
}
console.log("\n══════════════════════════════════════════════════");
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log("══════════════════════════════════════════════════");

if (failed > 0) {
  console.log("\nSkill frontmatter validation FAILED.");
  process.exit(1);
}
console.log("\nAll skills carry valid frontmatter. Pi 0.82.1 skill contract validated.");
process.exit(0);
