# ADR-009: Relay `actor_role` Semantics — Agent Name vs Functional Role Class

**Status:** Draft
**Decision:** Pending (The Data Professor)
**Date:** 2026-07-26
**Author:** Daneel (Relay Controller) — BATCH-TRUTH-CONTINUITY-20260726, ponny-express-10007 FASE 3.5
**Domain:** Relay Protocol, Event Schema, Agent Authority
**Related:** F-004 (Aurora Matrix), Contract v1 §7–§9, `.araya/relay/event-schema.json`, `.araya/relay/workflow.yaml`, `tests/req-043-test.js`

---

## Context

`.araya/relay/event-schema.json` defines:

```json
"actor_role": ["PROFESSOR","MANU","AURORA","SONIA","SPECIALIST","TERESA","ROLANDO","DANEEL"]
```

The enum is **semantically mixed**:

- `SPECIALIST` is a **functional role class** — it covers Valentina, Alejandra, Bernabé, María, Aquila, and (per `workflow.yaml` + Contract v1 §9 + `tests/req-043-test.js`) **Clara**, who executes test automation in `EXECUTING` with results `[DONE, ASK, BLOCK]`.
- `TERESA`, `ROLANDO`, `DANEEL`, `MANU`, `AURORA`, `SONIA` are **agent names** standing for single-holder authorities.

Finding F-004 (Aurora Matrix) flagged the absence of `CLARA` from the enum as a defect. But adding `CLARA` symmetrically would be wrong if `actor_role` is a **role class** field: Clara never acts as a Relay authority — she acts as a specialist in `EXECUTING`, and `SPECIALIST` already covers her. Conversely, if `actor_role` is an **agent-name** field, then `SPECIALIST` is the anomaly and every specialist (including Clara) would need an enum entry — making the schema brittle against dynamic agents (Neo/Trinity activations, future hires).

Contract v1 (16 sections) and the Relay Participant Contract v1.0.0 do **not** state unequivocally which semantics `actor_role` carries. Per ponny-express-10007 FASE 3.5, the schema was therefore **not** changed; this ADR records the options.

## Options

### Option A — Functional role class (RECOMMENDED)

`actor_role` names the **authority class** acting, not the person. `SPECIALIST` covers every executor, including Clara. `TERESA` stays because TEST_GATE is a single-holder authority class; the label is legacy but unique. Changes:

- None to the enum.
- Document in `event-schema.json` description: "`actor_role` is the functional authority class of the event emitter; executors use SPECIALIST regardless of agent name."
- Gate test already asserts this model (`Clara (TEST_AUTOMATION): EXECUTING only`).

**Pros:** zero schema churn; matches `workflow.yaml` (`owner_role: SPECIALIST`); robust to dynamic agents; matches current gate tests. **Cons:** `TERESA` as a label conflates person and class (acceptable while the gate is single-holder).

### Option B — Authority-class rename

Rename `TERESA` → `TEST_GATE` (and symmetrically treat classes everywhere). **Pros:** clean class model. **Cons:** breaking schema change; every preserved event and test referencing `TERESA` needs migration; no functional gain while the gate is single-holder.

### Option C — Agent-name enum

Add `CLARA` (and every future specialist) to the enum. **Pros:** per-agent audit granularity. **Cons:** enum churn on every hire/activation; contradicts `workflow.yaml` `owner_role: SPECIALIST`; duplicates what `actor`/`agent_id` fields should carry.

## Recommendation

**Option A.** Keep the enum unchanged; document the class semantics; keep Clara emitting as `SPECIALIST` in `EXECUTING`. If per-agent granularity is ever required, add a separate `actor_agent_id` free-form field rather than expanding the enum (that would be a new ADR).

## Consequences (if accepted)

- F-004 closed as "not a defect — works as designed" with this ADR as evidence.
- `event-schema.json` gains a `description` clarification only (non-breaking).
- REQ-042 motor implements `actor_role` as functional class; no CLARA enum needed.

## Decision

Pending — The Data Professor.
