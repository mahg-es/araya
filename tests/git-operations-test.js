#!/usr/bin/env node
// ARAYA git.* operations tests (ponny-express-10010 PHASE 11).
// Sandbox repos in temp dirs where mutation is needed; read-only here otherwise.
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
let passed = 0, failed = 0;
const failures = [];
function check(label, cond, detail) {
  if (cond) passed++;
  else { failed++; failures.push(`${label}${detail ? ` — ${detail}` : ""}`); }
}
function sh(cmd, args, cwd) {
  try {
    const out = execFileSync(cmd, args, { cwd: cwd ?? ROOT, encoding: "utf-8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: String(e.stdout ?? "") + String(e.stderr ?? "") };
  }
}
function cli(args, cwd) { return sh("npx", ["tsx", "src/cli.ts", ...args], cwd); }
function jsonOut(r) {
  const t = r.out;
  const starts = ["{", "["].map((c) => t.indexOf(c)).filter((i) => i >= 0);
  const start = Math.min(...starts);
  const end = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  return JSON.parse(t.slice(start, end + 1));
}

console.log("git.* Operations Tests");
console.log("======================");

// ─── git.repository-sanity on the real repo (read-only) ──────────────
const sanity = cli(["git", "sanity", "--json"]);
const s = jsonOut(sanity);
check("sanity: passed on clean worktree", s.passed === true, s.failed_checks?.join(","));
check("sanity: reports branch", typeof s.subject.branch === "string");
check("sanity: worktree rule check present", s.checks.some((c) => c.id === "no_worktree_outside_authorized"));

// ─── sandbox: dirty repo detection ───────────────────────────────────
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "araya-ops-"));
sh("git", ["init", "-b", "main"], tmp);
sh("git", ["remote", "add", "origin", "https://example.invalid/x.git"], tmp);
fs.writeFileSync(path.join(tmp, "f.txt"), "x");
sh("git", ["add", "f.txt"], tmp);
sh("git", ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-m", "init"], tmp);
const s2 = cli(["git", "sanity", "--repo", tmp, "--json"]);
const s2o = jsonOut(s2);
check("sanity: detects repository", s2o.checks.find((c) => c.id === "repository_exists").passed === true);
check("sanity: upstream unknown reported", s2o.checks.find((c) => c.id === "upstream_known").passed === false);

// ─── git.sync-integration: fail closed on dirty tree ─────────────────
sh("git", ["-C", tmp, "checkout", "-b", "dev-mahg"], tmp);
fs.writeFileSync(path.join(tmp, "dirty.txt"), "dirty");
const sync1 = cli(["operation", "execute", "git.sync-integration", `repo=${tmp}`, "branch=dev-mahg", "--json"]);
const sy1 = jsonOut(sync1);
check("sync: fails closed on dirty tree", sy1.passed === false && sy1.failed_checks.includes("working_tree_clean"));
check("sync: exit 1 on failure", sync1.code === 1);

// ─── git.sync-integration: rejects wrong branch ──────────────────────
const sync2 = cli(["operation", "execute", "git.sync-integration", `repo=${tmp}`, "branch=main", "--json"]);
const sy2 = jsonOut(sync2);
check("sync: rejects when current branch != requested integration", sy2.passed === false && sy2.failed_checks.includes("branch_is_integration"));

// ─── git.feature-start: dry-run + guards ─────────────────────────────
const fsDry = cli(["operation", "execute", "git.feature-start", `repo=${ROOT}`, "name=opstest-dryrun", "base=origin/dev-mahg", "dry_run=true", "--json"]);
const fsDryO = jsonOut(fsDry);
check("feature-start: dry-run passes with no writes", fsDryO.passed === true && fsDryO.side_effects.length === 0);
check("feature-start: dry_run check recorded", fsDryO.checks.some((c) => c.id === "dry_run_no_writes"));
const wtPath = path.join(os.homedir(), "github", "mahg-es", "worktrees", "araya", "opstest-dryrun");
check("feature-start: dry-run created nothing", !fs.existsSync(wtPath));

const fsDup = cli(["operation", "execute", "git.feature-start", `repo=${ROOT}`, "name=x", "branch=feature/evidence-and-context-preservation", "base=origin/dev-mahg", "dry_run=true", "--json"]);
const fsDupO = jsonOut(fsDup);
check("feature-start: rejects duplicate branch", fsDupO.passed === false && fsDupO.failed_checks.includes("branch_name_unique"));

// ─── git.merge-gate: negative paths (no gates, wrong base, bad sha) ──
const mg1 = cli(["gate", "merge-pr", "--pr", "84", "--candidate", "0000000000000000000000000000000000000000", "--json"]);
const mg1o = jsonOut(mg1);
check("merge-gate: fails on nonexistent candidate", mg1o.passed === false && mg1o.failed_checks.includes("candidate_resolves"));
check("merge-gate: no teresa/rolando report for arbitrary sha fails", mg1o.failed_checks.includes("teresa_exact_sha") && mg1o.failed_checks.includes("rolando_exact_sha"));
check("merge-gate: main base rejected structurally", jsonOut(cli(["gate", "merge-pr", "--pr", "84", "--candidate", "a6369d73125935ca3b95fe0ce28b7e696a5a0984", "--base", "main", "--json"])).failed_checks.includes("main_not_target"));

// merge-gate on REAL merged evidence: PR #84 candidate has teresa+rolando reports in .araya/runs
const mg3 = cli(["gate", "merge-pr", "--pr", "84", "--candidate", "a6369d73125935ca3b95fe0ce28b7e696a5a0984", "--base", "dev-mahg", "--json"]);
const mg3o = jsonOut(mg3);
check("merge-gate: teresa_exact_sha found for PR #84 candidate", mg3o.checks.find((c) => c.id === "teresa_exact_sha").passed === true, mg3o.checks.find((c) => c.id === "teresa_exact_sha").detail);
check("merge-gate: rolando_exact_sha found for PR #84 candidate", mg3o.checks.find((c) => c.id === "rolando_exact_sha").passed === true);

// evidence-only diff check with the real evidence commit 71cc401
const mg4 = cli(["gate", "merge-pr", "--pr", "84", "--candidate", "a6369d73125935ca3b95fe0ce28b7e696a5a0984", "--evidence-commit", "71cc4019dba2a33da2ca11f2d85639754d9eb325".replace("9dba2a33da2ca11f2d85639754d9eb325", ""), "--base", "dev-mahg", "--json"]);
const mg4o = jsonOut(mg4);
const evCheck = mg4o.checks.find((c) => c.id === "evidence_only_diff");
check("merge-gate: evidence_only_diff evaluated", evCheck !== undefined);

console.log("");
if (failures.length) {
  console.log("Failures:");
  for (const f of failures) console.log(`  ✗ ${f}`);
}
console.log("\n══════════════════════════════════════════════════");
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log("══════════════════════════════════════════════════");
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
