// ARAYA Batch 1 — Specification Layer Smoke Test
const { existsSync, readdirSync, mkdirSync, rmdirSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

let passed = 0;
let failed = 0;
function test(name, fn) { try { fn(); console.log(`  ✅ ${name}`); passed++; } catch(e) { console.log(`  ❌ ${name}: ${e.message}`); failed++; } }

console.log("\n🧪 ARAYA Batch 1 — Specification Layer\n");

const cwd = process.cwd();
const templatesDir = resolve(cwd, ".araya/templates");

// 1. Templates exist
console.log("1. Templates");
test("proposal-template.md exists", () => { if (!existsSync(resolve(templatesDir, "proposal-template.md"))) throw new Error("missing"); });
test("design-template.md exists", () => { if (!existsSync(resolve(templatesDir, "design-template.md"))) throw new Error("missing"); });
test("tasks-template.md exists", () => { if (!existsSync(resolve(templatesDir, "tasks-template.md"))) throw new Error("missing"); });
test("acceptance-template.md exists", () => { if (!existsSync(resolve(templatesDir, "acceptance-template.md"))) throw new Error("missing"); });

// 2. Frontmatter validation
console.log("\n2. Frontmatter Validation");
for (const tmpl of ["proposal-template.md", "design-template.md", "tasks-template.md", "acceptance-template.md"]) {
  const content = readFileSync(resolve(templatesDir, tmpl), "utf-8");
  test(`${tmpl} has frontmatter`, () => {
    if (!content.startsWith("---")) throw new Error("no frontmatter");
  });
  test(`${tmpl} has change_id`, () => {
    if (!content.includes("change_id:")) throw new Error("missing change_id");
  });
  test(`${tmpl} has title`, () => {
    if (!content.includes("title:")) throw new Error("missing title");
  });
  test(`${tmpl} has status`, () => {
    if (!content.includes("status:")) throw new Error("missing status");
  });
}

// 3. Folder structure
console.log("\n3. Folder Structure");
const requiredDirs = [".araya/specs", ".araya/changes", ".araya/archive", ".araya/templates"];
for (const dir of requiredDirs) {
  const fullPath = resolve(cwd, dir);
  test(`${dir} exists`, () => {
    if (!existsSync(fullPath)) throw new Error("missing directory");
  });
}

// Results
console.log(`\n${"═".repeat(50)}`);
console.log(`  ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${"═".repeat(50)}\n`);
if (failed > 0) process.exit(1);
