/**
 * ARAYA S1 — real runtime enforcement (ADR-0021 / REQ-051).
 *
 * Wires the operating-model gates into the actual Pi agent lifecycle so they
 * are unavoidable, not merely callable:
 *   - pre-disposition gate  → `agent_before_settle` (fires before final settlement)
 *   - pre-action gate       → `tool_call` (fires before a mutating tool executes)
 *
 * Operating state is DERIVED AUTOMATICALLY from authoritative inputs
 * (Repository Truth + Approved Plan + durable slice evidence + current
 * repository/runtime facts), never from a manually-maintained authority store.
 *
 * `.araya/operating-model/state.json` (if present at all) is a NON-AUTHORITATIVE
 * disposable cache whose ONLY writer is automatic (`deriveAndCacheState`) and
 * whose absence/corruption yields UNKNOWN — which FAILS CLOSED. It is never
 * hand-created, never authoritative, and safely disposable.
 *
 * NEW_RUNTIME_ENGINES=0, NEW_PERSONAS=0, NEW_PERSISTENT_AUTHORITY_STORES=0.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { preActionGate, preDispositionGate } from "./index";

export type StateStatus = "KNOWN" | "UNKNOWN";

/** Authoritative derived operating state (inputs come from Repository Truth). */
export interface DerivedState {
  stageAuthorized: boolean;
  currentNode: string;
  nextEligibleAction: string | null;
  blocker: boolean;
}

/** Result of deriving/reading the operating state. UNKNOWN must fail closed. */
export interface TransientState extends DerivedState {
  status: StateStatus;
}

const UNKNOWN_STATE: TransientState = {
  status: "UNKNOWN",
  stageAuthorized: false,
  currentNode: "",
  nextEligibleAction: null,
  blocker: false,
};

const STATE_PATH = path.join(".araya", "operating-model", "state.json");

/** Smallest sufficient automatic-continuation guard: at most one forced next
 *  provider turn per unchanged (state + nextEligibleAction + headSHA). */
export const MAX_AUTOMATIC_CONTINUATION_WITHOUT_STATE_CHANGE = 1;

/**
 * Deterministic continuation guard using a transient, in-process registry
 * (module-scoped). No durable authority store is created; a Pi process restart
 * resets it. Key includes the repository HEAD so any product/evidence change
 * resets the guard.
 */
const continuationCounts = new Map<string, number>();

/** Reset the transient continuation guard (test/verifier hook; in-process only). */
export function resetContinuationGuard(): void {
  continuationCounts.clear();
}

function isDerivedState(j: unknown): j is DerivedState {
  if (typeof j !== "object" || j === null) return false;
  const o = j as Record<string, unknown>;
  return (
    typeof o.stageAuthorized === "boolean" &&
    typeof o.currentNode === "string" &&
    typeof o.blocker === "boolean" &&
    (o.nextEligibleAction === null || o.nextEligibleAction === undefined || typeof o.nextEligibleAction === "string")
  );
}

