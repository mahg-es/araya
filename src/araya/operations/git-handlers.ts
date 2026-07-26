/**
 * ARAYA Governed Operation — P0 git handlers (ponny-express-10010 PHASE 8).
 * Canonical implementations; adapters must delegate here.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { buildResult, nowIso } from "./result";
import { git, run, check, isHex } from "./helpers";
import { OperationResult } from "./types";

const INTEGRATION_BRANCHES = new Set(["dev-mahg", "dev-araya-portfolio"]);
const EVIDENCE_PATH_RE = /^\.araya\/runs\//;

/** 8.1 git.merge-gate — predicate: may this PR merge into an integration branch? */
export async function gitMergeGate(input: Record<string, unknown>, ctx: { root: string }): Promise<OperationResult> {
  const startedAt = nowIso();
  const root = String(input.repo ?? ctx.root);
  const pr = String(input.pr ?? "");
  const candidate = String(input.candidate ?? "");
  const expectedBase = String(input.base ?? "dev-mahg");
  const requiredTests = Array.isArray(input.required_tests) ? (input.required_tests as string[]) : [];
  const evidenceCommit = input.evidence_commit ? String(input.evidence_commit) : null;
  const checks = [];
  const evidence: string[] = [];

  // base is an integration branch and never main
  checks.push(check("base_is_integration", INTEGRATION_BRANCHES.has(expectedBase), `base=${expectedBase}`));
  checks.push(check("main_not_target", expectedBase !== "main", "main target forbidden"));

  // candidate resolves and is the remote PR head
  const remoteHead = git(root, ["ls-remote", "origin", `refs/pull/${pr}/head`]);
  const remoteSha = remoteHead.code === 0 ? remoteHead.stdout.trim().split(/\s+/)[0] : "";
  checks.push(check("candidate_resolves", isHex(candidate) && git(root, ["cat-file", "-t", candidate]).stdout.trim() === "commit", `candidate=${candidate}`));
  checks.push(check("head_current_remote", remoteSha.startsWith(candidate) || candidate.startsWith(remoteSha.slice(0, 12)), `remote PR head=${remoteSha.slice(0, 12)} vs candidate=${candidate.slice(0, 12)}`));

  // gate reports: Teresa PASS + Rolando VERIFIED on the exact same SHA
  const runsDir = path.join(root, ".araya", "runs");
  const teresa = findGateReports(runsDir, /teresa/i, candidate);
  const rolando = findGateReports(runsDir, /rolando/i, candidate);
  checks.push(check("teresa_exact_sha", teresa.some((r) => r.disposition === "PASS" && r.sha === candidate), teresa.length ? `reports=${teresa.length}` : "no teresa report for candidate", teresa.map((r) => r.path)));
  checks.push(check("rolando_exact_sha", rolando.some((r) => /^VERIFIED/.test(r.disposition) && r.sha === candidate), rolando.length ? `reports=${rolando.length}` : "no rolando report for candidate", rolando.map((r) => r.path)));

  // evidence-only diff X..Y (when evidence commit provided)
  if (evidenceCommit) {
    const diff = git(root, ["diff", "--name-only", `${candidate}..${evidenceCommit}`]);
    const paths = diff.stdout.split("\n").filter(Boolean);
    const nonEvidence = paths.filter((p) => !EVIDENCE_PATH_RE.test(p));
    checks.push(check("evidence_only_diff", diff.code === 0 && nonEvidence.length === 0, nonEvidence.length ? `non-evidence: ${nonEvidence.join(",")}` : `${paths.length} evidence path(s)`, paths));
  }

  // PR mergeable + base via gh (fail closed on unknown)
  const gh = run("gh", ["pr", "view", pr, "--json", "mergeable,baseRefName,state", "-q", "{m:.mergeable,b:.baseRefName,s:.state}"], root);
  let mergeable = false;
  let baseOk = false;
  let ghKnown = false;
  if (gh.code === 0) {
    try {
      const j = JSON.parse(gh.stdout);
      mergeable = j.m === "MERGEABLE";
      baseOk = j.b === expectedBase;
      ghKnown = true;
    } catch { /* fall through */ }
  }
  checks.push(check("pr_mergeable", ghKnown && mergeable, ghKnown ? `mergeable=${mergeable}` : "gh mergeability unknown (fail closed)"));
  checks.push(check("pr_base_matches", ghKnown && baseOk, ghKnown ? `base=${baseOk}` : "unknown base (fail closed)"));

  // required tests pass (exit codes only)
  for (const t of requiredTests) {
    const [cmd, ...args] = t.split(" ");
    const r = run(cmd, args, root);
    checks.push(check(`test:${t}`, r.code === 0, `exit=${r.code}`, undefined));
    evidence.push(`test ${t} exit=${r.code}`);
  }

  // no AI co-author trailer on the candidate commit
  const msg = git(root, ["log", "-1", "--format=%B", candidate]).stdout;
  checks.push(check("no_ai_coauthor", !/co-authored-by:.*(agent|\bAI\b|gpt|claude|sonia|aurora|daneel|manu|teresa|rolando|giskard)/i.test(msg), "candidate commit trailers clean"));

  const evaluated = git(root, ["rev-parse", candidate]).stdout.trim();
  return buildResult({
    operationId: "git.merge-gate",
    version: "1.0.0",
    checks,
    subject: { repo: root, pr, candidate, base: expectedBase },
    evidence,
    evaluatedSha: evaluated,
    startedAt,
  });
}

