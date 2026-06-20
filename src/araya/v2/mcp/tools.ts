// ARAYA v2.0 — AX-as-MCP tool definitions (AX Slice 9), per Accepted ADR-0013.
//
// A DEFINED SUBSET of AX governance exposed as MCP tools (§3.2): five READ tools
// and exactly one WRITE tool. Each tool is a THIN shim that delegates to the
// EXISTING v2 engines (DispositionEngine, ScoreLedger, Verifier,
// DefinitionOfReadyGate, walk-the-chain) — no parallel AX stack, no
// reimplementation of governance logic (§3.3).
//
// THE LOAD-BEARING RULE (§3.1): READ tools never bind — they read and return.
// The single WRITE tool (`propose-disposition`) is PROPOSAL-ONLY: the external
// caller is stamped as the `producer` (never as the emitter), and a proposed
// success routes through the SAME emit() -> producer-is-emitter rejection ->
// independent verifier (`daneel`) seam the live loop uses. An external MCP caller
// can NEVER self-emit a binding success — it is structurally impossible, not a
// policy. The verifier reads real attached evidence and emits, exactly as in the
// live loop (ADR-0011 §4/§5).

import { z } from "zod";
import { DispositionEngine, DISPOSITIONS } from "../engines/disposition";
import type { Disposition, MoveContext } from "../engines/disposition";
import { Verifier } from "../engines/verifier";
import type { VerificationEvidence } from "../engines/verifier";
import { DefinitionOfReadyGate } from "../engines/definition-of-ready-gate";
import type { ReadinessGate } from "../engines/definition-of-ready-gate";
import { ScoreLedger } from "../ledger/score-ledger";
import type { ScoreEntry } from "../ledger/score-ledger";
import { walkChain } from "../contract/walk-chain";
import type { BoundaryResolver } from "../contract/contract";

/** Engine dependencies a server injects into the tool handlers. */
export interface AxEngineDeps {
  /** Ledger the WRITE move records to (and the READ ledger tools read). */
  ledger: ScoreLedger;
  /** Disposition engine bound to `ledger` (records the WRITE proposal's exit). */
  disposition: DispositionEngine;
  /** The governed independent verifier (`daneel`) — the ONLY success emitter. */
  verifier: Verifier;
  /** Server-stamped identity of the external MCP caller; always the producer,
   *  never the emitter. The caller cannot set or override this. */
  externalCaller: string;
  /** Resolver for `contract-walk`, or undefined when no manifest is configured. */
  resolver?: BoundaryResolver;
  /** The Constitution floor reference appended to every walked chain. */
  constitutionRef: string;
}

export type ToolMode = "READ" | "WRITE";

/** A registered AX MCP tool: metadata + the input schema + the pure handler. */
export interface AxTool {
  name: string;
  title: string;
  mode: ToolMode;
  description: string;
  inputSchema: z.ZodRawShape;
  /** Pure delegation to the engines; returns a plain JSON-able result. */
  handler: (deps: AxEngineDeps, args: any) => unknown;
}

// ---- shared schema fragments -------------------------------------------------

const evidenceShape = z
  .object({
    certification: z
      .object({ passed: z.number(), failed: z.number(), exitCode: z.number() })
      .optional(),
    dorVerdict: z.object({ disposition: z.string() }).optional(),
    tests: z.object({ run: z.number(), passed: z.boolean() }).optional(),
  })
  .optional();

const dispositionEnum = z.enum(DISPOSITIONS as unknown as [string, ...string[]]);

/** Build a MoveContext from the optional governance columns a caller supplies. */
function buildMove(args: {
  unitId: string;
  spec?: string;
  slice?: string;
  adrIds?: string[];
  contractIds?: string[];
  commit?: string;
  skillset?: string[];
  evidenceRef?: string;
}): MoveContext {
  return {
    timestamp: new Date().toISOString(),
    spec: args.spec ?? "ax-mcp",
    slice: args.slice ?? "",
    adr_ids: args.adrIds ?? [],
    contract_ids: args.contractIds ?? [],
    commit: args.commit ?? "",
    skillset: args.skillset ?? [],
    evidence_ref: args.evidenceRef ?? `mcp-propose unit:${args.unitId}`,
  };
}

// ---- READ tools (never bind) -------------------------------------------------

/**
 * READ — run the Definition-of-Ready gate over caller-supplied gate descriptors
 * and return the readiness verdict. Read-only: it uses a LEDGER-LESS disposition
 * engine, so the §4 composition runs and is RETURNED but nothing is recorded.
 */
