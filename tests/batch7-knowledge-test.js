// ARAYA Batch 7 — Organizational Knowledge Smoke Test
var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0, failed = 0;
function test(name, fn) { try { fn(); console.log("  ✅ " + name); passed++; } catch(e) { console.log("  ❌ " + name + ": " + e.message); failed++; } }

console.log("\n🧪 ARAYA Batch 7 — Organizational Knowledge\n");
var cwd = require("path").resolve(__dirname, "..");
var knowledgeDir = path.resolve(cwd, ".araya/knowledge");

// 1. Knowledge structure
console.log("1. Knowledge Structure");
var dirs = ["standards", "patterns", "anti-patterns", "lessons-learned", "adrs", "technology-preferences", "glossary", "recovered-projects", "organizational-memory"];
dirs.forEach(function(d) {
  test(d + " exists", function() { assert.ok(fs.existsSync(path.resolve(knowledgeDir, d))); });
});

// 2. Skill exists
console.log("\n2. Organizational Knowledge Skill");
test("SKILL.md exists", function() { assert.ok(fs.existsSync(path.resolve(cwd, "skills/organizational-knowledge/SKILL.md"))); });
var sk = fs.readFileSync(path.resolve(cwd, "skills/organizational-knowledge/SKILL.md"), "utf-8");
test("has knowledge types (STD/PAT/ANTI/ADR/LESSON/PREF)", function() {
  assert.ok(sk.includes("STD") && sk.includes("PAT") && sk.includes("ANTI") && sk.includes("LESSON") && sk.includes("PREF"));
});

// 3. Constitution updated
console.log("\n3. Constitution Rules");
var c = fs.readFileSync(path.resolve(cwd, ".araya/governance/constitution.md"), "utf-8");
test("has GOV-010 (reconstitution)", function() { assert.ok(c.includes("GOV-010")); });
test("has GOV-011 (baseline)", function() { assert.ok(c.includes("GOV-011")); });
test("has GOV-012 (auditable)", function() { assert.ok(c.includes("GOV-012")); });
test("has GOV-013 (never destroys)", function() { assert.ok(c.includes("GOV-013")); });

// 4. Reconstitution diagram
console.log("\n4. Reconstitution Diagram");
test("reconstitution-flow.mmd exists", function() { assert.ok(fs.existsSync(path.resolve(cwd, ".araya/diagrams/reconstitution-flow.mmd"))); });
var rf = fs.readFileSync(path.resolve(cwd, ".araya/diagrams/reconstitution-flow.mmd"), "utf-8");
test("has Discovery node", function() { assert.ok(rf.includes("Discovery")); });
test("has Recovery Mode node", function() { assert.ok(rf.includes("Recovery Mode")); });
test("has 3 options", function() { assert.ok(rf.includes("Minimal Cleanup") && rf.includes("Moderate") && rf.includes("Full")); });

console.log("\n" + "=".repeat(50));
console.log("  " + passed + " passed, " + failed + " failed, " + (passed + failed) + " total");
console.log("=".repeat(50) + "\n");
if (failed > 0) process.exit(1);
