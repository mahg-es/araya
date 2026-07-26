#!/usr/bin/env node
// ARAYA Operation-First Skill tests (ponny-express-10010 PHASE 6/11).
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
let passed = 0, failed = 0;
const failures = [];
function check(label, cond, detail) {
  if (cond) passed++;
  else { failed++; failures.push(`${label}${detail ? ` — ${detail}` : ""}`); }
}

console.log("Operation-First Skill Tests");
console.log("===========================");

const yaml = fs.readFileSync(path.join(ROOT, "araya.yaml"), "utf-8");
// agents: section only — from 'agents:' to the next top-level key (or EOF)
const agentsStart = yaml.search(/^agents:/m);
const rest = yaml.slice(agentsStart + "agents:".length);
const nextTop = rest.search(/^[A-Za-z_][^\s:]*:/m);
const agentsBlock = nextTop < 0 ? rest : rest.slice(0, nextTop);
const agentNames = [];
for (const m of agentsBlock.matchAll(/^  (\w+):\s*$/gm)) agentNames.push(m[1]);

function agentBlock(name) {
  const re = new RegExp(`\\n  ${name}:\\n([\\s\\S]*?)(?=\\n  \\w|$)`);
  const m = agentsBlock.match(re);
  return m ? m[1] : "";
}

const dormant = agentNames.filter((a) => /status:\s*dormant/.test(agentBlock(a)));
const active = agentNames.filter((a) => !dormant.includes(a));

// every active agent has the skill in araya.yaml
for (const a of active) {
  check(`araya.yaml: ${a} has araya-operation-runtime`, agentBlock(a).includes("- araya-operation-runtime"));
}
// dormant agents do not
for (const a of dormant) {
  check(`araya.yaml: ${a} (dormant) excluded`, !agentBlock(a).includes("- araya-operation-runtime"));
}

// generated profiles contain it for active agents
for (const a of active) {
  const p = path.join(ROOT, ".pi", "agents", `${a}.md`);
  check(`.pi/agents/${a}.md contains araya-operation-runtime`, fs.existsSync(p) && fs.readFileSync(p, "utf-8").includes("araya-operation-runtime"));
}

// skill file itself: frontmatter + OPERATION_GAP procedure
const skill = fs.readFileSync(path.join(ROOT, "skills", "araya-operation-runtime", "SKILL.md"), "utf-8");
check("skill has name frontmatter", /^name:\s*"araya-operation-runtime"/m.test(skill));
check("skill has description frontmatter", /^description:\s*".+"/m.test(skill));
check("skill documents OPERATION_GAP procedure", skill.includes("OPERATION_GAP") && skill.includes("catalog_searched"));
check("skill states the binding no-raw-implementation rule", /No raw implementation when a governed ARAYA operation/.test(skill));

// drift detection: generator --check passes now, and fails if a profile is manually weakened
const gen = execFileSyncSafe();
function execFileSyncSafe() {
  try {
    const out = execFileSync("npx", ["tsx", "src/araya/generate/index.ts", "--check"], { cwd: ROOT, encoding: "utf-8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: String(e.stdout ?? "") };
  }
}
check("generator --check clean (no drift)", gen.code === 0, gen.out.slice(0, 150));

console.log("");
if (failures.length) {
  console.log("Failures:");
  for (const f of failures) console.log(`  ✗ ${f}`);
}
console.log("\n══════════════════════════════════════════════════");
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log("══════════════════════════════════════════════════");
process.exit(failed ? 1 : 0);
