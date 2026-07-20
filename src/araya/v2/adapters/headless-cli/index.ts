// ARAYA v2.0 — Headless-CLI adapter barrel (AX Slice 10), per Accepted ADR-0014.

export { HeadlessCliAdapter } from "./adapter";
export type { HeadlessCliAdapterOptions } from "./adapter";
export { claudeCodeDescriptor } from "./invocation";
export type {
  BackendDescriptor,
  CliRunResult,
  TestRunResult,
  InvocationOptions,
} from "./invocation";
