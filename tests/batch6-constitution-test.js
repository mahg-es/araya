// ARAYA Batch 6 — Constitutional Governance Smoke Test
var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0, failed = 0;
function test(name, fn) { try { fn(); console.log("  ✅ " + name); passed++; } catch(e) { console.log("  ❌ " + name + ": " + e.message); failed++; } }

console.log("\n🧪 ARAYA Batch 6 — Constitutional Governance\n");
var cwd = require("path").resolve(__dirname, "..");

// 1. Constitution exists
console.log("1. Constitution");
var constPath = path.resolve(cwd, ".araya/governance/constitution.md");
test("constitution.md exists", function() { assert.ok(fs.existsSync(constPath)); });
var c = fs.readFileSync(constPath, "utf-8");

// 2. Rule catalog
console.log("\n2. Rule Catalog");
test("has Governance rules", function() { assert.ok(c.includes("GOV-001") && c.includes("GOV-004")); });
test("has Documentation rules", function() { assert.ok(c.includes("DOC-001") && c.includes("DOC-004")); });
test("has Security rules", function() { assert.ok(c.includes("SEC-001") && c.includes("SEC-003")); });
test("has HR rules", function() { assert.ok(c.includes("HR-001") && c.includes("HR-004")); });
test("has Engineering rules", function() { assert.ok(c.includes("ENG-001") && c.includes("ENG-003")); });
test("has Financial rules", function() { assert.ok(c.includes("FIN-001") && c.includes("FIN-002")); });

// 3. Rule types
console.log("\n3. Rule Types");
test("has OBLIGATION rules", function() { assert.ok(c.includes("OBLIGATION")); });
test("has PROHIBITION rules", function() { assert.ok(c.includes("PROHIBITION")); });
test("has PERMISSION rules", function() { assert.ok(c.includes("PERMISSION")); });
test("has ESCALATION rules", function() { assert.ok(c.includes("ESCALATION")); });

// 4. Governance structure
console.log("\n4. Governance Structure");
test("violations directory exists", function() { assert.ok(fs.existsSync(path.resolve(cwd, ".araya/governance/violations"))); });
test("exceptions directory exists", function() { assert.ok(fs.existsSync(path.resolve(cwd, ".araya/governance/exceptions"))); });
test("policies directory exists", function() { assert.ok(fs.existsSync(path.resolve(cwd, ".araya/governance/policies"))); });
test("rules directory exists", function() { assert.ok(fs.existsSync(path.resolve(cwd, ".araya/governance/rules"))); });

// 5. Constitution diagram
console.log("\n5. Constitution Diagram");
test("constitution.mmd exists", function() { assert.ok(fs.existsSync(path.resolve(cwd, ".araya/diagrams/constitution.mmd"))); });
var cm = fs.readFileSync(path.resolve(cwd, ".araya/diagrams/constitution.mmd"), "utf-8");
test("has The Data Professor node", function() { assert.ok(cm.includes("The Data Professor")); });
test("has Constitution node", function() { assert.ok(cm.includes("Constitution")); });
test("has 6 domains", function() { assert.ok(cm.includes("Governance") && cm.includes("Security") && cm.includes("Engineering")); });

console.log("\n" + "=".repeat(50));
console.log("  " + passed + " passed, " + failed + " failed, " + (passed + failed) + " total");
console.log("=".repeat(50) + "\n");
if (failed > 0) process.exit(1);
