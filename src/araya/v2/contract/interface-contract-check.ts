// ARAYA v2.0 — published-interface contract check harness (Slice 7, ADR-0012 §3.3).
//
// The entrypoint the Robot API-contract suite drives via Process. It resolves a
// published-interface boundary, observes its surface, and detects breaking changes
// against the promised (version-pinned) surface. Exit 0 = the interface honors its
// contract; exit 1 = a breaking change. It DETECTS only — it never fires a strike
// (built-but-not-armed, ADR-0012 §1.1).
//
// Usage: node interface-contract-check.js <boundaryId> <manifestPath> [observedSource]

import { BoundaryResolver } from "./contract";
import { checkPublishedInterface } from "./published-interface";

function main(): number {
  const [, , boundary, manifest, observedSource] = process.argv;
  if (!boundary || !manifest) {
    console.error("usage: interface-contract-check <boundaryId> <manifestPath> [observedSource]");
    return 2;
  }
  const resolver = BoundaryResolver.fromFile(manifest);
  const r = checkPublishedInterface(boundary, resolver, observedSource || undefined);
  console.log(JSON.stringify(
    { boundary: r.boundary, version: r.version, breaking: r.breaking, removed: r.removed, added: r.added },
    null, 2
  ));
  if (r.breaking) {
    console.log(`BREAKING CHANGE detected — removed promised member(s): ${r.removed.join(", ")}`);
    return 1;
  }
  console.log("no breaking change — the published interface honors its promised surface");
  return 0;
}

process.exit(main());
