// ARAYA Batch 4 — Governance Metrics Smoke Test
var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0, failed = 0;
function test(name, fn) { try { fn(); console.log("  ✅ " + name); passed++; } catch(e) { console.log("  ❌ " + name + ": " + e.message); failed++; } }

console.log("\n🧪 ARAYA Batch 4 — Governance Metrics\n");
var cwd = require("path").resolve(__dirname, "..");

// 1. Metrics artifacts exist
console.log("1. Metrics Artifacts");
var metricsDir = path.resolve(cwd, ".araya/metrics");
test("metrics-definition.md exists", function() { assert.ok(fs.existsSync(path.resolve(metricsDir, "metrics-definition.md"))); });
test("health-scoring.md exists", function() { assert.ok(fs.existsSync(path.resolve(metricsDir, "health-scoring.md"))); });

// 2. Metrics definition content
console.log("\n2. Metrics Definition");
var md = fs.readFileSync(path.resolve(metricsDir, "metrics-definition.md"), "utf-8");
test("has Requirements Coverage formula", function() { assert.ok(md.includes("Requirements Coverage")); });
test("has Acceptance Coverage formula", function() { assert.ok(md.includes("Acceptance Coverage")); });
test("has Traceability Coverage formula", function() { assert.ok(md.includes("Traceability Coverage")); });
test("has Delivery Health Score", function() { assert.ok(md.includes("Delivery Health Score")); });
test("has GREEN/YELLOW/RED tiers", function() { assert.ok(md.includes("GREEN") && md.includes("YELLOW") && md.includes("RED")); });

// 3. Health scoring
console.log("\n3. Health Scoring");
var hs = fs.readFileSync(path.resolve(metricsDir, "health-scoring.md"), "utf-8");
test("has scoring formula", function() { assert.ok(hs.includes("validation_coverage") && hs.includes("Health Score")); });
test("has scoring tiers", function() { assert.ok(hs.includes("95") && hs.includes("80")); });
test("has interpretation", function() { assert.ok(hs.includes("GREEN") && hs.includes("YELLOW") && hs.includes("RED")); });

// 4. Metrics diagram
console.log("\n4. Metrics Diagram");
test("metrics-flow.mmd exists", function() { assert.ok(fs.existsSync(path.resolve(cwd, ".araya/diagrams/metrics-flow.mmd"))); });
var mf = fs.readFileSync(path.resolve(cwd, ".araya/diagrams/metrics-flow.mmd"), "utf-8");
test("has Coverage subgraph", function() { assert.ok(mf.includes("Coverage")); });
test("has Lifecycle subgraph", function() { assert.ok(mf.includes("Lifecycle")); });
test("has Health Score node", function() { assert.ok(mf.includes("Health Score")); });
test("has GREEN/YELLOW/RED nodes", function() { assert.ok(mf.includes("GREEN") && mf.includes("YELLOW") && mf.includes("RED")); });

console.log("\n" + "=".repeat(50));
console.log("  " + passed + " passed, " + failed + " failed, " + (passed + failed) + " total");
console.log("=".repeat(50) + "\n");
if (failed > 0) process.exit(1);