/** Read-only git invocation. Returns trimmed stdout, or null on any failure. */
function git(root: string, args: string[]): string | null {
  try {
    return execFileSync("git", ["-C", root, ...args], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function readTextIfExists(p: string): string | null {
  try {
    return fs.readFileSync(p, "utf-8");
  } catch {
    return null;
  }
}

// ─── Authoritative state derivation ────────────────────────────────────────

/**
 * The ARAYA v0.5.0 adoption slice sequence S0..S6 (K01/K02 + formal Stage 2
 * Implementation Plan, Repository Truth). S7+ (canonical cutover) is a
 * SEPARATE Owner boundary and is never part of this runtime derivation.
 */
const PRE_S6_SEQUENCE = ["S0", "S1", "S2", "S3a", "S3b", "S4", "S5"];

/**
 * The S6 audit may corroborate S0–S5 (transitions that were already accepted
 * through independent evidence: coordinator ledger STOP entries + planning
 * evidence files), but it MUST NOT independently make `currentNode = S6`.
 * S6 acceptance requires an INDEPENDENT S6-acceptance record (live proof +
 * exact-SHA STOP + remote publication + durable coordinator evidence), which
 * does not exist until pe44's final live proof completes.
 */

function resolveCoordinatorRoot(root: string, explicit?: string): string | null {
  const candidates: string[] = [];
  if (explicit) candidates.push(explicit);
  if (process.env.ARAYA_COORDINATOR_ROOT) candidates.push(process.env.ARAYA_COORDINATOR_ROOT);
  candidates.push(path.resolve(root, "..", "araya-project-coordinator"));
  for (const c of candidates) {
    if (!c) continue;
    try {
      if (fs.existsSync(path.join(c, ".araya", "ax", "ledger", "score.ndjson")) || fs.existsSync(path.join(c, "planning", "current", "status-checkpoint.md"))) {
        return c;
      }
    } catch { /* keep searching */ }
  }
  return null;
}

function readCoordFile(coordinatorRoot: string, rel: string): string | null {
  return readTextIfExists(path.join(coordinatorRoot, rel));
}

/**
 * E4 / Stage-3 authorization (independent of S6 audit and of ADOPTION-RECORD).
 *
 * Returns true/false only when discoverable records resolve it; returns null
 * when unresolved OR when the coordinator record contradicts the audit record.
 * ADOPTION-RECORD.md "ADOPTED / ACTIVE CANONICAL" is SOURCE v0.5.0 adoption,
 * NOT target canonical cutover — it is never used as a stage-authorization
 * premise here.
 */
function resolveE4Authorized(root: string, coordinatorRoot: string | null): boolean | null {
  const audit = readTextIfExists(path.join(root, ".araya", "operating-model", "S6-CUTOVER-READINESS-AUDIT.md")) ?? "";
  const auditAuthorized = /Stage\s*3\s+authorized/i.test(audit) && !/Stage\s*3\s+not\s+authorized/i.test(audit);
  const auditNotAuthorized = /Stage\s*3\s+not\s+authorized/i.test(audit);

  if (coordinatorRoot) {
    const checkpoint = readCoordFile(coordinatorRoot, "planning/current/status-checkpoint.md") ?? "";
    const coordAuthorized = /Owner\s+E-4:\s*AUTHORIZED/i.test(checkpoint);
    const coordNotAuthorized = /Owner\s+E-4:\s*NOT\s+(?:GRANTED|AUTHORIZED)/i.test(checkpoint);
    if (coordAuthorized && !coordNotAuthorized) {
      // Contradiction: coordinator authorizes but the audit explicitly denies.
      if (auditNotAuthorized) return null;
      return true;
    }
    if (coordNotAuthorized) {
      // Contradiction: coordinator denies but the audit explicitly authorizes.
      if (auditAuthorized) return null;
      return false;
    }
  }

  // Corroborating authority marker from the S6 audit (Stage 3 authorized = E4
  // was granted; it is NOT a claim that S6 itself is accepted).
  if (auditAuthorized) return true;
  if (auditNotAuthorized) return false;
  return null;
}

/**
 * Independent S6 acceptance. Returns true ONLY when an independent durable
 * S6-acceptance record exists in the coordinator (live proof + exact-SHA STOP
 * + publication + coordinator evidence). The S6 audit's own `S6 = PASS` is
 * never consulted here. Absent → false (S6 NOT yet accepted).
 */
function resolveIndependentS6Accepted(coordinatorRoot: string | null): boolean {
  if (!coordinatorRoot) return false;
  // A dedicated coordinator evidence file is the canonical independent signal.
  // It does not exist yet (pe44 live proof has not completed).
  const dedicated = readCoordFile(coordinatorRoot, "planning/current/s6-live-proof-accepted.md");
  if (dedicated && /^S6\s*=\s*ACCEPTED/m.test(dedicated)) return true;
  // Fallback: coordinator status-checkpoint explicitly declaring S6 accepted
  // with live proof (post-pe44 state), never the target S6 audit.
  const checkpoint = readCoordFile(coordinatorRoot, "planning/current/status-checkpoint.md") ?? "";
  if (/S6\s*=\s*PASS.*live\s+proof|live\s+proof.*S6\s*=\s*PASS/is.test(checkpoint)) return true;
  return false;
}

/**
 * Discover and derive the operating state from actual existing authoritative
 * inputs in Repository Truth (never from chat memory):
 *
 *   - target Repository Truth:   `git rev-parse HEAD`
 *   - coordinator Repository Truth: sibling/env `araya-project-coordinator`
 *   - E4 / Stage-3 authorization: coordinator status-checkpoint (not ADOPTION-RECORD)
 *   - slice acceptance S0–S5:     corroborated by the S6 audit (independently-accepted transitions)
 *   - S6 acceptance:              INDEPENDENT S6-acceptance record only (absent → S6 NOT accepted)
 *
 * If required evidence is absent or contradictory, the result is UNKNOWN
 * (fail closed) — never a fabricated permissive state.
 */
export function deriveAuthoritativeState(root: string, coordinatorRoot?: string): TransientState {
  // 1. Repository Truth (target). No git HEAD → no trustworthy identity → UNKNOWN.
  const headSha = git(root, ["rev-parse", "HEAD"]);
  if (!headSha) return { ...UNKNOWN_STATE };

  const coordRoot = resolveCoordinatorRoot(root, coordinatorRoot);

  // 2. stageAuthorized — from E4/Stage-3 authorization only (never ADOPTION-RECORD).
  const e4 = resolveE4Authorized(root, coordRoot);
  if (e4 === null) return { ...UNKNOWN_STATE };
  const stageAuthorized = e4;

  // 3. Slice acceptance. The S6 audit is read ONLY for S0–S5 corroboration;
  //    its `S6 = PASS` is never used to conclude S6 acceptance.
  const audit = readTextIfExists(path.join(root, ".araya", "operating-model", "S6-CUTOVER-READINESS-AUDIT.md"));
  const statuses = audit ? parseNodeStatuses(audit) : null;

  // S0–S5 acceptance requires an S6 audit (or equivalent corroboration) present.
  if (statuses === null || statuses.size === 0) return { ...UNKNOWN_STATE };

  // Furthest completed PRE-S6 node (in canonical sequence order). S6 is excluded.
  let currentNode = "";
  for (const node of PRE_S6_SEQUENCE) {
    const st = statuses.get(node);
    if (st === "PASS") currentNode = node;
    else break; // first non-PASS node (FAIL/BLOCK/PENDING/missing) bounds the completed prefix
  }
  if (!currentNode) return { ...UNKNOWN_STATE };

  // Independent S6 acceptance (never the S6 audit's own marker).
  const s6IndependentlyAccepted = resolveIndependentS6Accepted(coordRoot);

  let nextEligibleAction: string | null;
  if (s6IndependentlyAccepted) {
    // Only with independent S6 acceptance does the derivation resolve S6 done.
    currentNode = "S6";
    nextEligibleAction = null; // S7 = NOT AUTHORIZED (separate Owner boundary)
  } else {
    // Pre-S6 state: the next eligible action is the DAG successor of currentNode.
    const idx = PRE_S6_SEQUENCE.indexOf(currentNode);
    nextEligibleAction = idx >= 0 && idx + 1 < PRE_S6_SEQUENCE.length ? PRE_S6_SEQUENCE[idx + 1] : "S6";
  }

  // blocker — any failed/blocked pre-S6 node.
  let blocker = false;
  for (const node of PRE_S6_SEQUENCE) {
    const st = statuses.get(node);
    if (st === "FAIL" || st === "BLOCK") { blocker = true; break; }
  }

  return {
    status: "KNOWN",
    stageAuthorized,
    currentNode,
    nextEligibleAction,
    blocker,
  };
}

/** Parse `S<n> = STATUS` declarations. Returns null on contradictory duplicates.
 *  Trailing annotations are commentary; the status value is authoritative. */
function parseNodeStatuses(audit: string): Map<string, string> | null {
  const map = new Map<string, string>();
  const re = /^(S\d+[a-z]?)\s*=\s*(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(audit)) !== null) {
    const node = m[1];
    const raw = m[2].trim();
    let status: string;
    if (/^NOT\s+AUTHORIZED\b|^NOT_AUTHORIZED\b/i.test(raw)) status = "NOT AUTHORIZED";
    else if (/^PASS\b/i.test(raw)) status = "PASS";
    else if (/^FAIL\b/i.test(raw)) status = "FAIL";
    else if (/^BLOCK\b/i.test(raw)) status = "BLOCK";
    else if (/^PENDING\b/i.test(raw)) status = "PENDING";
    else status = "UNKNOWN"; // some other declaration — treated as not PASS
    if (map.has(node) && map.get(node) !== status) return null;
    map.set(node, status);
  }
  return map;
}

/**
 * Automatic writer for the disposable cache. It only records state that was
 * already derived from authoritative inputs; it never invents authority.
 * This is the ONLY writer of state.json — no test or operator hand-creates it.
 */
export function deriveAndCacheState(root: string, derived: DerivedState): DerivedState {
  try {
    const dir = path.join(root, ".araya", "operating-model");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "state.json"), JSON.stringify(derived, null, 2));
  } catch {
    // Cache write failure is non-fatal: the derived state is still authoritative.
  }
  return derived;
}

