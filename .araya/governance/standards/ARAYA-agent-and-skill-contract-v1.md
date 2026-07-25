# ARAYA Agent and Skill Contract v1

- **Date:** 2026-07-25
- **Author:** Priscila (Technical Writer), per REQ-043 Step 2
- **Version:** 1.0.0
- **Status:** published
- **Applies to:** all permanent, dynamic, and temporary ARAYA agents

---

## 1. Purpose

This contract defines:

1. **What an ARAYA agent is** — its canonical profile, permissions, capabilities, skills, and Relay role.
2. **What a skill is** — its inputs, outputs, required permissions, evidence, failure modes, and handoff rules.
3. **How runtime profiles are generated** — from canonical sources to adapter-specific runtime files, with drift detection.
4. **How agents are validated** — machine-validatable checks that a running agent matches repository truth.

This contract prevents a task from being routed to a runtime identity whose role, permissions, or skills differ from canonical authority. It is the **schema-of-schemas** — the contract that governs agent and skill contracts.

---

## 2. Authority Hierarchy

```text
Professor = STRATEGIC AUTHORITY
Manu      = WHAT (Product Authority)
Aurora    = WHO CAN (Capability Authority)
Sonia     = HOW (Planning Authority)
Daneel    = COORDINATE (Relay Controller)
Specialist= DO (Implementation)
Clara     = AUTOMATE TESTS (Test Automation)
Priya     = DESIGN QUALITY (Quality Architecture)
Teresa    = TEST GATE (Independent Test Gate)
Rolando   = IS IT TRUE (Reality Authority)
Elena     = PROCESS AUDIT (PM Auditor)
Esteban   = KNOWLEDGE (Chief Knowledge Officer / Graph Steward)
Manu      = ACCEPT (Product Acceptance)
Sonia     = CLOSE (Delivery Closure)
```

**Retired:** Giskard is retired and is never an operational actor. Any reference to Giskard as an active agent in any artifact is a validation failure (see Section 10, Gate 4).

---

## 3. Canonical-Source Hierarchy

| Artifact | Authority | Editable | Format |
|---|---|---|---|
| `araya.yaml` | Structured agent registry | Yes, through governed PR | YAML |
| `prompts/agents/*.md` | Narrative role contract | Yes, through governed PR | Markdown |
| `skills/*/SKILL.md` | Skill contract | Yes, through governed PR | Markdown |
| `.araya/governance/standards/ARAYA-agent-and-skill-contract-v1.md` | This contract — schema-of-schemas | Yes, through governed PR | Markdown |
| `.pi/agents/*.md` | Generated Pi runtime profile | **No manual edits** | Markdown |
| Other runtime profiles | Generated adapter output | **No manual edits** | Adapter-specific |
| `.araya/catalog/catalog.json` | Generated index | **No independent edits** | JSON |
| Capability registry | Generated index/view | **No independent edits** | JSON |

**Conflict resolution:** When two sources conflict, generated files are invalid; they never override canonical inputs. The canonical source always wins.

**Order of precedence within canonical sources:**
1. This contract (defines the schema)
2. `araya.yaml` (defines agent instances)
3. `prompts/agents/*.md` (defines narrative intent)
4. `skills/*/SKILL.md` (defines skill contracts)

---

## 4. Canonical Agent Profile

### 4.1 Required Fields

Every agent MUST declare:

