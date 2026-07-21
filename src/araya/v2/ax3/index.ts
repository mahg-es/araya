// ARAYA v2 — AX3: Preflight / Postflight hooks
//
// Preflight: load AX3 chain before editing target paths.
// Postflight: update AX3 chain after meaningful changes.

import { findProjectRoot, resolveAx3Chain } from "./resolver";
import { reconcile } from "./reconciler";
import type { Ax3Chain, Ax3ReconcileResult } from "./types";

/**
 * Preflight: resolve the AX3 chain for the given target paths.
 * Returns the chain an agent must read before editing.
 *
 * This is the function agents call before modifying files.
 */
export function preflight(targetPaths: string[], projectRoot?: string): Ax3Chain {
  const root = projectRoot ?? findProjectRoot();
  return resolveAx3Chain(root, targetPaths);
}

/**
 * Postflight: reconcile the AX3 tree after meaningful changes.
 * Should be called after edits that affect purpose, scope, structure,
 * contracts, workflows, ownership, or AX3.md creation/deletion/move.
 *
 * @param scope - Optional scope to reconcile (defaults to whole project)
 * @param dryRun - If true, only report changes without writing
 */
export function postflight(
  scope?: string,
  dryRun: boolean = false,
  projectRoot?: string
): Ax3ReconcileResult {
  const root = projectRoot ?? findProjectRoot();
  return reconcile(root, scope, dryRun, false);
}

export { findProjectRoot, findRootAx3, parseAx3, loadAx3, resolveAx3Chain, walkDirs } from "./resolver";
export { reconcile, check, dryRun } from "./reconciler";
export * from "./types";
