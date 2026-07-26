/**
 * ARAYA Governed Operation — contract types (ponny-express-10010 PHASE 4).
 * One canonical implementation per operation; thin adapters per surface.
 */

export interface OperationCheck {
  id: string;
  passed: boolean;
  blocking?: boolean;
  detail?: string;
  evidence?: string[];
}

export interface OperationResult {
  operation_id: string;
  operation_version: string;
  passed: boolean;
  status: "PASS" | "FAIL" | "BLOCK" | "SKIP" | "NOT_IMPLEMENTED";
  subject?: Record<string, unknown>;
  checks: OperationCheck[];
  failed_checks: string[];
  blocking_reasons: string[];
  warnings: string[];
  evidence: string[];
  side_effects: string[];
  evaluated_sha?: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
}

export interface OperationDefinition {
  operation_id: string;
  version: string;
  status: "active" | "design-only" | "deprecated";
  domain: string;
  title: string;
  description: string;
  canonical_handler: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  side_effects: string[];
  risk_level: "read-only" | "low" | "medium" | "high";
  required_authority: string;
  preconditions: string[];
  postconditions: string[];
  evidence: string[];
  idempotency: string;
  rollback: string;
  adapters: string[];
  aliases?: string[];
  intents?: string[];
  tests: string[];
  owner: string;
  source_provenance: string;
}

export type OperationHandler = (
  input: Record<string, unknown>,
  ctx: { root: string }
) => Promise<OperationResult>;

export const OPERATION_STATUSES = ["active", "design-only", "deprecated"] as const;
export const RISK_LEVELS = ["read-only", "low", "medium", "high"] as const;
export const REQUIRED_AUTHORITIES = [
  "professor", "manu", "aurora", "sonia", "daneel", "clara", "teresa", "rolando", "specialist", "any",
] as const;
export const RESULT_STATUSES = ["PASS", "FAIL", "BLOCK", "SKIP", "NOT_IMPLEMENTED"] as const;
