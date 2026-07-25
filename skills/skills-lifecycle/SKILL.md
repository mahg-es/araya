---
name: skills-lifecycle
description: "ARAYA skills lifecycle management — govern creation, maturity, deprecation, and retirement of organizational skills."
---

# Skills Lifecycle Management

Govern the full lifecycle of every ARAYA skill from creation through
maturity to deprecation and retirement. Ensures the skills portfolio
remains current, relevant, and free of stale entries.

## What problem this solves

Without lifecycle governance, skills accumulate indefinitely. Stale
skills pollute the registry, duplicate skills fragment capability,
and deprecated skills get assigned to new agents. This skill ensures
every skill has a known state and a path to retirement.

## When to Use

- When a new skill is proposed
- When a skill has been superseded by a better one
- When a skill has zero assigned agents and no planned use
- During quarterly skills portfolio review

## Skill Lifecycle States

```
Proposed → Active → Deprecated → Retired
                ↓
            Superseded → Deprecated → Retired
```

| State | Meaning | Action Required |
|-------|---------|----------------|
| Proposed | Under review, not yet approved | CHRO review |
| Active | In use, has SKILL.md, assigned to agents | Maintain |
| Superseded | Replaced by better skill | Migrate agents, deprecate |
| Deprecated | Still usable but discouraged | Warn on use, plan removal |
| Retired | Removed from registry | Purge from agent assignments |

## Input

- Proposal for new skill (name, description, domain)
- Deprecation notice for existing skill
- Quarterly skills audit trigger

## Output

- Lifecycle state transition record
- Updated skill registry entry
- Agent reassignment plan (for superseded/deprecated skills)
- Retirement manifest for retired skills

## Steps

1. Receive lifecycle event (proposal, deprecation, retirement)
2. Validate against existing skills for conflicts
3. Apply state transition with justification
4. If superseding: plan agent migration to replacement skill
5. If retiring: verify zero agent assignments remain
6. Update capability registry

## Done Criteria

- [ ] State transition recorded with justification
- [ ] No orphaned agent assignments on retired skills
- [ ] Superseded skills have clear migration path
- [ ] Registry reflects current lifecycle states
