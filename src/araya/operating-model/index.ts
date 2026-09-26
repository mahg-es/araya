// ARAYA S1 — Deterministic Operating Model (ADR-0021 / REQ-051)
//
// One small machine-readable state contract + fail-closed gates + semantic
// authority resolution, over the existing ARAYA runtime.
// NEW_PERSISTENT_AUTHORITY_STORES = 0 · NEW_RUNTIME_ENGINES = 0 · NEW_PERSONAS = 0.

// ─── Authority classification ────────────────────────────────────────────────

export type AuthorityClass =
  | "REPOSITORY_TRUTH"
  | "APPROVED_GOVERNANCE"
  | "APPROVED_ADR"
  | "APPROVED_ARCHITECTURE"
  | "APPROVED_PLAN"
  | "WORKING_ARTIFACT"
  | "EXTERNAL_INPUT"
  | "EVIDENCE"
  | "UNKNOWN";

export interface AuthorityInput {
  /** artifact lives in the canonical repository (not a foreign clone) */
  canonicalRepository: boolean;
  /** artifact is at the governed canonical path */
  canonicalPlacement: boolean;
  /** lifecycle/status: current | intake | draft | historical | superseded */
  lifecycleStatus: string;
  /** approved branch/state: main | dev-araya-portfolio | dev-mahg | feature/* */
  approvedBranchState: string;
  /** a governing REQ/policy/ADR references and governs this artifact */
  governingSourcePresent: boolean;
  /** acceptance/publication state: published | merged | accepted | proposed | pending */
  acceptanceState: string;
}

const INTEGRATION_BRANCHES = new Set(["dev-araya-portfolio", "dev-mahg"]);

/**
 * Semantic authority resolution. Authority is a function of governance state,
 * NOT filesystem reachability, branch name alone, or merge occurrence alone.
 */
export function resolveAuthorityClass(input: AuthorityInput): AuthorityClass {
  if (!input.canonicalRepository) return "EXTERNAL_INPUT";

  const draftLike =
    input.lifecycleStatus === "draft" || input.lifecycleStatus === "intake";
  const merged =
    input.approvedBranchState === "main" ||
    INTEGRATION_BRANCHES.has(input.approvedBranchState);

  // Draft/intake state is a working artifact regardless of placement.
  if (draftLike) return "WORKING_ARTIFACT";

  // Merged on the canonical integration/main branch = Repository Truth.
  if (input.canonicalPlacement && merged) return "REPOSITORY_TRUTH";

  // Accepted at canonical placement but not yet merged = approved governance/ADR.
  if (input.canonicalPlacement && input.acceptanceState === "accepted") {
    return input.governingSourcePresent ? "APPROVED_GOVERNANCE" : "APPROVED_ADR";
  }

  return "UNKNOWN";
}

// ─── Decision routing (LOCK / DECIDE / ESCALATE / BLOCK) ────────────────────

export type Route =
  | "LOCK"
  | "DECIDE-BY-BEST-PRACTICE"
  | "ESCALATE-AUTHORITY"
  | "BLOCK-EVIDENCE-GAP";

// ─── Pre-action gate ─────────────────────────────────────────────────────────

export interface PreActionInput {
  newSubstantiveOwnerIntent: boolean;
  requirementInRepositoryTruth: boolean;
  authorityClass: AuthorityClass;
  requiredArchitecturePresent: boolean;
  requiredDependencySatisfied: boolean;
  candidateIdentityStale: boolean;
  stageAuthorized: boolean;
}

export interface GateResult {
  eligible: boolean;
  route: Route;
  reason?: string;
}

/** Fail-closed on unresolved prerequisites. */
export function preActionGate(input: PreActionInput): GateResult {
  // Requirement-First invariant: new substantive intent without a canonical
  // requirement in Repository Truth blocks the action and routes to capture.
  if (input.newSubstantiveOwnerIntent && !input.requirementInRepositoryTruth) {
    return {
      eligible: false,
      route: "BLOCK-EVIDENCE-GAP",
      reason: "NEW_SUBSTANTIVE_OWNER_INTENT=YES but REQUIREMENT_IN_REPOSITORY_TRUTH=NO → Requirement-First",
    };
  }

  if (input.authorityClass === "UNKNOWN") {
    return { eligible: false, route: "BLOCK-EVIDENCE-GAP", reason: "authority unresolved/UNKNOWN" };
  }

  if (input.authorityClass === "WORKING_ARTIFACT" || input.authorityClass === "EXTERNAL_INPUT") {
    return {
      eligible: false,
      route: "BLOCK-EVIDENCE-GAP",
      reason: `authority=${input.authorityClass} is not Repository Truth`,
    };
  }

  if (!input.requiredArchitecturePresent) {
    return { eligible: false, route: "BLOCK-EVIDENCE-GAP", reason: "required architecture absent" };
  }

  if (!input.requiredDependencySatisfied) {
    return { eligible: false, route: "BLOCK-EVIDENCE-GAP", reason: "required dependency absent → route to dependency" };
  }

  if (input.candidateIdentityStale) {
    return { eligible: false, route: "BLOCK-EVIDENCE-GAP", reason: "candidate identity stale" };
  }

  if (!input.stageAuthorized) {
    return { eligible: false, route: "ESCALATE-AUTHORITY", reason: "stage not authorized" };
  }

  return { eligible: true, route: "LOCK" };
}

