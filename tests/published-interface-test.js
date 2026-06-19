#!/usr/bin/env node
/**
 * ARAYA v2.0 — Published-Interface Overlay test (AX Slice 7), per ADR-0012.
 *
 * Proofs:
 *  - detection unit: no-break / removed→break / added→non-break;
 *  (a) the interface as-built matches its promised surface → the Robot API-contract
 *      suite certifies it PASS with a real output.xml (third certification adapter);
 *  (b) THE BREAK PROOF — a mutated surface (a removed promised method) → a breaking
 *      change IS detected → the suite fails → the cert engine yields FIX;
 *  (c) the detected break does NOT fire a strike (built-but-not-armed: flag off,
 *      struckLive false, no arbiter ledger written);
 *  (d) walk-the-chain composes the interface contract as inherited AC.
 *
 * Uses a temp evidence runId + temp mutated source; never the real ledger.
 * Usage: node tests/published-interface-test.js   (after `npm run build`; needs .venv robot)
 */

const assert = require("node:assert");
const { existsSync, readFileSync, writeFileSync, mkdtempSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve, dirname } = require("node:path");

const {
  BoundaryResolver, walkChain,
  detectBreakingChange, checkPublishedInterface, parsePromisedSurface,
  PUBLIC_CONTRACT_STRIKE_ARMED,
} = require("../dist/araya/v2/index.js");
const { CertificationGate } = require("../dist/araya/v2/engines/certification-gate.js");
const { apiContractInvocation } = require("../dist/araya/v2/engines/certification/api-contract-target.js");

const REPO = resolve(__dirname, "..");
const MANIFEST = join(REPO, ".araya/contracts/araya.boundaries.json");
const BOUNDARY = "ax:boundary:araya/v2/adapter-interface";
const SUITE = join(REPO, "tests/robot/adapter-contract.robot");
const ROBOT = join(REPO, ".venv/bin/robot");
const NODE_BIN = dirname(process.execPath);
const work = mkdtempSync(join(tmpdir(), "ax-s7-"));

let passed = 0, failed = 0;
const assertf = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };
async function test(name, fn) {
  try { await fn(); console.log(`  ok  ${name}`); passed++; }
  catch (e) { console.log(`  FAIL  ${name}: ${e.message}`); failed++; }
}

(async () => {
  console.log("Published-Interface Overlay (ADR-0012):");
  const resolver = BoundaryResolver.fromFile(MANIFEST);
  const gate = new CertificationGate();

  await test("detection unit: no-break / removed→break / added→non-break", async () => {
    assertf(detectBreakingChange(["a", "b"], ["a", "b"]).breaking === false, "identical → no break");
    const rm = detectBreakingChange(["a", "b"], ["a"]);
    assertf(rm.breaking === true && rm.removed.includes("b"), "removed promised member → break");
    const add = detectBreakingChange(["a"], ["a", "c"]);
    assertf(add.breaking === false && add.added.includes("c"), "added member → non-breaking");
  });

  await test("contract loads: kind published-interface, v1.0.0, promised surface parsed", async () => {
    const c = checkPublishedInterface(BOUNDARY, resolver);
    assertf(c.version === "1.0.0", `pinned version, got ${c.version}`);
    assertf(c.promised.includes("ArayaExecutionAdapter.getCapabilities"), "promised surface parsed");
    assertf(c.breaking === false, "as-built matches promised (no break)");
  });

  // (a) as-built → Robot API-contract suite certifies PASS with real output.xml
  let aRes;
  await test("(a) as-built honors contract → API-contract suite PASS (real output.xml)", async () => {
    const inv = apiContractInvocation({ suite: SUITE, arayaRoot: REPO, boundaryId: BOUNDARY, manifestPath: MANIFEST, nodeBinDir: NODE_BIN });
    aRes = gate.certify(inv, { arayaRoot: REPO, runId: "s7-api-pass", declaredGateCount: 1, robotBin: ROBOT });
    assertf(aRes.disposition === "PASS", `expected PASS, got ${aRes.disposition} (${aRes.summary})`);
    assertf(existsSync(aRes.outputXml), "real output.xml evidence written");
  });

  // (b) break proof: mutated source (getCapabilities removed) → break → suite FIX
  let bRes, bCheck;
  await test("(b) removed promised method → breaking change detected → cert engine FIX", async () => {
    const mutated = join(work, "adapter.mutated.ts");
    const src = readFileSync(resolve(REPO, "src/araya/v2/adapter.ts"), "utf-8");
    writeFileSync(mutated, src.replace(/getCapabilities\(\): HostCapabilities;/, "")); // drop a promised method
    bCheck = checkPublishedInterface(BOUNDARY, resolver, mutated);
    assertf(bCheck.breaking === true, "a removed promised method is a breaking change");
    assertf(bCheck.removed.includes("ArayaExecutionAdapter.getCapabilities"), "names the removed member");
    const inv = apiContractInvocation({ suite: SUITE, arayaRoot: REPO, boundaryId: BOUNDARY, manifestPath: MANIFEST, observedSource: mutated, nodeBinDir: NODE_BIN });
    bRes = gate.certify(inv, { arayaRoot: REPO, runId: "s7-api-break", declaredGateCount: 1, robotBin: ROBOT });
    assertf(bRes.disposition === "FIX", `a break must yield FIX, got ${bRes.disposition} (${bRes.summary})`);
    assertf(existsSync(bRes.outputXml), "real output.xml evidence for the break run");
  });

  // (c) built-but-not-armed: detection never strikes
  await test("(c) detected break does NOT fire a strike (built-but-not-armed)", async () => {
    assertf(PUBLIC_CONTRACT_STRIKE_ARMED === false, "the strike flag defaults off");
    assertf(bCheck.struckLive === false, "a detected break is not struck live");
    assertf(!existsSync(join(REPO, ".araya/ax/ledger/arbiter.ndjson")), "no arbiter/strike ledger written");
    assertf(!existsSync(join(REPO, "arbiter.ndjson")), "no stray strike ledger");
  });

  // (d) walk-the-chain composes the interface contract as inherited AC
  await test("(d) walk-the-chain composes the interface contract as inherited AC", async () => {
    const r = walkChain(BOUNDARY, resolver, "ax:boundary:constitution");
    assertf(r.chain[0] === BOUNDARY, "chain starts at the interface boundary");
    assertf(r.floor === "ax:boundary:constitution", "Constitution is the floor");
    const mine = r.prescriptiveUnion.find(x => x.boundary === BOUNDARY);
    assertf(mine && parsePromisedSurface(mine.text).includes("ArayaExecutionAdapter.executeSubagent"),
      "the interface contract (promised surface) is composed into the inherited prescriptive union");
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})();
