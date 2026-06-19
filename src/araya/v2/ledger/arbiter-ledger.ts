// ARAYA v2.0 — Arbiter Ledger (AX Slice 3)
// An append-only NDJSON record of illegal transitions and their strikes — the
// "arbiter's register" of the two-ledger model (ADR-0003). One JSON object per
// line, never edited or deleted (corrections are new entries). Distinct from the
// score ledger: strikes write here ONLY, never to score.ndjson (ADR-0008 §4).
//
// Governance-location-agnostic by contract: the ledger path is a value supplied
// by the caller and resolved per-environment at runtime. This module hardcodes
// no absolute path and contains no knowledge of which repository the path
// resolves into — it sees only a relative-or-configured string.

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

/** The per-gate strike budget classes (ADR-0008 §3(1)). */
export type Severity = "zero_tolerance" | "standard" | "lenient";

/** The kinds of violation a strike records (ADR-0008 §3(5)). */
export type ViolationType = "producer-is-emitter" | "illegal-transition" | "gate-failure";

/** The action the arbiter took for a recorded event (ADR-0008 §3(5), amended). */
export type ArbiterAction = "reject-and-return" | "tripped-escalate-and-remove" | "quarantined";

/**
 * One recorded arbiter event (ADR-0008 §3(5) schema). `strike_delta` is 1 for a
 * counted strike and 0 for a quarantined flaky event, so the register is the
 * single auditable source for both.
 */
export interface ArbiterEntry {
  /** ISO-8601 instant the event was recorded. */
  timestamp: string;
  /** The slice (reset boundary; runtime ≈ the run) the strike is scoped to. */
  slice: string;
  /** The unit the violation occurred in. */
  unit: string;
  /** The offending identity. */
  agent: string;
  /** The gate violated. */
  gate: string;
  /** The gate's severity class. */
  severity: Severity;
  /** Which kind of violation. */
  violation_type: ViolationType;
  /** Human-readable rule that was violated. */
  rule_violated: string;
  /** This identity's strike count on this gate after the event. */
  strike_number: number;
  /** The gate's strike budget. */
  max_strikes: number;
  /** 1 for a counted strike, 0 for a quarantined flaky event. */
  strike_delta: number;
  /** The action taken. */
  action_taken: ArbiterAction;
  /** Pointer to evidence. */
  evidence_ref: string;
}

export class ArbiterLedger {
  /**
   * @param path Configured ledger path — relative or absolute — resolved per
   *   environment by the caller. No default herein points at any specific
   *   repository; the caller owns where this lands.
   */
  constructor(private readonly path: string) {
    if (!path) throw new Error("ArbiterLedger requires a configured path");
  }

  /** Append exactly one event as one NDJSON line. Never rewrites prior lines. */
  append(entry: ArbiterEntry): void {
    const dir = dirname(this.path);
    if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
    appendFileSync(this.path, JSON.stringify(entry) + "\n", "utf-8");
  }

  /** Read every recorded event (for verification / audit). */
  readAll(): ArbiterEntry[] {
    if (!existsSync(this.path)) return [];
    return readFileSync(this.path, "utf-8")
      .split("\n")
      .filter(line => line.trim().length > 0)
      .map(line => JSON.parse(line) as ArbiterEntry);
  }
}

/**
 * Resolve the arbiter ledger path for the current environment. Reads an optional
 * configured override, otherwise falls back to a repository-relative path. The
 * fallback is deliberately relative — where it resolves is decided by the
 * process's working directory, not by this code (mirrors resolveScoreLedgerPath).
 */
export function resolveArbiterLedgerPath(env: NodeJS.ProcessEnv = process.env): string {
  return env.ARAYA_ARBITER_LEDGER_PATH || ".araya/ax/ledger/arbiter.ndjson";
}
