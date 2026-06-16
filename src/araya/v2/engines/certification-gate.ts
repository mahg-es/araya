// ARAYA v2.0 — Certification Gate (reusable core), AX Slice 4.
//
// Per ADR-0005 (hybrid amendment): the certification mechanism is ONE engine
// with TWO adapters. This file is the library-agnostic core, built once. It
// invokes Robot Framework with an explicit --outputdir, parses the run's exit
// code + the output.xml pass/fail counts, and maps the result to a typed
// disposition by the SHAPE of the unit. The verdict is a parse of attached
// evidence — never a model judgment (ADR-0004 / ADR-0005 §3).
//
// Adapters (CLI/TUI now; Browser deferred to a real web target) supply the
// RobotInvocation. The core never knows which Robot library a suite uses, so the
// same parse-and-map logic certifies a CLI command or a web page unchanged.
//
// This gate records a certification verdict; it performs NO score-ledger writes
// (evidence under .araya/evidence/ is ephemeral; the committed ledger reference
// is the durable record, per ADR-0003 / ADR-0005 §3.2).

import { spawnSync } from "node:child_process";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Disposition } from "./disposition";

/** What an adapter hands the core: a suite plus how to drive it. */
export interface RobotInvocation {
  /** Absolute path to the .robot suite (or suite directory). */
  suite: string;
  /** Robot `--variable NAME:VALUE` pairs supplied by the adapter. */
  variables?: Record<string, string>;
  /** Extra environment for the robot process, merged over process.env. */
  env?: Record<string, string>;
  /** Working directory for the robot process. Suite and evidence paths are
   *  absolute, so the verdict never resolves by cwd (ADR-0005 §5 constraint). */
  cwd?: string;
}

export interface CertificationOptions {
  /** Absolute ARAYA root; the evidence dir resolves relative to it. */
  arayaRoot: string;
  /** Unique run id; evidence lands in <arayaRoot>/.araya/evidence/<runId>/. */
  runId: string;
  /** Declared gates the unit composes (shape): 1 -> PASS, >1 -> SUCCESS. */
  declaredGateCount?: number;
  /** Robot executable. Default "robot" (on PATH). */
  robotBin?: string;
  /** Reruns on failure to detect flakiness. Default 0 -> single deterministic run. */
  maxReruns?: number;
}

export interface CertificationResult {
  /** Proposed disposition; null when quarantined (flaky) — no binding verdict. */
  disposition: Disposition | null;
  /** True when reruns diverged -> flaky -> quarantined; NO strike (ADR-0008 §3(4)). */
  quarantined: boolean;
  passed: number;
  failed: number;
  skipped: number;
  /** Robot process exit code of the binding (first) run. */
  exitCode: number;
  /** Absolute path to the output.xml the verdict was parsed from. */
  outputXml: string;
  /** Absolute evidence directory (the explicit --outputdir). */
  evidenceDir: string;
  summary: string;
}

interface RunOutcome {
  exitCode: number;
  passed: number;
  failed: number;
  skipped: number;
  outputXml: string;
}

export class CertificationGate {
  /**
   * Certify one Robot invocation. Pure evidence parse; no ledger writes.
   * The first run is binding; reruns (if enabled) exist only to detect flakiness.
   */
  certify(invocation: RobotInvocation, opts: CertificationOptions): CertificationResult {
    const evidenceDir = resolve(opts.arayaRoot, ".araya", "evidence", opts.runId);
    if (!existsSync(evidenceDir)) mkdirSync(evidenceDir, { recursive: true });

    const robotBin = opts.robotBin ?? "robot";
    const maxReruns = opts.maxReruns ?? 0;

    const runs: RunOutcome[] = [this.runOnce(robotBin, invocation, evidenceDir, 0)];
    // Rerun only after a failure, so the green path is never slowed.
    for (let i = 1; i <= maxReruns && this.isFail(runs[runs.length - 1]); i++) {
      runs.push(this.runOnce(robotBin, invocation, evidenceDir, i));
    }

    const binding = runs[0];
    const anyPass = runs.some(r => !this.isFail(r));
    const anyFail = runs.some(r => this.isFail(r));
    const flaky = maxReruns > 0 && anyPass && anyFail;

    if (flaky) {
      return {
        disposition: null,
        quarantined: true,
        passed: binding.passed, failed: binding.failed, skipped: binding.skipped,
        exitCode: binding.exitCode, outputXml: binding.outputXml, evidenceDir,
        summary: `QUARANTINE (flaky): ${runs.length} runs diverged — no strike (ADR-0008 §3(4))`,
      };
    }

    const allPass = !this.isFail(binding);
    const successDisposition: Disposition = (opts.declaredGateCount ?? 1) > 1 ? "SUCCESS" : "PASS";
    const disposition: Disposition = allPass ? successDisposition : "FIX";

    return {
      disposition,
      quarantined: false,
      passed: binding.passed, failed: binding.failed, skipped: binding.skipped,
      exitCode: binding.exitCode, outputXml: binding.outputXml, evidenceDir,
      summary: `${disposition}: ${binding.passed} passed, ${binding.failed} failed, ` +
        `${binding.skipped} skipped (robot exit ${binding.exitCode})`,
    };
  }

  /** All-pass requires both a clean exit code AND zero parsed failures. */
  private isFail(r: RunOutcome): boolean {
    return r.exitCode !== 0 || r.failed > 0;
  }

  private runOnce(robotBin: string, inv: RobotInvocation, evidenceDir: string, attempt: number): RunOutcome {
    const outputName = attempt === 0 ? "output.xml" : `output.rerun${attempt}.xml`;
    const args: string[] = ["--outputdir", evidenceDir, "--output", outputName];
    for (const [k, v] of Object.entries(inv.variables ?? {})) {
      args.push("--variable", `${k}:${v}`);
    }
    args.push(inv.suite);

    const proc = spawnSync(robotBin, args, {
      cwd: inv.cwd,
      env: { ...process.env, ...(inv.env ?? {}) },
      encoding: "utf-8",
    });

    const outputXml = resolve(evidenceDir, outputName);
    const counts = this.parseStatistics(outputXml);
    // proc.status is null when the process could not be spawned (e.g. robot
    // missing) — treat as a failed run, never a silent pass.
    return {
      exitCode: proc.status ?? 1,
      passed: counts.pass, failed: counts.fail, skipped: counts.skip,
      outputXml,
    };
  }

  /**
   * Parse the <total> statistics from Robot's output.xml — no XML dependency.
   * Robot writes a single <total> block with one <stat pass=".." fail=".."
   * skip="..">. Attributes are read independently of order. A missing file or
   * stat yields zero counts; combined with a non-zero exit code in isFail(),
   * an unparseable run is treated as a failure, never a pass.
   */
  private parseStatistics(outputXml: string): { pass: number; fail: number; skip: number } {
    if (!existsSync(outputXml)) return { pass: 0, fail: 0, skip: 0 };
    const xml = readFileSync(outputXml, "utf-8");
    const totalBlock = xml.match(/<total>([\s\S]*?)<\/total>/);
    const scope = totalBlock ? totalBlock[1] : xml;
    const statTag = scope.match(/<stat\b[^>]*>/);
    if (!statTag) return { pass: 0, fail: 0, skip: 0 };
    const attr = (name: string): number => {
      const m = statTag[0].match(new RegExp(`\\b${name}="(\\d+)"`));
      return m ? Number(m[1]) : 0;
    };
    return { pass: attr("pass"), fail: attr("fail"), skip: attr("skip") };
  }
}
