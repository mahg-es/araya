# Legacy skills review (pe-araya-2609-b-007)

Full-source, evidence-based review of every legacy `SKILL.md` body (not
frontmatter-only). Source of truth: `archive/araya-legacy-origin-dev-mahg-20260927`
(skills/). Machine-readable: `docs/legacy-skills-review.json`.

## Summary

- Legacy skills reviewed (full body): **128**
- KEEP: **3** — already-canonical, distinct procedural reasoning
- COMBINE: **12** — absorbed into 2 canonical skills (provenance retained)
- REPLACE_BY_OPERATION: **1** — deterministic step now reusable code
- DROP: **28** — legacy machinery / SDLC ceremony / roster coupling
- LATER: **84** — each with an individual, evidence-based reason

Every record carries purpose, inputs, outputs, dependencies,
deterministic_code_available, overlap_with_other_skills,
overlap_with_operations, overlap_with_AX3, current_product_value, disposition,
canonical_target, reason, source_provenance.

## Wave 1 — canonical skills (validated, unchanged)

1. **`test-authoring`** ← unit-test, integration-test, test-case, bdd-feature,
   tdd-generate, e2e-strategy, regression (runs via `test.execute`).
2. **`security-review`** ← secure-code, secure-arch, threat-model, pentest,
   secrets (deterministic secret/path check → `git.feature-pr-gate`).

7 canonical skills total: adr-write, tdd-execute, test-authoring,
security-review, git-publication, postoffice, ponyexpress.

## Deep deduplication

Identified near-duplicate / parameterizable-variant groups (noted in
`overlap_with_other_skills`; only the Wave-1 groups are combined now, the rest
remain LATER for a future wave):

- **Testing**: `unit-test`, `integration-test`, `test-case`, `bdd-feature`, `tdd-generate`, `e2e-strategy`, `regression`, `coverage`, `tdd-execute`
- **Security**: `secure-code`, `secure-arch`, `threat-model`, `pentest`, `secrets`
- **Cloud IaC**: `cloud-deploy`, `cloud-provision`
- **Frontend components**: `component`, `component-arch`
- **Data modeling**: `data-modeling`, `db-schema`
- **Lakehouse/medallion**: `data-lakehouse-design`, `medallion-architecture`
- **PKM**: `daily-note`, `pkm-workflow`
- **Project planning**: `project-planning`, `pm-plan`
- **FinOps**: `cost-analysis`, `usage-metering`, `resource-rightsizing`, `budget-forecasting`
- **SEO/GEO**: `geo-branding`, `seo-optimize`
- **SDLC vision/requirements**: `sdd-vision`, `sdd-requirements`

## Disposition — KEEP (3)

- `adr-write` → **adr-write** — Distinct procedural reasoning: author Architecture Decision Records (context, options, decision, consequences). Foundational, already canonical.
- `ax-postoffice` → **postoffice** — Distinct procedural reasoning: the agent-to-agent coordination channel (consult/write, advisory never a gate). Already canonical as `postoffice`.
- `tdd-execute` → **tdd-execute** — Distinct procedural reasoning: run a suite and report red/green; the deterministic run step now delegates to test.execute (operation reuse). Already canonical.

## Disposition — COMBINE (12)

- `bdd-feature` → **test-authoring** — Variant of test authoring (Gherkin executable specs; depends on sdd-requirements). Combined into `test-authoring`.
- `e2e-strategy` → **test-authoring** — Variant of test authoring (end-to-end strategy). Combined into `test-authoring`.
- `integration-test` → **test-authoring** — Variant of test authoring (component interactions). Combined into `test-authoring`.
- `pentest` → **security-review** — Variant of security review (SAST/DAST scanning + manual adversarial testing). Combined into `security-review`.
- `regression` → **test-authoring** — Variant of test authoring (regression suite design). Combined into `test-authoring`.
- `secrets` → **security-review** — Variant of security review (secrets hygiene; deterministic detection now git.feature-pr-gate). Combined into `security-review`.
- `secure-arch` → **security-review** — Variant of security review (zero-trust architecture review). Combined into `security-review`.
- `secure-code` → **security-review** — Variant of security review (OWASP/CWE code review). Combined with 4 security peers into `security-review`.
- `tdd-generate` → **test-authoring** — Variant of test authoring (generate test code from Gherkin). Combined into `test-authoring`.
- `test-case` → **test-authoring** — Variant of test authoring (structured cases from requirements). Combined into `test-authoring`.
- `threat-model` → **security-review** — Variant of security review (STRIDE threat modeling). Combined into `security-review`.
- `unit-test` → **test-authoring** — Variant of test authoring (isolated unit behavior). Combined with 6 testing peers into `test-authoring`; run via test.execute.

## Disposition — REPLACE_BY_OPERATION (1)

- `coverage` → **test.execute** — Deterministic coverage measurement (run coverage tool + parse report); now `test.execute` with a coverage command. No distinct reasoning to preserve.

## Disposition — DROP (28)

