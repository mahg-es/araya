/**
 * ARAYA Governed Operations — CLI adapter (ponny-express-10010 PHASE 9).
 * Thin adapter: parses argv, delegates to the OperationRegistry / canonical
 * handlers, emits OperationResult JSON. Exit code mirrors `passed`.
 */
import { OperationRegistry } from "./registry";

function emitJson(value: unknown, json: boolean) {
  if (json) {
    process.stdout.write(JSON.stringify(value, null, 2) + "\n");
  } else {
    process.stdout.write(String(value) + "\n");
  }
}

function kvArgs(args: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const a of args) {
    const m = a.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)=(.*)$/);
    if (m) {
      const key = m[1].replace(/-/g, "_");
      const raw = m[2];
      out[key] = raw === "true" ? true : raw === "false" ? false : raw;
    }
  }
  return out;
}

export async function operationsCliMain(args: string[], root: string): Promise<number> {
  const json = args.includes("--json");
  const clean = args.filter((a) => a !== "--json");
  const registry = new OperationRegistry(root);
  const { errors } = registry.load();
  if (errors.length > 0) {
    emitJson({ passed: false, errors }, json);
    return 1;
  }

  const [domain, sub, ...rest] = clean;

  try {
    if (domain === "operation" && sub === "resolve") {
      const query = rest.join(" ").replace(/^"|"$/g, "");
      const r = registry.resolve(query);
      const op = r.operation_id ? registry.describe(r.operation_id) : null;
      emitJson({
        operation_id: "operation.resolve",
        passed: r.found,
        query,
        matched_operation: r.operation_id,
        confidence: r.confidence,
        via: r.via,
        mandatory: r.found,
        available_adapters: op?.adapters ?? [],
      }, json);
      return r.found ? 0 : 1;
    }

    if (domain === "operation" && sub === "describe") {
      const id = rest[0];
      const def = registry.describe(id);
      if (!def) {
        emitJson({ passed: false, error: `unknown operation: ${id}` }, json);
        return 1;
      }
      emitJson(def, json);
      return 0;
    }

    if (domain === "operation" && sub === "list") {
      emitJson(registry.list(), json);
      return 0;
    }

    if (domain === "operation" && sub === "execute") {
      const id = rest[0];
      const input = kvArgs(rest.slice(1));
      const result = await registry.execute(id, input);
      emitJson(result, json);
      return result.passed ? 0 : 1;
    }

    if (domain === "gate" && sub === "merge-pr") {
      const prIdx = rest.indexOf("--pr");
      const pr = prIdx >= 0 ? rest[prIdx + 1] : "";
      const candIdx = rest.indexOf("--candidate");
      const candidate = candIdx >= 0 ? rest[candIdx + 1] : "";
      const baseIdx = rest.indexOf("--base");
      const base = baseIdx >= 0 ? rest[baseIdx + 1] : "dev-mahg";
      const evIdx = rest.indexOf("--evidence-commit");
      const evidence_commit = evIdx >= 0 ? rest[evIdx + 1] : undefined;
      const repoIdx = rest.indexOf("--repo");
      const repo = repoIdx >= 0 ? rest[repoIdx + 1] : root;
      if (!pr || !candidate) {
        emitJson({ passed: false, error: "gate merge-pr requires --pr <n> --candidate <sha> [--base <branch>] [--evidence-commit <sha>] [--repo <path>]" }, json);
        return 2;
      }
      const result = await registry.execute("git.merge-gate", { repo, pr, candidate, base, evidence_commit });
      emitJson(result, json);
      return result.passed ? 0 : 1;
    }

    if (domain === "git" && sub === "sanity") {
      const repoIdx = rest.indexOf("--repo");
      const repo = repoIdx >= 0 ? rest[repoIdx + 1] : root;
      const result = await registry.execute("git.repository-sanity", { repo });
      emitJson(result, json);
      return result.passed ? 0 : 1;
    }

    if (domain === "test" && sub?.startsWith("test.")) {
      const result = await registry.execute(sub, kvArgs(rest));
      emitJson(result, json);
      return result.passed ? 0 : 1;
    }

    emitJson({ passed: false, error: `unknown operations command: ${clean.join(" ")}` }, json);
    return 2;
  } catch (e) {
    emitJson({ passed: false, error: (e as Error).message }, json);
    return 1;
  }
}
