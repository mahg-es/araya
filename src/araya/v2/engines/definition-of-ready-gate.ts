// ARAYA v2.0 — Definition of Ready, as an advisory engine gate (AX Slice 5).
//
// Per Accepted ADR-0009. The DoR is the hand-run readiness pattern turned into a
// gate: it evaluates a slice's readiness gates and emits a typed disposition.
//
//   §3.1  A readiness gate is a NAMED PREDICATE yielding { passed, evidence }, and
//         declares its kind — `machine` (the engine evaluates it) or `human`
//         (only a person can rule it).
//   §3.2  REUSE, NOT REINVENTION — it emits through the existing DispositionEngine
//         and records via the existing ScoreLedger. No parallel disposition type,
//         no parallel ledger path.
//   §3.3  ADVISORY, NOT BLOCKING — it records a verdict and RETURNS it. Nothing
//         here halts, aborts, or gates slice start.
//   §3.4  MACHINE vs HUMAN — machine gates are real predicates; human-judgment
//         gates carry a ruled/unruled input supplied by a human, never
//         self-evaluated by the engine.
//   §4    THE LOAD-BEARING RULE — emit SUCCESS only when every machine gate passes
//         AND every human-judgment gate was actually ruled `pass` by a human. When
//         any human gate is unruled, emit ASK. The engine never emits SUCCESS by
//         counting only the gates it could check (producer-not-emitter applied to
//         the DoR). Reuses the existing ASK disposition; adds no new type.

import type { Disposition, DispositionEngine, Unit, MoveContext, EmitResult } from "./disposition";

export type GateKind = "machine" | "human";
export type HumanRuling = "pass" | "fail" | "unruled";

/** The outcome of one readiness gate. */
export interface ReadinessGateResult {
  id: string;
  kind: GateKind;
  passed: boolean;
  /** Present for human gates only. */
  ruling?: HumanRuling;
  /** Human gates: the identity that ruled it; absent when unruled. */
  ruledBy?: string;
  evidence: string;
}

/** A machine gate is a predicate the engine evaluates itself. */
export interface MachineGate {
  id: string;
  kind: "machine";
  /** Pure predicate; returns the boolean plus the evidence it rests on. */
  evaluate(): { passed: boolean; evidence: string };
}

/**
 * A human-judgment gate: ruled (or not) by a human, NEVER self-evaluated by the
 * engine. The engine only reads the ruling the human supplied.
 */
export interface HumanGate {
  id: string;
  kind: "human";
  ruling: HumanRuling;
  /** Required (non-empty) when ruling !== "unruled". */
  ruledBy?: string;
  evidence: string;
}

export type ReadinessGate = MachineGate | HumanGate;

export interface DorInput {
  /** Stable unit id for the slice whose readiness is assessed (e.g. "slice-5"). */
  unitId: string;
  /** The identity that produces the readiness assessment (never the SUCCESS emitter). */
  producer: string;
  gates: ReadinessGate[];
  /** Ledger columns for the recorded move (governance metadata + evidence_ref). */
  move: MoveContext;
}

export interface DorOutcome {
  unitId: string;
  /** The proposed disposition — never SUCCESS unless §4 holds. */
  proposed: Disposition;
  /** Whether the binding move was emitted+recorded (false e.g. when a SUCCESS
   *  awaits an independent emitter). */
  emitted: boolean;
  /** True when a legitimate SUCCESS could not be self-emitted and awaits an
   *  independent emitter (the live-loop deferral pattern). */
  pendingIndependentEmitter: boolean;
  results: ReadinessGateResult[];
  rejection?: EmitResult["rejection"];
  summary: string;
}

export class DefinitionOfReadyGate {
  /** Reuse, not reinvention: the SAME disposition engine the live exit uses. */
  constructor(private readonly disposition: DispositionEngine) {}