/**
 * Read the disposable cache. Absence or corruption yields UNKNOWN (status), so
 * callers fail closed — they must NOT fabricate a permissive authoritative state.
 */
export function readState(root: string): TransientState {
  const p = path.join(root, STATE_PATH);
  try {
    const raw = fs.readFileSync(p, "utf-8");
    const j = JSON.parse(raw);
    if (!isDerivedState(j)) return { ...UNKNOWN_STATE };
    return {
      status: "KNOWN",
      stageAuthorized: j.stageAuthorized,
      currentNode: j.currentNode,
      nextEligibleAction: j.nextEligibleAction ?? null,
      blocker: j.blocker,
    };
  } catch {
    return { ...UNKNOWN_STATE };
  }
}

/**
 * Automatic live derivation path (the DEFECT_A fix): derive authoritative
 * state from Repository Truth, refresh the disposable cache, and return it.
 * No manual step, no manual state file. UNKNOWN is returned only when the
 * authoritative evidence genuinely cannot resolve to a KNOWN state.
 */
export function getOrDeriveState(root: string, coordinatorRoot?: string): TransientState {
  const derived = deriveAuthoritativeState(root, coordinatorRoot);
  if (derived.status === "KNOWN") {
    deriveAndCacheState(root, {
      stageAuthorized: derived.stageAuthorized,
      currentNode: derived.currentNode,
      nextEligibleAction: derived.nextEligibleAction,
      blocker: derived.blocker,
    });
  }
  return derived;
}

