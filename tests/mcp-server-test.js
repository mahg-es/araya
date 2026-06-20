#!/usr/bin/env node
/**
 * ARAYA v2.0 — AX-as-MCP-server test (AX Slice 9), per Accepted ADR-0013.
 *
 * Proves:
 *  1. THE DEFINED SUBSET (§3.2): exactly 5 READ tools + 1 WRITE tool; no
 *     arbiter/strike tool is exposed.
 *  2. READ tools return real data from their engines and bind nothing
 *     (dor-check runs the DoR engine; ledger-read/disposition-read read the score
 *     ledger; evidence-verify invokes the verifier's evidence check; contract-walk
 *     walks a real contract chain).
 *  3. THE HONESTY PROOF, through the real MCP protocol (Client + in-memory
 *     transport):
 *      (b) propose-disposition with valid evidence routes to the verifier, which
 *          emits the success under `daneel` — emitter = daneel, producer = the
 *          external caller, emitter != producer; recorded in the ledger.
 *      (c) propose-disposition with NO evidence (and any attempt to self-emit) does
 *          NOT yield a binding success: the verifier refuses and emits ASK. Across
 *          the whole ledger, NO success line ever carries emitter === producer —
 *          external self-emit is structurally impossible.
 *      (s) the WRITE tool's schema exposes NO producer/emitter field — the caller
 *          cannot stamp itself as emitter.
 *  4. The six tools register and are callable THROUGH the MCP protocol.
 *
 * Uses temp ledgers/manifests — never the real ones.
 * Usage: node tests/mcp-server-test.js
 */

const { AxMcpServer, AX_TOOLS, AX_TOOL_NAMES } = require("../dist/araya/v2/mcp/index.js");
const { ScoreLedger } = require("../dist/araya/v2/index.js");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { InMemoryTransport } = require("@modelcontextprotocol/sdk/inMemory.js");
const { existsSync, readFileSync, writeFileSync, mkdtempSync, mkdirSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");

let passed = 0, failed = 0;
const assert = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };
async function test(name, fn) {
  try { await fn(); console.log(`  ok  ${name}`); passed++; }
  catch (e) { console.log(`  FAIL  ${name}: ${e.message}`); failed++; }
}
const work = mkdtempSync(join(tmpdir(), "ax-s9-"));
const ledgerLines = (p) => existsSync(p) ? readFileSync(p, "utf-8").split("\n").filter(Boolean).map(JSON.parse) : [];
const CALLER = "claude-code-session"; // the external MCP caller (the producer)

/** Connect a real MCP client to the server over an in-memory transport pair. */
async function connect(server) {
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  const mcp = server.buildServer();
  await mcp.connect(serverT);
  const client = new Client({ name: "ax-test-client", version: "0.0.0" });
  await client.connect(clientT);
  return client;
}
const callJson = async (client, name, args) => {
  const res = await client.callTool({ name, arguments: args });
  return JSON.parse(res.content[0].text);
};

