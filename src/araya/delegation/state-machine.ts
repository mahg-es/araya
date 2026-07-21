// ARAYA Delegation Broker — State Machine
// WS-10 Part 1: Pure transition function, validation, terminal guards
// Spec: .araya/plan/spec/req-001-delegation-architecture.md §5.4
// Isla, Infra Architect — 2026-07-22

import type { DelegationState, DelegationEvent } from "./types";
import { TERMINAL_STATES } from "./types";

// ─── Transition Table ───────────────────────────────────────────────────

/**
 * 14 valid transitions per spec §5.4 Transition Validation Table:
 *
 *   PENDING    → DISPATCHED  (VALIDATE_PASS)
 *   PENDING    → CANCELLED   (CANCEL)
 *   PENDING    → FAILED      (VALIDATE_FAIL)
 *   DISPATCHED → RUNNING     (RUNNING)
 *   DISPATCHED → FAILED      (DISPATCH_FAIL)
 *   DISPATCHED → TIMEOUT     (TIMEOUT)
 *   DISPATCHED → CANCELLED   (CANCEL)
 *   RUNNING    → COMPLETED   (COMPLETE)
 *   RUNNING    → FAILED      (FAIL)
 *   RUNNING    → TIMEOUT     (TIMEOUT)
 *   RUNNING    → BLOCKED     (BLOCK)
 *   BLOCKED    → DISPATCHED  (UNBLOCK)
 *   BLOCKED    → TIMEOUT     (TIMEOUT)
 *   BLOCKED    → CANCELLED   (CANCEL)
 */

const transitions: ReadonlyMap<DelegationState, ReadonlyMap<DelegationEvent, DelegationState>> = new Map([
  ["pending", new Map([
    ["VALIDATE_PASS", "dispatched"],
    ["VALIDATE_FAIL", "failed"],
    ["CANCEL", "cancelled"],
  ])],
  ["dispatched", new Map([
    ["RUNNING", "running"],
    ["DISPATCH_FAIL", "failed"],
    ["TIMEOUT", "timeout"],
    ["CANCEL", "cancelled"],
  ])],
  ["running", new Map([
    ["COMPLETE", "completed"],
    ["FAIL", "failed"],
    ["TIMEOUT", "timeout"],
    ["BLOCK", "blocked"],
  ])],
  ["blocked", new Map([
    ["UNBLOCK", "dispatched"],
    ["TIMEOUT", "timeout"],
    ["CANCEL", "cancelled"],
  ])],
  // Terminal states — no transitions
  ["completed", new Map()],
  ["failed", new Map()],
  ["timeout", new Map()],
  ["cancelled", new Map()],
]);

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Transition from `state` via `event` → new state.
 *
 * Throws on invalid transitions (including from terminal states).
 * Always call `canTransition` first if you want a soft check.
 */
export function transition(state: DelegationState, event: DelegationEvent): DelegationState {
  const stateTransitions = transitions.get(state);

  if (!stateTransitions || stateTransitions.size === 0) {
    throw new Error(
      `INVALID_STATE_TRANSITION: state '${state}' is terminal — no transitions allowed`
    );
  }

  const next = stateTransitions.get(event);

  if (!next) {
    const allowed = [...stateTransitions.keys()].join(", ");
    throw new Error(
      `INVALID_STATE_TRANSITION: cannot transition from '${state}' via '${event}'. ` +
        `Allowed events: [${allowed}]`
    );
  }

  return next;
}

/**
 * Check if a transition is valid without throwing.
 * Returns the target state or null if invalid.
 */
export function canTransition(
  state: DelegationState,
  event: DelegationEvent
): DelegationState | null {
  try {
    return transition(state, event);
  } catch {
    return null;
  }
}

/**
 * Returns true if the state is terminal (no further transitions).
 */
export function isTerminal(state: DelegationState): boolean {
  return TERMINAL_STATES.has(state);
}

/**
 * Returns the list of valid events for a given state.
 * Empty array for terminal states.
 */
export function allowedEvents(state: DelegationState): DelegationEvent[] {
  const stateTransitions = transitions.get(state);
  if (!stateTransitions) return [];
  return [...stateTransitions.keys()];
}

/**
 * Return the full transition table for debug/observability.
 */
export function getTransitionTable(): Record<string, string[]> {
  const table: Record<string, string[]> = {};
  for (const [state, events] of transitions.entries()) {
    const entries: string[] = [];
    for (const [event, target] of events.entries()) {
      entries.push(`${event} → ${target}`);
    }
    table[state] = entries;
  }
  return table;
}

/**
 * Validate that the transition matrix matches the spec.
 * Returns array of missing transitions (empty = valid).
 * Used by tests for self-validation.
 */
export function validateTransitionMatrix(): string[] {
  const errors: string[] = [];

  // Expected transitions from spec §5.4
  const expected: Array<[DelegationState, DelegationEvent, DelegationState]> = [
    ["pending", "VALIDATE_PASS", "dispatched"],
    ["pending", "VALIDATE_FAIL", "failed"],
    ["pending", "CANCEL", "cancelled"],
    ["dispatched", "RUNNING", "running"],
    ["dispatched", "DISPATCH_FAIL", "failed"],
    ["dispatched", "TIMEOUT", "timeout"],
    ["dispatched", "CANCEL", "cancelled"],
    ["running", "COMPLETE", "completed"],
    ["running", "FAIL", "failed"],
    ["running", "TIMEOUT", "timeout"],
    ["running", "BLOCK", "blocked"],
    ["blocked", "UNBLOCK", "dispatched"],
    ["blocked", "TIMEOUT", "timeout"],
    ["blocked", "CANCEL", "cancelled"],
  ];

  for (const [from, event, expectedTo] of expected) {
    const stateTransitions = transitions.get(from);
    if (!stateTransitions) {
      errors.push(`Missing state: ${from}`);
      continue;
    }
    const actualTo = stateTransitions.get(event);
    if (!actualTo) {
      errors.push(`Missing transition: ${from} + ${event} → ${expectedTo}`);
    } else if (actualTo !== expectedTo) {
      errors.push(`Wrong target: ${from} + ${event} → ${actualTo} (expected ${expectedTo})`);
    }
  }

  // Verify all terminal states have empty transition maps
  for (const terminal of TERMINAL_STATES) {
    const stateTransitions = transitions.get(terminal);
    if (stateTransitions && stateTransitions.size > 0) {
      errors.push(`Terminal state '${terminal}' has non-empty transitions: ${[...stateTransitions.keys()].join(", ")}`);
    }
  }

  return errors;
}
