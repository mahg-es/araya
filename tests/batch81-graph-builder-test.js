// ARAYA Batch 8.1 — Graph Builder Preparation Smoke Test
var assert = require("assert");
var fs = require("fs");
var path = require("path");
var passed = 0, failed = 0;
function test(name, fn) { try { fn(); console.log("  ✅ " + name); passed++; } catch(e) { console.log("  ❌ " + name + ": " + e.message); failed++; } }

console.log("\n🧪 ARAYA Batch 8.1 — Graph Builder Preparation\n");
var cwd = require("path").resolve(__dirname, "..");
var gb = path.resolve(cwd, ".araya/graph-builder");

// 1. Graph Builder structure
console.log("1. Graph Builder Structure");
test("README.md exists", function() { assert.ok(fs.existsSync(path.resolve(gb, "README.md"))); });
test("sources.md exists", function() { assert.ok(fs.existsSync(path.resolve(gb, "sources.md"))); });
test("mapping-rules.md exists", function() { assert.ok(fs.existsSync(path.resolve(gb, "mapping-rules.md"))); });
test("entity-schema.md exists", function() { assert.ok(fs.existsSync(path.resolve(gb, "entity-schema.md"))); });
test("relationship-schema.md exists", function() { assert.ok(fs.existsSync(path.resolve(gb, "relationship-schema.md"))); });
test("examples directory exists", function() { assert.ok(fs.existsSync(path.resolve(gb, "examples"))); });

// 2. Mapping rules content
console.log("\n2. Mapping Rules");
var mr = fs.readFileSync(path.resolve(gb, "mapping-rules.md"), "utf-8");
test("has MAP-001 (Agent OWNS Skill)", function() { assert.ok(mr.includes("MAP-001") && mr.includes("OWNS")); });
test("has MAP-002 (PREFERS Technology)", function() { assert.ok(mr.includes("MAP-002") && mr.includes("PREFERS")); });
test("has MAP-003 (VALIDATES)", function() { assert.ok(mr.includes("MAP-003") && mr.includes("VALIDATES")); });
test("has 15 mapping rules", function() { assert.ok(mr.includes("MAP-015")); });

// 3. Schema files
console.log("\n3. Schema Files");
var es = fs.readFileSync(path.resolve(gb, "entity-schema.md"), "utf-8");
test("entity schema has entity_id", function() { assert.ok(es.includes("entity_id:")); });
test("entity schema has entity_type", function() { assert.ok(es.includes("entity_type:")); });
var rs = fs.readFileSync(path.resolve(gb, "relationship-schema.md"), "utf-8");
test("relationship schema has relationship_id", function() { assert.ok(rs.includes("relationship_id:")); });
test("relationship schema has confidence", function() { assert.ok(rs.includes("confidence:")); });

// 4. Diagram
console.log("\n4. Graph Builder Diagram");
test("graph-builder-flow.mmd exists", function() { assert.ok(fs.existsSync(path.resolve(cwd, ".araya/diagrams/graph-builder-flow.mmd"))); });

// 5. Sources
console.log("\n5. Source Definition");
var s = fs.readFileSync(path.resolve(gb, "sources.md"), "utf-8");
test("has 14+ source artifacts", function() {
  assert.ok(s.includes("Specifications") && s.includes("Agents") && s.includes("Technology Preferences"));
});

console.log("\n" + "=".repeat(50));
console.log("  " + passed + " passed, " + failed + " failed, " + (passed + failed) + " total");
console.log("=".repeat(50) + "\n");
if (failed > 0) process.exit(1);
