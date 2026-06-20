import type { ArayaExecutionAdapter } from "../adapter";
import { PiAdapter } from "./pi";
import { MockAdapter } from "./mock";
import { HeadlessCliAdapter } from "./headless-cli";

export function resolveAdapter(name: string, config: any): ArayaExecutionAdapter {
  switch (name.toLowerCase()) {
    case "pi":
      return new PiAdapter(config);
    case "mock":
      return new MockAdapter();
    // AX Slice 10 (ADR-0014): the headless-CLI execution adapter. The pilot backend
    // is Claude Code (claude -p one-shot); future backends are descriptors, not new
    // factory cases. `config` may carry { descriptor, cwd, timeoutMs, env }.
    case "headless-cli":
    case "claude-code":
      return new HeadlessCliAdapter(config);
    default:
      throw new Error(`Unsupported execution adapter: "${name}"`);
  }
}
