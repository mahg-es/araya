// ARAYA Batch 9 — Organizational Knowledge Graph Smoke Test
var assert = require("assert");
var fs = require("fs");
var path = require("path");
var passed = 0, failed = 0;
function test(name, fn) { try { fn(); console.log("  ✅ " + name); passed++; } catch(e) { console.log("  ❌ " + name + ": " + e.message); failed++; } }

console.log("\n🧪 ARAYA Batch 9 — Knowledge Graph\n");
var cwd = require("path").resolve(__dirname, "..");
var graphDir = path.resolve(cwd, ".araya/graph");

// 1. Graph structure
console.log("1. Graph Structure");
["entities", "relationships", "indexes", "visualizations", "queries", "reports"].forEach(function(d) {
  test("graph/" + d + " exists", function() { assert.ok(fs.existsSync(path.resolve(graphDir, d))); });
});

// 2. Knowledge graph skill
console.log("\n2. Knowledge Graph Skill");
test("SKILL.md exists", function() { assert.ok(fs.existsSync(path.resolve(cwd, "skills/knowledge-graph/SKILL.md"))); });
var sk = fs.readFileSync(path.resolve(cwd, "skills/knowledge-graph/SKILL.md"), "utf-8");
test("has entity types", function() { assert.ok(sk.includes("Agent") && sk.includes("Technology") && sk.includes("Project")); });
test("has relationship types", function() { assert.ok(sk.includes("OWNS") && sk.includes("USES") && sk.includes("DEPENDS_ON")); });
test("has commands documented", function() { assert.ok(sk.includes("/araya graph") && sk.includes("/araya ask")); });

// 3. Constitution
console.log("\n3. Constitution — Graph Rules");
var con = fs.readFileSync(path.resolve(cwd, ".araya/governance/constitution.md"), "utf-8");
test("has GRAPH-001", function() { assert.ok(con.includes("GRAPH-001")); });
test("has GRAPH-004", function() { assert.ok(con.includes("GRAPH-004")); });
test("has graph section", function() { assert.ok(con.includes("### Graph")); });

console.log("\n" + "=".repeat(50));
console.log("  " + passed + " passed, " + failed + " failed, " + (passed + failed) + " total");
console.log("=".repeat(50) + "\n");
if (failed > 0) process.exit(1);
