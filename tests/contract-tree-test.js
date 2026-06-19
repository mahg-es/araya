#!/usr/bin/env node
/**
 * ARAYA v2.0 — AX Contract Tree test (Slice 6), per Accepted ADR-0010.
 *
 * Proofs (as evidence):
 *  (a) the resolver maps the pilot's LOGICAL boundary id -> its physical location,
 *      and a DIFFERENT manifest maps the SAME id elsewhere (logical->physical
 *      indirection, not a hardcoded path);
 *  (b) walk-the-chain composes the prescriptive layers up the LOGICAL tree with
 *      the Constitution as floor;
 *  (c) the descriptive generator regenerates ONLY its marked section — the
 *      authored prescriptive bytes are unchanged after regeneration (no-clobber);
 *  (d) prescriptive rules are expressible as DoR gate inputs (shape only, no wiring).
 *
 * Usage: node tests/contract-tree-test.js
 */

const assert = require("node:assert");
const { createHash } = require("node:crypto");
const { mkdtempSync, writeFileSync, mkdirSync, copyFileSync, readFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");

const {
  BoundaryResolver, parseContract, loadContract, DESCRIPTIVE_BEGIN,
} = require("../dist/araya/v2/contract/contract.js");
const { walkChain } = require("../dist/araya/v2/contract/walk-chain.js");
const { regenerateDescriptive } = require("../dist/araya/v2/contract/descriptive-generator.js");
const { prescriptiveAsReadinessGates } = require("../dist/araya/v2/contract/gate-seam.js");

const REPO = join(__dirname, "..");
const PILOT_ID = "ax:boundary:araya/v2/ledger";
const LEDGER_ROOT = join(REPO, "src/araya/v2/ledger");
const PILOT_CONTRACT = join(LEDGER_ROOT, "AGENTS.md");

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`  ok  ${name}`); };

console.log("AX Contract Tree (ADR-0010):");

// (a) logical -> physical indirection via the manifest (not a hardcoded path)
check("(a) resolver maps logical boundary id -> physical root; another manifest maps it elsewhere", () => {
  const araya = BoundaryResolver.fromFile(join(REPO, ".araya/contracts/araya.boundaries.json"));
  const physical = araya.resolveRoot(PILOT_ID);
  assert.strictEqual(physical, LEDGER_ROOT, "araya manifest resolves the pilot to its real root");

  // The SAME logical id, a DIFFERENT (external-project) manifest -> a DIFFERENT root.
  const external = new BoundaryResolver({
    project: "managed-external",
    base: "/opt/managed-external",
    roots: { [PILOT_ID]: "services/ledger" },
  });
  const externalPhysical = external.resolveRoot(PILOT_ID);
  assert.strictEqual(externalPhysical, "/opt/managed-external/services/ledger");
  assert.notStrictEqual(externalPhysical, physical, "identity is logical; location comes from the manifest");
});

