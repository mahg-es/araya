/**
 * ARAYA Governed Operation — contract validation (ponny-express-10010 PHASE 4/11).
 * Validates operation definitions and OperationResult structures.
 */
import {
  OperationDefinition,
  OperationResult,
  OPERATION_STATUSES,
  RISK_LEVELS,
  REQUIRED_AUTHORITIES,
  RESULT_STATUSES,
} from "./types";

const REQUIRED_DEF_FIELDS: (keyof OperationDefinition)[] = [
  "operation_id", "version", "status", "domain", "title", "description",
  "canonical_handler", "input_schema", "output_schema", "side_effects",
  "risk_level", "required_authority", "preconditions", "postconditions",
  "evidence", "idempotency", "rollback", "adapters", "tests", "owner",
  "source_provenance",
];

export function validateOperationDefinition(def: unknown): string[] {
  const errors: string[] = [];
  if (typeof def !== "object" || def === null) return ["definition is not an object"];
  const d = def as Record<string, unknown>;

  for (const f of REQUIRED_DEF_FIELDS) {
    if (!(f in d)) errors.push(`missing required field: ${f}`);
  }
  if (typeof d.operation_id !== "string" || !/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/.test(d.operation_id || "")) {
    errors.push("operation_id must be dotted-lowercase (e.g. git.merge-gate)");
  }
  if (typeof d.version !== "string" || !/^\d+\.\d+\.\d+$/.test(d.version || "")) {
    errors.push("version must be semver-like X.Y.Z");
  }
  if (!OPERATION_STATUSES.includes(d.status as never)) errors.push(`invalid status: ${d.status}`);
  if (!RISK_LEVELS.includes(d.risk_level as never)) errors.push(`invalid risk_level: ${d.risk_level}`);
  if (!REQUIRED_AUTHORITIES.includes(d.required_authority as never)) {
    errors.push(`unknown required_authority: ${d.required_authority}`);
  }
  if (!Array.isArray(d.side_effects)) errors.push("side_effects must be an array (empty allowed, declaration required)");
  if (Array.isArray(d.adapters) && d.adapters.length === 0 && d.status === "active") {
    errors.push("active operation must declare at least one adapter");
  }
  if (d.status === "design-only" && Array.isArray(d.adapters) && d.adapters.length > 0) {
    errors.push("design-only operation must not declare adapters (non-writing until authorized)");
  }
  return errors;
}

export function validateOperationResult(result: unknown): string[] {
  const errors: string[] = [];
  if (typeof result !== "object" || result === null) return ["result is not an object"];
  const r = result as Record<string, unknown>;

  if (typeof r.operation_id !== "string" || r.operation_id.length === 0) errors.push("missing operation_id");
  if (typeof r.operation_version !== "string" || r.operation_version.length === 0) errors.push("missing operation_version");
  if (typeof r.passed !== "boolean") errors.push("missing passed (boolean mandatory)");
  if (!RESULT_STATUSES.includes(r.status as never)) errors.push(`invalid result status: ${r.status}`);
  if (!Array.isArray(r.checks)) errors.push("checks must be an array");
  if (!Array.isArray(r.failed_checks)) errors.push("failed_checks must be an array");
  if (!Array.isArray(r.blocking_reasons)) errors.push("blocking_reasons must be an array");
  if (!Array.isArray(r.evidence)) errors.push("evidence must be an array");
  if (!Array.isArray(r.side_effects)) errors.push("side_effects must be an array");
  if (typeof r.started_at !== "string") errors.push("missing started_at");
  if (typeof r.completed_at !== "string") errors.push("missing completed_at");
  if (typeof r.duration_ms !== "number") errors.push("missing duration_ms");

  // boolean contract: passed=true only when every blocking check passed
  if (Array.isArray(r.checks) && r.passed === true) {
    for (const c of r.checks as { id?: string; passed?: boolean; blocking?: boolean }[]) {
      if (c && c.blocking !== false && c.passed === false) {
        errors.push(`boolean contract violated: passed=true but blocking check '${c.id}' failed`);
      }
    }
  }
  return errors;
}