(async () => {
  console.log("AX-as-MCP server (ADR-0013):");

  // 1 — the defined subset (§3.2)
  await test("(1) exposes exactly 5 READ + 1 WRITE; no arbiter/strike tool", async () => {
    const expected = ["dor-check", "disposition-read", "evidence-verify", "contract-walk", "ledger-read", "propose-disposition"];
    assert(JSON.stringify(AX_TOOL_NAMES) === JSON.stringify(expected), `tool set is ${AX_TOOL_NAMES}`);
    const modes = Object.fromEntries(AX_TOOLS.map(t => [t.name, t.mode]));
    const reads = AX_TOOLS.filter(t => t.mode === "READ").map(t => t.name);
    const writes = AX_TOOLS.filter(t => t.mode === "WRITE").map(t => t.name);
    assert(reads.length === 5, `5 READ tools, got ${reads.length}`);
    assert(writes.length === 1 && writes[0] === "propose-disposition", `1 WRITE tool, got ${writes}`);
    assert(modes["propose-disposition"] === "WRITE", "propose-disposition is WRITE");
    const banned = AX_TOOL_NAMES.filter(n => /arbiter|strike|violation/i.test(n));
    assert(banned.length === 0, `no arbiter/strike tool exposed, found ${banned}`);
  });

  // 2 — READ tools return real engine data, bind nothing
  await test("(2a) dor-check runs the DoR engine and records nothing (READ)", async () => {
    const ledgerPath = join(work, "dor.ndjson");
    const server = new AxMcpServer({ externalCaller: CALLER, scoreLedgerPath: ledgerPath });
    // all machine gates pass + the one human gate ruled pass -> a success verdict
    const ready = server.invoke("dor-check", {
      unitId: "slice-x", producer: CALLER,
      gates: [
        { id: "g1", kind: "machine", passed: true, evidence: "built" },
        { id: "g2", kind: "human", ruling: "pass", ruledBy: "professor", evidence: "approved" },
      ],
    });
    assert(ready.proposed === "SUCCESS", `multi-gate all-pass -> SUCCESS, got ${ready.proposed}`);
    assert(ready.bound === false, "dor-check is read-only");
    // an unruled human gate -> ASK (the §4 load-bearing rule), still recording nothing
    const notReady = server.invoke("dor-check", {
      unitId: "slice-y",
      gates: [
        { id: "g1", kind: "machine", passed: true, evidence: "built" },
        { id: "g2", kind: "human", ruling: "unruled", evidence: "awaiting" },
      ],
    });
    assert(notReady.proposed === "ASK", `unruled human gate -> ASK, got ${notReady.proposed}`);
    assert(!existsSync(ledgerPath), "dor-check wrote no ledger entry");
  });

  await test("(2b) ledger-read + disposition-read read real ledger entries (READ)", async () => {
    const ledgerPath = join(work, "read.ndjson");
    const seed = new ScoreLedger(ledgerPath);
    seed.append({ timestamp: "t1", spec: "s", slice: "slice-1", unit: "u-1", disposition: "PASS",
      producer: "p", emitter: "daneel", adr_ids: [], contract_ids: [], commit: "c", skillset: [], evidence_ref: "e" });
    seed.append({ timestamp: "t2", spec: "s", slice: "slice-2", unit: "u-2", disposition: "ASK",
      producer: "p", emitter: "daneel", adr_ids: [], contract_ids: [], commit: "c", skillset: [], evidence_ref: "e" });
    const server = new AxMcpServer({ externalCaller: CALLER, scoreLedgerPath: ledgerPath });
    const all = server.invoke("ledger-read", {});
    assert(all.count === 2, `ledger-read returns all entries, got ${all.count}`);
    const filtered = server.invoke("ledger-read", { slice: "slice-2" });
    assert(filtered.count === 1 && filtered.entries[0].unit === "u-2", "ledger-read filters by slice");
    const dr = server.invoke("disposition-read", { unitId: "u-1" });
    assert(dr.count === 1 && dr.dispositions[0].disposition === "PASS" && dr.dispositions[0].emitter === "daneel",
      "disposition-read returns the unit's recorded disposition");
  });

  await test("(2c) evidence-verify invokes the verifier's honest check (READ)", async () => {
    const server = new AxMcpServer({ externalCaller: CALLER, scoreLedgerPath: join(work, "ev.ndjson") });
    const yes = server.invoke("evidence-verify", { evidence: { tests: { run: 3, passed: true } } });
    assert(yes.substantiates === true && yes.bound === false, "passing tests substantiate; read-only");
    const no = server.invoke("evidence-verify", { evidence: { tests: { run: 0, passed: false } } });
    assert(no.substantiates === false, "no passing evidence -> does not substantiate");
    const none = server.invoke("evidence-verify", {});
    assert(none.substantiates === false, "absent evidence -> does not substantiate");
  });

  await test("(2d) contract-walk walks a real logical contract chain (READ)", async () => {
    // a tiny portable manifest + one authored boundary contract
    const base = join(work, "proj");
    const childRoot = join(base, "child");
    mkdirSync(childRoot, { recursive: true });
    writeFileSync(join(childRoot, "AGENTS.md"),
      "---\nboundary: ax:boundary:child\n---\n## Prescriptive\nchild rule holds.\n");
    const manifestPath = join(base, "manifest.json");
    writeFileSync(manifestPath, JSON.stringify({ project: "demo", base: ".", roots: { "ax:boundary:child": "child" } }));
    const server = new AxMcpServer({ externalCaller: CALLER, scoreLedgerPath: join(work, "cw.ndjson"), boundaryManifestPath: manifestPath });
    const walk = server.invoke("contract-walk", { boundaryId: "ax:boundary:child" });
    assert(walk.chain && walk.chain[0] === "ax:boundary:child", "contract-walk returns the chain");
    assert(walk.prescriptiveUnion.some(r => /child rule holds/.test(r.text)), "the prescriptive layer is composed");
    assert(typeof walk.floor === "string", "the Constitution floor is appended");
  });

  // 3 — THE HONESTY PROOF, through the real MCP protocol
  const honestLedger = join(work, "honest.ndjson");
  const server = new AxMcpServer({ externalCaller: CALLER, scoreLedgerPath: honestLedger });
  const client = await connect(server);

  await test("(3-b) WRITE with valid evidence routes to the verifier; emitter=daneel != producer", async () => {
    const r = await callJson(client, "propose-disposition", {
      unitId: "ax-unit-1", declaredGates: ["g"], proposed: "PASS",
      evidence: { tests: { run: 5, passed: true } }, slice: "slice-9",
    });
    assert(r.routedToVerifier === true, "the proposal routed through the verifier seam");
    assert(r.verified === true, "the verifier found substantiating evidence");
    assert(r.emitter === server.verifierIdentity, `emitter is the verifier (daneel), got ${r.emitter}`);
    assert(r.producer === CALLER, `producer is the external caller, got ${r.producer}`);
    assert(r.emitter !== r.producer, "emitter != producer (producer-not-emitter holds at the MCP surface)");
    assert(r.recorded === true && r.disposition === "PASS", "the binding success was emitted+recorded");
    const success = ledgerLines(honestLedger).find(l => l.unit === "ax-unit-1" && l.disposition === "PASS");
    assert(success && success.emitter === "daneel" && success.producer === CALLER,
      "the recorded success carries emitter=daneel, producer=the external caller");
  });

  await test("(3-c) WRITE with NO evidence cannot self-emit a success — verifier refuses (ASK)", async () => {
    const r = await callJson(client, "propose-disposition", {
      unitId: "ax-unit-2", declaredGates: ["g"], proposed: "PASS", slice: "slice-9", // no evidence
    });
    assert(r.routedToVerifier === true, "even an unevidenced success routes to the verifier (never self-emitted)");
    assert(r.verified === false, "no substantiating evidence");
    assert(r.disposition === "ASK", `refusal emits ASK, got ${r.disposition}`);
    assert(r.emitter === server.verifierIdentity, "the refusal is emitted by the verifier, not the caller");
    const lines = ledgerLines(honestLedger);
    assert(!lines.some(l => l.unit === "ax-unit-2" && (l.disposition === "PASS" || l.disposition === "SUCCESS")),
      "no success recorded for the unevidenced unit");
  });

  await test("(3-c') across the whole ledger, NO success line has emitter === producer (self-emit impossible)", async () => {
    const selfEmittedSuccess = ledgerLines(honestLedger).some(
      l => (l.disposition === "PASS" || l.disposition === "SUCCESS") && l.emitter === l.producer
    );
    assert(!selfEmittedSuccess, "an external caller never self-emitted a binding success");
    const callerEmitted = ledgerLines(honestLedger).some(l => l.emitter === CALLER);
    assert(!callerEmitted, "the external caller is never the emitter of any recorded move");
  });

  await test("(3-s) the WRITE tool's schema exposes no producer/emitter field (structural)", async () => {
    const write = AX_TOOLS.find(t => t.name === "propose-disposition");
    const keys = Object.keys(write.inputSchema);
    assert(!keys.includes("producer") && !keys.includes("emitter"),
      `caller cannot stamp producer/emitter; schema keys = ${keys}`);
  });

  // 4 — registration + callable through the MCP protocol
  await test("(4) the six tools list + call through the MCP protocol", async () => {
    const listed = (await client.listTools()).tools.map(t => t.name).sort();
    assert(JSON.stringify(listed) === JSON.stringify([...AX_TOOL_NAMES].sort()),
      `client.listTools returns the six tools, got ${listed}`);
    const ev = await callJson(client, "evidence-verify", { evidence: { tests: { run: 1, passed: true } } });
    assert(ev.substantiates === true, "a READ tool is callable through the protocol");
  });

  await client.close();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