| Field | Type | Description |
|---|---|---|
| `name` | string | Lowercase agent identifier. Must match `prompts/agents/<name>.md` filename and `araya.yaml` key. |
| `version` | semver | Agent profile version. Incremented when contract changes. |
| `status` | enum | `active`, `dormant`, `retired`, or `proposed`. |
| `role.title` | string | Human-readable role title. |
| `role.authority` | enum | One of: `STRATEGIC_AUTHORITY`, `PRODUCT_AUTHORITY`, `CAPABILITY_AUTHORITY`, `PLANNING_AUTHORITY`, `COORDINATOR`, `SPECIALIST`, `TEST_AUTOMATION`, `QUALITY_ARCHITECT`, `TEST_GATE`, `REALITY_AUTHORITY`, `PROCESS_AUDITOR`, `KNOWLEDGE_STEWARD`. |
| `role.mission` | string | One-sentence mission statement. |
| `model.tier` | enum | `fast`, `balanced`, or `reasoning`. |
| `model.provider_policy` | enum | `framework-default`, `pinned`, or `allow-fallback`. |
| `permissions` | object | Boolean map: `read`, `write`, `edit`, `bash`, `can_write_code`, `can_approve`, `can_merge_pr`, `can_modify_main`, `can_access_secrets`. |
| `capabilities` | string[] | List of capability tags. |
| `skills` | string[] | List of skill names. Must correspond to `skills/<name>/SKILL.md`. |
| `relay` | object | Relay participant contract fields (see Section 4.3). |
| `boundaries` | object | `must_not` (string[]), `consult` (map of domain → agent). |
| `runtime.targets` | string[] | Which adapters/runtimes this agent runs on. |
| `runtime.generated` | boolean | Whether runtime profiles are generated (must be `true` for Framework agents). |
| `provenance.registry` | string | Path to canonical registry entry. |

### 4.2 Optional Fields

| Field | Type | Description |
|---|---|---|
| `emoji` | string | Single-emoji visual identifier. |
| `max_turns` | integer | Maximum agent turns per task. Default: 30. |
| `model.primary_provider` | string | Provider identifier (e.g., `pi.dev`). Default: framework default. |
| `model.reasoning_effort` | enum | `low`, `medium`, `high`. Only for `reasoning` tier. |
| `execution_mode` | enum | `deterministic` or `adaptive`. Default: framework default. |
| `description` | string | Longer description. Required for `dormant` agents. |
| `permissions.can_emit_binding` | boolean | Whether agent can emit binding governance acts. Default: `false`. |
| `permissions.can_produce_deliverables` | boolean | Whether agent produces delivery artifacts. Default: matches `can_write_code`. |

### 4.3 Relay Fields (Required When `relay` Present)

| Field | Type | Description |
|---|---|---|
| `relay.can_receive_states` | string[] | Which states this agent can be assigned as functional owner. Values from Relay state enum. |
| `relay.allowed_results` | string[] | Which result events this agent may emit. Values from Relay event_type enum. |
| `relay.cannot_select_next_owner` | boolean | Must be `true` for all agents except Daneel. |
| `relay.evidence_required` | boolean | Whether evidence is required on DONE return. Must be `true` for SPECIALIST, TERESA, ROLANDO. |

### 4.4 Full Profile Example (Valentina)

```yaml
name: valentina
version: 1.0.0
status: active
emoji: "🔧"

role:
  title: Backend Developer
  authority: SPECIALIST
  mission: Implement backend application behavior from approved contracts.

model:
  tier: balanced
  provider_policy: framework-default
  primary_provider: pi.dev

max_turns: 30

permissions:
  read: true
  write: true
  edit: true
  bash: true
  can_write_code: true
  can_approve: false
  can_merge_pr: false
  can_modify_main: false
  can_access_secrets: false

capabilities:
  - backend_implementation
  - api_implementation
  - database_change_implementation

skills:
  - api-design
  - db-schema
  - endpoint
  - auth-middleware
  - error-handling
  - relay-participant
  - ax3
  - araya-command-and-delegation-expert
  - ax-postoffice
  - token-efficiency

relay:
  can_receive_states: [EXECUTING]
  allowed_results: [DONE, ASK, BLOCK]
  cannot_select_next_owner: true
  evidence_required: true

boundaries:
  must_not:
    - approve_own_delivery
    - perform_independent_reality_verification
    - merge_to_main
  consult:
    security: diana
    architecture: aisha
    testing: clara

runtime:
  targets: [pi, codex, claude-cli, agy]
  generated: true

provenance:
  registry: araya.yaml
  narrative: prompts/agents/valentina.md
  generated_hash: null
```

### 4.5 Agent JSON Schema

