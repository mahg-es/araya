// ARAYA v2.0 — AX-as-MCP barrel (AX Slice 9), per Accepted ADR-0013.
// Kept OUT of the v2 root barrel (src/araya/v2/index.ts) so non-transport
// consumers and the existing suite never load the ESM SDK.

export { AxMcpServer } from "./server";
export type { AxMcpServerOptions } from "./server";
export { AX_TOOLS, AX_TOOL_NAMES } from "./tools";
export type { AxTool, AxEngineDeps, ToolMode } from "./tools";
