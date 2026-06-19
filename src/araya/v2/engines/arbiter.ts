// ARAYA v2.0 — Arbiter Engine (AX Slice 3)
// Turns the disposition machine's recordIllegalTransition seam into real
// strike-counting against the append-only arbiter ledger, per ADR-0008.
//
// Scope (ADR-0008, Option A): this engine OWNS the strike policy and is proven
// adversarially by tests. It is NOT wired into the live ADR-0007 B-2 deferral
// loop — there, producer-is-emitter is the designed deferral on every success,
// not a culpable act, and live producer-is-emitter enforcement is deferred to
// Slice 8 (when a genuine independent emitter makes self-emission culpable).
// Strikes write to the arbiter ledger ONLY, never to the score ledger.

import { ArbiterLedger, resolveArbiterLedgerPath } from "../ledger/arbiter-ledger";
import type { ArbiterEntry, ArbiterAction, Severity, ViolationType } from "../ledger/arbiter-ledger";

/** Per-severity strike budget (ADR-0008 §3(1)). A strike trips on REACHING it. */
export const MAX_STRIKES: Record<Severity, number> = {
  zero_tolerance: 1,
  standard: 3,
  lenient: 5,
};

/** Rerun budget for flaky quarantine (ADR-0008 §3(4)); mirrors max_retries: 2. */
export const FLAKY_RERUN_BUDGET = 2;

/** Sentinel assignee when no different capable identity remains (ADR-0008 §3(5)). */
export const PROTOCOL_HUMAN = "__protocol_human__";

/**
 * Severity of the two disposition illegal transitions (ADR-0008 §3(2) amendment):
 * self-certification is zero-tolerance; a shape error is standard. Resolved from
 * the violation kind, not from an undeclared-gate default.
 */
const DISPOSITION_SEVERITY: Partial<Record<ViolationType, Severity>> = {
  "producer-is-emitter": "zero_tolerance",
  "illegal-transition": "standard",
};

export interface ViolationInput {
  /** Reset boundary the strike is scoped to (runtime ≈ the run). */
  slice: string;
  unit: string;
  /** Offending identity. */
  agent: string;
  gate: string;
  violation_type: ViolationType;
  rule_violated: string;
  evidence_ref?: string;
  /** Explicit severity override; else resolved from kind / resolver / default. */
  severity?: Severity;
}

export interface ArbiterOutcome {
  /** The ledger entry written for this event. */
  recorded: ArbiterEntry;
  /** True when this event struck the identity out (removed from the unit/gate). */
  struckOut: boolean;
}

export class ArbiterEngine {
  private readonly ledger: ArbiterLedger;
  private readonly severityResolver?: (gate: string) => Severity | undefined;
  /** Strike counts keyed `slice::agent::gate` — per agent per slice. */
  private strikes = new Map<string, number>();
  /** Struck-out identities keyed `slice::unit::gate` → set of agents. */
  private struckOut = new Map<string, Set<string>>();

  constructor(opts?: { ledgerPath?: string; severityResolver?: (gate: string) => Severity | undefined }) {
    this.ledger = new ArbiterLedger(opts?.ledgerPath ?? resolveArbiterLedgerPath());
    this.severityResolver = opts?.severityResolver;
  }

  private strikeKey(slice: string, agent: string, gate: string): string {
    return `${slice}::${agent}::${gate}`;
  }
  private removeKey(slice: string, unit: string, gate: string): string {
    return `${slice}::${unit}::${gate}`;
  }

  /**
   * Resolve a gate's severity (ADR-0008 §3): explicit override > disposition
   * violation-kind classification > caller-supplied resolver > default standard.
   */
  severityFor(v: ViolationInput): Severity {
    if (v.severity) return v.severity;
    const byKind = DISPOSITION_SEVERITY[v.violation_type];
    if (byKind) return byKind;
    return this.severityResolver?.(v.gate) ?? "standard";
  }

  maxStrikesFor(severity: Severity): number {
    return MAX_STRIKES[severity];
  }

