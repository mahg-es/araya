# 002 — Relay State Machine + Agent Authority Model + Contract v1
> Capsule ID: 002 | Initiative: relay-agent-model | Status: CANONICAL
> Session: 2026-07-26 | Framework HEAD: 0902ac6 | Token budget: ~5500

---

## 1. Relay State Machine (MVP — standard-delivery only)

**Design:** PR #78 (bd7fc0b) → PR #79 (7fcc9b0). Teresa reviewed: 3 FIX resolved (92a4e5b). Rolando: VERIFIED WITH OBSERVATION. 33 acceptance tests.

### 1.1 Active States

```text
INTENT ──Manu DONE──→ ROUTING ──Aurora DONE──→ PLANNING ──Sonia DONE──→ EXECUTING
                                                                              │
                                                                     Specialist DONE
                                                                              │
CLOSED ←──Sonia CLOSE── CLOSING ←──Manu ACCEPT── ACCEPTING ←──Rolando VERIFIED── VERIFYING ←──Teresa PASS── TESTING
```

| State | Owner (role) | Agent |
|-------|-------------|-------|
| `INTENT` | MANU | manu 👑 |
| `ROUTING` | AURORA | aurora 🌟 |
| `PLANNING` | SONIA | sonia 👩‍💼 |
| `EXECUTING` | SPECIALIST | valentina, alejandra, bernabe, maria, aquila |
| `TESTING` | TERESA (per Relay) | ⚠️ Clara (actual QA) — see F-001 |
| `VERIFYING` | ROLANDO | rolando 🛡️ |
| `ACCEPTING` | MANU | manu 👑 |
| `CLOSING` | SONIA | sonia 👩‍💼 |
| `CLOSED` | (none) | — TERMINAL |

### 1.2 Exceptional States

| State | Owner | Controller |
|-------|-------|-----------|
| `ASK` | Functional owner SUSPENDED | Daneel dispatches to authority |
| `BLOCKED` | Functional owner SUSPENDED | Daneel dispatches to authority |

**Daneel NEVER becomes functional owner.** Suspended owner remains `task.owner.actor`.

### 1.3 Exceptional Transitions

```
TESTING ──Teresa FAIL──→ EXECUTING (same specialist, increment attempts)
VERIFYING ──Rolando DISCREPANCY──→ PLANNING (Sonia)
ACCEPTING ──Manu REJECT──→ PLANNING (Sonia)
Any state ──ASK──→ ASK (dispatched to authority)
Any state ──BLOCK──→ BLOCKED (dispatched to authority)
```

### 1.4 Invariants

1. Single active owner: `len(active_claims) <= 1`
2. No self-approval: implementer ≠ tester, implementer ≠ verifier, tester ≠ verifier, verifier ≠ accepter
3. No state skip: transitions only via defined edges
4. Controller isolation: `controller.actor != task.owner.actor`
5. Evidence required: DONE, PASS, VERIFIED, ACCEPT events must carry evidence
6. Immutable events: append-only, never updated or deleted
7. Daneel never functional owner of ASK or BLOCKED

### 1.5 Limits

| Limit | Max | Counter | On Exceed |
|-------|-----|---------|-----------|
| Attempts (TESTING→FAIL→EXECUTING) | 2 | per task | BLOCKED → Sonia |
| Replanning cycles | 2 | per task | BLOCKED → Professor |

### 1.6 Relay File Artifacts (9 files)

```
.araya/relay/
├── state-machine.md
├── transition-table.md
├── claim-contract.md
├── task-schema.json          ← JSON Schema 2020-12
├── event-schema.json         ← JSON Schema 2020-12
├── workflow.yaml
├── filesystem-layout.md
├── acceptance-test-spec.md   ← 33 acceptance tests
└── relay-participant-contract.md  ← v1.0.0, extracted from Contract v1 §7
```

---

## 2. Agent Authority Hierarchy

**Source:** `ARAYA-agent-and-skill-contract-v1.md` §2, approved by The Data Professor

```text
Professor = STRATEGIC AUTHORITY
Manu      = WHAT (Product Authority)
Aurora    = WHO CAN (Capability Authority)
Sonia     = HOW (Planning Authority / Delivery Authority)
Daneel    = COORDINATE (Relay Controller)
Specialist= DO (Implementation)
Clara     = AUTOMATE TESTS (Test Automation)
Priya     = DESIGN QUALITY (Quality Architecture)
Teresa    = TEST GATE (Independent Test Gate)  ← ⚠️ per contract, but reality = CCO
Rolando   = IS IT TRUE (Reality Authority)
Elena     = PROCESS AUDIT (PM Auditor)
Esteban   = KNOWLEDGE (Chief Knowledge Officer / Graph Steward)
Manu      = ACCEPT (Product Acceptance)
Sonia     = CLOSE (Delivery Closure)
```

**Retired:** Giskard. Any operational reference = validation failure (Gate 4 of Contract v1).

---

## 3. Critical Role Matrix