function dorCheck(deps: AxEngineDeps, args: any): unknown {
  const gates: ReadinessGate[] = (args.gates ?? []).map((g: any) =>
    g.kind === "machine"
      ? {
          id: g.id,
          kind: "machine" as const,
          evaluate: () => ({ passed: !!g.passed, evidence: g.evidence ?? "" }),
        }
      : {
          id: g.id,
          kind: "human" as const,
          ruling: g.ruling ?? "unruled",
          ruledBy: g.ruledBy,
          evidence: g.evidence ?? "",
        }
  );
  // Ledger-less engine: evaluate() computes + returns the verdict; appends nothing.
  const gate = new DefinitionOfReadyGate(new DispositionEngine());
  const outcome = gate.evaluate({
    unitId: args.unitId,
    producer: args.producer ?? deps.externalCaller,
    gates,
    move: buildMove(args),
  });
  return {
    unitId: outcome.unitId,
    proposed: outcome.proposed,
    summary: outcome.summary,
    results: outcome.results,
    bound: false,
  };
}

/** READ — the disposition(s) recorded for a unit in the score ledger. */
function dispositionRead(deps: AxEngineDeps, args: any): unknown {
  const entries = deps.ledger.readAll().filter((e: ScoreEntry) => e.unit === args.unitId);
  return {
    unit: args.unitId,
    count: entries.length,
    dispositions: entries.map((e) => ({
      disposition: e.disposition,
      producer: e.producer,
      emitter: e.emitter,
      timestamp: e.timestamp,
      evidence_ref: e.evidence_ref,
    })),
  };
}

/**
 * READ — does the attached executable evidence substantiate a success? Invokes
 * the verifier's honest evidence check (ADR-0011 §4) as a PURE predicate; it
 * emits nothing and records nothing.
 */
function evidenceVerify(deps: AxEngineDeps, args: any): unknown {
  const evidence = args.evidence as VerificationEvidence | undefined;
  const substantiates = deps.verifier.substantiatesSuccess(evidence);
  return {
    substantiates,
    note: substantiates
      ? "attached evidence substantiates a success (ADR-0011 §4)"
      : "no substantiating executable evidence — a success would be refused (ADR-0011 §4)",
    bound: false,
  };
}

/** READ — walk the logical contract chain for a boundary; return the union. */
function contractWalk(deps: AxEngineDeps, args: any): unknown {
  if (!deps.resolver) {
    return { error: "no boundary manifest configured for this server" };
  }
  const result = walkChain(args.boundaryId, deps.resolver, deps.constitutionRef);
  return { project: deps.resolver.project, ...result };
}

/** READ — read recorded moves from the score ledger (optionally filtered). */
function ledgerRead(deps: AxEngineDeps, args: any): unknown {
  let entries = deps.ledger.readAll();
  if (args.unit) entries = entries.filter((e: ScoreEntry) => e.unit === args.unit);
  if (args.slice) entries = entries.filter((e: ScoreEntry) => e.slice === args.slice);
  if (typeof args.limit === "number" && args.limit >= 0) entries = entries.slice(-args.limit);
  return { count: entries.length, entries };
}

// ---- WRITE tool (proposal-only; routes through the verifier) ------------------

/**
 * WRITE — propose a disposition. PROPOSAL-ONLY (§3.1): the external caller is
 * stamped as `producer` (server-side, NOT from the args), so a proposed success
 * is refused by emit()'s producer-is-emitter check and routed to the independent
 * verifier (`daneel`), which reads the attached evidence and emits the binding
 * disposition under its OWN identity. The caller can NEVER be the emitter of a
 * success; self-emit is structurally impossible. This handler never appends to
 * the ledger directly — recording happens only inside emit()/verifier.emit().
 */
