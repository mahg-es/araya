---
name: ai-routing
description: "ARAYA Provider-Agnostic AI Routing — capability-based model selection, cost governance, and explainable routing decisions."
---

# AI Routing Engine

Agents own expertise. Models provide execution capacity. Route work to the
best execution engine while preserving organizational governance.

## Routing Strategies

| Strategy | Optimizes For |
|----------|--------------|
| FAST | Latency — smallest/fastest model capable of the task |
| BALANCED | Quality vs. cost tradeoff |
| REASONING | Deep analysis — largest context, highest reasoning |
| ECONOMY | Lowest cost model capable of the task |
| ENTERPRISE | Governance-first — respects all constitutional rules |

## Cost Classes

| Class | Description |
|-------|-------------|
| LOW | Most economical — simple tasks, documentation, formatting |
| MEDIUM | Balanced — standard development, testing, review |
| HIGH | Premium reasoning — architecture, security, planning |
| PREMIUM | Maximum capability — mission-critical analysis |

## Commands

- `/araya route "<task>"` — recommend agent + provider + model for a task
- `/araya route --explain` — show why a routing decision was made
- `/araya provider:list` — list registered providers and their models
- `/araya model:list` — list models with capabilities and routing classes

## Rules

- Capability matching is mandatory — no routing without capability verification
- Routing must be explainable — every decision has documented reasoning
- Cost optimization must not violate quality requirements
- Routing respects organizational technology preferences
- Historical success patterns (trajectories) inform routing decisions
