// ARAYA v2.0 — Score Ledger (AX Slice 2)
// An append-only NDJSON record of the moves that units played: one JSON object
// per line, never edited or deleted (corrections are new entries). This is the
// score ledger of the two-ledger model; the arbiter ledger and strike
// accounting are a later slice and are NOT implemented here.
//
// Governance-location-agnostic by contract: the ledger path is a value supplied
// by the caller and resolved per-environment at runtime. This module hardcodes
// no absolute path and contains no knowledge of which repository the path
// resolves into — it sees only a relative-or-configured string.

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * One move played by a closed unit. Identity and disposition fields are the
 * authoritative columns; the rest ground the entry in the governing contracts.
 */
export interface ScoreEntry {
  /** ISO-8601 instant the move was recorded (supplied by the caller). */
  timestamp: string;
  /** The spec / objective the unit serves. */
  spec: string;
  /** The slice the unit belongs to (e.g. "slice-2"). */
  slice: string;
  /** Stable unit identifier. */
  unit: string;
  /** The typed disposition that was played (one of the eight). */
  disposition: string;
  /** Identity that produced the deliverable. */
  producer: string;
  /** Independent identity that emitted the binding disposition. */
  emitter: string;
  /** Governing ADR ids for the move. */
  adr_ids: string[];
  /** Governing AX contract ids, if any. */
  contract_ids: string[];
  /** Commit the move is anchored to. */
  commit: string;
  /** Skills exercised by the unit. */
  skillset: string[];
  /** Pointer to the attached evidence (the entry references, not embeds, it). */
  evidence_ref: string;
}

export class ScoreLedger {
  /**
   * @param path Configured ledger path — relative or absolute — resolved per
   *   environment by the caller. No default herein points at any specific
   *   repository; the caller owns where this lands.
   */
  constructor(private readonly path: string) {
    if (!path) throw new Error("ScoreLedger requires a configured path");
  }

  /** Append exactly one move as one NDJSON line. Never rewrites prior lines. */
  append(entry: ScoreEntry): void {
    const dir = dirname(this.path);
    if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
    appendFileSync(this.path, JSON.stringify(entry) + "\n", "utf-8");
  }

  /** Read every recorded move (for verification / audit). */
  readAll(): ScoreEntry[] {
    if (!existsSync(this.path)) return [];
    return readFileSync(this.path, "utf-8")
      .split("\n")
      .filter(line => line.trim().length > 0)
      .map(line => JSON.parse(line) as ScoreEntry);
  }
}

/**
 * Resolve the ledger path for the current environment. Reads an optional
 * configured override, otherwise falls back to a repository-relative path. The
 * fallback is deliberately relative — where it resolves is decided by the
 * process's working directory, not by this code.
 */
export function resolveScoreLedgerPath(env: NodeJS.ProcessEnv = process.env): string {
  return env.ARAYA_SCORE_LEDGER_PATH || ".araya/ax/ledger/score.ndjson";
}
