// ARAYA v2.0 — API-contract certification adapter, AX Slice 7.
//
// Per Accepted ADR-0012 §3.3, this is the THIRD adapter of the ADR-0005
// one-engine certification gate — alongside CLI/TUI (Adapter 1) and Browser
// (Adapter 2). It builds the RobotInvocation that drives a published interface's
// CONTRACT suite, asserting the promised surface still holds. The reusable
// CertificationGate core executes and parses it; this adapter only describes the
// target. No parallel certification path.
//
// For araya's in-process TS interface the suite drives a thin contract harness via
// Robot's Process library (as the CLI/TUI adapter does); for a networked boundary
// the same adapter shape would supply a base URL for RequestsLibrary.

import { resolve } from "node:path";
import type { RobotInvocation } from "../certification-gate";

export interface ApiContractTarget {
  /** Absolute path to the .robot contract suite. */
  suite: string;
  /** Absolute ARAYA root containing the built harness (dist/). */
  arayaRoot: string;
  /** Logical boundary id of the published interface under test. */
  boundaryId: string;
  /** Absolute path to the boundary manifest the harness resolves with. */
  manifestPath: string;
  /** Absolute path to the source surface to observe (override; e.g. a mutated
   *  copy for the break proof). Empty → the harness uses the declared source. */
  observedSource?: string;
  /** Optional dir to prepend to PATH (the Node 20 bin) for the robot process. */
  nodeBinDir?: string;
}

/**
 * Build the Robot invocation for an API-contract target. The suite receives:
 *   ${CLI_DIST}        absolute path to the dir containing the compiled harness
 *   ${BOUNDARY}        the logical published-interface boundary id
 *   ${MANIFEST}        absolute path to the boundary manifest
 *   ${OBSERVED_SOURCE} absolute path to observe (or "" for the declared source)
 */
export function apiContractInvocation(target: ApiContractTarget): RobotInvocation {
  const cliDist = resolve(target.arayaRoot, "dist");
  const env: Record<string, string> = {};
  if (target.nodeBinDir) {
    env.PATH = `${target.nodeBinDir}:${process.env.PATH ?? ""}`;
  }
  return {
    suite: target.suite,
    variables: {
      CLI_DIST: cliDist,
      BOUNDARY: target.boundaryId,
      MANIFEST: target.manifestPath,
      OBSERVED_SOURCE: target.observedSource ?? "",
    },
    env,
  };
}
