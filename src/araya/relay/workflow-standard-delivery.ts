/**
 * ARAYA Relay Motor — standard-delivery workflow definition (canonical,
 * mirrors .araya/relay/workflow.yaml; the YAML remains the human contract,
 * this is its executable twin validated by tests to match).
 */
import { EventType, StateSpec } from "./types";

export const STANDARD_DELIVERY: StateSpec[] = [
  {
    state: "INTENT",
    owner_role: "MANU",
    allowed_events: ["DONE", "ASK", "BLOCK"],
    next: { DONE: { state: "ROUTING", owner_role: "AURORA" } },
  },
  {
    state: "ROUTING",
    owner_role: "AURORA",
    allowed_events: ["DONE", "ASK", "BLOCK"],
    next: { DONE: { state: "PLANNING", owner_role: "SONIA" } },
  },
  {
    state: "PLANNING",
    owner_role: "SONIA",
    allowed_events: ["DONE", "ASK", "BLOCK"],
    next: { DONE: { state: "EXECUTING", owner_role: "SPECIALIST" } },
  },
  {
    state: "EXECUTING",
    owner_role: "SPECIALIST",
    allowed_events: ["DONE", "ASK", "BLOCK"],
    next: { DONE: { state: "TESTING", owner_role: "TERESA" } },
  },
  {
    state: "TESTING",
    owner_role: "TERESA",
    allowed_events: ["PASS", "FAIL", "ASK", "BLOCK"],
    next: {
      PASS: { state: "VERIFYING", owner_role: "ROLANDO" },
      FAIL: { state: "EXECUTING", owner_role: "SPECIALIST", action: "increment_attempts" },
    },
  },
  {
    state: "VERIFYING",
    owner_role: "ROLANDO",
    allowed_events: ["VERIFIED", "DISCREPANCY", "ASK", "BLOCK"],
    next: {
      VERIFIED: { state: "ACCEPTING", owner_role: "MANU" },
      DISCREPANCY: { state: "PLANNING", owner_role: "SONIA", action: "increment_replanning" },
    },
  },
  {
    state: "ACCEPTING",
    owner_role: "MANU",
    allowed_events: ["ACCEPT", "REJECT", "ASK", "BLOCK"],
    next: {
      ACCEPT: { state: "CLOSING", owner_role: "SONIA" },
      REJECT: { state: "PLANNING", owner_role: "SONIA", action: "increment_replanning" },
    },
  },
  {
    state: "CLOSING",
    owner_role: "SONIA",
    allowed_events: ["CLOSE"],
    next: { CLOSE: { state: "CLOSED", owner_role: "SONIA" } },
  },
  { state: "CLOSED", owner_role: "SONIA", allowed_events: [], next: {}, terminal: true },
];

export const EXCEPTIONAL_STATES = ["ASK", "BLOCKED"] as const;
