# Contributing to ARAYA

Thank you for your interest in contributing to ARAYA — the AI-native SDLC
orchestration framework. This document outlines how to contribute effectively.

## Philosophy

ARAYA follows these principles:
- **Business-driven development** — ask "what problem?" before "what technology?"
- **Unix philosophy** — every skill does one thing well
- **Configuration over code** — `araya.yaml` is the source of truth
- **Governance-first** — SDD → BDD → TDD before implementation
- **Autonomous teams** — agents communicate directly, no human relay

## How to Contribute

### Reporting Issues
- Use GitHub Issues with clear titles and reproduction steps
- Include ARAYA version (`/araya:status`), pi version, and OS
- For bugs: expected behavior vs. actual behavior
- For features: describe the use case, not the implementation

### Adding Skills
1. Create a new directory under `skills/<skill-name>/`
2. Add `SKILL.md` with required YAML frontmatter:
   ```yaml
   ---
   name: skill-name
   description: "What this skill does and when to use it."
   ---
   ```
3. Follow the skill template pattern (What problem, When to use, Input, Output, Steps, Rules)
4. Register the skill in an agent's definition in `araya.yaml`

### Adding Agents
1. Create a prompt file in `.pi/agents/<name>.md` with YAML frontmatter:
   ```yaml
   ---
   name: agent-name
   description: Agent role and purpose
   tools: read, write, edit, bash, grep, find
   model_tier: balanced
   ---
   ```
2. Add agent to `araya.yaml` with role, skills, model_tier, permissions
3. Follow the apostolic naming convention (New Testament names)

### Pull Requests
1. Fork and create a feature branch: `feature/your-feature`
2. Follow the governance pipeline: SDD → BDD → TDD → Implementation
3. Run the smoke test: `node tests/mvp2-smoke-test.js`
4. Ensure all 29 agents resolve correctly
5. Submit PR to `dev` branch with description

## Governance

ARAYA enforces enterprise governance for all changes:
- **No direct writes to `main`** — all changes through PR to `dev-mahg`
- **Quality gates** in CI/CD (lint, test, coverage, security)
- **Architecture review** required for schema/API changes
- **Security review** required for auth/crypto/secret changes

## Versioning

ARAYA follows a pragmatic semantic versioning scheme:

| Level | Example | When |
|-------|---------|------|
| **Hotfix** | 0.2.0 → 0.2.1 | Every PR merged to dev-mahg |
| **Revision** | 0.2.x → 0.3.0 | Major feature, architecture change, or new domain |
| **Version** | 0.x.x → 1.0.0 | Mature major release — may not happen this year |

Hotfix resets to 0 on revision bump. Version bump only for production-grade milestone releases.

## Code of Conduct

Be respectful. Be constructive. Agents don't judge — neither should contributors.

## License

MIT — see [LICENSE](LICENSE).
