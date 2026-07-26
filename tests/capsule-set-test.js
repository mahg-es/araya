#!/usr/bin/env node
// ARAYA Capsule Set Verification Tests
// Per ponny-express-10007 FASE 4: fails if
//   - a referenced SHA does not exist
//   - a declared branch does not contain the SHA
//   - an evidence path does not exist
//   - a requirement declared registered is not tracked
//   - a PR declared merged has no verifiable merge commit
//   - an active agent is described with authority different from araya.yaml
// Validates the v2 set at .araya/context/capsules/session-2026-07-26-v2/.
// Portfolio checks run against MAHG_PORTFOLIO_PATH (default sibling checkout);
// if absent, portfolio-scoped checks SKIP with explicit notice.
// Author: Daneel (Relay Controller) — BATCH-TRUTH-CONTINUITY-20260726

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const SET = path.join(ROOT, ".araya", "context", "capsules", "session-2026-07-26-v2");
const PORTFOLIO = process.env.MAHG_PORTFOLIO_PATH || "/home/thedataprofessor/github/mahg-es/araya-project-coordinator";
const HAS_PORTFOLIO = fs.existsSync(path.join(PORTFOLIO, ".git"));

let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

function check(label, cond, detail) {
  if (cond) passed++;
  else { failed++; failures.push(`${label}${detail ? ` — ${detail}` : ""}`); }
}
function skip(label) { skipped++; console.log(`  ~ SKIP ${label}`); }

function git(repo, args) {
  try {
    return execSync(`git -C "${repo}" ${args}`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return null;
  }
}

console.log("Capsule Set Verification (session-2026-07-26-v2)");
console.log("================================================");

// ─── 0. Set completeness ─────────────────────────────────────────────
const manifest = fs.readFileSync(path.join(SET, "manifest.yaml"), "utf-8");
const capsuleFiles = fs.readdirSync(SET).filter((f) => f.endsWith(".md"));
check("set has 9 capsules + manifest", capsuleFiles.length === 9, `found ${capsuleFiles.length} .md`);
for (const f of capsuleFiles) {
  check(`manifest lists ${f}`, manifest.includes(`"${f}"`));
}
const allText = capsuleFiles.map((f) => fs.readFileSync(path.join(SET, f), "utf-8")).join("\n");

// ─── 1. Manifest SHAs exist and branches contain them ────────────────
const fwSha = (manifest.match(/generated_from_framework_sha:\s*"?([0-9a-f]+)"?/) || [])[1];
const pfSha = (manifest.match(/generated_from_portfolio_sha:\s*"?([0-9a-f]+)"?/) || [])[1];
const fwBranch = (manifest.match(/framework_branch:\s*"?([^\s"]+)"?/) || [])[1];
const pfBranch = (manifest.match(/portfolio_branch:\s*"?([^\s"]+)"?/) || [])[1];

check("manifest framework SHA exists", fwSha && git(ROOT, `cat-file -t ${fwSha}`) === "commit", fwSha);
check(
  `manifest framework SHA is on origin/${fwBranch}`,
  fwSha && git(ROOT, `merge-base --is-ancestor ${fwSha} origin/${fwBranch}`) !== null || git(ROOT, `merge-base --is-ancestor ${fwSha} origin/${fwBranch} && echo OK`) === "OK"
);
if (!HAS_PORTFOLIO) skip("portfolio SHA/branch checks (repo not found)");
else {
  check("manifest portfolio SHA exists", pfSha && git(PORTFOLIO, `cat-file -t ${pfSha}`) === "commit", pfSha);
  check(
    `manifest portfolio SHA is on origin/${pfBranch}`,
    git(PORTFOLIO, `merge-base --is-ancestor ${pfSha} origin/${pfBranch} && echo OK`) === "OK"
  );
}
check("manifest does not claim main while SHA is dev-only", !(fwBranch === "main"));

// ─── 2. Every commit-SHA token in capsules resolves in ≥1 repo ───────
const textForSha = allText.replace(/MSG-\d{8}-\d{6}-[0-9a-f]+/g, "MSG-ID");
const shaTokens = new Set();
for (const m of textForSha.matchAll(/\b[0-9a-f]{7,40}\b/g)) {
  const t = m[0];
  if (t.length >= 7 && /[a-f]/.test(t) && /\d/.test(t)) shaTokens.add(t);
}
for (const t of shaTokens) {
  const inFw = git(ROOT, `cat-file -t ${t}`);
  const inPf = HAS_PORTFOLIO ? git(PORTFOLIO, `cat-file -t ${t}`) : null;
  check(`SHA token ${t} resolves`, inFw === "commit" || inPf === "commit", `fw=${inFw} pf=${inPf}`);
}

// ─── 3. Evidence paths referenced in capsules exist ──────────────────
const pathTokens = new Set();
const absentRe = /absent|does not exist|not exist|missing|no existe/i;
for (const m of allText.matchAll(/`((?:\.araya|tests|prompts|skills|ops|portfolio)\/[^`\s]+)`/g)) {
  const raw = m[1];
  if (raw.includes("*") || raw.includes("<") || raw.includes("NNN")) continue; // globs/templates
  const p = raw.replace(/[()]$/g, "").replace(/\/$/, "");
  // locate the citing line to honor explicit absence claims
  const line = allText.split("\n").find((l) => l.includes(raw)) || "";
  if (absentRe.test(line)) continue;
  pathTokens.add(p);
}
for (const p of pathTokens) {
  const fwExists = fs.existsSync(path.join(ROOT, p)) || git(ROOT, `ls-tree origin/${fwBranch} --name-only "${p}"`) === p;
  const pfExists = HAS_PORTFOLIO && (fs.existsSync(path.join(PORTFOLIO, p)) || git(PORTFOLIO, `ls-tree origin/${pfBranch} --name-only "${p}"`) === p);
  check(`referenced path exists: ${p}`, fwExists || pfExists, `fw=${fwExists} pf=${pfExists}`);
}

// ─── 4. Requirements declared registered are tracked ─────────────────
const reqFiles = [
  "portfolio/projects/araya-portfolio/requirements/req-042-araya-relay-motor-mvp.md",
  "portfolio/projects/araya-portfolio/requirements/REQ-043-araya-agent-capability-skill-runtime-alignment.md",
  "portfolio/projects/araya-portfolio/requirements/REQ-044-ARAYA-Capability-Activation-and-Context-Continuity.md",
  "portfolio/projects/araya-portfolio/requirements/REQ-045-ARAYA-compress-and-compact.md",
];
if (!HAS_PORTFOLIO) skip("requirement tracking checks");
else {
  for (const rf of reqFiles) {
    check(`registered requirement tracked: ${path.basename(rf)}`, git(PORTFOLIO, `ls-tree origin/${pfBranch} --name-only "${rf}"`) === rf);
  }
}

// ─── 5. PRs declared merged have merge commits ───────────────────────
const prMerges = [
  { pr: 291, sha: "af0c2b5", repo: PORTFOLIO, ok: HAS_PORTFOLIO },
  { pr: 292, sha: "125c53a", repo: PORTFOLIO, ok: HAS_PORTFOLIO },
  { pr: 293, sha: "f9689af", repo: PORTFOLIO, ok: HAS_PORTFOLIO },
  { pr: 294, sha: "7e3d357", repo: PORTFOLIO, ok: HAS_PORTFOLIO },
  { pr: 295, sha: "ae4cc2d", repo: PORTFOLIO, ok: HAS_PORTFOLIO },
  { pr: 78, sha: "c269780", repo: ROOT, ok: true },
  { pr: 79, sha: "7fcc9b0", repo: ROOT, ok: true },
  { pr: 80, sha: "788606d", repo: ROOT, ok: true },
  { pr: 81, sha: "0902ac6", repo: ROOT, ok: true },
  { pr: 82, sha: "38197e6", repo: ROOT, ok: true },
];
for (const { pr, sha, repo, ok } of prMerges) {
  if (!ok) { skip(`PR #${pr} merge check`); continue; }
  const line = git(repo, `rev-list --parents -n 1 ${sha}`);
  const parents = line ? line.split(" ").length - 1 : 0;
  check(`PR #${pr} merge commit ${sha} has 2 parents`, parents === 2, `parents=${parents}`);
}