  /**
   * Record a confirmed (deterministic) violation as a strike. Increments the
   * per-(slice, agent, gate) count; on REACHING max_strikes the agent is struck
   * out (removed from the unit/gate this slice) and the action is
   * ESCALATE-and-remove; otherwise reject-and-return. Writes ONE arbiter line.
   */
  recordViolation(v: ViolationInput): ArbiterOutcome {
    const severity = this.severityFor(v);
    const max = this.maxStrikesFor(severity);
    const key = this.strikeKey(v.slice, v.agent, v.gate);
    const strike_number = (this.strikes.get(key) ?? 0) + 1;
    this.strikes.set(key, strike_number);

    const terminal = strike_number >= max;
    if (terminal) {
      const rk = this.removeKey(v.slice, v.unit, v.gate);
      if (!this.struckOut.has(rk)) this.struckOut.set(rk, new Set());
      this.struckOut.get(rk)!.add(v.agent);
    }
    const action: ArbiterAction = terminal ? "tripped-escalate-and-remove" : "reject-and-return";
    const recorded = this.write(v, severity, max, strike_number, 1, action);
    return { recorded, struckOut: terminal };
  }

  /**
   * Record a test/behavioral gate failure with flaky quarantine (ADR-0008
   * §3(4)). `rerunsPassed` are the pass(true)/fail(false) outcomes of reruns
   * (at most FLAKY_RERUN_BUDGET considered). If any rerun passes within budget →
   * FLAKY → a strike_delta:0 quarantine record and NO strike. Otherwise it is a
   * deterministic failure → a real strike via recordViolation.
   *
   * Disposition illegal transitions are deterministic and must NOT use this path.
   */
  recordGateFailure(v: ViolationInput, rerunsPassed: boolean[]): ArbiterOutcome {
    const flaky = rerunsPassed.slice(0, FLAKY_RERUN_BUDGET).some(passed => passed === true);
    if (!flaky) {
      return this.recordViolation(v);
    }
    // Quarantine: audited but burns NO strike. strike_number is the unchanged
    // current count for this identity+gate.
    const severity = this.severityFor(v);
    const max = this.maxStrikesFor(severity);
    const strike_number = this.strikes.get(this.strikeKey(v.slice, v.agent, v.gate)) ?? 0;
    const recorded = this.write(v, severity, max, strike_number, 0, "quarantined");
    return { recorded, struckOut: false };
  }

  /** Property B: may this identity still attempt this unit/gate in this slice? */
  canAttempt(slice: string, unit: string, gate: string, agent: string): boolean {
    return !(this.struckOut.get(this.removeKey(slice, unit, gate))?.has(agent) ?? false);
  }

  /** Strikes recorded for an identity on a gate within a slice. */
  strikeCount(slice: string, agent: string, gate: string): number {
    return this.strikes.get(this.strikeKey(slice, agent, gate)) ?? 0;
  }

  /**
   * Property B: pick a DIFFERENT capable identity for the reassigned attempt,
   * excluding any struck-out agent (in candidate order). Returns PROTOCOL_HUMAN
   * when no different capable identity remains — never the struck-out agent.
   */
  nextAssignee(slice: string, unit: string, gate: string, candidates: string[]): string {
    for (const candidate of candidates) {
      if (this.canAttempt(slice, unit, gate, candidate)) return candidate;
    }
    return PROTOCOL_HUMAN;
  }

  /** Strikes are scoped per agent per slice; reset clears one slice's state. */
  resetSlice(slice: string): void {
    const prefix = `${slice}::`;
    for (const k of [...this.strikes.keys()]) if (k.startsWith(prefix)) this.strikes.delete(k);
    for (const k of [...this.struckOut.keys()]) if (k.startsWith(prefix)) this.struckOut.delete(k);
  }

  private write(
    v: ViolationInput,
    severity: Severity,
    max: number,
    strike_number: number,
    strike_delta: number,
    action: ArbiterAction
  ): ArbiterEntry {
    const entry: ArbiterEntry = {
      timestamp: new Date().toISOString(),
      slice: v.slice,
      unit: v.unit,
      agent: v.agent,
      gate: v.gate,
      severity,
      violation_type: v.violation_type,
      rule_violated: v.rule_violated,
      strike_number,
      max_strikes: max,
      strike_delta,
      action_taken: action,
      evidence_ref: v.evidence_ref ?? "",
    };
    this.ledger.append(entry);
    return entry;
  }
}