// ─── Bash effect classification (the DEFECT_A deadlock fix) ─────────────────

export type BashEffect = "read-only" | "mutating" | "unknown";

/** Read-only evidence commands required for derivation (safe exact git forms). */
const READ_ONLY_GIT_SUBCOMMANDS = new Set([
  "fetch", "ls-remote", "status", "log", "show", "rev-parse", "diff", "branch",
]);

/** Known-mutating git subcommands (conservative default is `unknown` → BLOCK). */
const MUTATING_GIT_SUBCOMMANDS = new Set([
  "add", "commit", "checkout", "switch", "restore", "reset", "clean", "merge",
  "rebase", "cherry-pick", "revert", "push", "pull", "stash", "tag", "worktree",
  "gc", "prune", "rm", "mv",
]);

/**
 * Conservative effect classifier. Replaces the former `bash = always mutating`.
 *
 * - Safe exact read-only git forms → "read-only" (always allowed, even UNKNOWN,
 *   so the mechanism required to resolve UNKNOWN is never deadlocked).
 * - Known-mutating git subcommands → "mutating" (gated by stage authority).
 * - Anything else (non-git, compounds, pipes, redirection, substitution) →
 *   "unknown" → BLOCK.
 */
export function classifyBashEffect(command: string): BashEffect {
  const cmd = (command ?? "").trim();
  if (!cmd) return "unknown";

  // Reject unsafe compounds, pipes, redirection, and unknown substitution first.
  // Newline/CR are compound separators too — a multi-line command must be
  // blocked conservatively, never partially classified as read-only.
  if (/[\n\r]/.test(cmd)) return "unknown";
  if (/;/.test(cmd)) return "unknown";
  if (/&&|\|\|/.test(cmd)) return "unknown";
  if (/\|/.test(cmd)) return "unknown";
  if (/[<>]/.test(cmd)) return "unknown";
  if (/`|\$\(|\$\{/.test(cmd)) return "unknown";

  const parts = cmd.split(/\s+/).filter(Boolean);
  if (parts[0] !== "git") return "unknown"; // only git forms are whitelisted
  const sub = parts[1];
  if (!sub) return "unknown";

  if (READ_ONLY_GIT_SUBCOMMANDS.has(sub)) {
    if (sub === "branch") {
      // `git branch -d/-D/-m/-M` mutate; list / --show-current / -a / -r are read-only.
      if (parts.some((a) => /^-[dDmM]$/.test(a))) return "mutating";
      return "read-only";
    }
    return "read-only";
  }
  if (MUTATING_GIT_SUBCOMMANDS.has(sub)) return "mutating";
  return "unknown";
}

function toolEffect(toolName: string, command?: string): "non-mutating" | "mutating" | "unknown" {
  if (toolName === "bash") {
    if (command == null || command === "") return "unknown";
    const effect = classifyBashEffect(command);
    if (effect === "read-only") return "non-mutating";
    return effect; // "mutating" | "unknown"
  }
  if (toolName === "edit" || toolName === "write") return "mutating";
  return "non-mutating"; // read, grep, find, ls, custom read-only tools — not gated
}

// ─── Pre-action enforcement ─────────────────────────────────────────────────

/**
 * Pre-action enforcement. Return `{ block: true, reason? }` (the Pi `tool_call`
 * result shape) to block a mutating tool when prerequisites are unresolved
 * (fail-closed) OR when the operating state is UNKNOWN. Return undefined to
 * allow the tool.
 *
 * Read-only bash (narrow whitelist) is always allowed so the read-only evidence
 * acquisition required to resolve UNKNOWN is never deadlocked. Unknown shell
 * effects are blocked (conservative default).
 */
export function enforcePreAction(
  root: string,
  toolName: string,
  command?: string,
): { block: boolean; reason?: string } | undefined {
  const effect = toolEffect(toolName, command);
  if (effect === "non-mutating") return undefined;
  if (effect === "unknown") {
    return { block: true, reason: "unknown shell effect — blocked (conservative default)" };
  }

  // mutating (edit/write or known-mutating bash) → derive state, then gate.
  const s = getOrDeriveState(root);
  if (s.status === "UNKNOWN") {
    return { block: true, reason: "operating state UNKNOWN — fail closed (derive/resolve before mutation)" };
  }
  if (!s.stageAuthorized) {
    return { block: true, reason: "stage NOT authorized — mutation blocked (fail-closed)" };
  }
  return undefined;
}

// ─── Pre-disposition enforcement (the DEFECT_B fix) ─────────────────────────

/** Deterministic continuation message (minimal; invents no new authority/intent). */
function continuationMessage(nextEligibleAction: string | null): string {
  if (nextEligibleAction) {
    return `Continue with the derived NEXT_ELIGIBLE_ACTION (${nextEligibleAction}) under current authority.`;
  }
  return "Operating state UNKNOWN — derive/resolve authoritative state before terminal settlement.";
}

/** Shape of the boundary result returned to Pi (BoundaryResult-compatible). */
export interface PreDispositionResult {
  entries?: Array<{
    type: "custom" | "custom_message";
    customType: string;
    content?: string;
    data?: unknown;
    display?: boolean;
  }>;
  continue?: boolean;
}

/**
 * Pre-disposition enforcement.
 *
 * Respects the upstream Pi `agent_before_settle` contract:
 *   - `event.context.canContinue === true`  → `{ continue: true }` is valid.
 *   - `event.context.canContinue === false` → ARAYA first creates a legitimate
 *     next-turn context (a queued deterministic continuation `custom_message`)
 *     and only then requests continuation — never a blind `continue: true`.
 *   - If no valid runnable context can be safely created, a deterministic
 *     fail-closed `INVALID_BOUNDARY_CONTINUATION` entry is surfaced and NO
 *     invalid `continue: true` is returned (no silent settlement, no boundary error).
 *
 * A finite loop guard caps automatic continuations per unchanged
 * (currentNode + nextEligibleAction + HEAD) key.
 */
export function enforcePreDisposition(root: string, event?: any): PreDispositionResult | undefined {
  const canContinue = event?.context?.canContinue === true;
  const s = getOrDeriveState(root);

  // Decide whether a terminal settlement is forbidden (authorized work remains).
  let needAnotherTurn: boolean;
  let message: string;
  if (s.status === "UNKNOWN") {
    // Fail closed: unresolved state must not permit a terminal settlement.
    needAnotherTurn = true;
    message = continuationMessage(null);
  } else {
    const gate = preDispositionGate({
      disposition: "STOP", // the agent is attempting to settle/terminate
      nextEligibleActionExists: s.nextEligibleAction != null && s.nextEligibleAction !== "",
      stageAuthorized: s.stageAuthorized,
      blockerExists: s.blocker,
      verificationRequiredButAbsent: false,
      repositoryTruthPublicationRequiredButAbsent: false,
    });
    needAnotherTurn = !gate.allowed;
    message = continuationMessage(s.nextEligibleAction);
  }

  if (!needAnotherTurn) return undefined;

  // Loop guard: same state + same nextEligibleAction + no product/evidence change.
  const guardKey = `${s.currentNode}|${s.nextEligibleAction ?? "none"}|${git(root, ["rev-parse", "HEAD"]) ?? "no-head"}`;
  const count = (continuationCounts.get(guardKey) ?? 0) + 1;
  continuationCounts.set(guardKey, count);
  if (count > MAX_AUTOMATIC_CONTINUATION_WITHOUT_STATE_CHANGE) {
    return {
      entries: [{
        type: "custom",
        customType: "araya_invalid_boundary_continuation",
        data: {
          reason: "INVALID_BOUNDARY_CONTINUATION",
          guardKey,
          automaticContinuationsWithoutStateChange: count,
          limit: MAX_AUTOMATIC_CONTINUATION_WITHOUT_STATE_CHANGE,
          derived: {
            status: s.status,
            currentNode: s.currentNode,
            nextEligibleAction: s.nextEligibleAction,
            blocker: s.blocker,
          },
        },
      }],
    };
  }

  if (canContinue) {
    return { continue: true };
  }

  // canContinue === false → create a legitimate, minimal runnable next-turn
  // context via a queued custom_message, then request continuation.
  return {
    entries: [{
      type: "custom_message",
      customType: "araya_derived_continuation",
      content: message,
      display: false,
    }],
    continue: true,
  };
}
