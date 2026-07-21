---
name: ai-routing
description: "ARAYA Provider-Agnostic AI Routing — capability-based model selection, cost governance, and explainable routing decisions."
---

# AI Routing

Provider-agnostic model selection engine. Routes work to the best execution
engine based on task requirements, capability matching, cost governance, and
organizational technology preferences — while keeping every routing decision
explainable.

## What problem this solves

Without routing rules, tasks hit arbitrary models — a reasoning task runs on
an economy model, or a trivial task burns premium tokens. Cost balloons.
Quality suffers. Nobody can explain why a model was chosen.

## When to Use

- Before delegating any task that requires an LLM
- When cost anomalies are detected
- When The Data Professor asks "why did this use that model?"
- During provider onboarding or model retirement

## Routing Strategies

| Strategy | Optimizes For |
|----------|--------------|
| FAST | Latency — smallest/fastest model capable of the task |
| BALANCED | Quality vs. cost tradeoff |
| REASONING | Deep analysis — largest context, highest reasoning |
| ECONOMY | Lowest cost model capable of the task |
| ENTERPRISE | Governance-first — respects all constitutional rules |

## Cost Classes

| Class | Description | Example Tasks |
|-------|-------------|---------------|
| LOW | Most economical | Documentation, formatting, simple lookups |
| MEDIUM | Balanced | Standard development, testing, review |
| HIGH | Premium reasoning | Architecture, security, planning |
| PREMIUM | Maximum capability | Mission-critical analysis |

## Input

- Task description (natural language)
- Required capabilities (from capability registry)
- Strategy preference (default: BALANCED)
- Provider availability and rate-limit state

## Output

```markdown
## Routing Decision

- **Agent:** {agent name}
- **Provider:** {provider}
- **Model:** {model id}
- **Strategy:** {FAST|BALANCED|REASONING|ECONOMY|ENTERPRISE}
- **Cost Class:** {LOW|MEDIUM|HIGH|PREMIUM}
- **Reasoning:** {explanation — why this model for this task}
```

## Steps

1. Receive task and identify required capabilities
2. Match capabilities against agent registry — find qualified agents
3. Filter providers/models by: capability coverage, rate-limit state, recent failures, cost tier
4. Apply routing strategy to rank remaining options
5. Select best-fit model and document reasoning
6. Record routing decision in run artifacts

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
- Never route to a provider at or near TPM quota
- Provider failures in last 60 minutes automatically deprioritize that provider

## Done Criteria

- [ ] Task capabilities identified and matched
- [ ] Routing decision documented with reasoning
- [ ] Cost class justified
- [ ] Decision recorded in run artifacts
