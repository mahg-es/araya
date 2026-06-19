// ARAYA v2.0 — AX Contract Tree: the gate seam (Slice 6, SHAPE ONLY).
//
// Per Accepted ADR-0010 §3.5. A boundary's prescriptive rules must be EXPRESSIBLE
// as inputs to the existing gates — reusing the DoR machine-gate shape (ADR-0009)
// and/or Robot certification suites (ADR-0005), with NO parallel disposition or
// ledger path. This slice wires NOTHING into live enforcement: the functions
// below produce gate-shaped descriptors and nothing calls them in any execution
// path. Live contract enforcement is deferred to the shared live-enforcement slice.

import type { MachineGate } from "../engines/definition-of-ready-gate";
import type { PrescriptiveRule } from "./walk-chain";

/**
 * Express a boundary's inherited prescriptive rules as DoR machine-gate
 * descriptors (ADR-0009 shape). This DEMONSTRATES the seam — the descriptors are
 * returned to the caller, never registered into the DoR gate or any live loop.
 *
 * @param checker a pure predicate the caller supplies per rule (e.g. a Robot
 *   suite result, a grep). Absent (the default), the descriptor reports the rule
 *   as unevaluated — proving expressibility without asserting enforcement.
 */
export function prescriptiveAsReadinessGates(
  rules: PrescriptiveRule[],
  checker?: (rule: PrescriptiveRule) => { passed: boolean; evidence: string }
): MachineGate[] {
  return rules.map((rule, i) => ({
    id: `contract:${rule.boundary}#${i}`,
    kind: "machine" as const,
    evaluate() {
      if (checker) return checker(rule);
      return {
        passed: false,
        evidence: `prescriptive rule from ${rule.boundary} not yet wired to a check (no live enforcement, ADR-0010 §3.5)`,
      };
    },
  }));
}
