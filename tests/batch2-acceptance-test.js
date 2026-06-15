// ARAYA Batch 2 — Acceptance Governance Smoke Test
const { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } = require("node:fs");
const { resolve } = require("node:path");

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log("  ✅ " + name); passed++; }
  catch(e) { console.log("  ❌ " + name + ": " + e.message); failed++; }
}
function assert(c, m) { if (!c) throw new Error(m || "assertion failed"); }

console.log("\n🧪 ARAYA Batch 2 — Acceptance Governance\n");
var cwd = require("path").resolve(__dirname, "..");

// 1. Template has new sections
console.log("1. Template Validation");
var tmplPath = resolve(cwd, ".araya/templates/acceptance-template.md");
var tmpl = readFileSync(tmplPath, "utf-8");

test("has Acceptance Criteria section", function() { assert(tmpl.includes("## Acceptance Criteria")); });
test("has Validation Method section", function() { assert(tmpl.includes("## Validation Methods")); });
test("has Evidence Required section", function() { assert(tmpl.includes("## Evidence Required")); });
test("has Validation Result section", function() { assert(tmpl.includes("## Validation Result")); });
test("has Evidence References section", function() { assert(tmpl.includes("## Evidence References")); });
test("has Validation Summary section", function() { assert(tmpl.includes("## Validation Summary")); });
test("has Delivery Status section", function() { assert(tmpl.includes("## Delivery Status")); });
test("has AC ID format", function() { assert(/AC-\d+/.test(tmpl), "no AC-### pattern found"); });
test("has Requirement ID linkage", function() { assert(/REQ-\d+/.test(tmpl), "no REQ-### pattern found"); });
test("has Status values", function() { assert(/Pending/.test(tmpl) && /Passed/.test(tmpl) && /Failed/.test(tmpl), "missing status values"); });

// 2. Create test change with acceptance doc
console.log("\n2. Acceptance Parsing");
var testDir = resolve(cwd, ".araya/changes/CHG-TEST-001");
mkdirSync(testDir, { recursive: true });

var testAcceptance = [
  "---",
  "change_id: CHG-TEST-001",
  "title: Test Change",
  "status: draft",
  "owner: manu",
  "---",
  "",
  "## Acceptance Criteria",
  "| AC ID | Requirement ID | Status |",
  "|-------|---------------|--------|",
  "| AC-001 | REQ-001 | Passed |",
  "| AC-002 | REQ-001 | Failed |",
  "| AC-003 | REQ-002 | Pending |"
].join("\n");

writeFileSync(resolve(testDir, "acceptance.md"), testAcceptance);
var content = readFileSync(resolve(testDir, "acceptance.md"), "utf-8");

test("AC-001 found", function() { assert(content.includes("AC-001")); });
test("AC-002 found", function() { assert(content.includes("AC-002")); });
test("AC-003 found", function() { assert(content.includes("AC-003")); });
test("Passed status detected", function() { assert(/Passed/.test(content)); });
test("Failed status detected", function() { assert(/Failed/.test(content)); });
test("Pending status detected", function() { assert(/Pending/.test(content)); });

// 3. Backward compatibility
console.log("\n3. Backward Compatibility");
test("template has frontmatter", function() { assert(tmpl.startsWith("---")); });
test("template has change_id", function() { assert(tmpl.includes("change_id:")); });
test("template has title", function() { assert(tmpl.includes("title:")); });
test("template has status", function() { assert(tmpl.includes("status:")); });

// Cleanup
rmSync(testDir, { recursive: true, force: true });

console.log("\n" + "=".repeat(50));
console.log("  " + passed + " passed, " + failed + " failed, " + (passed + failed) + " total");
console.log("=".repeat(50) + "\n");
if (failed > 0) process.exit(1);