function proposeDisposition(deps: AxEngineDeps, args: any): unknown {
  const proposed = args.proposed as Disposition;
  const unit = {
    unit: args.unitId,
    declaredGates: args.declaredGates as string[],
    producer: deps.externalCaller, // server-stamped: the external caller is the producer
  };
  const move = buildMove(args);

  // The external caller is the only identity it can claim; we pass it as the
  // attempted emitter. For a success this is producer === emitter, so emit()
  // refuses it (producer-is-emitter) — the machine guarantee (ADR-0004/0011).
  const first = deps.disposition.emit(unit, proposed, deps.externalCaller, move);

  if (first.ok) {
    // Only non-success exits reach here (a producer may record a defect in its
    // own work). A success can never be self-emitted: it always self-rejects above.
    return {
      routedToVerifier: false,
      recorded: true,
      producer: deps.externalCaller,
      emitter: deps.externalCaller,
      disposition: first.disposition,
      verified: false,
      note: "non-success exit recorded by the producer (no binding success self-emitted)",
    };
  }

  if (first.rejection?.kind === "producer-is-emitter") {
    // Route the refused success to the independent verifier — the SAME seam the
    // live loop uses (delegation.awaitIndependentEmitter -> verifier.emit).
    const vr = deps.verifier.emit(unit, proposed, move, args.evidence as VerificationEvidence | undefined);
    return {
      routedToVerifier: true,
      recorded: vr.emitted,
      producer: deps.externalCaller,
      emitter: vr.emitted ? vr.emitter : null,
      disposition: vr.disposition,
      verified: vr.verified,
      rejection: vr.rejection,
      note: vr.verified
        ? `verifier (${vr.emitter}) emitted ${vr.disposition} on substantiating evidence; emitter != producer`
        : `verifier (${vr.emitter}) REFUSED the success (no substantiating evidence) and emitted ${vr.disposition}; no self-emitted success`,
    };
  }

  // Illegal-by-shape (e.g. PASS proposed on a multi-gate unit). Nothing recorded.
  return {
    routedToVerifier: false,
    recorded: false,
    producer: deps.externalCaller,
    emitter: null,
    disposition: null,
    verified: false,
    rejection: first.rejection,
    note: "illegal transition by shape; nothing emitted",
  };
}

// ---- the defined subset (§3.2): exactly 5 READ + 1 WRITE ---------------------

export const AX_TOOLS: AxTool[] = [
  {
    name: "dor-check",
    title: "Definition-of-Ready check",
    mode: "READ",
    description:
      "Run the AX Definition-of-Ready gate over supplied gate descriptors and return the readiness verdict. Read-only; records nothing.",
    inputSchema: {
      unitId: z.string(),
      producer: z.string().optional(),
      gates: z.array(
        z.object({
          id: z.string(),
          kind: z.enum(["machine", "human"]),
          passed: z.boolean().optional(),
          ruling: z.enum(["pass", "fail", "unruled"]).optional(),
          ruledBy: z.string().optional(),
          evidence: z.string().optional(),
        })
      ),
    },
    handler: dorCheck,
  },
  {
    name: "disposition-read",
    title: "Read a unit's disposition",
    mode: "READ",
    description: "Read the disposition(s) recorded for a unit in the score ledger. Read-only.",
    inputSchema: { unitId: z.string() },
    handler: dispositionRead,
  },
  {
    name: "evidence-verify",
    title: "Verify attached evidence",
    mode: "READ",
    description:
      "Check whether attached executable evidence substantiates a success (ADR-0011 §4). Pure predicate; emits and records nothing.",
    inputSchema: { evidence: evidenceShape },
    handler: evidenceVerify,
  },
  {
    name: "contract-walk",
    title: "Walk the contract chain",
    mode: "READ",
    description:
      "Walk the logical AX contract chain for a boundary and return the inherited prescriptive union. Read-only.",
    inputSchema: { boundaryId: z.string() },
    handler: contractWalk,
  },
  {
    name: "ledger-read",
    title: "Read the score ledger",
    mode: "READ",
    description: "Read recorded moves from the score ledger, optionally filtered by unit/slice/limit. Read-only.",
    inputSchema: {
      unit: z.string().optional(),
      slice: z.string().optional(),
      limit: z.number().optional(),
    },
    handler: ledgerRead,
  },
  {
    name: "propose-disposition",
    title: "Propose a disposition (verifier-gated)",
    mode: "WRITE",
    description:
      "Propose a disposition for a unit. PROPOSAL-ONLY: the caller is the producer; a proposed success routes through the independent verifier (daneel) and can never be self-emitted (ADR-0013 §3.1). Note: there is no `producer`/`emitter` field — the server stamps the caller as producer; only the verifier emits a binding success.",
    inputSchema: {
      unitId: z.string(),
      declaredGates: z.array(z.string()),
      proposed: dispositionEnum,
      evidence: evidenceShape,
      spec: z.string().optional(),
      slice: z.string().optional(),
      adrIds: z.array(z.string()).optional(),
      contractIds: z.array(z.string()).optional(),
      commit: z.string().optional(),
      skillset: z.array(z.string()).optional(),
      evidenceRef: z.string().optional(),
    },
    handler: proposeDisposition,
  },
];

/** The exposed tool names, in registration order (exactly 6). */
export const AX_TOOL_NAMES: string[] = AX_TOOLS.map((t) => t.name);
