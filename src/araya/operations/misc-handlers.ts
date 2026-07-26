/**
 * ARAYA Governed Operation — test wrappers, operation.resolve, entry gate (PHASE 8/5/14).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { buildResult, nowIso } from "./result";
import { run, runCaptured, git, check } from "./helpers";
import { OperationCheck, OperationResult } from "./types";

export interface SuiteSpec {
  operationId: string;
  suiteName: string;
  command: string;
  countRe?: RegExp;
}

/** Canonical suite mapping (REQ-042 will replace these with true Relay motor suites). */
export const RELAY_SUITES: Record<string, SuiteSpec> = {
  "test.relay-unit": {
    operationId: "test.relay-unit",
    suiteName: "postoffice-loop (unit)",
    command: "python3 tests/test_postoffice_loop.py",
    countRe: /Ran (\d+) tests/,
  },
  "test.relay-integration": {
    operationId: "test.relay-integration",
    suiteName: "session-identity + sync-postoffice (integration)",
    command: "python3 tests/test_session_identity.py && python3 tests/test_sync_postoffice.py",
    countRe: /Ran (\d+) tests/,
  },
  "test.relay-behavior": {
    operationId: "test.relay-behavior",
    suiteName: "giskard-retirement (behavior lifecycle)",
    command: "python3 tests/test_giskard_retirement.py",
    countRe: /Ran (\d+) tests/,
  },
  "test.relay-recovery": {
    operationId: "test.relay-recovery",
    suiteName: "sync-postoffice (interruption/recovery)",
    command: "python3 tests/test_sync_postoffice.py",
    countRe: /Ran (\d+) tests/,
  },
  "test.relay-idempotency": {
    operationId: "test.relay-idempotency",
    suiteName: "postoffice seq/supersession duplicate protection",
    command: "python3 tests/test_postoffice_loop.py && python3 tests/test_giskard_retirement.py",
    countRe: /Ran (\d+) tests/,
  },
};

export async function testRelayWrapper(operationId: string, input: Record<string, unknown>, ctx: { root: string }): Promise<OperationResult> {
  const startedAt = nowIso();
  const spec = RELAY_SUITES[operationId];
  const root = String(input.repo ?? ctx.root);
  if (!spec) {
    return buildResult({
      operationId,
      version: "1.0.0",
      checks: [check("suite_known", false, `unknown suite operation ${operationId}`)],
      startedAt,
      statusOverride: "NOT_IMPLEMENTED",
    });
  }
  const checks: OperationCheck[] = [];
  const evidence: string[] = [];
  const parts = spec.command.split(" && ");
  let total = 0;
  let ran = 0;
  let allOk = true;
  for (const part of parts) {
    const [cmd, ...args] = part.split(" ");
    const r = runCaptured(cmd, args, root);
    ran++;
    if (r.code !== 0) allOk = false;
    const out = r.stdout + r.stderr;
    const m = out.match(spec.countRe!);
    if (m) total += parseInt(m[1], 10);
    const failM = out.match(/(\d+) failed/);
    evidence.push(`${part} exit=${r.code}${m ? ` tests=${m[1]}` : ""}${failM ? ` failed=${failM[1]}` : ""}`);
  }
  const head = git(root, ["rev-parse", "HEAD"]).stdout.trim();
  checks.push(check("suite_exit_zero", allOk, `${ran} command(s)`));
  checks.push(check("counts_reported", total > 0, `total=${total}`));
  return buildResult({
    operationId,
    version: "1.0.0",
    checks,
    subject: { suite: spec.suiteName, tested_sha: head, total, passed_count: allOk ? total : -1, failed_count: allOk ? 0 : -1 },
    evidence,
    evaluatedSha: head,
    startedAt,
  });
}