- `agent-design` — Legacy roster: design multi-agent systems for the removed named-persona architecture. No current product value.
- `agent-topology` — Legacy roster machinery: dynamic agent topology/team assembly over the removed roster.
- `ai-routing` — Legacy runtime: provider-agnostic AI routing + capability registry. Removed global runtime.
- `araya-command-and-delegation-expert` — Legacy delegation machinery (catalog consultation, gap registration). Replaced by delegation resolver + ephemeral worker.
- `araya-operation-runtime` — Mandatory operation-first + OPERATION_GAP ceremony; b-004 explicitly removed mandatory pre-task lookup.
- `autonomous-execution` — Legacy autonomous NL execution triggers + run persistence. Removed runtime.
- `ax3` — AX3 contract hierarchy is now the canonical kernel (K01-K10), not a skill.
- `capability-registry` — Legacy organizational capability registry; now capabilities/index.json.
- `cr-generate` — Change Request generation; legacy SDLC report ceremony (Manu approval flow).
- `daily-standup` — Roster-based daily standup ceremony.
- `definition-of-done` — Mandatory DoD checklists + confidence-score ceremony; AX3 already covers done criteria.
- `drr-create` — Delivery Review Reports; legacy SDLC report ceremony.
- `gap-analysis` — Gap Analysis Reports; legacy SDLC report ceremony.
- `iar-generate` — Impact Analysis Reports; legacy SDLC report ceremony.
- `impediment` — Roster-based blocker tracking tied to standup/roles.
- `knowledge-graph` — Legacy organizational knowledge graph/impact engine. Removed.
- `organizational-health` — Legacy org-health monitoring over the roster. Removed.
- `organizational-knowledge` — Legacy org knowledge management. Removed.
- `reality-verification` — Legacy Reality Verification Layer (5-tier delivery governance). Covered by AX3.
- `relay-participant` — Legacy relay state-machine participant (state ownership/transitions). Replaced by relay L07 handoff.
- `retrospective` — Roster-based sprint retrospective ceremony.
- `skills-lifecycle` — Legacy skills lifecycle governance over the removed registry.
- `spof-detection` — Legacy single-point-of-failure detection over the roster. Removed.
- `sprint-planning` — Roster-based sprint planning ceremony.
- `token-efficiency` — Legacy global token efficiency framework. Removed runtime.
- `trajectory-management` — Legacy golden trajectory management. Removed.
- `velocity` — Roster-based sprint velocity tracking; agile ceremony over removed roles.
- `workforce-planning` — Legacy workforce planning over the roster. Removed.

## Disposition — LATER (84)

