import type { ArayaExecutionAdapter } from "../adapter";
import { PiAdapter } from "./pi";
import { MockAdapter } from "./mock";

export function resolveAdapter(name: string, config: any): ArayaExecutionAdapter {
  switch (name.toLowerCase()) {
    case "pi":
      return new PiAdapter(config);
    case "mock":
      return new MockAdapter();
    default:
      throw new Error(`Unsupported execution adapter: "${name}"`);
  }
}