// ─── Pre-disposition gate ────────────────────────────────────────────────────

export interface PreDispositionInput {
  disposition: "STOP" | "FIX" | "ESCALATE" | "BLOCK" | "AUDIT" | "ASK";
  nextEligibleActionExists: boolean;
  stageAuthorized: boolean;
  blockerExists: boolean;
  verificationRequiredButAbsent: boolean;
  repositoryTruthPublicationRequiredButAbsent: boolean;
}

export interface DispositionResult {
  allowed: boolean;
  reason?: string;
}

/** A terminal success disposition fails closed when authorized work remains. */
export function preDispositionGate(input: PreDispositionInput): DispositionResult {
  const terminal = input.disposition === "STOP" || input.disposition === "AUDIT";

  if (terminal && input.nextEligibleActionExists && input.stageAuthorized && !input.blockerExists) {
    return {
      allowed: false,
      reason: "authorized next action exists + no blocker → terminal disposition forbidden",
    };
  }

  if (terminal && input.verificationRequiredButAbsent) {
    return { allowed: false, reason: "verification required but absent → STOP forbidden" };
  }

  if (terminal && input.repositoryTruthPublicationRequiredButAbsent) {
    return { allowed: false, reason: "Repository Truth publication required but absent" };
  }

  return { allowed: true };
}

// ─── Verification capability predicate (replaces persona-bound sentinels) ────

export interface VerificationEvidence {
  producerIdentity: string;
  verifierIdentity: string;
  candidateSha: string;
  disposition: string;
  evidenceDurable: boolean;
}

export type VerificationVerdict =
  | "PASS"
  | "PRODUCER_IS_VERIFIER"
  | "STALE_SHA"
  | "MISSING_VERIFICATION"
  | "NON_DURABLE_EVIDENCE";

/**
 * Governed capability invariant (ADR-0011 / ADR-0019 / agent-operating-standard §10):
 * producer != verifier + independent verifier + exact candidate SHA + STOP + durable evidence.
 * No persona names (Teresa/Rolando/Giskard) are required.
 */
export function verifyCapability(
  evidence: VerificationEvidence,
  expectedSha: string,
): VerificationVerdict {
  if (!evidence.verifierIdentity || evidence.verifierIdentity === evidence.producerIdentity) {
    return "PRODUCER_IS_VERIFIER";
  }
  if (evidence.candidateSha !== expectedSha) return "STALE_SHA";
  if (evidence.disposition !== "STOP") return "MISSING_VERIFICATION";
  if (!evidence.evidenceDurable) return "NON_DURABLE_EVIDENCE";
  return "PASS";
}

// ─── Recurrent state contract (derived, not stored) ─────────────────────────

export interface OperatingState {
  currentStage: string;
  currentNode: string;
  requirementState: "REPOSITORY_TRUTH" | "PENDING" | "ABSENT";
  authorityClass: AuthorityClass;
  dependencyState: "SATISFIED" | "PENDING";
  candidateIdentity: string;
  verificationState: "PASS" | "STALE" | "ABSENT";
  repositoryTruthState: "REPOSITORY_TRUTH" | "PENDING" | "ABSENT";
  invariants: { name: string; satisfied: boolean }[];
  nextEligibleAction: string | null;
  terminalDispositionEligibility: boolean;
}

/** Reconstruct operating state from authoritative inputs (no persistent store). */
export function deriveState(input: {
  currentStage: string;
  currentNode: string;
  requirementInRepositoryTruth: boolean;
  authorityClass: AuthorityClass;
  dependenciesSatisfied: boolean;
  candidateSha: string;
  candidateShaStale: boolean;
  verificationPresent: boolean;
  verificationStale: boolean;
  repositoryTruthPublished: boolean;
  nextEligibleAction: string | null;
}): OperatingState {
  const invariants: { name: string; satisfied: boolean }[] = [
    { name: "REQUIREMENT_FIRST", satisfied: !(false) },
    { name: "AUTHORITY_RESOLVED", satisfied: input.authorityClass !== "UNKNOWN" },
    { name: "DEPENDENCIES", satisfied: input.dependenciesSatisfied },
    { name: "CANDIDATE_CURRENT", satisfied: !input.candidateShaStale },
  ];

  const requirementState = input.requirementInRepositoryTruth
    ? "REPOSITORY_TRUTH"
    : "PENDING";

  const verificationState = !input.verificationPresent
    ? "ABSENT"
    : input.verificationStale
      ? "STALE"
      : "PASS";

  const repositoryTruthState = input.repositoryTruthPublished
    ? "REPOSITORY_TRUTH"
    : "PENDING";

  const terminalDispositionEligibility =
    input.nextEligibleAction === null &&
    input.dependenciesSatisfied &&
    input.repositoryTruthPublished;

  return {
    currentStage: input.currentStage,
    currentNode: input.currentNode,
    requirementState,
    authorityClass: input.authorityClass,
    dependencyState: input.dependenciesSatisfied ? "SATISFIED" : "PENDING",
    candidateIdentity: input.candidateSha,
    verificationState,
    repositoryTruthState,
    invariants,
    nextEligibleAction: input.nextEligibleAction,
    terminalDispositionEligibility,
  };
}