- `abc-costing-model` — Activity-Based Costing model for profitability attribution. Finance domain; deferred — not foundational, no current product need.
- `accessibility` — WCAG 2.2 AA audit/remediation for UI. Frontend-quality domain; deferred.
- `analytics-report` — Generate executive/operational analytics reports. BI domain; deferred.
- `animation` — Purposeful motion/micro-interactions. Frontend design; deferred.
- `api-design` — Design REST/GraphQL APIs (OpenAPI 3.1). Backend design; deferred.
- `api-document` — Generate API reference docs. Backend docs; deferred.
- `api-gateway` — Design/configure API gateways. Backend infra; deferred.
- `api-integration` — Connect frontend to backend (typed clients). Frontend/backend glue; deferred.
- `architecture-diagram` — C4/Mermaid architecture diagrams. Foundational-adjacent but not Wave 1; deferred.
- `asset-management` — Organize brand assets. Design ops; deferred.
- `auth-middleware` — Implement authn/authz middleware. Backend security-adjacent; deferred.
- `brand-audit` — Quarterly brand audits. Marketing; deferred.
- `brand-compliance` — Enforce brand compliance. Marketing; deferred.
- `budget-forecasting` — Forecast cloud/infra budgets. FinOps; deferred.
- `cache-strategy` — Design caching strategies. Backend performance; deferred.
- `cicd-pipeline` — Generate CI/CD pipeline configs. DevOps; deferred.
- `cicd-quality` — Quality gates in CI/CD (overlaps git.merge-gate/feature-pr-gate). DevOps; deferred.
- `cloud-deploy` — Provision/deploy cloud infra (Terraform/Pulumi). IaC; near-duplicate of cloud-provision; deferred.
- `cloud-provision` — Provision cloud infra (Terraform/Pulumi). IaC; near-duplicate of cloud-deploy; deferred.
- `compliance` — Regulatory compliance assessment (GDPR/SOC2/HIPAA). Governance-adjacent; deferred.
- `component` — Create reusable UI components. Frontend; deferred.
- `component-arch` — Design component architecture/design systems. Frontend; overlaps `component`; deferred.
- `content-calendar` — Editorial content calendars. Marketing ops; deferred.
- `cost-analysis` — Cloud cost analysis by service/project. FinOps; overlaps usage-metering/resource-rightsizing; deferred.
- `cost-to-serve` — Cost-to-serve modeling per customer/channel. Finance; depends on ABC model; deferred.
- `curriculum-planning` — Design multi-course curricula. Education; deferred.
- `daily-note` — Capture structured daily knowledge (PKM). Overlaps pkm-workflow; deferred.
- `dashboard-design` — BI dashboard design. Data/BI; deferred.
- `data-governance` — Data governance frameworks. Data platform; deferred.
- `data-lakehouse-design` — Lakehouse architecture (medallion). Data platform; overlaps medallion-architecture; deferred.
- `data-modeling` — Dimensional/star data modeling. Data; overlaps db-schema; deferred.
- `data-quality` — Data quality validation (Great Expectations). Data; deferred.
- `data-visualization` — Chart/visualization selection. Data/BI; deferred.
- `db-optimization` — DB query/index optimization. Backend performance; deferred.
- `db-schema` — Design DB schemas/ERDs. Backend; overlaps data-modeling; deferred.
- `deployment-automation` — Automate deployments. DevOps; overlaps cicd-pipeline; deferred.
- `docker` — Generate Dockerfiles/compose. Infra; deferred.
- `endpoint` — Implement REST endpoints. Backend; depends on api-design/db-schema; deferred.
- `error-handling` — Standardized error-handling patterns. Backend code quality; deferred.
- `etl-orchestration` — ETL orchestration (Airflow/Dagster/Prefect). Data; deferred.
- `form-design` — Accessible validated forms. Frontend; deferred.
- `geo-branding` — Generative Engine Optimization. Marketing; overlaps seo-optimize; deferred.
- `kpi-framework` — Cascading KPI frameworks. Business/BI; deferred.
- `kubernetes` — K8s manifests/Helm. Infra; deferred.
- `lab-scenario-design` — Design hands-on educational labs. Education; deferred.
- `llm-local-deploy` — Local LLM serving (Ollama/vLLM). ML infra; deferred.
- `medallion-architecture` — Medallion (bronze/silver/gold) architecture. Data; overlaps data-lakehouse-design; deferred.
- `message-queue` — Async messaging architecture. Backend; deferred.
- `microservice` — Microservice architecture design. Backend; deferred.
- `model-fine-tuning` — Fine-tune open LLMs (LoRA/QLoRA). ML; deferred.
- `monitoring` — Observability (logs/metrics/traces). Ops; deferred.
- `multi-platform-publish` — Syndicate content across platforms. Marketing; deferred.
- `page-route` — Page routing/navigation. Frontend; deferred.
- `performance` — Frontend performance optimization. Frontend; deferred.
- `performance-test` — Load/stress/soak testing. Performance engineering; deferred.
- `pkm-workflow` — Personal knowledge management workflows. Overlaps daily-note; deferred.
- `pm-decompose` — Break work into deliverable subtasks (AWU). PM; deferred.
- `pm-dependencies` — Task dependency DAG/critical path. PM; deferred.
- `pm-plan` — Sprint/project planning. PM; overlaps project-planning; deferred.
- `pm-risk` — Project risk register. PM; deferred.
- `pm-status` — Sprint/project status reports. PM; deferred.
- `po-gap-questionnaire` — PO requirements-gap questionnaire (Manu audit flow). PM/product; deferred.
- `profitability-lineage` — Trace profitability source→activity→customer. Finance; depends on ABC/whale-curve; deferred.
- `project-planning` — Project charter/roadmap/milestones. PM; overlaps pm-plan; deferred.
- `rag-pipeline` — RAG pipeline (chunk/embed/retrieve). AI engineering; deferred.
- `resource-rightsizing` — Cloud resource rightsizing. FinOps; overlaps cost-analysis; deferred.
- `responsive` — Mobile-first responsive design. Frontend; deferred.
- `sdd-requirements` — Functional/non-functional requirements from vision. SDLC; overlaps sdd-vision; deferred.
- `sdd-vision` — Define project vision from business problem. SDLC; deferred.
- `seo-optimize` — SEO keyword/on-page optimization. Marketing; deferred.
- `slide-deck-generate` — Presentation slide decks. Content; deferred.
- `spark-pipeline` — Apache Spark ETL pipelines. Data; deferred.
- `state-management` — Frontend state management. Frontend; deferred.
- `static-site-generate` — Generate static sites from Markdown. Content/web; deferred.
- `student-assessment` — Competency-based assessments. Education; deferred.
- `technical-book` — Write technical book chapters. Content; deferred.
- `theme-design` — CSS theme systems/design tokens. Frontend design; deferred.
- `training-module` — Modular training courses. Education; deferred.
- `uat-generate` — Generate UAT packages. Legacy SDLC ceremony; deferred (no current acceptance workflow).
- `uat-review` — Review UAT packages. Legacy SDLC ceremony; deferred.
- `usage-metering` — Track cloud resource consumption. FinOps; overlaps cost-analysis; deferred.
- `vector-search` — Vector similarity search (embeddings/HNSW). AI/data; deferred.
- `visual-identity` — Visual identity systems. Design; deferred.
- `whale-curve-analyze` — Whale Curve customer profitability. Finance; depends on ABC model; deferred.

## Provenance policy

- No legacy skill deleted from history; it remains in the archived Git branch.
- Active `skills/` tree contains only the 7 canonical skills.
- COMBINE records absorbed sources in `source_provenance` (skills/index.json).
- No legacy authority/roster semantics copied; only procedural value.