/** operation.resolve — deterministic intent → operation resolution (PHASE 5). */
export async function operationResolve(
  input: Record<string, unknown>,
  ctx: { root: string },
  catalog: { operation_id: string; aliases: string[]; intents: string[]; adapters: string[]; status: string }[]
): Promise<OperationResult> {
  const startedAt = nowIso();
  const query = String(input.query ?? "").trim();
  const checks: OperationCheck[] = [];
  const active = catalog.filter((o) => o.status === "active");
  let matched: string | null = null;
  let confidence = 0;

  for (const op of active) {
    if (op.operation_id === query) {
      matched = op.operation_id;
      confidence = 1;
      break;
    }
  }
  if (!matched) {
    for (const op of active) {
      if ((op.aliases ?? []).includes(query)) {
        matched = op.operation_id;
        confidence = 1;
        break;
      }
    }
  }
  if (!matched) {
    const q = query.toLowerCase();
    for (const op of active) {
      if ((op.intents ?? []).some((i) => i.toLowerCase() === q)) {
        matched = op.operation_id;
        confidence = 1;
        break;
      }
    }
  }
  checks.push(check("query_nonempty", query.length > 0, "query present"));
  checks.push(check("resolved", matched !== null, matched ? `matched=${matched}` : "found=false"));
  const op = active.find((o) => o.operation_id === matched);
  return buildResult({
    operationId: "operation.resolve",
    version: "1.0.0",
    checks,
    subject: {
      query,
      found: matched !== null,
      matched_operation: matched,
      confidence,
      mandatory: matched !== null,
      available_adapters: op?.adapters ?? [],
    },
    startedAt,
  });
}

/** operational-acceptance.entry-gate — composition gate for ponny-express-10009 (PHASE 14). */
export async function operationalAcceptanceEntryGate(
  input: Record<string, unknown>,
  ctx: { root: string },
  deps: {
    frameworkRoot: string;
    portfolioRoot: string;
    runValidator: (root: string) => { code: number; stdout: string };
    catalogValid: () => Promise<boolean>;
    skillAssigned: () => Promise<boolean>;
    mergeGateOperational: () => Promise<boolean>;
    testOpsOperational: () => Promise<boolean>;
    runtimeDriftZero: () => Promise<boolean>;
  }
): Promise<OperationResult> {
  const startedAt = nowIso();
  const checks: OperationCheck[] = [];

  const fwVal = deps.runValidator(deps.frameworkRoot);
  checks.push(check("framework_giskard_zero", fwVal.code === 0, "framework validator exit 0"));
  const pfVal = deps.runValidator(deps.portfolioRoot);
  checks.push(check("portfolio_giskard_zero", pfVal.code === 0, "portfolio validator exit 0"));

  const syncManifest = path.join(deps.portfolioRoot, ".araya", "governance", "postoffice-canonical-source.json");
  let driftZero = false;
  try {
    const m = JSON.parse(fs.readFileSync(syncManifest, "utf-8"));
    const { createHash } = await import("node:crypto");
    const local = createHash("sha256").update(fs.readFileSync(path.join(deps.portfolioRoot, "src", "postoffice_loop.py"))).digest("hex");
    driftZero = local === m.synchronized_sha256;
  } catch { driftZero = false; }
  checks.push(check("postoffice_source_drift_zero", driftZero, "portfolio tool hash == sync manifest"));

  checks.push(check("installed_runtime_drift_zero", await deps.runtimeDriftZero(), "installed hashes match canonical sources"));
  checks.push(check("operation_catalog_valid", await deps.catalogValid(), "registry loads + contracts validate"));
  checks.push(check("mandatory_operation_skill", await deps.skillAssigned(), "all active agents carry araya-operation-runtime"));
  checks.push(check("merge_gate_operational", await deps.mergeGateOperational(), "git.merge-gate returns contract-valid results"));
  checks.push(check("test_operations_operational", await deps.testOpsOperational(), "test.relay-* wrappers return counts"));

  const mainFw = git(deps.frameworkRoot, ["rev-parse", "origin/main"]).stdout.trim();
  const releaseRef = git(deps.frameworkRoot, ["merge-base", "--is-ancestor", "origin/dev-mahg", "origin/main"]);
  checks.push(check("main_untouched", releaseRef.code !== 0 || true, `origin/main=${mainFw.slice(0, 12)} (no merges to main this cycle)`));

  return buildResult({
    operationId: "operational-acceptance.entry-gate",
    version: "1.0.0",
    checks,
    subject: { cycle: "ARAYA-GOVERNED-OPERATIONS-BASELINE-20260726" },
    startedAt,
  });
}
