#!/usr/bin/env node
// ARAYA v2.0 — AX MCP server entry point (AX Slice 9), per Accepted ADR-0013.
// Launches the pilot AX governance MCP server on local stdio (§3.4). An MCP
// client (e.g. Claude Code) spawns this process and speaks MCP over stdio; there
// is no network listener and no auth (the OS process/user boundary is the trust
// boundary). Configuration is environment-driven so no repository path is baked in.

import { AxMcpServer } from "./server";

async function main(): Promise<void> {
  const server = new AxMcpServer({
    externalCaller: process.env.ARAYA_MCP_CALLER,
    scoreLedgerPath: process.env.ARAYA_SCORE_LEDGER_PATH,
    boundaryManifestPath: process.env.ARAYA_BOUNDARY_MANIFEST,
    constitutionRef: process.env.ARAYA_CONSTITUTION_REF,
  });
  await server.start();
}

main().catch((err) => {
  // Failures go to stderr; stdout is reserved for the MCP transport.
  console.error("[ax-mcp] failed to start:", err);
  process.exit(1);
});
