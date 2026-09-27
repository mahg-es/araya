# Legacy skills review (pe-araya-2609-b-006)

Evidence-based review of the full archived skill corpus. Source of truth:
`archive/araya-legacy-origin-dev-mahg-20260927` (skills/). Machine-readable
companion: `docs/legacy-skills-review.json`.

## Summary

- Legacy skills reviewed: **128**
- KEEP: **3** (already-canonical skills; source of a canonical skill)
- COMBINE: **12** (absorbed into 2 canonical skills)
- REPLACE_BY_OPERATION: **1**
- DROP: **28**
- LATER: **84**

Every legacy skill has exactly one disposition; none silently disappears.
Provenance is retained in `skills/index.json` (`source_provenance`) for each
recovered canonical skill.

## Wave 1 — recovered canonical skills

Recovered in this increment (foundational engineering; compose with the
existing foundation):

1. **`test-authoring`** — author unit/integration/E2E/BDD tests from
   requirements/specs; run via the deterministic `test.execute` operation.
   Combined from: `unit-test`, `integration-test`, `test-case`, `bdd-feature`,
   `tdd-generate`, `e2e-strategy`, `regression`.
2. **`security-review`** — review code/architecture/dependencies for security
   (OWASP/CWE/STRIDE) and audit secrets; deterministic secret/path checks
   delegated to `git.feature-pr-gate`. Combined from: `secure-code`,
   `secure-arch`, `threat-model`, `pentest`, `secrets`.

The full canonical set is now 7 skills: `adr-write`, `tdd-execute`,
`test-authoring`, `security-review`, `git-publication`, `postoffice`,
`ponyexpress`.

## Disposition — KEEP (3)

Already canonical (recovered in b-004); kept as-is, with any operation reuse
noted:

- `adr-write` — already canonical (recovered in b-004)
- `ax-postoffice` — already canonical as `postoffice` (recovered in b-004)
- `tdd-execute` — already canonical (recovered in b-004); execution now delegates to test.execute

## Disposition — COMBINE (12)

Variants of one capability, absorbed into a single canonical skill:

- `bdd-feature` → **test-authoring**
- `e2e-strategy` → **test-authoring**
- `integration-test` → **test-authoring**
- `pentest` → **security-review**
- `regression` → **test-authoring**
- `secrets` → **security-review**
- `secure-arch` → **security-review**
- `secure-code` → **security-review**
- `tdd-generate` → **test-authoring**
- `test-case` → **test-authoring**
- `threat-model` → **security-review**
- `unit-test` → **test-authoring**

## Disposition — REPLACE_BY_OPERATION (1)

Deterministic step now expressed as a reusable operation:

- `coverage` → **test.execute** — deterministic step is now a reusable operation

## Disposition — DROP (28)

Legacy ARAYA governance/runtime/roster machinery, SDLC ceremony, or content now
covered by AX3 or a deterministic operation:

- `agent-design` — legacy roster agent design (removed architecture)
- `agent-topology` — legacy dynamic agent topology (roster machinery)
- `ai-routing` — legacy provider-agnostic routing runtime
- `araya-command-and-delegation-expert` — legacy delegation machinery (replaced by delegation resolver + ephemeral worker)
- `araya-operation-runtime` — mandatory operation-first + OPERATION_GAP ceremony (b-004 explicitly removed)
- `autonomous-execution` — legacy autonomous NL execution triggers
- `ax3` — AX3 contract hierarchy is now the canonical kernel (K01-K10), not a skill
- `capability-registry` — legacy org capability registry (now capabilities/index.json)
- `cr-generate` — Change Request generation (legacy SDLC ceremony)
- `daily-standup` — roster-based daily standup ceremony
- `definition-of-done` — mandatory DoD checklists (AX3 covers done criteria)
- `drr-create` — Delivery Review Reports (legacy SDLC ceremony)
- `gap-analysis` — Gap Analysis Reports (legacy SDLC ceremony)
- `iar-generate` — Impact Analysis Reports (legacy SDLC ceremony)
- `impediment` — roster-based blocker tracking
- `knowledge-graph` — legacy organizational knowledge graph
- `organizational-health` — legacy org health monitoring
- `organizational-knowledge` — legacy org knowledge management
- `reality-verification` — legacy Reality Verification Layer (governance)
- `relay-participant` — legacy relay state machine (replaced by relay L07 handoff)
- `retrospective` — roster-based sprint retrospective ceremony
- `skills-lifecycle` — legacy skills lifecycle governance
- `spof-detection` — legacy single-point-of-failure detection
- `sprint-planning` — roster-based sprint planning ceremony
- `token-efficiency` — legacy global token efficiency framework
- `trajectory-management` — legacy golden trajectory management
- `velocity` — legacy roster-based team velocity tracking
- `workforce-planning` — legacy workforce planning

## Disposition — LATER (84)

Plausible domain value, but no current product need/evidence for this
increment. Not a dumping ground — each will be re-reviewed individually.

- `abc-costing-model`
- `accessibility`
- `analytics-report`
- `animation`
- `api-design`
- `api-document`
- `api-gateway`
- `api-integration`
- `architecture-diagram`
- `asset-management`
- `auth-middleware`
- `brand-audit`
- `brand-compliance`
- `budget-forecasting`
- `cache-strategy`
- `cicd-pipeline`
- `cicd-quality`
- `cloud-deploy`
- `cloud-provision`
- `compliance`
- `component`
- `component-arch`
- `content-calendar`
- `cost-analysis`
- `cost-to-serve`
- `curriculum-planning`
- `daily-note`
- `dashboard-design`
- `data-governance`
- `data-lakehouse-design`
- `data-modeling`
- `data-quality`
- `data-visualization`
- `db-optimization`
- `db-schema`
- `deployment-automation`
- `docker`
- `endpoint`
- `error-handling`
- `etl-orchestration`
- `form-design`
- `geo-branding`
- `kpi-framework`
- `kubernetes`
- `lab-scenario-design`
- `llm-local-deploy`
- `medallion-architecture`
- `message-queue`
- `microservice`
- `model-fine-tuning`
- `monitoring`
- `multi-platform-publish`
- `page-route`
- `performance`
- `performance-test`
- `pkm-workflow`
- `pm-decompose`
- `pm-dependencies`
- `pm-plan`
- `pm-risk`
- `pm-status`
- `po-gap-questionnaire`
- `profitability-lineage`
- `project-planning`
- `rag-pipeline`
- `resource-rightsizing`
- `responsive`
- `sdd-requirements`
- `sdd-vision`
- `seo-optimize`
- `slide-deck-generate`
- `spark-pipeline`
- `state-management`
- `static-site-generate`
- `student-assessment`
- `technical-book`
- `theme-design`
- `training-module`
- `uat-generate`
- `uat-review`
- `usage-metering`
- `vector-search`
- `visual-identity`
- `whale-curve-analyze`

## Provenance policy

- No legacy skill is deleted from history; it remains in the archived Git
  branch.
- The active `skills/` tree contains only the 7 canonical skills.
- `COMBINE` records which legacy skills each canonical skill absorbed
  (`source_provenance` in `skills/index.json`).
- No legacy authority/roster semantics are copied; only procedural value.
