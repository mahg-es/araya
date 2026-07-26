# 002 — Relay State Machine + Agent Authority Model — v2
> Capsule ID: 002 | Initiative: relay-agent-model | Status: CANONICAL
> Session: 2026-07-26-v2 | Framework: dev-mahg 38197e6 | Supersedes v1 capsule 002

## 1. Relay State Machine (MVP — standard-delivery only)
Design: PR #78 (c269780) → PR #79 (7fcc9b0). Teresa FIX→resolved (92a4e5b). Rolando VERIFIED WITH OBSERVATION (commit 5696140). 33 acceptance tests. Artifacts: `.araya/relay/` (9 design files + AX3.md), all tracked.

States: INTENT(MANU) → ROUTING(AURORA) → PLANNING(SONIA) → EXECUTING(SPECIALIST) → TESTING(TERESA) → VERIFYING(ROLANDO) → ACCEPTING(MANU) → CLOSING(SONIA) → CLOSED. Exceptions: ASK/BLOCKED suspend the functional owner; Daneel dispatches, NEVER becomes owner. Limits: 2 test attempts, 2 replanning cycles, then BLOCKED.

## 2. Current Authority Matrix (ALIGNED — verified by tests/req-043-test.js 31/31 at 4073e3e)

| Agent | Authority | Relay states | Results | Key restrictions |
|---|---|---|---|---|
| Professor | STRATEGIC (final) | — | decisions | not in araya.yaml (by design) |
| Manu | PRODUCT (WHAT) | INTENT, ACCEPTING | DONE / ACCEPT / REJECT | no implement/test |
| Aurora | CAPABILITY (WHO CAN) | ROUTING | DONE / GAR | no specialist execution |
| Sonia | PLANNING (HOW) | PLANNING, CLOSING | DONE / CLOSE | no implementation |
| Daneel | COORDINATOR | ASK/BLOCKED dispatch | Dispatch / Escalate | NEVER functional owner; `can_write_code: false`; reports to The Data Professor |
| Clara | TEST_AUTOMATION | EXECUTING only | DONE / ASK / BLOCK + evidence | never emits PASS/FAIL; `can_write_code: true` |
| Teresa | TEST_GATE | TESTING only | PASS / FAIL / ASK / BLOCK (binding) | never implements; never authors product tests during gate; `can_write_code: false` |
| Rolando | REALITY_AUTHORITY | VERIFYING only | VERIFIED / DISCREPANCY / ASK / BLOCK | never implements; never alters audited evidence; reports to The Data Professor |
| Neo | SPECIALIST (dynamic) | none while dormant | — | `dormant`, AX skills only; Aurora activates per gap |
| Trinity | SPECIALIST (dynamic) | none while dormant | — | `dormant`, AX skills only |

Verification path: `araya.yaml` (L0) → `prompts/agents/` (L1) → generator → `.pi/agents/` + `.araya/generated/` (L3) → `tests/req-043-test.js` gates. Sonia's roster aligned in PR #82 (`prompts/agents/sonia.md`: tdd/tests→clara, Relay TESTING gate→teresa).

## 3. Critical Role Matrix (Contract v1 §9)
Manu/Aurora/Sonia/Daneel/Rolando/Teresa/Elena write NO product. Clara writes tests only. Priya writes quality config only, never replaces the independent gate. Esteban owns knowledge/graph artifacts. Binding results per agent as in §2 table.

## 4. Agent & Skill Contract v1.0.0
`.araya/governance/standards/ARAYA-agent-and-skill-contract-v1.md` — 16 sections, 12 validation gates. Post-PR-#82 gate status: Gates 1-3, 5-7, 10-12 ✅; Gate 4 (operational Giskard) ✅ resolved in araya.yaml/prompts/CANONICAL-CONTEXT (historical refs marked retired); Gate 8 (relay-participant on Relay agents) ✅ (skill now valid under Pi 0.82.1 contract); Gate 9 (bare agents) — Sofia active-bare remains open (F-005).

## 5. ADR-009 (Draft) — actor_role Semantics
`event-schema.json` `actor_role` enum mixes class (`SPECIALIST`) and agent-name (`TERESA`) labels. F-004 resolution path: ADR-009 draft recommends Option A — functional role class; Clara emits as SPECIALIST; NO enum change. Decision: **The Data Professor** (pending). File: `.araya/governance/adrs/adr-009-relay-actor-role-semantics.md`.

## 6. Retired
Giskard — retired 2026-07-20. Non-operational everywhere (araya.yaml, prompts, CANONICAL-CONTEXT marked). Relay T-030: operational Giskard reference = BLOCK; historical references allowed when marked (T-031). Open residue: outbox MSG-20260725-183610 addressed `to: giskard` — preserved + discrepancy record (capsule 005/007).

> v2 sources: workflow.yaml, event-schema.json, araya.yaml @38197e6, contract v1, ADR-009, req-043 gate suite.
