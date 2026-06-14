# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What ARAYA is

ARAYA is **not a standalone application** — it is an extension framework for [pi.dev](https://pi.dev) that turns a single pi session into a multi-agent AI SDLC organization (28 agents, 120 skills). It is installed by **symlinking/copying its files into `~/.pi/agent/`** (see `araya-setup.sh`); pi then loads the extension at runtime.

The system is overwhelmingly **configuration + markdown driven**. The TypeScript in `src/` is a secondary orchestration engine + standalone CLI; most behavior comes from `araya.yaml`, the agent prompts, and the skills.

## Commands

```bash
npm run build              # tsc → dist/  (compiles src/ only)
npm run dev                # ts-node src/cli.ts  (run the standalone CLI)
./araya-setup.sh           # install into ~/.pi/agent/ (symlinks ext/skills/prompts, copies agents)
./araya-setup.sh --force   # reinstall, overwriting existing links/files

# Tests are plain Node scripts run individually — there is NO `npm test` script and no test runner.
node tests/mvp2-smoke-test.js          # primary smoke test (config + delegation + tiers)
node tests/<batchN>-<name>-test.js     # run any single test directly
```

Tests are CommonJS `.js` files that load `araya.yaml` and exercise the engines directly — they do **not** require a build first. The two `*.test.ts` files in `tests/` are generated example artifacts, not part of the suite.

## Architecture: the layers and their flow

1. **`araya.yaml` — single source of truth.** Defines version, all 28 agents (role, `model_tier`, permissions, skills), delivery modes, workflow policies, model tiers, execution budgets, circuit breakers, branch strategy, and provider configs. The extension reads this at runtime; changing agent capabilities or modes means editing YAML, not code.

2. **`extensions/araya/index.ts` — the pi extension.** At load it calls `findArayaRoot()` (walks up for `araya.yaml`, resolving symlinks), reads the YAML, and registers a slash command per agent plus `/araya run`. Agent prompts are assembled at call time from `araya.yaml` config + the personality file.

3. **`prompts/agents/<name>.md` — personality prompts.** One per agent, loaded by `loadPersonality()`.

4. **`.pi/agents/<name>.md` — pi agent definitions** (YAML frontmatter: name, tools, model_tier). `araya-setup.sh` **copies** these into `~/.pi/agent/agents/`. There are 28 here.

5. **`skills/<name>/SKILL.md` — 120 skills.** Each is frontmatter (`name`, `description`) + a fixed template (What problem / When to use / Input / Output / Steps / Rules). Referenced by agents in `araya.yaml` by skill name. Symlinked into `~/.pi/agent/skills/araya/`.

6. **`src/araya/v2/` — orchestration engine (TypeScript).** Barrel-exported from `v2/index.ts`. `orchestrator.ts` drives delivery; `engines/` holds the policy engines (`workflow-policy`, `model-selection`, `quality-gate`, `execution-budget`, `circuit-breaker`, `delegation`); `adapters/` implement the `ArayaExecutionAdapter` seam (`pi`, `mock`, `terminal-api`, chosen by `factory.ts`); `sandbox/worktree.ts` isolates execution in git worktrees; `providers/registry.ts` and `tools/registry.ts` govern provider/tool access.

7. **`src/cli.ts` — standalone CLI runner** (`run` / `capabilities` / `validate`), independent of pi, using the same engines and the adapter factory.

8. **`.araya/` — runtime state and artifacts** (largely git-ignored: `runs/`, `evidence/`, `telemetry/`, `approvals/`, `memory/`, `worktrees/`).

**Model tiers, not model names.** Agents declare `model_tier: fast | balanced | reasoning` — never a hardcoded model. `model-selection.ts` + `araya.yaml`'s `model_tiers`/`providers` resolve the actual model. Preserve this indirection.

**Versioning.** The authoritative version is `araya.yaml`'s `version:` field, read live by the extension. Note `package.json` and the string in `araya-setup.sh` are not authoritative.

## Adding to the system

- **New skill:** create `skills/<name>/SKILL.md` with the frontmatter + template, then register the skill name under an agent in `araya.yaml`.
- **New agent:** add `.pi/agents/<name>.md` (frontmatter) **and** `prompts/agents/<name>.md` (personality) **and** an entry in `araya.yaml` (role, `model_tier`, `permissions`, `skills`). All three must agree or the agent won't resolve.