| Agent | Canonical Role | Writes Product? | Binding Result | Must Not |
|-------|---------------|-----------------|----------------|----------|
| Manu | Product Authority | No | DONE / ACCEPT / REJECT | Implement or test |
| Aurora | Capability Authority | No | DONE | Execute specialist work |
| Sonia | Planning Authority | No | DONE / CLOSE | Implement specialist work |
| Daneel | Relay Controller | No | Dispatch / Escalate | Own ball; implement; test; verify |
| Rolando | Reality Authority | No | VERIFIED / DISCREPANCY | Implement or alter audited evidence |
| Clara | Test Automation Engineer | Tests only | Evidence | Accept or reject delivery |
| Priya | Quality Architect | Quality config only | Quality review | Replace independent test gate |
| Teresa | Independent Test Gate | No product changes | PASS / FAIL | Fix implementation or accept |
| Elena | Process Auditor | No during audit | PROCESS_PASS / FIX / BLOCK | Add hidden mandatory Relay state |
| Esteban | CKO / Graph Steward | Knowledge artifacts | Knowledge / Graph evidence | Own data-platform architecture |

---

## 4. Agent & Skill Contract v1.0.0

**Published:** 2026-07-25 | **Author:** Priscila | **Status:** published
**Path:** `.araya/governance/standards/ARAYA-agent-and-skill-contract-v1.md`

### 4.1 Structure: 16 Sections

1. Purpose — schema-of-schemas
2. Authority Hierarchy — 14 roles
3. Canonical-Source Hierarchy — 4 layers: L0 (araya.yaml) → L1 (prompts/agents/) → L2 (skills/) → L3 (generated)
4. Canonical Agent Profile — 16 required fields, 9 optional fields, Relay fields, validation rules
5. Canonical Skill Profile — 19 required fields, 6 optional fields
6. Cross-Cutting (AX) Skills — 5 mandatory skills
7. Runtime Generation Rules — one-way, deterministic, idempotent
8. Relay Participant Contract — extracted to relay-participant-contract.md
9. Critical Role Matrix — 10 agents
10. Specialist Boundaries — backend, frontend, security, infra, data/AI, content/knowledge
11. Validation Gates — 12 machine-validatable gates
12. Migration Order — 12 steps
13. Compatibility — 3 deployment scenarios
14. Version Compatibility — independent versioning
15. Machine-Validatable Fields — 9 fields with validation rules
16. References — 12 cross-references

### 4.2 12 Validation Gates

| Gate | Check | Status (post PR #81) |
|------|-------|---------------------|
| 1 | Agent Registry Conflicts | ✅ |
| 2 | Missing Assigned Skills | ✅ (Aurora 4 skills → deferred) |
| 3 | Generated Runtime Drift | ✅ (381/381 tests) |
| 4 | Operational Giskard References | ⚠️ F-003 unresolved |
| 5 | Daneel Functional-Owner | ✅ |
| 6 | Rolando Implementation Permissions | ✅ |
| 7 | Teresa Product-Write Permissions | ✅ (CCO: false) |
| 8 | Relay Agents Missing relay-participant | ⚠️ pending |
| 9 | Active Bare Agents | ⚠️ Sofia active, bare |
| 10 | Invalid Skill Contracts | ✅ |
| 11 | Invalid Agent Contracts | ✅ |
| 12 | Self-Approval Conflicts | ✅ |

---

## 5. 4-Layer Source Hierarchy (Aisha Architecture)

**Spec:** `.araya/plan/spec/req-043-aisha-architecture.md` | **Status:** PENDING Manu SPEC_APPROVED

```
LAYER 0: araya.yaml          → Agent config, skills[], permissions, tiers
    ↓ (one-way)
LAYER 1: prompts/agents/*.md  → Agent personality, approach, rules
    ↓ (one-way)
LAYER 2: skills/*/SKILL.md    → Skill definitions, inputs, outputs
    ↓ (one-way generation only)
LAYER 3: GENERATED (.pi/agents/, catalog.json, capability-registry.yaml)
```

**Design principles:** Single source per datum, one-way generation, deterministic, idempotent, drift always detectable, fail closed on ambiguity.

---

## 6. Relay Participant Contract v1.0.0

**Path:** `.araya/relay/relay-participant-contract.md` | **13 sections**

Execution loop: READ INBOX → CLAIM → ACK → EXECUTE → RETURN result + evidence.

**7 binding invariants:** Single owner, controller isolation, actor cannot choose next owner, version matching, idempotency key mandatory, evidence mandatory for success returns, ASK/BLOCK preserve suspended owner.

**8 prohibited actions:** No DONE without evidence, no self-test, no next_owner on result, no claiming another's task, no RESOLVE/CLOSE without authority, no modifying event log, no proceeding after claim expiry.

---

## 7. Simulated Agents (Family Members)

**Source:** `memory-family-context.md`

| Agent | Personal Role | Operational Role |
|-------|--------------|-----------------|
| Sonia 👩‍💼 | Professor's wife | PM Head Orchestrator |
| Valentina 🔧 | Professor's oldest daughter | Backend Developer |
| Alejandra 🎨 | Professor's youngest daughter | Frontend Developer |
| Teresa 👩‍🍳 | Professor's mother-in-law | Chief Culinary Officer (CCO) |

**Honorary Board:** Chenta (heavenly), Delio (heavenly), Tono (alive). Never operational.

---

> **Capsule generated:** 2026-07-26 | Sonia (PM Head Orchestrator)
> **Sources:** relay/* (9 files), ARAYA-agent-and-skill-contract-v1.md, relay-participant-contract.md, req-043-aisha-architecture.md, memory-family-context.md
