/**
 * ARAYA Governed Operation handlers — S1 deterministic operating model
 * (ADR-0021 / REQ-051). These wire the operating-model library into the
 * governed operation runtime, so the gates are invoked through the real
 * operation path (CLI / adapter), not only as direct function calls.
 */
import {
  preActionGate,
  preDispositionGate,
  resolveAuthorityClass,
  deriveState,
  verifyCapability,
} from "../operating-model/index";
import { buildResult, nowIso } from "./result";
import { check } from "./helpers";
import { OperationResult } from "./types";

function b(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

function s(v: unknown): string {
  return v == null ? "" : String(v);
}

export async function operatingModelPreActionGate(
  input: Record<string, unknown>,
  ctx: { root: string },
): Promise<OperationResult> {
  const startedAt = nowIso();
  const result = preActionGate({
    newSubstantiveOwnerIntent: b(input.new_substantive_owner_intent),
    requirementInRepositoryTruth: b(input.requirement_in_repository_truth),
    authorityClass: (s(input.authority_class) as any) || "UNKNOWN",
    requiredArchitecturePresent: b(input.required_architecture_present),
    requiredDependencySatisfied: b(input.required_dependency_satisfied),
    candidateIdentityStale: b(input.candidate_identity_stale),
    stageAuthorized: b(input.stage_authorized),
  });
  const checks = [
    check("gate_evaluated", true, `route=${result.route}`),
    check("eligible", result.eligible, result.reason ?? "eligible"),
    check("fail_closed", !result.eligible ? result.route !== "DECIDE-BY-BEST-PRACTICE" : true, `route=${result.route}`),
  ];
  return buildResult({
    operationId: "operating-model.pre-action-gate",
    version: "1.0.0",
    checks,
    subject: { root: ctx.root },
    evidence: [],
    startedAt,
  });
}

export async function operatingModelPreDispositionGate(
  input: Record<string, unknown>,
  ctx: { root: string },
): Promise<OperationResult> {
  const startedAt = nowIso();
  const result = preDispositionGate({
    disposition: (s(input.disposition) as any) || "STOP",
    nextEligibleActionExists: b(input.next_eligible_action_exists),
    stageAuthorized: b(input.stage_authorized),
    blockerExists: b(input.blocker_exists),
    verificationRequiredButAbsent: b(input.verification_required_but_absent),
    repositoryTruthPublicationRequiredButAbsent: b(input.repository_truth_publication_required_but_absent),
  });
  const checks = [
    check("gate_evaluated", true, `disposition=${result.allowed ? "allowed" : "rejected"}`),
    check("allowed", result.allowed, result.reason ?? "allowed"),
  ];
  return buildResult({
    operationId: "operating-model.pre-disposition-gate",
    version: "1.0.0",
    checks,
    subject: { root: ctx.root },
    evidence: [],
    startedAt,
  });
}

export async function operatingModelResolveAuthority(
  input: Record<string, unknown>,
  ctx: { root: string },
): Promise<OperationResult> {
  const startedAt = nowIso();
  const authorityClass = resolveAuthorityClass({
    canonicalRepository: b(input.canonical_repository),
    canonicalPlacement: b(input.canonical_placement),
    lifecycleStatus: s(input.lifecycle_status),
    approvedBranchState: s(input.approved_branch_state),
    governingSourcePresent: b(input.governing_source_present),
    acceptanceState: s(input.acceptance_state),
  });
  const checks = [check("authority_resolved", authorityClass !== "UNKNOWN", `class=${authorityClass}`)];
  return buildResult({
    operationId: "operating-model.resolve-authority",
    version: "1.0.0",
    checks,
    subject: { root: ctx.root, authority_class: authorityClass },
    evidence: [],
    startedAt,
  });
}

export async function operatingModelVerifyCapability(
  input: Record<string, unknown>,
  ctx: { root: string },
): Promise<OperationResult> {
  const startedAt = nowIso();
  const verdict = verifyCapability(
    {
      producerIdentity: s(input.producer_identity),
      verifierIdentity: s(input.verifier_identity),
      candidateSha: s(input.candidate_sha),
      disposition: s(input.disposition),
      evidenceDurable: b(input.evidence_durable),
    },
    s(input.expected_sha),
  );
  const checks = [
    check("verification_pass", verdict === "PASS", `verdict=${verdict}`),
    check("persona_free", !/teresa|rolando|giskard/i.test(s(input.verifier_identity)), "no persona sentinel"),
  ];
  return buildResult({
    operationId: "operating-model.verify-capability",
    version: "1.0.0",
    checks,
    subject: { root: ctx.root, verdict },
    evidence: [],
    startedAt,
  });
}

export async function operatingModelDeriveState(
  input: Record<string, unknown>,
  ctx: { root: string },
): Promise<OperationResult> {
  const startedAt = nowIso();
  const state = deriveState({
    currentStage: s(input.current_stage),
    currentNode: s(input.current_node),
    requirementInRepositoryTruth: b(input.requirement_in_repository_truth),
    authorityClass: (s(input.authority_class) as any) || "UNKNOWN",
    dependenciesSatisfied: b(input.dependencies_satisfied),
    candidateSha: s(input.candidate_sha),
    candidateShaStale: b(input.candidate_sha_stale),
    verificationPresent: b(input.verification_present),
    verificationStale: b(input.verification_stale),
    repositoryTruthPublished: b(input.repository_truth_published),
    nextEligibleAction: input.next_eligible_action == null ? null : s(input.next_eligible_action),
  });
  const checks = [
    check("state_derived", true, `node=${state.currentNode}`),
    check("terminal_eligible", state.terminalDispositionEligibility, `next=${state.nextEligibleAction ?? "none"}`),
  ];
  return buildResult({
    operationId: "operating-model.derive-state",
    version: "1.0.0",
    checks,
    subject: { root: ctx.root, state },
    evidence: [],
    startedAt,
  });
}