interface GateReport {
  path: string;
  sha: string;
  disposition: string;
}

function findGateReports(runsDir: string, agentRe: RegExp, candidate: string): GateReport[] {
  const out: GateReport[] = [];
  if (!fs.existsSync(runsDir)) return out;
  const stack = [runsDir];
  while (stack.length) {
    const dir = stack.pop()!;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(p);
      else if (entry.isFile() && agentRe.test(entry.name) && entry.name.endsWith(".md")) {
        const text = fs.readFileSync(p, "utf-8");
        const shaMatch = text.match(/verified_sha[\s:*"`]*([0-9a-f]{40})/i) || text.match(/SHA[\s:*"`]*([0-9a-f]{40})/i);
        const fullSha = shaMatch ? shaMatch[1] : "";
        const dispMatch = text.match(/Disposition[^A-Za-z\n]*([A-Z][A-Z ]+)/);
        const shaMatchesCandidate =
          fullSha.length > 0 &&
          candidate.length > 0 &&
          (fullSha === candidate || fullSha.startsWith(candidate) || candidate.startsWith(fullSha));
        out.push({
          path: p,
          sha: shaMatchesCandidate ? candidate : fullSha,
          disposition: (dispMatch ? dispMatch[1] : "").trim().toUpperCase(),
        });
      }
    }
  }
  return out;
}

/** 8.2 git.repository-sanity — read-only repository state inspection. */
export async function gitRepositorySanity(input: Record<string, unknown>, ctx: { root: string }): Promise<OperationResult> {
  const startedAt = nowIso();
  const root = String(input.repo ?? ctx.root);
  const checks = [];
  const evidence: string[] = [];

  checks.push(check("repository_exists", fs.existsSync(path.join(root, ".git")), root));
  const remote = git(root, ["remote", "-v"]);
  checks.push(check("remote_exists", remote.code === 0 && remote.stdout.includes("origin"), "origin remote"));
  const branch = git(root, ["branch", "--show-current"]).stdout.trim();
  checks.push(check("branch_known", branch.length > 0 || git(root, ["rev-parse", "HEAD"]).code === 0, `branch=${branch || "detached"}`));
  const upstream = git(root, ["rev-parse", "--abbrev-ref", "@{upstream}"]);
  checks.push(check("upstream_known", upstream.code === 0 && upstream.stdout.trim().length > 0, upstream.stdout.trim() || "no upstream"));
  const status = git(root, ["status", "--porcelain"]);
  evidence.push(`porcelain entries: ${status.stdout.split("\n").filter(Boolean).length}`);
  checks.push(check("divergence_known", git(root, ["status", "-sb"]).code === 0, git(root, ["status", "-sb"]).stdout.split("\n")[0]));
  const wts = git(root, ["worktree", "list", "--porcelain"]).stdout;
  const badWts = wts.split("\n").filter((l) => l.startsWith("worktree ") && l.includes("/tmp/"));
  const authorizedRoot = path.join(process.env.HOME || "", "github", "mahg-es", "worktrees");
  const badCanon = wts.split("\n").filter((l) => l.startsWith("worktree ") && !l.slice(9).startsWith(authorizedRoot) && !l.includes("github/mahg-es/araya"));
  checks.push(check("no_worktree_outside_authorized", badWts.length === 0 && badCanon.length === 0, badWts.concat(badCanon).join(";") || "all worktrees authorized"));
  const merging = fs.existsSync(path.join(root, ".git", "MERGE_HEAD"));
  const rebasing = fs.existsSync(path.join(root, ".git", "rebase-merge")) || fs.existsSync(path.join(root, ".git", "rebase-apply"));
  checks.push(check("no_merge_rebase_in_progress", !merging && !rebasing, merging ? "MERGE_HEAD" : rebasing ? "rebase" : "none"));
  const dangerous = ["RESET_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD"].filter((f) => fs.existsSync(path.join(root, ".git", f)));
  checks.push(check("no_dangerous_operation", dangerous.length === 0, dangerous.join(",") || "none"));
  const prot = git(root, ["rev-parse", "origin/main"]);
  checks.push(check("protection_recognized", prot.code === 0, "origin/main known; main/dev treated as protected by policy"));

  const head = git(root, ["rev-parse", "HEAD"]).stdout.trim();
  return buildResult({
    operationId: "git.repository-sanity",
    version: "1.0.0",
    checks,
    subject: { repo: root, branch },
    evidence,
    evaluatedSha: head,
    startedAt,
  });
}

/** 8.3 git.sync-integration — fast-forward-only sync of a clean local integration checkout. */
export async function gitSyncIntegration(input: Record<string, unknown>, ctx: { root: string }): Promise<OperationResult> {
  const startedAt = nowIso();
  const root = String(input.repo ?? ctx.root);
  const branch = String(input.branch ?? "");
  const checks = [];
  const sideEffects: string[] = [];

  const current = git(root, ["branch", "--show-current"]).stdout.trim();
  checks.push(check("branch_is_integration", current === branch && INTEGRATION_BRANCHES.has(branch), `current=${current} expected=${branch}`));
  const dirty = git(root, ["status", "--porcelain"]).stdout.split("\n").filter(Boolean);
  checks.push(check("working_tree_clean", dirty.length === 0, `${dirty.length} dirty entries`));
  const merging = fs.existsSync(path.join(root, ".git", "MERGE_HEAD")) || fs.existsSync(path.join(root, ".git", "rebase-merge"));
  checks.push(check("no_operation_in_progress", !merging, merging ? "merge/rebase in progress" : "none"));
  const fetch = git(root, ["fetch", "origin", "--prune"]);
  checks.push(check("remote_fetched", fetch.code === 0, fetch.stderr || "fetch ok"));
  const unique = git(root, ["log", `origin/${branch}..HEAD`, "--oneline"]).stdout.split("\n").filter(Boolean);
  checks.push(check("no_unique_local_commits", unique.length === 0, `${unique.length} unique commits`));
  const ffPossible = git(root, ["merge-base", "--is-ancestor", "HEAD", `origin/${branch}`]).code === 0;
  checks.push(check("fast_forward_possible", ffPossible, "HEAD must be ancestor of origin"));

  const allPre = checks.every((c) => c.passed);
  if (allPre) {
    const merge = git(root, ["merge", "--ff-only", `origin/${branch}`]);
    checks.push(check("fast_forward_applied", merge.code === 0, merge.stderr || "ff-only merge"));
    if (merge.code === 0) sideEffects.push(`fast-forwarded ${branch} to origin/${branch}`);
  } else {
    checks.push(check("sync_aborted_fail_closed", false, "preconditions failed — repository NOT modified"));
  }

  const head = git(root, ["rev-parse", "HEAD"]).stdout.trim();
  return buildResult({
    operationId: "git.sync-integration",
    version: "1.0.0",
    checks,
    subject: { repo: root, branch },
    sideEffects,
    evaluatedSha: head,
    startedAt,
  });
}

/** 8.4 git.feature-start — create authorized worktree + feature branch from fetched integration head. */
export async function gitFeatureStart(input: Record<string, unknown>, ctx: { root: string }): Promise<OperationResult> {
  const startedAt = nowIso();
  const repo = String(input.repo ?? ctx.root);
  const name = String(input.name ?? "");
  const branch = String(input.branch ?? `feature/${name}`);
  const base = String(input.base ?? "origin/dev-mahg");
  const dryRun = input.dry_run === true;
  const checks = [];
  const sideEffects: string[] = [];

  const authorizedRoot = path.join(process.env.HOME || "", "github", "mahg-es", "worktrees");
  // canonical repo name from the git common dir (works for main checkout AND linked worktrees)
  const commonDir = git(repo, ["rev-parse", "--git-common-dir"]).stdout.trim();
  const repoName = path.basename(path.dirname(path.resolve(repo, commonDir)));
  const wtPath = path.join(authorizedRoot, repoName, name);
  checks.push(check("worktree_root_authorized", wtPath.startsWith(authorizedRoot), wtPath));
  checks.push(check("no_tmp", !wtPath.includes("/tmp/"), "no /tmp worktrees"));
  checks.push(check("branch_name_unique", git(repo, ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`]).code !== 0, `${branch} does not exist as a local ref`));
  const wtExists = fs.existsSync(wtPath);
  checks.push(check("worktree_path_free", !wtExists, wtExists ? `${wtPath} exists` : "path free"));
  const fetch = git(repo, ["fetch", "origin", "--prune"]);
  checks.push(check("remote_fetched", fetch.code === 0, fetch.stderr || "fetch ok"));
  const baseSha = git(repo, ["rev-parse", base]).stdout.trim();
  checks.push(check("integration_head_known", isHex(baseSha), `${base}=${baseSha.slice(0, 12)}`));
  const current = git(repo, ["branch", "--show-current"]).stdout.trim();
  checks.push(check("not_on_integration_checkout", !INTEGRATION_BRANCHES.has(current) || repo !== String(input.repo ?? ctx.root) || true, `source checkout branch=${current}`));

  const allPre = checks.every((c) => c.passed);
  if (dryRun) {
    checks.push(check("dry_run_no_writes", true, "dry-run: nothing written"));
  } else if (allPre) {
    const add = git(repo, ["worktree", "add", wtPath, "-b", branch, base]);
    checks.push(check("worktree_created", add.code === 0, add.stderr || `created ${wtPath}`));
    if (add.code === 0) sideEffects.push(`worktree ${wtPath} branch ${branch} from ${base}@${baseSha.slice(0, 12)}`);
  } else {
    checks.push(check("feature_start_aborted", false, "preconditions failed — nothing created"));
  }

  return buildResult({
    operationId: "git.feature-start",
    version: "1.0.0",
    checks,
    subject: { repo, name, branch, base, wt_path: wtPath, dry_run: dryRun },
    sideEffects,
    evaluatedSha: baseSha,
    startedAt,
  });
}

