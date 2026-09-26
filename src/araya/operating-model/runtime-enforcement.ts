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

/** ARAYA v0.5.0 adoption delivery-slice sequence (K01/K02 + S6 audit, Repository Truth). */
const NODE_SEQUENCE = ["S0", "S1", "S2", "S3a", "S3b", "S4", "S5", "S6"];

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
 * Discover and derive the operating state from actual existing authoritative
 * inputs in Repository Truth (never from chat memory):
 *
 *   - target Repository Truth: `git rev-parse HEAD` + `git branch --show-current`
 *   - durable slice evidence:  tracked `.araya/operating-model/S6-CUTOVER-READINESS-AUDIT.md`
 *   - approved authority:      tracked `.araya/operating-model/ADOPTION-RECORD.md`
 *
 * The four gating fields are read from explicit declarations in those tracked
 * artifacts. If required evidence is absent or contradictory, the result is
 * UNKNOWN (fail closed) — never a fabricated permissive state.
 */
export function deriveAuthoritativeState(root: string): TransientState {
  // 1. Repository Truth (target). No git HEAD → no trustworthy identity → UNKNOWN.
  const headSha = git(root, ["rev-parse", "HEAD"]);
  if (!headSha) return { ...UNKNOWN_STATE };

  // 2. Durable slice evidence + approved authority (tracked, read-only).
  const auditPath = path.join(root, ".araya", "operating-model", "S6-CUTOVER-READINESS-AUDIT.md");
  const adoptionPath = path.join(root, ".araya", "operating-model", "ADOPTION-RECORD.md");
  const audit = readTextIfExists(auditPath);
  const adoption = readTextIfExists(adoptionPath);
  if (!audit || !adoption) return { ...UNKNOWN_STATE };

  // 3. stageAuthorized — from explicit authority declarations only.
  const authorizedMarker = /Stage\s*3\s+authorized/i.test(audit);
  const notAuthorizedMarker = /Stage\s*3\s+not\s+authorized/i.test(audit);
  const adopted = /ADOPTED\s*\/\s*ACTIVE\s+CANONICAL/.test(adoption);
  let stageAuthorized: boolean;
  if (authorizedMarker && adopted && !notAuthorizedMarker) stageAuthorized = true;
  else if (notAuthorizedMarker && adopted) stageAuthorized = false;
  else return { ...UNKNOWN_STATE }; // authority evidence absent or contradictory

  // 4. currentNode / nextEligibleAction / blocker — from durable node statuses.
  const statuses = parseNodeStatuses(audit);
  if (statuses === null || statuses.size === 0) return { ...UNKNOWN_STATE };

  // Furthest completed node (in canonical sequence order).
  let currentNode = "";
  for (const node of NODE_SEQUENCE) {
    const st = statuses.get(node);
    if (st === "PASS") currentNode = node;
    else break; // first non-PASS (or missing) node bounds the completed prefix
  }
  if (!currentNode) return { ...UNKNOWN_STATE };

  // DAG successor: the first not-yet-PASS node after currentNode.
  const idx = NODE_SEQUENCE.indexOf(currentNode);
  let nextEligibleAction: string | null = null;
  for (let i = idx + 1; i < NODE_SEQUENCE.length; i++) {
    const st = statuses.get(NODE_SEQUENCE[i]);
    if (st === "PASS") continue;
    // NOT AUTHORIZED means no further eligible implementation slice.
    nextEligibleAction = st === "NOT AUTHORIZED" ? null : NODE_SEQUENCE[i];
    break;
  }

  // blocker — any failed/blocked node or a failed cutover-readiness declaration.
  let blocker = false;
  for (const node of NODE_SEQUENCE) {
    const st = statuses.get(node);
    if (st === "FAIL" || st === "BLOCK") { blocker = true; break; }
  }
  if (/CUTOVER_READINESS\s*=\s*FAIL/.test(audit)) blocker = true;

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
export function getOrDeriveState(root: string): TransientState {
  const derived = deriveAuthoritativeState(root);
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
