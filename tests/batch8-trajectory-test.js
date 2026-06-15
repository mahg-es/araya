// ARAYA Batch 8 — Golden Trajectories Smoke Test
var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0, failed = 0;
function test(name, fn) { try { fn(); console.log("  ✅ " + name); passed++; } catch(e) { console.log("  ❌ " + name + ": " + e.message); failed++; } }

console.log("\n🧪 ARAYA Batch 8 — Golden Trajectories\n");
var cwd = require("path").resolve(__dirname, "..");

// 1. Trajectory structure
console.log("1. Trajectory Structure");
var trajDir = path.resolve(cwd, ".araya/trajectories");
["golden", "candidate", "archived", "patterns", "metrics"].forEach(function(d) {
  test("trajectories/" + d + " exists", function() { assert.ok(fs.existsSync(path.resolve(trajDir, d))); });
});

// 2. Learning structure
console.log("\n2. Learning Structure");
["patterns", "recommendations", "playbooks", "improvements"].forEach(function(d) {
  test("learning/" + d + " exists", function() { assert.ok(fs.existsSync(path.resolve(cwd, ".araya/learning", d))); });
});

// 3. Technology preferences
console.log("\n3. Technology Preferences");
for (var i = 2; i <= 7; i++) {
  test("PREF-00" + i + " exists", function(idx) { return function() {
    assert.ok(fs.existsSync(path.resolve(cwd, ".araya/knowledge/technology-preferences/PREF-00" + idx + ".md")));
  }; }(i));
}
var pref2 = fs.readFileSync(path.resolve(cwd, ".araya/knowledge/technology-preferences/PREF-002.md"), "utf-8");
test("PREF-002 has XHTML preference", function() { assert.ok(pref2.includes("XHTML")); });
var pref6 = fs.readFileSync(path.resolve(cwd, ".araya/knowledge/technology-preferences/PREF-006.md"), "utf-8");
test("PREF-006 has Free Pascal", function() { assert.ok(pref6.includes("Free Pascal")); });

// 4. Constitution
console.log("\n4. Constitution Update");
var con = fs.readFileSync(path.resolve(cwd, ".araya/governance/constitution.md"), "utf-8");
test("has TECH-001", function() { assert.ok(con.includes("TECH-001")); });
test("has TECH-004", function() { assert.ok(con.includes("TECH-004")); });
test("has KNW-001", function() { assert.ok(con.includes("KNW-001")); });
test("has KNW-004", function() { assert.ok(con.includes("KNW-004")); });

// 5. Esteban role
console.log("\n5. Esteban — Chief Knowledge Officer");
var ay = fs.readFileSync(path.resolve(cwd, "araya.yaml"), "utf-8");
test("Esteban is CKO", function() { assert.ok(ay.includes("Chief Knowledge Officer")); });

console.log("\n" + "=".repeat(50));
console.log("  " + passed + " passed, " + failed + " failed, " + (passed + failed) + " total");
console.log("=".repeat(50) + "\n");
if (failed > 0) process.exit(1);