Agent profiles MUST validate against the schema at:

```text
.araya/governance/schemas/agent-profile.schema.json
```

The schema enforces:
- All required fields present and correctly typed
- `status` is a valid enum value
- `role.authority` is a valid enum value
- `skills[]` entries match `^[a-z][a-z0-9-]*$` (kebab-case)
- `relay` fields consistent with role authority
- `can_receive_states` values are valid Relay state names
- `allowed_results` values are valid Relay event types
- `cannot_select_next_owner` is `true` unless `role.authority == COORDINATOR`

---

## 5. Canonical Skill Profile

### 5.1 Required Fields

Every skill MUST declare:

| Field | Type | Description |
|---|---|---|
| `name` | string | Lowercase kebab-case skill identifier. Must match directory name `skills/<name>/`. |
| `version` | semver | Skill contract version. |
| `status` | enum | `active`, `proposed`, `deprecated`, or `retired`. |
| `owner` | string | Agent name responsible for this skill's contract. |
| `description` | string | One-line summary. |
| `purpose.problem` | string | What problem this skill solves. |
| `purpose.outcome` | string | What successful execution produces. |
| `when_to_use` | string[] | Conditions that trigger this skill. |
| `when_not_to_use` | string[] | Anti-conditions. |
| `requires.skills` | string[] | Skills required before this one (may be empty). |
| `permissions.required` | string[] | Tool permissions needed: `read`, `write`, `edit`, `bash`. |
| `risk_level` | enum | `low`, `medium`, `high`, or `critical`. |
| `inputs.required` | string[] | Required inputs (may be empty). |
| `outputs.required` | string[] | Required outputs. |
| `evidence_required` | string[] | Evidence artifacts produced. |
| `side_effects` | string[] | What this skill modifies. |
| `failure_modes` | string[] | Known failure scenarios. |
| `rollback.strategy` | string | How to undo. |
| `handoff_to.success` | string | Agent name to hand off to on success. |
| `handoff_to.relay_result` | string | Relay event type on success (e.g., `DONE`). |
| `handoff_to.blocked` | string | Agent name to hand off to when blocked (usually `daneel`). |

### 5.2 Optional Fields

| Field | Type | Description |
|---|---|---|
| `model_tier` | enum | Recommended model tier: `fast`, `balanced`, or `reasoning`. Default: `balanced`. |
| `requires.artifacts` | string[] | Required artifacts (file types or names). |
| `conflicts_with` | string[] | Skills that must not run concurrently. |
| `acceptance_tests` | string[] | Test categories applied. |
| `max_turns` | integer | Recommended max turns. |

### 5.3 Full Profile Example (endpoint)

```yaml
name: endpoint
version: 1.0.0
status: active
owner: valentina
description: Implement an approved API endpoint contract.
model_tier: balanced

purpose:
  problem: Convert an approved API contract into tested backend behavior.
  outcome: Working endpoint, tests, and implementation evidence.

when_to_use:
  - An approved API contract requires implementation.
when_not_to_use:
  - Architecture has not been approved.
  - The task is only an API design review.

requires:
  skills: [api-design, error-handling]
  artifacts: [approved-openapi-contract]
conflicts_with: []

permissions:
  required: [read, write, edit, bash]
risk_level: medium

inputs:
  required:
    - api_contract
    - acceptance_criteria
outputs:
  required:
    - source_changes
    - automated_tests
    - implementation_receipt

evidence_required:
  - commit_sha
  - test_report
  - changed_file_list

side_effects:
  - modifies_source
  - may_modify_database_contract
failure_modes:
  - invalid_contract
  - test_failure
  - security_dependency
rollback:
  strategy: revert_feature_commit

handoff_to:
  success: clara
  relay_result: DONE
  blocked: daneel

acceptance_tests:
  - schema_validation
  - positive_behavior
  - negative_behavior
  - authorization
  - regression
```

### 5.4 Skill JSON Schema

Skill profiles MUST validate against the schema at:

```text
.araya/governance/schemas/skill-profile.schema.json
```

---

