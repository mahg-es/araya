/**
 * ARAYA Governed Operation — OperationResult builder (ponny-express-10010 PHASE 4).
 */
import { OperationCheck, OperationResult } from "./types";
import { validateOperationResult } from "./contract";

export function nowIso(): string {
  return new Date().toISOString();
}

export function buildResult(params: {
  operationId: string;
  version: string;
  checks: OperationCheck[];
  subject?: Record<string, unknown>;
  warnings?: string[];
  evidence?: string[];
  sideEffects?: string[];
  evaluatedSha?: string;
  startedAt: string;
  statusOverride?: OperationResult["status"];
}): OperationResult {
  const failed = params.checks.filter((c) => !c.passed && c.blocking !== false).map((c) => c.id);
  const blockingReasons = params.checks
    .filter((c) => !c.passed && c.blocking !== false)
    .map((c) => `${c.id}: ${c.detail ?? "failed"}`);
  const completedAt = nowIso();
  const passed = failed.length === 0;
  const result: OperationResult = {
    operation_id: params.operationId,
    operation_version: params.version,
    passed,
    status: params.statusOverride ?? (passed ? "PASS" : "FAIL"),
    subject: params.subject,
    checks: params.checks,
    failed_checks: failed,
    blocking_reasons: blockingReasons,
    warnings: params.warnings ?? [],
    evidence: params.evidence ?? [],
    side_effects: params.sideEffects ?? [],
    evaluated_sha: params.evaluatedSha,
    started_at: params.startedAt,
    completed_at: completedAt,
    duration_ms: Date.parse(completedAt) - Date.parse(params.startedAt),
  };
  const errors = validateOperationResult(result);
  if (errors.length > 0) {
    throw new Error(`OperationResult contract violation: ${errors.join("; ")}`);
  }
  return result;
}
