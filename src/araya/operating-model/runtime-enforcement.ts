/**
 * ARAYA S1 — real runtime enforcement (ADR-0021 / REQ-051).
 *
 * Wires the operating-model gates into the actual Pi agent lifecycle so they
 * are unavoidable, not merely callable:
 *   - pre-disposition gate  → `agent_before_settle` (fires before final settlement)
 *   - pre-action gate       → `tool_call` (fires before a mutating tool executes)
 *
 * State is DERIVED from a transient marker (`.araya/operating-model/state.json`),
 * not a persistent authority store. NEW_RUNTIME_ENGINES=0, NEW_PERSONAS=0.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { preActionGate, preDispositionGate } from "./index";

export interface TransientState {
  stageAuthorized: boolean;
  currentNode: string;
  nextEligibleAction: string | null;
  blocker: boolean;
}

const MUTATING_TOOLS = new Set(["bash", "edit", "write"]);

export function readState(root: string): TransientState {
  const p = path.join(root, ".araya", "operating-model", "state.json");
  try {
    const raw = fs.readFileSync(p, "utf-8");
    const j = JSON.parse(raw);
    return {
      stageAuthorized: j.stageAuthorized === true,
      currentNode: String(j.currentNode ?? ""),
      nextEligibleAction: j.nextEligibleAction == null ? null : String(j.nextEligibleAction),
      blocker: j.blocker === true,
    };
  } catch {
    // No state marker → no enforcement signal. Fail-open only for unknown state;
    // enforcement activates once the marker declares an authorized next action.
    return { stageAuthorized: false, currentNode: "", nextEligibleAction: null, blocker: false };
  }
}

/**
 * Pre-disposition enforcement. Return a BoundaryResult-like object with
 * `continue: true` when a terminal settlement is premature (authorized next
 * action exists and no blocker). Return undefined otherwise.
 */
export function enforcePreDisposition(root: string): { continue?: boolean } | undefined {
  const s = readState(root);
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
 * Pre-action enforcement. Return `{ action: "handled" }` to block a mutating
 * tool when prerequisites are unresolved (fail-closed). Return undefined to
 * allow the tool. Only mutating tools are gated.
 */
export function enforcePreAction(root: string, toolName: string): { action: string } | undefined {
  if (!MUTATING_TOOLS.has(toolName)) return undefined;
  const s = readState(root);
  // Fail-closed on the automatic stage boundary: mutation is blocked when the
  // operating state declares the stage NOT authorized. (Requirement-First /
  // authority / candidate-staleness predicates require task context and remain
  // governed through the operation runtime; this hook provides the automatic
  // boundary for the stage authority the marker can derive.)
  if (!s.stageAuthorized) {
    return { action: "handled" };
  }
  return undefined;
}
