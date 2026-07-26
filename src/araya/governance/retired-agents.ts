/**
 * ARAYA Retired-Agent Guard (ponny-express-10008, FASE 3).
 *
 * Central registry + enforcement for operationally retired agents.
 * Single source of truth: .araya/governance/retired-agents.json
 * (mirrored by the PostOffice tool's Python guard in src/postoffice_loop.py).
 *
 * Contract:
 *   isRetiredAgent("giskard") === true
 *   assertRoutable("giskard") → throws RetiredOperationalActorError
 *   → disposition BLOCK, reason RETIRED_OPERATIONAL_ACTOR
 *   → fired BEFORE any message/route/assignment is persisted
 */

import * as fs from "node:fs";
import * as path from "node:path";

export const RETIRED_REASON = "RETIRED_OPERATIONAL_ACTOR";

export interface RetiredAgentRecord {
  id: string;
  name?: string;
  retired_at?: string;
  reason?: string;
}

export class RetiredOperationalActorError extends Error {
  public readonly code = RETIRED_REASON;
  public readonly disposition = "BLOCK";
  constructor(field: string, actor: string) {
    super(
      `${field}: '${actor}' is retired — no operational role. Routing/delivery/assignment is forbidden (RETIRED_OPERATIONAL_ACTOR).`
    );
    this.name = "RetiredOperationalActorError";
  }
}

let cached: { at: number; ids: Set<string> } | null = null;

export function retiredAgents(root: string): Set<string> {
  if (cached && Date.now() - cached.at < 5000) return cached.ids;
  let ids = new Set<string>(["giskard"]); // fail-closed fallback
  try {
    const p = path.join(root, ".araya", "governance", "retired-agents.json");
    const data = JSON.parse(fs.readFileSync(p, "utf-8"));
    const fromFile = (data.retired_agents || [])
      .map((a: RetiredAgentRecord) => String(a.id || "").trim().toLowerCase())
      .filter((s: string) => s.length > 0);
    if (fromFile.length > 0) ids = new Set<string>(fromFile);
  } catch {
    // keep fallback — fail closed
  }
  cached = { at: Date.now(), ids };
  return ids;
}

export function isRetiredAgent(actor: string | null | undefined, root: string): boolean {
  if (!actor) return false;
  return retiredAgents(root).has(actor.trim().toLowerCase());
}

/** Reject routing/assignment/ownership to a retired agent. Fail closed on retired. */
export function assertRoutable(actor: string | null | undefined, field: string, root: string): void {
  if (isRetiredAgent(actor, root)) {
    throw new RetiredOperationalActorError(field, String(actor));
  }
}

/**
 * Scan canonical runtime sources for operational retired-agent references.
 * Returns a list of violations (empty = clean). Checks:
 *   - araya.yaml agent blocks: reports_to / owner / recipient / next_owner / assigned_to fields
 *   - prompts/agents/*.md: "reports to <retired>" claims not marked as historical
 *   - .araya/relay/*.{json,yaml}: retired ids inside enums or owner_role fields
 */
export function findOperationalRetiredReferences(root: string): string[] {
  const violations: string[] = [];
  const retired = retiredAgents(root);
  const retiredAlt = Array.from(retired).map((r) => r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  // araya.yaml — structural field scan
  const yamlPath = path.join(root, "araya.yaml");
  if (fs.existsSync(yamlPath)) {
    const lines = fs.readFileSync(yamlPath, "utf-8").split("\n");
    lines.forEach((line, i) => {
      const m = line.match(/^\s*(reports_to|owner|recipient|next_owner|assigned_to|route_to|fallback_owner):\s*["']?([A-Za-z_-]+)["']?\s*$/);
      if (m && retired.has(m[2].toLowerCase())) {
        violations.push(`araya.yaml:${i + 1}: ${m[1]}: ${m[2]} (retired)`);
      }
      for (const r of retiredAlt) {
        if (new RegExp(`reports to ${r}\\b`, "i").test(line) && !/retired|superseded|non-operational|historical/i.test(line)) {
          violations.push(`araya.yaml:${i + 1}: unmarked 'reports to ${r}' claim`);
        }
      }
    });
  }

  // prompts/agents — profile scan
  const promptsDir = path.join(root, "prompts", "agents");
  if (fs.existsSync(promptsDir)) {
    for (const f of fs.readdirSync(promptsDir).filter((x) => x.endsWith(".md"))) {
      const lines = fs.readFileSync(path.join(promptsDir, f), "utf-8").split("\n");
      lines.forEach((line, i) => {
        for (const r of retiredAlt) {
          if (new RegExp(`reports?\\s+to\\s+${r}\\b`, "i").test(line) && !/retired|superseded|non-operational|historical|former/i.test(line)) {
            violations.push(`prompts/agents/${f}:${i + 1}: unmarked 'reports to ${r}'`);
          }
        }
      });
    }
  }

  // relay schemas — enum/owner scan
  const relayDir = path.join(root, ".araya", "relay");
  if (fs.existsSync(relayDir)) {
    for (const f of fs.readdirSync(relayDir)) {
      if (f === "acceptance-test-spec.md") continue; // negative test spec (T-030/T-031)
      if (!/\.(json|ya?ml)$/.test(f)) continue;
      const lines = fs.readFileSync(path.join(relayDir, f), "utf-8").split("\n");
      lines.forEach((line, i) => {
        for (const r of retiredAlt) {
          if (new RegExp(`\\b${r}\\b`, "i").test(line)) {
            violations.push(`.araya/relay/${f}:${i + 1}: retired id in relay definition`);
          }
        }
      });
    }
  }

  return violations;
}
