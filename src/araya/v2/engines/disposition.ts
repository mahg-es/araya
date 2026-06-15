// ARAYA v2.0 — Disposition State Machine (AX Slice 2)
// The single typed exit of a unit of work. A unit may end only via one of the
// eight typed dispositions; "done" is never implicit. Success is determined by
// the shape of the unit, not chosen by the producer, and the producer of a
// deliverable may not emit its own binding success disposition.
//
// Each legal move is recorded to the score ledger. Illegal transitions are
// detected and rejected, but NO strike is recorded and NO arbiter ledger is
// written — strike accounting is a later slice and attaches at the
// recordIllegalTransition() seam below.

import type { ScoreLedger, ScoreEntry } from "../ledger/score-ledger";

/** The eight typed dispositions — the only ways a unit may exit. */
export type Disposition =
  | "PASS"
  | "SUCCESS"
  | "STOP"
  | "ASK"
  | "FIX"
  | "ESCALATE"
  | "BLOCK"
  | "AUDIT";

export const DISPOSITIONS: ReadonlyArray<Disposition> = [
  "PASS",
  "SUCCESS",
  "STOP",
  "ASK",
  "FIX",
  "ESCALATE",
  "BLOCK",
  "AUDIT",
];

/** A unit of work presented for exit. Its shape fixes its legal success. */
export interface Unit {
  /** Stable unit identifier (e.g. "ax-slice-2"). */
  unit: string;
  /** The gates the unit declared up front. */
  declaredGates: string[];
  /** The identity that produced the unit's deliverable. */
  producer: string;
}

/** The non-identity columns of a score entry; emit() fills in the rest. */
export type MoveContext = Omit<ScoreEntry, "unit" | "disposition" | "producer" | "emitter">;

export interface EmitResult {
  ok: boolean;
  disposition: Disposition | null;
  /** Present only when ok === false. */
  rejection?: {
    kind: "illegal-transition" | "producer-is-emitter";
    reason: string;
  };
}

export class DispositionEngine {
  constructor(private readonly ledger?: ScoreLedger) {}

  /** PASS and SUCCESS are the two success dispositions. */
  isSuccess(d: Disposition): boolean {
    return d === "PASS" || d === "SUCCESS";
  }

  /**
   * Success is determined by the shape of the unit: a single declared gate may
   * only PASS; more than one declared gate composing one objective may only
   * SUCCESS.
   */
  legalSuccessFor(unit: Unit): Disposition {
    return unit.declaredGates.length === 1 ? "PASS" : "SUCCESS";
  }

  /**
   * Emit a typed disposition for a unit. The producer *proposes*; an
   * independent verifier *emits*. A legal move is appended to the score ledger.
   *
   * A success disposition is rejected (not emitted, not recorded) when:
   *  - it is not the legal success for the unit's shape (e.g. PASS proposed on
   *    a multi-gate unit) — an illegal transition; or
   *  - the emitter is the producer — self-certification is forbidden.
   *
   * Non-success dispositions (STOP/ASK/FIX/ESCALATE/BLOCK/AUDIT) are legal at
   * any shape and are not identity-gated: a producer may flag a defect in its
   * own work.
   */
  emit(unit: Unit, proposed: Disposition, emitter: string, move?: MoveContext): EmitResult {
    if (this.isSuccess(proposed)) {
      const legal = this.legalSuccessFor(unit);
      if (proposed !== legal) {
        const reason =
          `${proposed} is not the legal success for a unit with ` +
          `${unit.declaredGates.length} declared gate(s); only ${legal} is.`;
        this.recordIllegalTransition(unit, proposed, emitter, reason);
        return { ok: false, disposition: null, rejection: { kind: "illegal-transition", reason } };
      }
      if (emitter === unit.producer) {
        const reason =
          `producer '${unit.producer}' may not emit its own success disposition; ` +
          `an independent emitter is required.`;
        this.recordIllegalTransition(unit, proposed, emitter, reason);
        return { ok: false, disposition: null, rejection: { kind: "producer-is-emitter", reason } };
      }
    }

    // Legal move (a validated success, or any non-success exit) → record it.
    if (this.ledger && move) {
      this.ledger.append({
        ...move,
        unit: unit.unit,
        disposition: proposed,
        producer: unit.producer,
        emitter,
      });
    }

    return { ok: true, disposition: proposed };
  }

  /**
   * Slice-3 seam — INTENTIONALLY a no-op in this slice. Slice 2 detects and
   * rejects illegal transitions (above) but records no strike and writes no
   * arbiter ledger. A later slice implements strike accounting against this
   * hook; the signature is fixed here so that work is a wrapper, not a rewrite.
   */
  private recordIllegalTransition(
    _unit: Unit,
    _proposed: Disposition,
    _emitter: string,
    _reason: string
  ): void {
    /* Strike accounting + arbiter ledger live in a later slice. No-op here. */
  }
}
