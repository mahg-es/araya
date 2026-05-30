---
name: capability-registry
description: "ARAYA organizational capability registry — authoritative source of agents, skills, domains, and coverage for workforce planning."
---

# Capability Registry

Maintain the authoritative registry of all ARAYA agents, their skills,
domains, capabilities, and coverage. This is the source of truth for
workforce planning and assignment guardrails.

## What problem this solves

Without a registry, tasks get assigned to unqualified agents. Skills
gaps go undetected until they block a delivery.

## When to Use

- When a new agent or skill is added
- Before any task delegation
- When Aurora performs gap analysis

## Registry Format

```yaml
agents:
  - name: sonia
    role: PM Head Orchestrator
    domain: leadership
    capabilities: [orchestration, governance, reporting, risk_management]
    skills: [pm-plan, pm-decompose, pm-dependencies, pm-risk, pm-status, ...]
    tier: reasoning
```

## Steps

1. Inventory all agents from araya.yaml
2. Map each agent to domains, capabilities, and skills
3. Detect coverage gaps: required capability with no owning agent
4. Write to `.araya/organization/capability-registry.yaml`

## Done Criteria

- [ ] All 25 agents registered
- [ ] All skills mapped to agents
- [ ] Coverage analysis complete
- [ ] Gaps documented