// (b) walk-the-chain composes prescriptive layers up the logical tree + floor
check("(b) walk-the-chain composes prescriptive union up the logical tree, Constitution as floor", () => {
  // synthetic 3-node logical chain (leaf -> mid -> root), each with an AGENTS.md
  const work = mkdtempSync(join(tmpdir(), "ax-s6-chain-"));
  const node = (dir, id, parent, rule) => {
    mkdirSync(join(work, dir), { recursive: true });
    const fm = parent ? `boundary: ${id}\nparent: ${parent}` : `boundary: ${id}`;
    writeFileSync(join(work, dir, "AGENTS.md"),
      `---\n${fm}\n---\n# ${id}\n\n## Prescriptive\n\n- ${rule}\n\n## Descriptive\n\n${DESCRIPTIVE_BEGIN}\n${"<!-- END GENERATED: descriptive -->"}\n`);
  };
  node("leaf", "ax:test:leaf", "ax:test:mid", "L1 leaf rule");
  node("mid", "ax:test:mid", "ax:test:root", "M1 mid rule");
  node("root", "ax:test:root", undefined, "R1 root rule");
  const resolver = new BoundaryResolver({
    project: "synthetic", base: work,
    roots: { "ax:test:leaf": "leaf", "ax:test:mid": "mid", "ax:test:root": "root" },
  });

  const r = walkChain("ax:test:leaf", resolver, "ax:boundary:constitution");
  assert.deepStrictEqual(r.chain, ["ax:test:leaf", "ax:test:mid", "ax:test:root"], "leaf->root order");
  assert.deepStrictEqual(r.prescriptiveUnion.map(x => x.boundary), ["ax:test:leaf", "ax:test:mid", "ax:test:root"]);
  assert.ok(r.prescriptiveUnion.some(x => x.text.includes("R1 root rule")), "inherits the root's rule");
  assert.strictEqual(r.floor, "ax:boundary:constitution", "Constitution is the floor of every chain");
  rmSync(work, { recursive: true, force: true });

  // and the real pilot resolves its declared parent, honestly reporting the
  // not-yet-authored parent as an unresolved gap (only one contract piloted).
  const araya = BoundaryResolver.fromFile(join(REPO, ".araya/contracts/araya.boundaries.json"));
  const pilot = walkChain(PILOT_ID, araya, "ax:boundary:constitution");
  assert.deepStrictEqual(pilot.chain, [PILOT_ID]);
  assert.deepStrictEqual(pilot.unresolved, ["ax:boundary:araya/v2"], "parent contract not yet authored");
  assert.ok(pilot.prescriptiveUnion[0].text.includes("Append-only"), "pilot's authored prescriptive inherited");
});

// (c) the no-clobber proof: regenerate descriptive, prescriptive bytes unchanged
check("(c) descriptive regen rewrites ONLY its section; prescriptive bytes unchanged", () => {
  const work = mkdtempSync(join(tmpdir(), "ax-s6-regen-"));
  const tmpContract = join(work, "AGENTS.md");
  copyFileSync(PILOT_CONTRACT, tmpContract);

  const headHash = (s) => createHash("sha256")
    .update(s.slice(0, s.indexOf(DESCRIPTIVE_BEGIN) + DESCRIPTIVE_BEGIN.length)).digest("hex");

  const before = readFileSync(tmpContract, "utf-8");
  const beforeHead = headHash(before);
  const beforePrescriptive = parseContract(before).prescriptive;

  // regenerate, observing the REAL ledger boundary
  regenerateDescriptive(tmpContract, LEDGER_ROOT);

  const after = readFileSync(tmpContract, "utf-8");
  assert.strictEqual(headHash(after), beforeHead, "frontmatter + prescriptive + heading bytes are unchanged");
  assert.strictEqual(parseContract(after).prescriptive, beforePrescriptive, "prescriptive section identical");
  const desc = parseContract(after).descriptive;
  assert.ok(desc.length > 0 && /score-ledger\.ts/.test(desc), "descriptive section was (re)generated with observed state");
  rmSync(work, { recursive: true, force: true });
});

// (d) prescriptive rules expressible as DoR gate inputs (shape only)
check("(d) prescriptive rules express as DoR machine-gate descriptors (no wiring)", () => {
  const araya = BoundaryResolver.fromFile(join(REPO, ".araya/contracts/araya.boundaries.json"));
  const pilot = walkChain(PILOT_ID, araya, "ax:boundary:constitution");
  const gates = prescriptiveAsReadinessGates(pilot.prescriptiveUnion);
  assert.ok(gates.length >= 1, "produced gate descriptors");
  for (const g of gates) {
    assert.ok(typeof g.id === "string" && g.kind === "machine" && typeof g.evaluate === "function",
      "conforms to the ADR-0009 MachineGate shape");
  }
  // unwired default: reports unevaluated, never asserts enforcement
  assert.strictEqual(gates[0].evaluate().passed, false);
});

console.log(`\nAll ${passed} checks passed.`);
