// ARAYA v2.0 — AxMcpServer: AX governance behind an MCP surface (AX Slice 9).
// Per Accepted ADR-0013. A THIN adapter (§3.3) over the EXISTING v2 engines: it
// builds a DispositionEngine + ScoreLedger + Verifier once, injects them into the
// six tool handlers (tools.ts), and registers those handlers on an MCP server from
// the official TypeScript SDK. No parallel AX stack; the governance logic stays in
// the engines.
//
// Transport (§3.4): the pilot posture is LOCAL stdio, single trusted client, NO
// auth — authentication is the OS process/user boundary, authorization is the tool
// subset itself. No network listener is opened here; remote/multi-client auth is a
// deferred future decision (ADR-0013 §3.4).
//
// The SDK ships as ESM; this project is CommonJS. Node's require(esm) (>= 20.19)
// loads it cleanly, so the SDK is pulled in lazily at start()/buildServer() time
// via require — keeping non-transport consumers (and the existing test suite) free
// of any SDK load. The type import below is erased at compile time.

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DispositionEngine } from "../engines/disposition";
import { Verifier, VERIFIER_IDENTITY } from "../engines/verifier";
import { ScoreLedger, resolveScoreLedgerPath } from "../ledger/score-ledger";
import { BoundaryResolver } from "../contract/contract";
import { AX_TOOLS, AX_TOOL_NAMES } from "./tools";
import type { AxEngineDeps } from "./tools";

const SERVER_NAME = "ax-governance";
const SERVER_VERSION = "0.1.0";

/** Default floor reference appended to a walked contract chain (ADR-0001). */
const DEFAULT_CONSTITUTION_REF = "araya-constitution";

export interface AxMcpServerOptions {
  /**
   * Identity stamped as the `producer` on every WRITE proposal — the external
   * MCP caller. It is NEVER the emitter of a binding success. Defaults to a
   * generic external-caller id.
   */
  externalCaller?: string;
  /** Score-ledger path (caller-owned; resolved per-environment). */
  scoreLedgerPath?: string;
  /** Optional boundary manifest path enabling `contract-walk`. */
  boundaryManifestPath?: string;
  /** Optional override of the Constitution floor reference. */
  constitutionRef?: string;
}

export class AxMcpServer {
  private readonly deps: AxEngineDeps;

  constructor(opts: AxMcpServerOptions = {}) {
    const ledger = new ScoreLedger(opts.scoreLedgerPath ?? resolveScoreLedgerPath());
    // One disposition engine bound to the ledger; the verifier reuses the SAME
    // engine (reuse, not reinvention) so its emissions record on the same path.
    const disposition = new DispositionEngine(ledger);
    const verifier = new Verifier(disposition);
    const resolver = opts.boundaryManifestPath
      ? BoundaryResolver.fromFile(opts.boundaryManifestPath)
      : undefined;

    this.deps = {
      ledger,
      disposition,
      verifier,
      externalCaller: opts.externalCaller ?? "mcp-external-caller",
      resolver,
      constitutionRef: opts.constitutionRef ?? DEFAULT_CONSTITUTION_REF,
    };
  }

  /** The verifier identity — the only emitter of a binding success. */
  get verifierIdentity(): string {
    return VERIFIER_IDENTITY;
  }

  /** The server-stamped external-caller (producer) identity. */
  get externalCaller(): string {
    return this.deps.externalCaller;
  }

  /** The exposed tool names (exactly the defined subset, §3.2). */
  get toolNames(): string[] {
    return AX_TOOL_NAMES;
  }

  /** READ vs WRITE classification of the exposed tools. */
  get toolModes(): Record<string, "READ" | "WRITE"> {
    return Object.fromEntries(AX_TOOLS.map((t) => [t.name, t.mode]));
  }

  /**
   * Invoke a tool's handler directly against the live engine deps. This is the
   * same function the MCP registration calls; exposed for in-process callers and
   * for proving the governance behavior without a transport.
   */
  invoke(name: string, args: unknown): unknown {
    const tool = AX_TOOLS.find((t) => t.name === name);
    if (!tool) throw new Error(`unknown AX MCP tool: ${name}`);
    return tool.handler(this.deps, args ?? {});
  }

  /** Register all six tools on an MCP server (the SDK adapter seam, §3.3). */
  register(mcp: McpServer): void {
    for (const tool of AX_TOOLS) {
      mcp.registerTool(
        tool.name,
        { title: tool.title, description: tool.description, inputSchema: tool.inputSchema },
        async (args: unknown) => ({
          content: [{ type: "text" as const, text: JSON.stringify(this.invoke(tool.name, args)) }],
        })
      );
    }
  }

  /** Construct a real MCP server with the six tools registered (SDK loaded lazily). */
  buildServer(): McpServer {
    // require(esm): the ESM-only SDK is loaded here, not at module eval.
    const { McpServer: McpServerCtor } = require("@modelcontextprotocol/sdk/server/mcp.js");
    const mcp: McpServer = new McpServerCtor({ name: SERVER_NAME, version: SERVER_VERSION });
    this.register(mcp);
    return mcp;
  }

  /**
   * Start the pilot server on local stdio (§3.4). No network listener, no auth;
   * the OS process/user boundary is the trust boundary and the tool subset is the
   * authorization. Blocks on the transport until the client disconnects.
   */
  async start(): Promise<void> {
    const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
    const mcp = this.buildServer();
    await mcp.connect(new StdioServerTransport());
  }
}