  /**
   * Evaluate a slice's DoR and emit a typed disposition. ADVISORY: this records
   * and returns; it never halts. Recording is done by DispositionEngine.emit via
   * the existing ScoreLedger — no parallel path.
   */
  evaluate(input: DorInput): DorOutcome {
    const results: ReadinessGateResult[] = input.gates.map(g =>
      g.kind === "machine" ? this.evalMachine(g) : this.readHuman(g)
    );

    const machine = results.filter(r => r.kind === "machine");
    const human = results.filter(r => r.kind === "human");

    const anyMachineFail = machine.some(r => !r.passed);
    const anyHumanUnruled = human.some(r => r.ruling === "unruled");
    const anyHumanFail = human.some(r => r.ruling === "fail");

    const unit: Unit = {
      unit: input.unitId,
      declaredGates: results.map(r => r.id),
      producer: input.producer,
    };

    // §4 composition. The ONLY path to a success disposition is: every machine
    // gate passed AND every human gate ruled "pass". Everything else is a
    // non-success exit; the engine never reaches SUCCESS by checking only
    // machine gates.
    let proposed: Disposition;
    let emitter: string;
    if (anyMachineFail) {
      proposed = "FIX";                       // a concrete, evidenced readiness defect
      emitter = input.producer;
    } else if (anyHumanUnruled) {
      proposed = "ASK";                       // THE load-bearing rule: no human ruling -> ASK
      emitter = input.producer;
    } else if (anyHumanFail) {
      proposed = "FIX";                       // a human ruled the slice not ready
      emitter = input.producer;
    } else {
      proposed = this.disposition.legalSuccessFor(unit);   // SUCCESS (multi-gate) / PASS (single)
      emitter = this.independentEmitter(human, input.producer);  // the human who ruled (not the producer)
    }

    const result = this.disposition.emit(unit, proposed, emitter, input.move);

    // SUCCESS the producer may not self-emit defers to an independent emitter —
    // the same seam the live loop uses; no fabricated emitter, no auto-SUCCESS.
    const pendingIndependentEmitter =
      !result.ok && result.rejection?.kind === "producer-is-emitter";

    const summary =
      `DoR ${input.unitId}: ${proposed}` +
      (result.ok ? " (emitted+recorded)" : pendingIndependentEmitter
        ? " (success awaits independent emitter)"
        : ` (rejected: ${result.rejection?.kind})`) +
      ` — machine ${machine.filter(r => r.passed).length}/${machine.length} pass, ` +
      `human ${human.filter(r => r.ruling === "pass").length}/${human.length} ruled-pass, ` +
      `${human.filter(r => r.ruling === "unruled").length} unruled`;

    return {
      unitId: input.unitId,
      proposed,
      emitted: result.ok,
      pendingIndependentEmitter,
      results,
      rejection: result.rejection,
      summary,
    };
  }

  private evalMachine(g: MachineGate): ReadinessGateResult {
    const { passed, evidence } = g.evaluate();
    return { id: g.id, kind: "machine", passed, evidence };
  }

  private readHuman(g: HumanGate): ReadinessGateResult {
    // The engine NEVER decides a human gate — it only reads the supplied ruling.
    // A pass/fail without a named human ruler is not a human ruling: it collapses
    // to "unruled", so the load-bearing rule can't be bypassed by a ruler-less pass.
    const ruling: HumanRuling = g.ruling !== "unruled" && !!g.ruledBy ? g.ruling : "unruled";
    return {
      id: g.id,
      kind: "human",
      passed: ruling === "pass",
      ruling,
      ruledBy: ruling !== "unruled" ? g.ruledBy : undefined,
      evidence: g.evidence,
    };
  }

  /**
   * The independent emitter of a binding SUCCESS is the human who ruled the
   * judgment gates — never the producer (ADR-0004 / ADR-0009 §4). If no human
   * ruled (a DoR with no human gates), this returns the producer, so emit()'s
   * own producer-is-emitter check defers the SUCCESS rather than self-certifying.
   */
  private independentEmitter(human: ReadinessGateResult[], producer: string): string {
    const rulers = Array.from(new Set(human.map(r => r.ruledBy).filter((x): x is string => !!x)));
    return rulers[0] ?? producer;
  }
}
