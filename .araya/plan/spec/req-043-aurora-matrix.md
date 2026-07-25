# REQ-043 — Agent-to-Skill-to-Permission-to-Relay-State Matrix

**Author:** Aurora 🌟 (CHRO)
**Generated:** 2026-07-21
**Sources:** `araya.yaml` v0.13.0, `catalog.json` v1.0.0, `prompts/agents/*.md` (30 files), `.araya/relay/*` (9 files)
**Status:** ANALYSIS ONLY — NO implementation

---

## 1. Complete Agent Matrix

Every agent. Every dimension. One source of truth.

### Legend

| Column | Meaning |
|--------|---------|
| **Registry Role** | Role declared in `araya.yaml` |
| **Prompt Role** | Role declared in `prompts/agents/<agent>.md` |
| **Runtime Role** | Functional role in Relay state machine (`actor_role` enum) |
| **Permissions** | From `araya.yaml`: `can_write_code`, `can_merge_pr`, `can_approve_review`, `can_emit_binding`, `can_produce_deliverables` |
| **Declared Skills** | Skills listed in `araya.yaml` |
| **Installed Skills** | Skills with actual `SKILL.md` on disk |
| **Missing Skills** | Skills declared but no `SKILL.md` exists |
| **Relay States** | States where this agent can be `owner.actor` |
| **Relay Events** | Event types this agent can emit per state machine |

### 1.1 Governance Layer — Core Relay Participants

