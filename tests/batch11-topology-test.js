// ARAYA Batch 11 — Dynamic Agent Topology Smoke Test
var assert = require("assert");
var fs = require("fs");
var path = require("path");
var passed = 0, failed = 0;
function test(name, fn) { try { fn(); console.log("  ✅ " + name); passed++; } catch(e) { console.log("  ❌ " + name + ": " + e.message); failed++; } }

console.log("\n🧪 ARAYA Batch 11 — Dynamic Agent Topology\n");
var cwd = process.cwd();

// 1. Topology structure
console.log("1. Topology Structure");
var topoDir = path.resolve(cwd, ".araya/topology");
["teams", "formations", "templates", "recommendations", "constraints", "metrics"].forEach(function(d) {
  test("topology/" + d + " exists", function() { assert.ok(fs.existsSync(path.resolve(topoDir, d))); });
});

// 2. Topology skill
console.log("\n2. Topology Skill");
test("agent-topology SKILL.md exists", function() { assert.ok(fs.existsSync(path.resolve(cwd, "skills/agent-topology/SKILL.md"))); });
var sk = fs.readFileSync(path.resolve(cwd, "skills/agent-topology/SKILL.md"), "utf-8");
test("has topology templates", function() { assert.ok(sk.includes("Web Platform") && sk.includes("Data Platform")); });
test("has commands documented", function() { assert.ok(sk.includes("/araya team:recommend") && sk.includes("/araya team:assemble")); });

// 3. Constitution
console.log("\n3. Constitution — Topology Rules");
var con = fs.readFileSync(path.resolve(cwd, ".araya/governance/constitution.md"), "utf-8");
test("has TOPO-001", function() { assert.ok(con.includes("TOPO-001")); });
test("has TOPO-005", function() { assert.ok(con.includes("TOPO-005")); });

// 4. Aurora has topology skill
console.log("\n4. Aurora Integration");
var ay = fs.readFileSync(path.resolve(cwd, "araya.yaml"), "utf-8");
test("Aurora has agent-topology skill", function() { assert.ok(ay.includes("agent-topology")); });

console.log("\n" + "=".repeat(50));
console.log("  " + passed + " passed, " + failed + " failed, " + (passed + failed) + " total");
console.log("=".repeat(50) + "\n");
if (failed > 0) process.exit(1);