## 6. Cross-Cutting (AX) Skills

Cross-cutting (AX) skills are mandatory for **every** ARAYA agent. No agent is exempt. These skills govern the agent's relationship to the framework itself.

| Skill | Purpose | Governing Doc |
|---|---|---|
| `araya-command-and-delegation-expert` | Command discovery, capability-aware execution, mandatory specialist delegation | `skills/araya-command-and-delegation-expert/SKILL.md` |
| `ax3` | AX3 contract hierarchy — read before editing, update after meaningful changes | `skills/ax3/SKILL.md` |
| `ax-postoffice` | PostOffice communication protocol | `skills/ax-postoffice/SKILL.md` |
| `token-efficiency` | Token consumption optimization | `skills/token-efficiency/SKILL.md` |
| `relay-participant` | Relay protocol participation (required for all Relay-capable agents) | `.araya/relay/relay-participant-contract.md` |

**Validation rule:** An agent profile missing any of the first four AX skills is invalid. Missing `relay-participant` is valid only for non-Relay agents (agents with no `relay` section).

**Dynamic/temporary agents** (status `dormant`, activated by Capability Officer pipeline) MUST carry AX skills at activation time.

---

## 7. Runtime Generation Rules

### 7.1 Generation Principles

1. Runtime profiles are generated exclusively from canonical sources (Section 3).
2. Runtime-specific syntax and format may differ across adapters, but **authority, permissions, capabilities, and skills may not**.
3. A generated runtime profile may **add** adapter-specific configuration (e.g., temperature, system prompt fragments) but may **never weaken** a canonical restriction.
4. Generation is **idempotent**: running generation twice with the same canonical inputs produces identical output.

### 7.2 Required Generated Metadata

Every generated file MUST record:

| Field | Example |
|---|---|
| Generator name | `araya-runtime-generator v2.1.0` |
| Source files | `araya.yaml`, `prompts/agents/valentina.md` |
| Source hashes | `sha256:abc123...` |
| Generated timestamp | `2026-07-25T14:00:00Z` |
| Do-not-edit marker | `# GENERATED — DO NOT EDIT` |

### 7.3 Drift Detection

The `araya-runtime generate --check` command:

1. Reads all canonical sources.
2. Computes expected generated output.
3. Compares against actual generated files.
4. Returns **exit 0** if identical, **exit 1** if drift detected.
5. On drift, identifies exact fields that differ.

### 7.4 Generation Failures

Generation MUST fail (non-zero exit) when:

- A referenced skill does not exist in `skills/*/SKILL.md`.
- An agent requests a permission not in the canonical profile.
- A canonical source fails schema validation.

---

## 8. Relay Participant Contract

The full Relay participant contract is extracted to its own canonical document:

> **`.araya/relay/relay-participant-contract.md`** — defines the READ INBOX → CLAIM → ACK → EXECUTE → RETURN lifecycle, binding invariants, evidence requirements, and ASK/BLOCK protocol.

All agents with a `relay` section in their profile MUST carry the `relay-participant` skill. The extracted contract is binding on all Relay participants.

---

## 9. Critical Role Matrix

| Agent | Canonical Role | Writes Product? | Binding Result | Must Not |
|---|---|---|---|---|
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

## 10. Specialist Boundaries

### 10.1 Backend
- **Aisha:** Architecture and ADRs; read-only for delivery code.
- **Valentina:** Implementation; no independent architecture acceptance.

### 10.2 Frontend
- **Lin:** Server-rendered frontend architecture (XHTML/Jinja2/Tailwind/HTMX).
- **Alejandra:** Frontend implementation.
- **SPA use requires explicit ADR** approved by Lin.

### 10.3 Security
- **Diana:** Threat modeling, architecture security review, code-security review.
- Risk severity determines gate; not every informational finding blocks delivery.

### 10.4 Infrastructure
- **Isla:** Containers (Docker), Traefik, CI/CD, observability, secrets management, backup/restore, host controls.

