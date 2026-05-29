---
name: araya-v2-vision
description: "ARAYA v2.0 — AI-native SDLC orchestration framework with enterprise governance"
---

# ARAYA v2.0 — SDD Vision

## Project Name
ARAYA v2.0 — AI-Native SDLC Orchestration Framework

## Description

ARAYA evolves from a multi-agent pi extension into a complete AI-native Software
Development Lifecycle orchestration framework. v2.0 adds enterprise governance,
delivery modes, workflow policies, execution budgets, circuit breakers, model
tiering, and autonomous inter-agent delegation — transforming ARAYA from a
"team of agents you can talk to" into a "GitHub Actions + PMO + Jira + SDLC
governance platform" that plans, executes, reviews, and validates software
delivery with full traceability.

## Objectives

1. **Sonia as Head Orchestrator** — PMO + workflow controller + governance coordinator, running review roundtables autonomously without human relay
2. **Delivery Modes** — full/standard/quick/review/repair with appropriate gate selection per mode
3. **Model Tiering** — capability-based model selection (fast/balanced/reasoning), not hardcoded names
4. **Execution Governance** — budgets prevent runaway costs, circuit breakers stop infinite loops
5. **Structured Outputs** — every agent returns a standardized JSON contract with confidence scoring
6. **Audit Trail** — trace IDs, evidence artifacts, run storage for full reproducibility
7. **Human Checkpoints** — approval required for destructive operations, schema changes, security modifications

## Success Metrics

1. `/araya run --mode standard "Add JWT auth"` produces complete SDD→BDD→TDD→implementation with evidence
2. Model selection uses capability tiers (fast/balanced/reasoning), never hardcoded provider model IDs
3. Execution budgets halt runs that exceed cost/time thresholds
4. Circuit breakers prevent infinite retry loops
5. Confidence scores flow through all agent responses
6. Evidence artifacts captured for every run
7. Human approval gates block destructive operations
8. Safe mode enables dry-run planning without file modifications
9. Every execution has trace_id for debugging
10. Sonia orchestrates by workflow manifest, not hardcoded flows

## Scope

### In Scope (MVP1)
- Sonia orchestrator enhancements (roundtable protocol already in prompt)
- Delivery modes (full/standard/quick/review/repair) with gate configuration
- Model tiering (fast/balanced/reasoning) in araya.yaml
- Basic delegation using existing `/araya <agent> "task"` command
- Structured JSON contract definition
- Execution budgets (cost, time, tokens, turns)
- Circuit breakers (max failures, max retries, stop conditions)
- Workflow Policy Engine (auto/conservative/balanced/aggressive)
- Quality Gate Engine (mode-based gate selection)
- Updated araya.yaml v2.0 schema

### Out of Scope (MVP1)
- Worktree isolation for execution agents
- Full telemetry/observability pipeline
- Reporting engine (manual reports via pm-status for now)
- Confidence scoring engine (placeholder, returns 1.0)
- Memory/state persistence engine
- Safe mode (dry-run) enforcement at OS level
- Sub-agent infrastructure (pi limitation)
- Agent definitions migration to .pi/agents/ (stays in prompts/agents/)

## Constraints

- pi.dev model management — all supported models available
- No writes to disk in safe mode
- Execution budgets enforced: $2.00 max, 20 min max, 4 parallel agents max
- Branch governance: main protected, dev for integration, feature/* for execution
- All artifacts in .araya/ directory structure

## Stakeholders

- **The Data Professor** — Executive sponsor, final approver
- **Sonia** — PM/Head Orchestrator
- **Daneel** — Implementation lead
- **23 ARAYA agents** — Specialized execution agents
