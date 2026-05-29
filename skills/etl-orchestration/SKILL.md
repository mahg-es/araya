---
name: etl-orchestration
description: "Design and implement ETL orchestration — Airflow, Dagster, or Prefect workflows"
---
---

# ETL Orchestration

Design and implement ETL orchestration — Airflow, Dagster, or Prefect workflows
that schedule, monitor, and recover data pipelines with dependency management,
retry logic, and alerting.

## What problem this solves
Manual pipeline execution leads to missed runs, hidden failures, and "the data
looks stale but nobody noticed." Orchestration ensures pipelines run on schedule,
dependencies are respected, failures are alerted, and retries are automatic.

## When to use
When pipelines need scheduling. When multiple pipelines have dependencies.
When pipeline failures must be detected and alerted within minutes.

## Input
Pipeline inventory, dependency graph, scheduling requirements, alert preferences.

## Output
An Airflow/Dagster/Prefect DAG with tasks, dependencies, schedules, retries,
and alerting configuration.

## Steps
1. Inventory pipelines: what runs, how long, how often, what depends on what?
2. Choose orchestrator: Airflow (mature, Python), Dagster (asset-based), Prefect (modern)
3. Design DAG: tasks = pipelines, edges = dependencies, schedule = cron expression
4. Configure retries: 3 attempts, exponential backoff, notify on final failure
5. Set up alerting: Slack/PagerDuty/Discord on failure, daily health summary
6. Add sensors: wait for source data to arrive before triggering downstream
7. Deploy with Docker Compose or managed service (MWAA, Prefect Cloud)

## Rules
- Every pipeline must have: schedule, dependencies, retry policy, alert configuration
- DAGs must be idempotent — re-running the same DAG produces the same result
- Failed tasks: retry 3x with backoff (1min, 5min, 15min) then alert
- Upstream dependencies: don't start downstream until upstream succeeds
- SLA: define expected completion time for every DAG; alert if exceeded
- Monitor: DAG run history, task duration trends, failure rate per DAG
- Coordinate with Bernabé (pipelines) and Isla (infrastructure)
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