| Agent | Registry Role | Prompt Role | Runtime Role | Tier | Permissions | Declared Skills | Missing Skills | Relay States |
|-------|--------------|-------------|--------------|------|-------------|-----------------|----------------|-------------|
| **manu** 👑 | Product Owner | Product Owner (The Data Professor's proxy) | MANU | reasoning | write:❌ merge:❌ approve:✅ | sdd-vision, sdd-requirements, test-case, bdd-feature, pm-status, project-planning, po-gap-questionnaire, definition-of-done, drr-create, uat-review, token-efficiency, ax3, araya-command-and-delegation-expert, ax-postoffice | — | INTENT, ACCEPTING |
| **aurora** 🌟 | Capability Officer | Chief Human Resources Officer (CHRO) | AURORA | reasoning | write:❌ merge:❌ approve:❌ | capability-registry, gap-analysis, workforce-planning, agent-topology, **skills-lifecycle**, **spof-detection**, **hiring-recommendations**, **organizational-health**, ai-routing, ax3, araya-command-and-delegation-expert, ax-postoffice | skills-lifecycle, spof-detection, hiring-recommendations, organizational-health | ROUTING |
| **sonia** 👩‍💼 | Program Director & PMO Head | PM Head Orchestrator | SONIA | reasoning | write:❌ merge:❌ approve:✅ | pm-plan, pm-dependencies, pm-risk, pm-status, project-planning, drr-create, iar-generate, cr-generate, autonomous-execution, pm-decompose, ax3, araya-command-and-delegation-expert, ax-postoffice | — | PLANNING, CLOSING |
| **rolando** 🛡️ | Reality Authority (Verifier) | Reality Authority (Verifier) | ROLANDO | reasoning | write:❌ merge:❌ approve:✅ bind:✅ deliverables:❌ | reality-verification, ax3, araya-command-and-delegation-expert, ax-postoffice | — | VERIFYING |
| **daneel** 🔨 | Delegated Executor | Delegated Executor | DANEEL (COORDINATOR) | balanced | write:✅ merge:❌ approve:❌ | ax3, araya-command-and-delegation-expert, ax-postoffice | — | *(controller only — never functional owner)* |

### 1.2 Specialist Bench — Relay: EXECUTING

| Agent | Registry Role | Prompt Role | Runtime Role | Tier | Permissions | Declared Skills | Missing Skills | Relay States |
|-------|--------------|-------------|--------------|------|-------------|-----------------|----------------|-------------|
| **valentina** 🔧 | Backend Developer | Backend Developer | SPECIALIST | balanced | write:✅ merge:❌ | api-design, db-schema, endpoint, auth-middleware, error-handling, ax3, araya-command-and-delegation-expert, ax-postoffice | — | EXECUTING |
| **alejandra** 🎨 | Frontend Developer | Frontend Developer | SPECIALIST | balanced | write:✅ merge:❌ | component, form-design, page-route, api-integration, responsive, ax3, araya-command-and-delegation-expert, ax-postoffice | — | EXECUTING |
| **bernabe** ⚙️ | Data Engineer | Data Engineer | SPECIALIST | balanced | write:✅ merge:❌ | spark-pipeline, etl-orchestration, data-quality, medallion-architecture, ax3, araya-command-and-delegation-expert, ax-postoffice | — | EXECUTING |
| **maria** 🧠 | AI/ML Engineer | AI/ML Engineer | SPECIALIST | reasoning | write:✅ merge:❌ | llm-local-deploy, rag-pipeline, vector-search, agent-design, model-fine-tuning, ax3, araya-command-and-delegation-expert, ax-postoffice | — | EXECUTING |
| **aquila** 🏗️ | Static Site Engineer | Static Site Engineer | SPECIALIST | balanced | write:✅ merge:❌ | static-site-generate, theme-design, seo-optimize, deployment-automation, ax3, araya-command-and-delegation-expert, ax-postoffice | — | EXECUTING |

### 1.3 Quality & Testing Layer — Relay: TESTING

| Agent | Registry Role | Prompt Role | Runtime Role | Tier | Permissions | Declared Skills | Missing Skills | Relay States |
|-------|--------------|-------------|--------------|------|-------------|-----------------|----------------|-------------|
| **clara** 🔍 | QA Engineer | QA Engineer | SPECIALIST *(not TERESA per Relay)* | balanced | write:✅ merge:❌ | unit-test, integration-test, test-case, regression, coverage, tdd-generate, tdd-execute, uat-generate, token-efficiency, ax3, araya-command-and-delegation-expert, ax-postoffice | — | *(should be TESTING — see §3.4)* |
| **priya** 🧪 | QA Lead | QA Lead | SPECIALIST | balanced | write:❌ merge:❌ approve:✅ | performance-test, e2e-strategy, cicd-quality, uat-review, token-efficiency, ax3, araya-command-and-delegation-expert, ax-postoffice | — | *(test strategy, not TESTING gate)* |

### 1.4 Governance & Advisory Layer

| Agent | Registry Role | Prompt Role | Tier | Permissions | Declared Skills | Missing Skills | Relay States |
|-------|--------------|-------------|------|-------------|-----------------|----------------|-------------|
| **teresa** 👩‍🍳 | Chief Culinary Officer (CCO) | **QA Engineer** ⚠️ | balanced | write:❌ merge:❌ approve:✅ | uat-review, token-efficiency, ax3, araya-command-and-delegation-expert, ax-postoffice | — | *(Relay says TESTING — see §3.4)* |
| **diana** 🛡️ | Cybersecurity Specialist | Cybersecurity Specialist | reasoning | write:❌ merge:❌ approve:✅ | threat-model, secure-arch, secure-code, pentest, compliance, secrets, ax3, araya-command-and-delegation-expert, ax-postoffice | — | *(security review phase, not Relay)* |
| **elena** 📋 | Scrum Master + PM Auditor | Scrum Master + PM Auditor | balanced | write:❌ merge:❌ approve:✅ | daily-standup, sprint-planning, retrospective, impediment, velocity, definition-of-done, reality-verification, ax3, araya-command-and-delegation-expert, ax-postoffice | — | *(PM audit, not Relay)* |
| **aisha** 🔷 | Backend Architect | Backend Architect | reasoning | write:❌ merge:❌ approve:✅ | microservice, api-gateway, cache-strategy, message-queue, db-optimization, ax3, araya-command-and-delegation-expert, ax-postoffice | — | *(architecture review, not Relay)* |
| **lin** 🎨 | Frontend Architect | Frontend Architect | reasoning | write:❌ merge:❌ approve:✅ | component-arch, animation, performance, accessibility, state-management, ax3, araya-command-and-delegation-expert, ax-postoffice | — | *(architecture review, not Relay)* |
| **junia** ☁️ | Data Platform Architect | Data Platform Architect | reasoning | write:❌ merge:❌ approve:✅ | data-lakehouse-design, spark-pipeline, cloud-provision, data-modeling, data-governance, ax3, araya-command-and-delegation-expert, ax-postoffice | — | *(architecture review, not Relay)* |
| **isla** 🖥️ | Infra Architect | Infra Architect | reasoning | write:✅ merge:❌ | docker, kubernetes, cicd-pipeline, cloud-deploy, monitoring, ax3, araya-command-and-delegation-expert, ax-postoffice | — | *(infra execution, not Relay)* |

### 1.5 Domain Specialists (Non-Relay)

| Agent | Registry Role | Prompt Role | Tier | Permissions | Declared Skills | Missing Skills |
|-------|--------------|-------------|------|-------------|-----------------|----------------|
| **lidia** 💰 | Profitability Domain Expert | Profitability Analyst | reasoning | write:❌ merge:❌ approve:✅ | abc-costing-model, whale-curve-analyze, cost-to-serve, profitability-lineage, ax3, araya-command-and-delegation-expert, ax-postoffice | — |
| **pablo** 📊 | BI & Analytics Lead | BI & Analytics Lead | balanced | write:❌ merge:❌ | dashboard-design, data-visualization, kpi-framework, analytics-report, ax3, araya-command-and-delegation-expert, ax-postoffice | — |
| **mateo** 📈 | FinOps Specialist | FinOps Specialist | balanced | write:❌ merge:❌ | cost-analysis, usage-metering, resource-rightsizing, budget-forecasting, token-efficiency, ax3, araya-command-and-delegation-expert, ax-postoffice | — |
| **lucas** ✍️ | Content Strategist | Content Strategist | balanced | write:❌ merge:❌ | seo-optimize, geo-branding, multi-platform-publish, content-calendar, ax3, araya-command-and-delegation-expert, ax-postoffice | — |
| **priscila** 📚 | Technical Writer | Technical Writer | balanced | write:✅ merge:❌ | adr-write, api-document, architecture-diagram, slide-deck-generate, technical-book, ax3, araya-command-and-delegation-expert, ax-postoffice | — |
| **eunice** 🎓 | Educational Designer | Educational Designer | balanced | write:✅ merge:❌ | lab-scenario-design, student-assessment, training-module, curriculum-planning, ax3, araya-command-and-delegation-expert, ax-postoffice | — |
| **esteban** 🗂️ | Chief Knowledge Officer & Graph Builder Steward | Knowledge Manager | balanced | write:✅ merge:❌ | daily-note, knowledge-graph, project-planning, pkm-workflow, organizational-knowledge, trajectory-management, ax3, araya-command-and-delegation-expert, ax-postoffice | — |
| **dorcas** 🎯 | Brand Governance Lead | Brand Governance Lead | balanced | write:❌ merge:❌ | brand-compliance, visual-identity, brand-audit, asset-management, ax3, araya-command-and-delegation-expert, ax-postoffice | — |

### 1.6 Bare / Dormant Agents

| Agent | Registry Role | Prompt Role | Status | Permissions | Declared Skills | Missing Skills |
|-------|--------------|-------------|--------|-------------|-----------------|----------------|
| **neo** ⚡ | Dynamic Capability Agent | Dynamic Capability Agent | **dormant** | write:✅ approve:❌ | ax3, araya-command-and-delegation-expert, ax-postoffice | *(bare — no domain skills)* |
| **trinity** ⚡ | Dynamic Capability Agent | Dynamic Capability Agent | **dormant** | write:✅ approve:❌ | ax3, araya-command-and-delegation-expert, ax-postoffice | *(bare — no domain skills)* |
| **sofia** 💬 | AI Assistant | AI Assistant | active | *(no permissions declared)* | ax3, araya-command-and-delegation-expert, ax-postoffice | *(bare — no domain skills, runs on fast tier)* |

---

## 2. Skill Overlap Analysis

### 2.1 Intentional / Acceptable Overlaps

| Skill | Agents | Assessment |
|-------|--------|-----------|
| **ax3** | ALL 30 agents | ✅ AX cross-cutting — required for all |
| **araya-command-and-delegation-expert** | ALL 30 agents | ✅ AX cross-cutting — required for all |
| **ax-postoffice** | ALL 30 agents | ✅ AX cross-cutting — required for all |
| **token-efficiency** | manu, clara, teresa, priya, mateo | ✅ Acceptable — FinOps and quality awareness |
| **uat-review** | manu, teresa, priya | ✅ Acceptable — PO, CCO, QA Lead all validate |
| **project-planning** | manu, sonia, esteban | ✅ Acceptable — different contexts (PO vs PM vs KM) |
| **spark-pipeline** | junia, bernabe | ✅ Acceptable — architect + implementer |
| **seo-optimize** | lucas, aquila | ✅ Acceptable — content strategy + technical implementation |
| **definition-of-done** | manu, elena | ✅ Acceptable — PO defines, PM auditor enforces |
| **reality-verification** | rolando, elena | ⚠️ Overlap — Rolando is the primary; Elena has it for PM audit scope. Needs clarification: does Elena do reality verification or just process audit? |
| **test-case** | manu, clara | ✅ Acceptable — PO defines ACs, QA designs test cases |
| **drr-create** | manu, sonia | ✅ Acceptable — PO reviews, Sonia creates the formal DRR |
| **pm-status** | manu, sonia | ✅ Acceptable — PO reviews status, PM generates reports |

### 2.2 Suspicious / Potentially Conflicting Overlaps

| Skill | Agents | Issue |
|-------|--------|-------|
| **daily-note** | esteban only | ✅ No conflict — single owner |
| **daily-standup** | elena only | ✅ No conflict — single owner |

---

## 3. Critical Findings

### 3.1 ⛔ FINDING F-001: The Teresa/Clara Identity Crisis

**Severity: CRITICAL — Blocks Relay operation**

**The Problem:**

Three different sources give three different views of "Teresa":

| Source | Teresa's Role | Teresa's Skills |
|--------|--------------|-----------------|
| `araya.yaml` | Chief Culinary Officer (CCO) | uat-review, token-efficiency, ax3, araya-command-and-delegation-expert, ax-postoffice |
| `prompts/agents/teresa.md` | **QA Engineer** | unit-test, integration-test, test-case, regression, coverage, tdd-generate, tdd-execute |
| `prompts/agents/sonia.md` (team roster) | **QA Engineer** | unit-test, integration-test, test-case, regression, coverage, tdd-generate, tdd-execute |
| `.araya/relay/state-machine.md` | TESTING state owner | *(references "Teresa" as TESTING gate)* |
| `.araya/relay/workflow.yaml` | `owner_role: TERESA` for TESTING | — |

**Meanwhile, the actual QA Engineer is Clara:**

| Source | Clara's Role | Clara's Skills |
|--------|-------------|----------------|
| `araya.yaml` | QA Engineer | unit-test, integration-test, test-case, regression, coverage, tdd-generate, tdd-execute, uat-generate, token-efficiency |
| `prompts/agents/clara.md` | QA Engineer | *(references her skills by name, says she "joined because Teresa was promoted to CCO")* |

**Impact:**
1. **Relay references "Teresa" as TESTING owner** — but the actual Teresa (CCO) has `unit-test`, `integration-test`, `tdd-generate`, `tdd-execute` missing from her skills. She cannot execute the TESTING phase.
2. **Sonia's prompt still deploys Teresa** for `tdd/tests` phase — she would be deploying the CCO instead of the QA Engineer.
3. **Clara has all the right skills** (unit-test through uat-generate) but is never referenced in Relay or Sonia's phase map.
4. **The prompt file `teresa.md` still describes her as QA Engineer** — this is a stale file that contradicts `araya.yaml`.

**Recommendation:**
- [1] Update `.araya/relay/state-machine.md`: rename TESTING owner from "Teresa" to "Clara" (or keep TERESA role label but map to Clara).
- [2] Update `.araya/relay/workflow.yaml`: change `owner_role: TERESA` to `owner_role: CLARA` for TESTING state.
- [3] Update `prompts/agents/teresa.md`: rewrite to reflect CCO role with uat-review, token-efficiency. Include her history ("formerly QA Engineer, promoted to CCO").
- [4] Update `prompts/agents/sonia.md`: update team roster — replace Teresa (QA) with Clara (QA), add Teresa (CCO) in advisory role.
- [5] Update `araya.yaml`: ensure Clara's capabilities include `testing_execution` and she is positioned as the primary TESTING owner.
- [6] Relay event schema `actor_role` enum: assess whether "TERESA" role label should remain as a functional role that maps to Clara, or be renamed.

### 3.2 ⛔ FINDING F-002: 4 Missing Skill Files (Aurora's Skills)

**Severity: HIGH — Blocks Aurora's full operational capability**

Aurora declares 12 skills in `araya.yaml`. 4 have no `SKILL.md` file:

| Skill | Status in Catalog | Source Files | Impact |
|-------|------------------|-------------|--------|
| **skills-lifecycle** | `not_installed` | `[]` | Cannot manage skill creation, deprecation, retirement workflows |
| **spof-detection** | `not_installed` | `[]` | Cannot detect Single Points of Failure in organizational design |
| **hiring-recommendations** | `not_installed` | `[]` | Cannot generate structured hiring recommendations |
| **organizational-health** | `not_installed` | `[]` | Cannot assess organizational health metrics |

**Note:** The `catalog.json` reports `skills_undeclared: 4` but all 4 have status `not_installed` (not `undeclared`). This appears to be a catalog classification nuance — they are declared in `araya.yaml` but have no SKILL.md, making them "declared but not installed."

**Recommendation:**
- [A] Create the 4 SKILL.md files for Aurora (extend existing agent).
- [B] Remove the 4 skills from `araya.yaml` if they're aspirational and not yet needed.
- [C] Defer — flag as technical debt, Aurora operates with her 8 installed skills.

### 3.3 ⛔ FINDING F-003: Giskard Operational References

**Severity: HIGH — Governance conflict between araya.yaml and Relay**

**Giskard is retired.** Relay acceptance test T-030 states:
> "Operational Giskard reference causes BLOCK: Giskard is retired — no operational role"

Yet two active agents still declare reporting lines to Giskard:

| Agent | Source | Reference |
|-------|--------|-----------|
| **Rolando** | `araya.yaml` line 184 | "reports to Giskard, not delivery ops" |
| **Rolando** | `prompts/agents/rolando.md` line 4, 40 | "reports to Giskard, not to delivery operations" |
| **Daneel** | `araya.yaml` line 204 | "reports to Giskard, routes to the specialist bench" |
| **Daneel** | `prompts/agents/daneel.md` line 3, 15, 38 | "reports to Giskard", "Receive execution requests from Giskard", "Report to Giskard" |

**Giskard has:** No entry in `araya.yaml`, no prompt file, no skills, no permissions, no Relay role.

**Impact:**
1. If Rolando or Daneel attempt to "report to Giskard" operationally, Relay would BLOCK per T-030.
2. Chain of command is undefined — who do Rolando and Daneel report to now?
3. Daneel "receives execution requests from Giskard" — this is impossible if Giskard is retired.

**Recommendation:**
- [1] Remove all "reports to Giskard" language from `araya.yaml` and both prompt files.
- [2] Define new reporting line: Rolando and Daneel → Sonia (operational) or The Data Professor (governance).
- [3] Update Daneel's charter: "Receive execution requests from [Sonia/Professor]" instead of Giskard.
- [4] Relay acceptance test T-030 should remain as a guard — but agents must not trip it.

### 3.4 ⚠️ FINDING F-004: Relay's "Teresa" Role in actor_role Enum

**Severity: MEDIUM — Schema vs. reality mismatch**

The `event-schema.json` `actor_role` enum has: `["PROFESSOR", "MANU", "AURORA", "SONIA", "SPECIALIST", "TERESA", "ROLANDO", "DANEEL"]`

There is no `CLARA` in the enum. If the TESTING phase is executed by Clara (the actual QA Engineer), the event schema would reject her role.

**Recommendation:**
- Add `CLARA` to the `actor_role` enum, or change `TERESA` to represent the functional TESTING role (mapped to Clara).

### 3.5 ⚠️ FINDING F-005: 3 Bare Agents (No Domain Skills)

**Severity: MEDIUM — Capacity risk**

| Agent | Domain Skills | Status | Can Execute? |
|-------|-------------|--------|-------------|
| **Neo** | 0 (only AX) | dormant | ❌ Cannot be activated without skill injection |
| **Trinity** | 0 (only AX) | dormant | ❌ Cannot be activated without skill injection |
| **Sofia** | 0 (only AX) | active | ❌ Can only triage/delegate, no domain execution |

Bare agents can route/delegate (via `araya-command-and-delegation-expert`) but cannot execute domain work. This is by design for Neo/Trinity (dynamic, mission-scoped), but Sofia's lack of domain skills limits her utility as a first-point-of-contact.

### 3.6 ⚠️ FINDING F-006: Daneel Owner Violations (Preventive)

**Severity: LOW — Already guarded by Relay invariants**

Relay invariants prevent Daneel from becoming functional owner:
- Invariant 4: `controller.actor != task.owner.actor`
- Invariant 7: "Daneel never is functional owner of ASK or BLOCKED"
- T-002: Controller never functional owner
- T-006: Daneel cannot substitute functional owner
- T-007: ASK/BLOCK: Daneel does not become owner

Daneel's `araya.yaml` permissions: `can_write_code: true`, `can_merge_pr: false`. He CAN write code but should only route/coordinate per his charter. The Relay invariants prevent him from occupying functional states, but there is no enforcement that prevents him from writing code outside the Relay context. This is a **governance gap** — Daneel's `can_write_code: true` contradicts his charter of "you route tasks — you do not execute specialist work directly."

**Recommendation:**
- Consider setting `can_write_code: false` for Daneel to enforce his routing-only charter at the permission level.

### 3.7 ℹ️ FINDING F-007: Rolando Implementation Permissions

**Severity: INFO — Already correctly configured**

Rolando's permissions match his Reality Authority role:
- `can_write_code: false` ✅ — He verifies, does not modify code
- `can_produce_deliverables: false` ✅ — He audits, does not deliver
- `can_emit_binding: true` ✅ — His dispositions (VERIFIED/DISCREPANCY/REJECTED) are binding
- `can_approve_review: true` ✅ — He approves verification

His prompt is consistent: "read-only for code — you verify, you do not modify." No conflicts found.

### 3.8 ⛔ FINDING F-008: Teresa (CCO) Implementation Permissions

**Severity: HIGH — Role/permission mismatch with stale prompt**

| Dimension | araya.yaml (CCO) | prompts/agents/teresa.md (QA) |
|-----------|-----------------|------------------------------|
| Role | Chief Culinary Officer | QA Engineer |
| can_write_code | ❌ false | *(QA Engineer implies test code writing)* |
| can_approve_review | ✅ true | — |
| Skills | uat-review, token-efficiency | unit-test, integration-test, test-case, regression, coverage, tdd-generate, tdd-execute |

**The prompt file is stale.** If Teresa is invoked with her prompt file, she will:
1. Believe she is a QA Engineer (which she no longer is)
2. Attempt to write test code (which she does not have permission to do per `araya.yaml`)
3. Not know about her CCO advisory role

**Impact:** Any invocation of Teresa via her prompt will produce incorrect behavior. She will attempt QA work she cannot perform and neglect her CCO duties.

**Recommendation (same as F-001):**
- Update `prompts/agents/teresa.md` to reflect CCO role, advisory board membership, and uat-review/token-efficiency skills.
- Her CCO role: "Board-level. Advisory. The Professor's mother-in-law." She reviews UAT packages and advises on quality, but Clara executes the testing.

---

## 4. Relay State Coverage Matrix

### 4.1 Happy Path Coverage

| Relay State | Required Owner | Actual Agent | Coverage |
|-------------|---------------|-------------|----------|
| INTENT | MANU | manu 👑 | ✅ COVERED — manu has sdd-vision, sdd-requirements |
| ROUTING | AURORA | aurora 🌟 | ⚠️ PARTIAL — 4 of 12 skills missing |
| PLANNING | SONIA | sonia 👩‍💼 | ✅ COVERED — full PMO skill set |
| EXECUTING | SPECIALIST | valentina, alejandra, bernabe, maria, aquila | ✅ COVERED — specialist bench |
| TESTING | TERESA (per Relay) | **Clara** (actual QA) | ❌ MISMATCH — see F-001 |
| VERIFYING | ROLANDO | rolando 🛡️ | ✅ COVERED — reality-verification |
| ACCEPTING | MANU | manu 👑 | ✅ COVERED — uat-review, drr-create |
| CLOSING | SONIA | sonia 👩‍💼 | ✅ COVERED — cr-generate, iar-generate |
| CLOSED | (none) | — | ✅ TERMINAL |

### 4.2 Exceptional State Coverage

| Relay State | Controller | Coverage |
|-------------|-----------|----------|
| ASK | Daneel | ✅ COVERED — Daneel dispatches to waiting_on authority |
| BLOCKED | Daneel | ✅ COVERED — Daneel dispatches to waiting_on authority |

### 4.3 Event Emitter Coverage

| Event Type | Required Role | Agents Who Can Emit |
|-----------|--------------|---------------------|
| DONE (INTENT→ROUTING) | MANU | manu |
| DONE (ROUTING→PLANNING) | AURORA | aurora |
| DONE (PLANNING→EXECUTING) | SONIA | sonia |
| DONE (EXECUTING→TESTING) | SPECIALIST | valentina, alejandra, bernabe, maria, aquila |
| PASS (TESTING→VERIFYING) | TERESA (per Relay) | ❌ clara (actual) — mismatch |
| FAIL (TESTING→EXECUTING) | TERESA (per Relay) | ❌ clara (actual) — mismatch |
| VERIFIED (VERIFYING→ACCEPTING) | ROLANDO | rolando |
| DISCREPANCY (VERIFYING→PLANNING) | ROLANDO | rolando |
| ACCEPT (ACCEPTING→CLOSING) | MANU | manu |
| REJECT (ACCEPTING→PLANNING) | MANU | manu |
| CLOSE (CLOSING→CLOSED) | SONIA | sonia |
| ASK (any→ASK) | any functional owner | all core participants |
| BLOCK (any→BLOCKED) | any functional owner | all core participants |
| RESOLVE (ASK/BLOCKED→suspended) | DANEEL | daneel |
| ESCALATE (ASK/BLOCKED→BLOCKED) | DANEEL | daneel |

---

## 5. Catalog vs. Reality Drift Summary

| Catalog Stat | Value | Reality Check |
|-------------|-------|---------------|
| `skills_undeclared` | 4 | Actually 4 `not_installed` (Aurora's missing SKILL.md files) |
| `skills_orphan` | 0 | ✅ Clean |
| `agents_bare` | 2 | Understated — actually 3 (Neo, Trinity, Sofia) |
| `agents_active` | 26 | Correct |
| `agents_dormant` | 2 | Correct (Neo, Trinity) |
| `drift_detected` | false | ⚠️ FALSE NEGATIVE — Teresa/Clara, Giskard, and Aurora's missing skills constitute drift |

---

## 6. Priority Action Items (for The Data Professor's Approval)

### CRITICAL — Blocks Relay operation

| ID | Finding | Recommendation |
|----|---------|---------------|
| F-001 | Teresa/Clara identity crisis | Update Relay to use Clara for TESTING; rewrite Teresa's prompt to CCO; update Sonia's roster |
| F-003 | Giskard operational references | Remove Giskard reporting lines from Rolando/Daneel; define new chain of command |

### HIGH — Blocks agent capability

| ID | Finding | Recommendation |
|----|---------|---------------|
| F-002 | 4 missing Aurora skill files | [A] Create SKILL.md files, [B] Remove from araya.yaml, or [C] Defer as tech debt |
| F-008 | Teresa prompt file is stale | Rewrite to CCO role (same as F-001 item) |

### MEDIUM — Governance gaps

| ID | Finding | Recommendation |
|----|---------|---------------|
| F-004 | Relay schema missing CLARA in actor_role | Add CLARA to event-schema.json enum |
| F-005 | 3 bare agents | Assess Sofia's domain gap; Neo/Trinity are bare by design |
| F-006 | Daneel can_write_code = true | Consider setting to false to enforce routing-only charter |

### INFO — No action needed

| ID | Finding |
|----|---------|
| F-007 | Rolando permissions are correctly configured |

---

## 7. Methodology

This matrix was built by:
1. Extracting all 30 agents from `araya.yaml` (permissions, skills, roles, capabilities)
2. Cross-referencing each against `prompts/agents/<agent>.md` (prompt-declared role and skills)
3. Mapping each agent to Relay state machine roles from `state-machine.md`, `transition-table.md`, `workflow.yaml`
4. Validating all skills against `catalog.json` and filesystem (SKILL.md existence)
5. Checking Relay schemas (`event-schema.json`, `task-schema.json`) for role enum consistency
6. Applying Relay invariants (self-approval prevention, controller isolation, evidence requirements)
7. Identifying drift between `araya.yaml`, prompt files, Relay artifacts, and catalog

---

*This is an analysis document. No files have been modified. The Data Professor's approval is required before any changes are implemented.*
