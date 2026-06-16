// ARAYA v2.0 — The Verifier: the governed independent emitter (AX Slice 8).
//
// Per Accepted ADR-0011. The verifier is a governed agent (`daneel`, the Reality
// Authority) declared in araya.yaml as non-producing (can_write_code:false), so
// it can never be a unit's producer. It is the INDEPENDENT EMITTER that fills the
// awaitIndependentEmitter seam: when a producer self-proposes its own success
// (structurally refused upstream by emit()'s producer-is-emitter check), the
// engine routes the proposal here, and the verifier emits the binding disposition
// under its OWN roster identity. That makes producer-not-emitter a MACHINE
// guarantee, not a protocol courtesy.
//
// THE HONESTY CONSTRAINT (§4, the heart of this slice): the verifier reads the
// attached executable evidence and emits a success ONLY if that evidence
// substantiates it. No evidence -> no success. A renamed re-emission of the
// producer's claim is theatre and is forbidden. (Option B — the verifier
// re-executing the tests itself — is deferred; this slice reads the evidence.)

import type { Disposition, DispositionEngine, Unit, MoveContext, EmitResult } from "./disposition";

/** The governed verifier's roster identity (ADR-0011 §3). */
export const VERIFIER_IDENTITY = "daneel";

/**
 * Built-but-NOT-armed (ADR-0011 §6). Live zero-tolerance producer-is-emitter
 * striking is gated behind this flag, which DEFAULTS OFF. Arming it is a separate,
 * deliberate "enable enforcement" decision, made after the emitter is proven —
 * NOT taken in this slice. Nothing in the live loop strikes while this is false.
 */
export const PRODUCER_IS_EMITTER_STRIKE_ARMED = false;

/** Machine-readable, model-free evidence the producer attached (ADR-0011 §4). */
export interface VerificationEvidence {
  /** Certification gate result (ADR-0005): output.xml counts + robot exit code. */
  certification?: { passed: number; failed: number; exitCode: number };
  /** DoR / readiness gate recorded verdict (ADR-0009). */
  dorVerdict?: { disposition: string };
  /** Test-suite result. */
  tests?: { run: number; passed: boolean };
}

export interface VerificationResult {
  /** Did attached evidence substantiate the proposed success? */
  verified: boolean;
  /** Was a binding move emitted + recorded? */
  emitted: boolean;
  /** The identity that emitted (the verifier). */
  emitter: string;
  /** What was emitted: the proposed success when verified, else a non-success. */
  disposition: Disposition;
  rejection?: EmitResult["rejection"];
}

export class Verifier {
  /** Reuse, not reinvention: the SAME disposition engine the live exit uses. */
  constructor(
    private readonly disposition: DispositionEngine,
    private readonly identity: string = VERIFIER_IDENTITY
  ) {}

  /** The verifier's roster identity (the emitter on its moves). */
  get id(): string {
    return this.identity;
  }

  /**
   * True ONLY when concrete machine evidence shows a pass (ADR-0011 §4). An
   * absent or unsubstantiated evidence object is false — the producer's assertion
   * is never itself evidence.
   */
  substantiatesSuccess(ev?: VerificationEvidence): boolean {
    if (!ev) return false;
    const c = ev.certification;
    if (c && c.failed === 0 && c.exitCode === 0 && c.passed > 0) return true;
    if (ev.dorVerdict && (ev.dorVerdict.disposition === "SUCCESS" || ev.dorVerdict.disposition === "PASS")) return true;
    if (ev.tests && ev.tests.run > 0 && ev.tests.passed) return true;
    return false;
  }

  /**
   * Emit the binding disposition under the verifier's own identity, gated on a
   * real reading of the evidence. The producer never reaches here — it is
   * refused upstream by emit()'s producer-is-emitter check (the machine guarantee).
   *
   * - A success the evidence substantiates is emitted as proposed.
   * - A success with NO substantiating evidence is REFUSED: a non-success (ASK)
   *   is emitted instead. No evidence -> no success.
   * - A non-success proposal is emitted as-is (a verifier may record a defect).
   */
  emit(unit: Unit, proposed: Disposition, move: MoveContext, evidence?: VerificationEvidence): VerificationResult {
    if (this.disposition.isSuccess(proposed) && !this.substantiatesSuccess(evidence)) {
      const r = this.disposition.emit(unit, "ASK", this.identity, {
        ...move,
        evidence_ref: `${move.evidence_ref} | verifier(${this.identity}) REFUSED ${proposed}: no substantiating executable evidence (ADR-0011 §4)`,
      });
      return { verified: false, emitted: r.ok, emitter: this.identity, disposition: "ASK", rejection: r.rejection };
    }
    const r = this.disposition.emit(unit, proposed, this.identity, {
      ...move,
      evidence_ref: `${move.evidence_ref} | verifier(${this.identity}) emitted ${proposed}: evidence substantiates (ADR-0011 §4)`,
    });
    return { verified: this.disposition.isSuccess(proposed), emitted: r.ok, emitter: this.identity, disposition: proposed, rejection: r.rejection };
  }
}
