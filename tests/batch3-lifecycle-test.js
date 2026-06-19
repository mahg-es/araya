// ARAYA Batch 3 — Change Lifecycle & Traceability Smoke Test
var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0, failed = 0;
function test(name, fn) { try { fn(); console.log("  ✅ " + name); passed++; } catch(e) { console.log("  ❌ " + name + ": " + e.message); failed++; } }

console.log("\n🧪 ARAYA Batch 3 — Lifecycle & Traceability\n");
var cwd = require("path").resolve(__dirname, "..");

// 1. Lifecycle diagram exists
console.log("1. Diagrams");
var mermaidDir = path.resolve(cwd, ".araya/diagrams");
test("lifecycle.mmd exists", function() { assert.ok(fs.existsSync(path.resolve(mermaidDir, "lifecycle.mmd"))); });
test("traceability.mmd exists", function() { assert.ok(fs.existsSync(path.resolve(mermaidDir, "traceability.mmd"))); });
test("lifecycle.mmd has states", function() {
  var c = fs.readFileSync(path.resolve(mermaidDir, "lifecycle.mmd"), "utf-8");
  assert.ok(c.includes("Draft") && c.includes("Archived"), "missing lifecycle states");
});
test("traceability.mmd has chain", function() {
  var c = fs.readFileSync(path.resolve(mermaidDir, "traceability.mmd"), "utf-8");
  assert.ok(c.includes("REQ-001") && c.includes("CR-001"), "missing traceability chain");
});

// 2. Proposal template extended
console.log("\n2. Template Metadata");
var tmpl = fs.readFileSync(path.resolve(cwd, ".araya/templates/proposal-template.md"), "utf-8");
test("has lifecycle states", function() { assert.ok(tmpl.includes("## Lifecycle States")); });
test("has traceability chain", function() { assert.ok(tmpl.includes("## Traceability Chain")); });
test("has artifact references", function() { assert.ok(tmpl.includes("## Artifact References")); });
test("has validation checklist", function() { assert.ok(tmpl.includes("## Validation")); });
test("has requirement_ids in frontmatter", function() { assert.ok(tmpl.includes("requirement_ids:")); });
test("has acceptance_ids in frontmatter", function() { assert.ok(tmpl.includes("acceptance_ids:")); });
test("has task_ids in frontmatter", function() { assert.ok(tmpl.includes("task_ids:")); });
test("has delivery_id in frontmatter", function() { assert.ok(tmpl.includes("delivery_id:")); });
test("has drr_id in frontmatter", function() { assert.ok(tmpl.includes("drr_id:")); });
test("has iar_id in frontmatter", function() { assert.ok(tmpl.includes("iar_id:")); });
test("has cr_id in frontmatter", function() { assert.ok(tmpl.includes("cr_id:")); });

// 3. Backward compatibility
console.log("\n3. Backward Compatibility");
test("still has change_id", function() { assert.ok(tmpl.includes("change_id:")); });
test("still has title", function() { assert.ok(tmpl.includes("title:")); });
test("still has status", function() { assert.ok(tmpl.includes("status:")); });
test("still has owner", function() { assert.ok(tmpl.includes("owner:")); });
test("still has frontmatter", function() { assert.ok(tmpl.startsWith("---")); });

console.log("\n" + "=".repeat(50));
console.log("  " + passed + " passed, " + failed + " failed, " + (passed + failed) + " total");
console.log("=".repeat(50) + "\n");
if (failed > 0) process.exit(1);
