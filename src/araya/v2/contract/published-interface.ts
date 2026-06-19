// ARAYA v2.0 — AX Published-Interface Overlay (Slice 7), per Accepted ADR-0012.
//
// A published interface is an ADR-0010 boundary of `kind: published-interface`
// (logical/declared, never path-derived). Its PROMISED surface is the prescriptive
// layer; its version is pinned in frontmatter (MAJOR.REVISION.HOTFIX, ADR-0012
// §3.1). A BREAKING CHANGE is detected STRUCTURALLY (§3.2 Option A): compare the
// OBSERVED surface (read from source the Slice-6 way, surface.ts) against the
// PROMISED surface. A removed/changed promised member is a break; a purely added
// member is non-breaking. The semantic type-diff (Option B) is deferred.
//
// BUILT-BUT-NOT-ARMED (§1.1 premise): a detected break is the signal that WOULD
// trip the ADR-0008 public-contract zero-tolerance strike — but the strike stays
// behind the default-off flag below. This module DETECTS; it never strikes.

import { readFileSync } from "node:fs";
import { BoundaryResolver, loadContract, DESCRIPTIVE_BEGIN, DESCRIPTIVE_END } from "./contract";
import { observeSurface } from "./surface";

/** The boundary kind that marks the published-interface overlay. */
export const PUBLISHED_INTERFACE_KIND = "published-interface";

/**
 * Built-but-NOT-armed (ADR-0012 §1.1, the Professor's premise). The public-contract
 * zero-tolerance strike (ADR-0008) is gated behind this flag, which DEFAULTS OFF —
 * joining the four other deferred teeth that converge on one future "enable
 * enforcement" decision. Detection is built and proven; nothing strikes while off.
 */
export const PUBLIC_CONTRACT_STRIKE_ARMED = false;

export interface BreakingChange {
  /** Promised members absent from the observed surface — backward-incompatible. */
  removed: string[];
  /** Observed members not promised — additive, non-breaking (a REVISION bump). */
  added: string[];
  /** True iff any promised member was removed/changed (a public-contract break). */
  breaking: boolean;
}

export interface InterfaceCheck extends BreakingChange {
  boundary: string;
  version?: string;
  promised: string[];
  observed: string[];
  /** Always false in this slice: detection never fires the strike (built-not-armed). */
  struckLive: boolean;
}

/** Parse the promised surface from a fenced ```surface block in the prescriptive layer. */
export function parsePromisedSurface(prescriptive: string): string[] {
  const m = prescriptive.match(/```surface\s*\n([\s\S]*?)```/);
  if (!m) return [];
  return m[1].split("\n").map(l => l.trim()).filter(Boolean).sort();
}

/** Structural breaking-change detection: promised vs observed (order-independent). */
export function detectBreakingChange(promised: string[], observed: string[]): BreakingChange {
  const obs = new Set(observed);
  const prom = new Set(promised);
  const removed = promised.filter(p => !obs.has(p));
  const added = observed.filter(o => !prom.has(o));
  return { removed, added, breaking: removed.length > 0 };
}

/**
 * Check a published-interface boundary: load its contract, observe its declared
 * source surface, and detect breaking changes against the promised surface.
 * Pure detection — no strike, no ledger write (built-but-not-armed).
 *
 * @param observedSourceOverride optional absolute path to observe instead of the
 *   declared interface_source (used by tests/harness to point at a mutated copy).
 */
export function checkPublishedInterface(
  boundaryId: string,
  resolver: BoundaryResolver,
  observedSourceOverride?: string
): InterfaceCheck {
  const contract = loadContract(boundaryId, resolver);
  if (!contract) throw new Error(`no contract for boundary ${boundaryId}`);
  if (contract.frontmatter.kind !== PUBLISHED_INTERFACE_KIND) {
    throw new Error(`boundary ${boundaryId} is not kind: ${PUBLISHED_INTERFACE_KIND}`);
  }
  const src = observedSourceOverride
    ?? resolver.resolveFromBase(contract.frontmatter.interfaceSource ?? "");
  const promised = parsePromisedSurface(contract.prescriptive);
  const observed = observeSurface(src);
  const delta = detectBreakingChange(promised, observed);
  return {
    boundary: boundaryId,
    version: contract.frontmatter.interfaceVersion,
    promised,
    observed,
    ...delta,
    struckLive: false, // built-but-not-armed: detection never strikes (ADR-0012 §1.1)
  };
}

/**
 * Render the observed surface as the descriptive body for a published-interface
 * contract. Reuses the Slice-6 marker splice (the caller writes it), so the
 * authored prescriptive promised-surface is never touched.
 */
export function renderInterfaceDescriptive(boundaryId: string, version: string | undefined, observed: string[]): string {
  const head = `_Observed surface of \`${boundaryId}\`${version ? ` @ ${version}` : ""} — generated, do not edit._`;
  return [head, "", ...observed.map(m => `- \`${m}\``)].join("\n");
}

export { DESCRIPTIVE_BEGIN, DESCRIPTIVE_END };
