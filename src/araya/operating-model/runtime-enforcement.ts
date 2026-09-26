/**
 * ARAYA S1 — real runtime enforcement (ADR-0021 / REQ-051).
 *
 * Wires the operating-model gates into the actual Pi agent lifecycle so they
 * are unavoidable, not merely callable:
 *   - pre-disposition gate  → `agent_before_settle` (fires before final settlement)
 *   - pre-action gate       → `tool_call` (fires before a mutating tool executes)
 *
 * Operating state is DERIVED from authoritative inputs (Repository Truth +
 * Approved Plan + durable slice evidence + current repository/runtime facts),
 * never from a manually-maintained authority store.
 *
 * `.araya/operating-model/state.json` (if present at all) is a NON-AUTHORITATIVE
 * disposable cache whose writer is automatic (`deriveAndCacheState`) and whose
 * absence/corruption yields UNKNOWN — which FAILS CLOSED. It is never hand-
 * created, never authoritative, and safely disposable. NEW_RUNTIME_ENGINES=0,
 * NEW_PERSONAS=0, NEW_PERSISTENT_AUTHORITY_STORES=0.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { preActionGate, preDispositionGate } from "./index";

export type StateStatus = "KNOWN" | "UNKNOWN";

/** Authoritative derived operating state (inputs come from Repository Truth). */
export interface DerivedState {
  stageAuthorized: boolean;
  currentNode: string;
  nextEligibleAction: string | null;
  blocker: boolean;
}

/** Result of reading the disposable cache. UNKNOWN must fail closed. */
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

const MUTATING_TOOLS = new Set(["bash", "edit", "write"]);

const STATE_PATH = path.join(".araya", "operating-model", "state.json");

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
 * Pre-disposition enforcement. Return `{ continue: true }` when a terminal
 * settlement is premature (authorized next action exists and no blocker) OR when
 * authoritative state is UNKNOWN (fail closed). Return undefined to allow settle.
 */
export function enforcePreDisposition(root: string): { continue?: boolean } | undefined {
  const s = readState(root);
  if (s.status === "UNKNOWN") {
    // Fail closed: unresolved authoritative state must not permit a terminal
    // settlement (STOP/AUDIT). Derive/resolve state before settling.
    return { continue: true };
  }
  const gate = preDispositionGate({
    disposition: "STOP", // the agent is attempting to settle/terminate
    nextEligibleActionExists: s.nextEligibleAction != null && s.nextEligibleAction !== "",
    stageAuthorized: s.stageAuthorized,
    blockerExists: s.blocker,
    verificationRequiredButAbsent: false,
    repositoryTruthPublicationRequiredButAbsent: false,
  });
  if (!gate.allowed) {
    return { continue: true };
  }
  return undefined;
}

/**
 * Pre-action enforcement. Return `{ block: true }` (the Pi `tool_call` event
 * result shape) to block a mutating tool when prerequisites are unresolved
 * (fail-closed) OR when authoritative state is UNKNOWN. Return undefined to
 * allow the tool. Only mutating tools gated.
 */
export function enforcePreAction(root: string, toolName: string): { block: boolean; reason?: string } | undefined {
  if (!MUTATING_TOOLS.has(toolName)) return undefined;
  const s = readState(root);
  // Fail closed: UNKNOWN state blocks mutation until state is derived/resolved.
  if (s.status === "UNKNOWN") {
    return { block: true, reason: "operating state UNKNOWN — fail closed (derive/resolve before mutation)" };
  }
  // Fail-closed on the automatic stage boundary: mutation is blocked when the
  // operating state declares the stage NOT authorized.
  if (!s.stageAuthorized) {
    return { block: true, reason: "stage NOT authorized — mutation blocked (fail-closed)" };
  }
  return undefined;
}