### 10.5 Data / AI
- **Junia:** Platform architecture and data-product contracts.
- **Bernabé:** Pipeline implementation (Spark, ETL, medallion).
- **María:** AI/ML implementation and evaluation (RAG, vector search, fine-tuning).
- **Lidia:** Profitability methodology (ABC costing, whale curve, cost-to-serve).
- **Pablo:** BI semantic/visual consumption (dashboards, KPIs, analytics).
- **Mateo:** Cloud and AI FinOps (cost analysis, usage metering, budget forecasting).

### 10.6 Content / Knowledge
- **Priscila:** Technical documentation (ADRs, API docs, architecture diagrams, slide decks, technical books).
- **Lucas:** Content strategy (SEO, GEO, multi-platform publishing, content calendars).
- **Eunice:** Learning design (lab scenarios, assessments, training modules, curricula).
- **Aquila:** Static-site implementation (site generation, theme design, deployment automation).
- **Dorcas:** Brand governance (compliance, visual identity, audits, asset management).
- **Esteban:** Organizational knowledge graph (daily notes, PKM workflows, trajectory management).

---

## 11. Validation Gates

A Framework release candidate is **invalid** when any condition below is true. Each gate is machine-validatable.

### Gate 1: Agent Registry Conflicts
```text
any two entries in araya.yaml with same name but different:
  - role.authority
  - permissions.can_approve
  - skills[] (set difference)
```
**Check:** `count(registry_conflicts) == 0`

### Gate 2: Missing Assigned Skills
```text
for each agent in araya.yaml:
  for each skill in agent.skills:
    skills/<skill>/SKILL.md must exist
```
**Check:** `count(missing_skills) == 0`

### Gate 3: Generated Runtime Drift
```text
araya-runtime generate --check
```
**Check:** `exit_code == 0`

### Gate 4: Operational Giskard References
```text
grep -r "giskard" prompts/agents/ araya.yaml
  must return zero results (excluding comments marking as "retired")
```
**Check:** `count(operational_giskard_refs) == 0`

### Gate 5: Daneel Functional-Owner Assignments
```text
for each agent in araya.yaml where role.authority == COORDINATOR:
  agent.relay.can_receive_states must be empty
```
**Check:** `count(daneel_functional_owner_assignments) == 0`

### Gate 6: Rolando Implementation Permissions
```text
rolando.permissions.can_write_code must be false
```
**Check:** `rolando_can_write_code == false`

### Gate 7: Teresa Product-Write Permissions
```text
teresa.permissions.can_write_code must be false
```
**Check:** `teresa_can_write_code == false`

### Gate 8: Relay-Capable Agents Missing relay-participant
```text
for each agent in araya.yaml where agent.relay is present:
  "relay-participant" must be in agent.skills[]
```
**Check:** `count(relay_agents_missing_relay_participant) == 0`

### Gate 9: Active Bare Agents
```text
for each agent in araya.yaml where status == "active":
  agent.skills[] must contain at least one non-AX skill
  (AX skills: ax3, araya-command-and-delegation-expert, ax-postoffice, token-efficiency, relay-participant)
```
**Check:** `count(active_bare_agents) == 0`

### Gate 10: Invalid Skill Contracts
```text
for each skill in skills/*/SKILL.md:
  skill must validate against skill-profile.schema.json
```
**Check:** `count(invalid_skill_contracts) == 0`

### Gate 11: Invalid Agent Contracts
```text
for each agent in araya.yaml:
  agent must validate against agent-profile.schema.json
```
**Check:** `count(invalid_agent_contracts) == 0`

### Gate 12: Self-Approval Conflicts
```text
for each agent:
  if agent.relay.can_receive_states contains EXECUTING
    and agent.relay.can_receive_states contains TESTING → CONFLICT
  if agent.relay.can_receive_states contains EXECUTING
    and agent.relay.can_receive_states contains VERIFYING → CONFLICT
  if agent.relay.can_receive_states contains TESTING
    and agent.relay.can_receive_states contains VERIFYING → CONFLICT
  if agent.relay.can_receive_states contains VERIFYING
    and agent.relay.can_receive_states contains ACCEPTING → CONFLICT
```
**Check:** `count(self_approval_conflicts) == 0`