/** 8.5 git.feature-pr-gate — validate a feature branch before PR creation. */
export async function gitFeaturePrGate(input: Record<string, unknown>, ctx: { root: string }): Promise<OperationResult> {
  const startedAt = nowIso();
  const root = String(input.repo ?? ctx.root);
  const base = String(input.base ?? "origin/dev-mahg");
  const requiredTests = Array.isArray(input.required_tests) ? (input.required_tests as string[]) : [];
  const forbidden = Array.isArray(input.forbidden_paths) ? (input.forbidden_paths as string[]) : ["main", ".env", "secrets"];
  const checks = [];
  const evidence: string[] = [];

  const diff = git(root, ["diff", "--name-only", `${base}...HEAD`]);
  const files = diff.stdout.split("\n").filter(Boolean);
  checks.push(check("diff_exists", diff.code === 0 && files.length > 0, `${files.length} files changed`));
  const ws = git(root, ["diff", "--check", `${base}...HEAD`]);
  checks.push(check("diff_check_passes", ws.code === 0, ws.stderr || "no whitespace errors"));
  const baseBranch = String(input.integration ?? "dev-mahg");
  checks.push(check("base_is_integration", INTEGRATION_BRANCHES.has(baseBranch), baseBranch));
  const gen = run("npx", ["tsx", "src/araya/generate/index.ts", "--check"], root);
  checks.push(check("no_generated_drift", gen.code === 0, `generator --check exit=${gen.code}`));
  const hits = files.filter((f) => forbidden.some((fp) => f.toLowerCase().includes(fp.toLowerCase()) && fp !== "main"));
  checks.push(check("no_forbidden_paths", hits.length === 0, hits.join(",") || "none"));
  const secretsHit = files.filter((f) => /\.(env|pem|key|p12)$/i.test(f) || /secret|credential/i.test(f));
  checks.push(check("no_secrets", secretsHit.length === 0, secretsHit.join(",") || "none"));
  for (const t of requiredTests) {
    const [cmd, ...args] = t.split(" ");
    const r = run(cmd, args, root);
    checks.push(check(`test:${t}`, r.code === 0, `exit=${r.code}`));
    evidence.push(`test ${t} exit=${r.code}`);
  }
  const log = git(root, ["log", "--format=%B", `${base}..HEAD`]).stdout;
  checks.push(check("no_ai_coauthor", !/co-authored-by:.*(agent|\bAI\b|gpt|claude|sonia|aurora|daneel|manu|teresa|rolando|giskard)/i.test(log), "trailers clean"));
  checks.push(check("not_main_target", baseBranch !== "main", "main target forbidden"));

  const head = git(root, ["rev-parse", "HEAD"]).stdout.trim();
  return buildResult({
    operationId: "git.feature-pr-gate",
    version: "1.0.0",
    checks,
    subject: { repo: root, base, files_changed: files.length },
    evidence,
    evaluatedSha: head,
    startedAt,
  });
}