// ─── 6. Active agents described with correct authority (vs araya.yaml) ─
const yaml = fs.readFileSync(path.join(ROOT, "araya.yaml"), "utf-8");
const expectations = [
  { agent: "clara", role: "Test Automation Engineer", authority: "TEST_AUTOMATION", status: "active" },
  { agent: "teresa", role: "Independent Test Gate", authority: "TEST_GATE", status: "active" },
  { agent: "rolando", role: "Reality Authority", authority: "REALITY_AUTHORITY", status: "active" },
  { agent: "daneel", role: "Delegated Executor", authority: "COORDINATOR", status: "active" },
  { agent: "neo", role: "Dynamic Capability Agent", authority: null, status: "dormant" },
  { agent: "trinity", role: "Dynamic Capability Agent", authority: null, status: "dormant" },
];
for (const e of expectations) {
  const block = (yaml.match(new RegExp(`\\n  ${e.agent}:\\n([\\s\\S]*?)(?=\\n  \\w|$)`)) || [])[1] || "";
  check(`araya.yaml ${e.agent} role = ${e.role}`, block.includes(`role: ${e.role}`));
  if (e.status === "dormant") {
    check(`araya.yaml ${e.agent} status dormant`, /status:\s*dormant/.test(block));
  }
  if (e.authority) {
    const cap = e.agent[0].toUpperCase() + e.agent.slice(1);
    const rowRe = new RegExp(`\\|\\s*${cap}\\s*\\|\\s*${e.authority}\\s*\\|`);
    check(`capsule 002 describes ${e.agent} as ${e.authority} (matches araya.yaml)`, rowRe.test(allText));
  }
}
check("daneel can_write_code false in araya.yaml", /daneel:[\s\S]*?can_write_code:\s*false/.test(yaml));
check("capsule 002 states daneel can_write_code=false", /can_write_code(?:`)?\s*[:=]\s*`?false/.test(allText));

// ─── Results ─────────────────────────────────────────────────────────
console.log("");
if (failures.length > 0) {
  console.log("Failures:");
  for (const f of failures) console.log(`  ✗ ${f}`);
}
console.log("\n══════════════════════════════════════════════════");
console.log(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped, ${passed + failed} total`);
console.log("══════════════════════════════════════════════════");
process.exit(failed > 0 ? 1 : 0);
