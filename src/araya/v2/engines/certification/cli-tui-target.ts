// ARAYA v2.0 — CLI/TUI certification adapter, AX Slice 4.
//
// Per ADR-0005 (hybrid amendment), Adapter 1 of the one-engine/two-adapter
// certification gate. It builds the RobotInvocation that drives an araya
// CLI/TUI command via Robot's Process / OperatingSystem libraries, asserting on
// the command's real output and exit code. The reusable CertificationGate core
// executes and parses it; this adapter only describes the target.
//
// Adapter 2 — Browser Library on Node 20 — is deferred to a real web target and
// is intentionally NOT built in this slice.

import { resolve } from "node:path";
import type { RobotInvocation } from "../certification-gate";

export interface CliTuiTarget {
  /** Absolute path to the .robot suite certifying the command's behavior. */
  suite: string;
  /** Absolute ARAYA root containing the built CLI (dist/) under test. */
  arayaRoot: string;
  /** Working directory the command runs in (the environment under test). */
  targetCwd: string;
  /** Optional directory to prepend to PATH (e.g. the Node 20 bin) for the
   *  robot process, so the CLI it spawns runs on the pinned runtime. */
  nodeBinDir?: string;
}

/**
 * Build the Robot invocation for a CLI/TUI target. The suite receives:
 *   ${CLI_DIST}    absolute path to the dir containing cli.js
 *   ${TARGET_CWD}  absolute path to the working directory under test
 */
export function cliTuiInvocation(target: CliTuiTarget): RobotInvocation {
  const cliDist = resolve(target.arayaRoot, "dist");
  const env: Record<string, string> = {};
  if (target.nodeBinDir) {
    env.PATH = `${target.nodeBinDir}:${process.env.PATH ?? ""}`;
  }
  return {
    suite: target.suite,
    variables: {
      CLI_DIST: cliDist,
      TARGET_CWD: target.targetCwd,
    },
    env,
  };
}