---

## 12. Migration Order

1. Correct organizational authority (add Elena, Esteban; retire Giskard).
2. Correct Clara / Priya / Teresa roles and permissions.
3. Correct Elena (Process Auditor) and Esteban (CKO / Graph Steward).
4. Add `relay-participant` skill to all Relay-capable agents.
5. Resolve missing skills (every skill reference has a `SKILL.md`).
6. Generate runtime files for all adapters.
7. Add drift tests (`araya-runtime generate --check`).
8. Correct specialist stack defaults (model tiers, max turns).
9. Normalize remaining skills in batches (validate against skill schema).
10. Regenerate catalog and capability registry.
11. Teresa executes validation suite.
12. Rolando verifies exact SHA.

---

## 13. Compatibility

This contract belongs to ARAYA Framework and must function in all deployment scenarios:

| Scenario | Description |
|---|---|
| **Framework alone** | `mahg-es/araya` with no governed projects. Agent contracts and skill contracts are defined but not exercised in delivery. |
| **Framework + one governed project** | `mahg-es/araya` + one project (e.g., `mahg-pms`). Full Relay pipeline for the project. |
| **Framework + Portfolio** | `mahg-es/araya` + `araya-portfolio` + multiple governed projects. Portfolio aggregates views; Framework defines protocol. |

**Portfolio independence:** Portfolio is never required for agent runtime or project-local Relay execution. A governed project with only Framework is fully operational.

---

## 14. Version Compatibility

- **Agent profile version:** Changes to an agent's `skills[]`, `permissions`, `relay`, or `boundaries` MUST increment the agent version.
- **Skill profile version:** Changes to a skill's inputs, outputs, evidence, failure modes, or handoff MUST increment the skill version.
- **Contract version:** This contract (`ARAYA-agent-and-skill-contract-v1.md`) versions independently. A v2 of this contract may add fields but MUST accept v1 profiles (backward-compatible).

---

## 15. Machine-Validatable Fields Summary

| Field | Location | Type | Validation |
|---|---|---|---|
| Agent `name` | `araya.yaml` | `string` | Must match `^[a-z][a-z0-9-]*$` and `prompts/agents/<name>.md` |
| Agent `status` | `araya.yaml` | `enum` | `active`, `dormant`, `retired`, `proposed` |
| Agent `role.authority` | `araya.yaml` | `enum` | 12 valid values (Section 2) |
| Agent `skills[]` | `araya.yaml` | `string[]` | Each must have `skills/<name>/SKILL.md` |
| Agent `relay.can_receive_states[]` | `araya.yaml` | `string[]` | Must be valid Relay state names |
| Agent `relay.allowed_results[]` | `araya.yaml` | `string[]` | Must be valid Relay event types |
| Skill `name` | `skills/*/SKILL.md` | `string` | Must match directory name |
| Skill `status` | `skills/*/SKILL.md` | `enum` | `active`, `proposed`, `deprecated`, `retired` |
| Skill `risk_level` | `skills/*/SKILL.md` | `enum` | `low`, `medium`, `high`, `critical` |

---

## 16. References

- **Agent JSON Schema:** `.araya/governance/schemas/agent-profile.schema.json`
- **Skill JSON Schema:** `.araya/governance/schemas/skill-profile.schema.json`
- **Relay Participant Contract:** `.araya/relay/relay-participant-contract.md`
- **Relay State Machine:** `.araya/relay/state-machine.md`
- **Relay Transition Table:** `.araya/relay/transition-table.md`
- **Relay Claim Contract:** `.araya/relay/claim-contract.md`
- **Relay Task Schema:** `.araya/relay/task-schema.json`
- **Relay Event Schema:** `.araya/relay/event-schema.json`
- **Agent Tool Access Standard:** `.araya/governance/standards/agent-tool-access-standard.md`
- **Agent Registry:** `araya.yaml`
- **Cross-Cutting Skills:** Section 6 of this document
