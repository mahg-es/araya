// ARAYA v2.0 — AX Contract Tree: walk-the-chain over the LOGICAL tree (Slice 6).
//
// Per Accepted ADR-0010 §3.3. A unit about to edit a boundary inherits the UNION
// of the prescriptive layers from that boundary up to the root, following the
// explicit `parent:` links — a LOGICAL tree resolved via the manifest, never
// directory nesting. The Constitution is the global floor (ADR-0001): a child
// contract may only TIGHTEN it. Semantic weakening on prose rules is a REPORTABLE
// illegal state (ADR-0001), not auto-enforced here — this slice composes and
// reports; it does not block (no live enforcement, ADR-0010 §3.5).

import { BoundaryResolver, loadContract } from "./contract";

export interface PrescriptiveRule {
  /** The boundary that contributes this rule. */
  boundary: string;
  /** The authored prescriptive text. */
  text: string;
}

export interface ChainResult {
  /** Boundary ids leaf -> ... (root-most authored boundary). */
  chain: string[];
  /** The inherited prescriptive layers, leaf -> root order. */
  prescriptiveUnion: PrescriptiveRule[];
  /** The Constitution floor reference appended to every chain. */
  floor: string;
  /** Declared parent ids with no authored contract yet (honest gaps). */
  unresolved: string[];
}

/**
 * Walk from a leaf boundary up its logical parent chain, composing the union of
 * prescriptive layers and appending the Constitution as the floor.
 *
 * @param constitutionRef a reference to the global floor (e.g. the Constitution
 *   path or logical id). The floor is structural: it terminates every chain.
 */
export function walkChain(
  leafBoundaryId: string,
  resolver: BoundaryResolver,
  constitutionRef: string
): ChainResult {
  const chain: string[] = [];
  const prescriptiveUnion: PrescriptiveRule[] = [];
  const unresolved: string[] = [];
  const seen = new Set<string>();

  let current: string | undefined = leafBoundaryId;
  while (current && !seen.has(current)) {
    seen.add(current);
    const contract = loadContract(current, resolver);
    if (!contract) {
      // A declared boundary whose contract is not yet authored. Recorded as a
      // gap, not a failure — only the pilot boundary is authored in Slice 6.
      unresolved.push(current);
      break;
    }
    chain.push(current);
    if (contract.prescriptive) {
      prescriptiveUnion.push({ boundary: current, text: contract.prescriptive });
    }
    current = contract.frontmatter.parent;
  }

  return { chain, prescriptiveUnion, floor: constitutionRef, unresolved };
}
