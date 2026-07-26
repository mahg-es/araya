/**
 * ARAYA Operation Catalog — canonical registry (ponny-express-10010 PHASE 5).
 * Loads operations/*.yaml contracts, validates them, resolves queries
 * deterministically (exact id, alias, declared intent — no probabilistic matching
 * presented as certainty).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { load as yamlLoad } from "js-yaml";
import { OperationDefinition, OperationHandler } from "./types";
import { validateOperationDefinition } from "./contract";
import {
  gitMergeGate,
  gitRepositorySanity,
  gitSyncIntegration,
  gitFeatureStart,
  gitFeaturePrGate,
} from "./git-handlers";
import { testRelayWrapper, operationResolve, RELAY_SUITES } from "./misc-handlers";

export interface RegisteredOperation {
  definition: OperationDefinition;
  handler: OperationHandler | null;
}

const HANDLERS: Record<string, OperationHandler> = {
  "git.merge-gate": gitMergeGate,
  "git.repository-sanity": gitRepositorySanity,
  "git.sync-integration": gitSyncIntegration,
  "git.feature-start": gitFeatureStart,
  "git.feature-pr-gate": gitFeaturePrGate,
  "test.relay-unit": (input, ctx) => testRelayWrapper("test.relay-unit", input, ctx),
  "test.relay-integration": (input, ctx) => testRelayWrapper("test.relay-integration", input, ctx),
  "test.relay-behavior": (input, ctx) => testRelayWrapper("test.relay-behavior", input, ctx),
  "test.relay-recovery": (input, ctx) => testRelayWrapper("test.relay-recovery", input, ctx),
  "test.relay-idempotency": (input, ctx) => testRelayWrapper("test.relay-idempotency", input, ctx),
};

export class OperationRegistry {
  private operations = new Map<string, RegisteredOperation>();
  private aliasIndex = new Map<string, string>();
  private intentIndex = new Map<string, string>();

  constructor(public readonly root: string) {}

  load(): { loaded: number; errors: string[] } {
    const dir = path.join(this.root, "operations");
    const errors: string[] = [];
    let loaded = 0;
    if (!fs.existsSync(dir)) return { loaded: 0, errors: [`operations directory missing: ${dir}`] };
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml")).sort()) {
      const full = path.join(dir, file);
      let def: OperationDefinition;
      try {
        def = yamlLoad(fs.readFileSync(full, "utf-8")) as OperationDefinition;
      } catch (e) {
        errors.push(`${file}: YAML parse error: ${(e as Error).message}`);
        continue;
      }
      const defErrors = validateOperationDefinition(def);
      if (defErrors.length > 0) {
        errors.push(`${file}: ${defErrors.join("; ")}`);
        continue;
      }
      if (this.operations.has(def.operation_id)) {
        errors.push(`${file}: duplicate operation_id ${def.operation_id}`);
        continue;
      }
      for (const a of def.aliases ?? []) {
        if (this.aliasIndex.has(a)) {
          if (this.aliasIndex.get(a) === def.operation_id) continue; // benign intra-file duplicate
          errors.push(`${file}: duplicate alias '${a}' (already maps to ${this.aliasIndex.get(a)})`);
          continue;
        }
        this.aliasIndex.set(a, def.operation_id);
      }
      for (const i of def.intents ?? []) {
        if (!this.intentIndex.has(i.toLowerCase())) this.intentIndex.set(i.toLowerCase(), def.operation_id);
      }
      this.operations.set(def.operation_id, {
        definition: def,
        handler: def.status === "active" ? HANDLERS[def.operation_id] ?? null : null,
      });
      loaded++;
    }
    return { loaded, errors };
  }

  list(status?: string): OperationDefinition[] {
    return Array.from(this.operations.values())
      .map((o) => o.definition)
      .filter((d) => !status || d.status === status)
      .sort((a, b) => a.operation_id.localeCompare(b.operation_id));
  }

  describe(id: string): OperationDefinition | null {
    return this.operations.get(id)?.definition ?? null;
  }

  hasHandler(id: string): boolean {
    return this.operations.get(id)?.handler != null;
  }

  async execute(id: string, input: Record<string, unknown>): Promise<import("./types").OperationResult> {
    const op = this.operations.get(id);
    if (!op) throw new Error(`unknown operation: ${id}`);
    if (op.definition.status !== "active") {
      throw new Error(`operation ${id} is ${op.definition.status} — not executable (design-only until authorized)`);
    }
    if (!op.handler) throw new Error(`operation ${id} has no canonical handler registered`);
    return op.handler(input, { root: this.root });
  }

  /** Deterministic resolution: exact id → alias → declared intent. */
  resolve(query: string): { found: boolean; operation_id: string | null; confidence: 0 | 1; via: string | null } {
    if (this.operations.has(query)) {
      return { found: true, operation_id: query, confidence: 1, via: "exact-id" };
    }
    const aliased = this.aliasIndex.get(query);
    if (aliased) return { found: true, operation_id: aliased, confidence: 1, via: "alias" };
    const intended = this.intentIndex.get(query.toLowerCase());
    if (intended) return { found: true, operation_id: intended, confidence: 1, via: "intent" };
    return { found: false, operation_id: null, confidence: 0, via: null };
  }

  search(term: string): OperationDefinition[] {
    const t = term.toLowerCase();
    return this.list().filter(
      (d) =>
        d.operation_id.includes(t) ||
        d.title.toLowerCase().includes(t) ||
        d.description.toLowerCase().includes(t) ||
        (d.aliases ?? []).some((a) => a.toLowerCase().includes(t)) ||
        (d.intents ?? []).some((i) => i.toLowerCase().includes(t))
    );
  }

  catalogForResolve(): { operation_id: string; aliases: string[]; intents: string[]; adapters: string[]; status: string }[] {
    return this.list().map((d) => ({
      operation_id: d.operation_id,
      aliases: d.aliases ?? [],
      intents: d.intents ?? [],
      adapters: d.adapters ?? [],
      status: d.status,
    }));
  }
}

export { operationResolve, RELAY_SUITES };
