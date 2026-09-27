# ARAYA — AX3 v0.5.0

## What is ARAYA?

ARAYA is an AI-engineer **operating model**: a minimal always-on kernel
(`GPT-CONFIGURATION.md`) plus ten canonical Knowledge files (`K01`–`K10`) that
govern authority, Repository Truth, stages, ADRs, product delivery, Git
publication, installation bundles, orchestration, and templates.

On top of that kernel sits the **capability foundation**: a small, reusable,
agent-first set of deterministic operations, progressive-disclosure skills, a
capability/delegation resolver, agent-to-agent and Professor channels
(PostOffice / PonyExpress), runtime utilities, and an agent-first CLI. ARAYA is
a methodology that runs *on top of* a host — it does not own the host.

## Current state

- **Active canonical:** AX3 v0.5.0 (adopted 2026-09-20).
- **Status:** clean core + capability foundation installed; Pi adapter,
  ChatGPT bundle, and installer working.
- The legacy ARAYA runtime (global Pi hooks, orchestration engines, permanent
  agent roster, authority ledgers, relay state machine) is **archived** on Git
  branches (`archive/araya-legacy-*`) and is **not** part of the active
  product. Legacy capabilities return only after an individual product-value
  review (see `docs/LEGACY-CAPABILITY-INVENTORY.md`).

## What works now

1. Canonical core integrity (`sha256sum -c SHA256SUMS.txt`).
2. Repository installer (`araya-install.sh`): core + capability foundation by
   default, opt-in adapters, never touches global `~/.pi`.
3. Automatic ARAYA project context: when Pi runs inside this repository, it
   loads `AGENTS.md` (AX3 v0.5.0) automatically — no command needed.
4. Explicit, project-scoped Pi adapter (`/araya <task>` in a project other
   than this repository).
5. Reproducible ChatGPT bundle (`bundle/chatgpt/build.sh`).
6. **Capability foundation** — see below.

### Capability foundation

The foundation is a clean, reusable, agent-first layer. It deliberately has no
global runtime, no authority ledger, and no orchestration engine.

**Operations (deterministic code).** Reusable, parametrized, explicitly-invoked
operations with a minimal API — `list`, `describe`, `resolve`, `execute`. Git
operations are recovered as deterministic checks (repository sanity, merge
gate, feature PR gate, feature start) and are never a global shell gate.

**Skills (procedural specialization).** Skills are the primary unit of reusable
procedural specialization, loaded by progressive disclosure: minimal metadata
is always discoverable (`skills/index.json`), full instructions load only when
a skill is selected, and resources load only when needed. The full library is
never loaded into every context. Seven canonical skills exist:
`adr-write`, `tdd-execute`, `test-authoring`, `security-review`,
`git-publication`, `postoffice`, `ponyexpress`.

Skills compose into one ephemeral specialist (e.g. a "review and safely publish
a fix" task selects `test-authoring` + `tdd-execute` + `git-publication` +
`security-review` and the corresponding deterministic operations).

**Ephemeral agent model.** Specialist agents are ephemeral workers composed
from a task + selected skills + selected operations + scoped context +
permissions + runtime model. Their display names are randomly assigned and have
no architectural meaning — capabilities and skills determine specialization,
not names. There is no permanent persona roster.

**Delegation.** A capability resolver plus an ephemeral-agent factory. A task
is resolved to capabilities, skills, and deterministic operations; if no
specialist is needed it executes directly, otherwise it composes an ephemeral
specialist and hands it off for REAL native subagent execution, then traces the
communication through PostOffice.

The native subagent boundary: `delegate run` resolves, composes a scoped worker
request, records the PostOffice handoff (delegation), and emits the worker
prompt for the agent-facing caller to invoke through Pi's native `subagent`
mechanism; `delegate result` records the worker's returned result and emits the
correlation trace. The library never spawns the subagent itself — it provides
the smallest adapter boundary so the caller invokes the host's native subagent
without duplicating orchestration logic.

**CLI (agent-first).** `cli/araya` provides stable, namespaced commands with
structured parameters, `--json` output, stable exit codes, non-interactive
execution, and machine-readable capability discovery:

```bash
python3 cli/araya --json status
python3 cli/araya --json operation list
python3 cli/araya --json operation execute git.repository-sanity repo=/path/to/repo
python3 cli/araya --json git merge-gate --pr 123 --candidate <sha> --base dev-mahg
python3 cli/araya --json delegate "publish this branch to integration"
python3 cli/araya --json delegate run --correlation P123 "verify the repository"
python3 cli/araya --json delegate result --correlation P123 --worker <name> --status PASS
```

**PostOffice (agent ↔ agent).** Messaging + historical trace: sender, recipient,
timestamp, correlation id, message type, subject, body, acknowledgement. It is
**not** an authority, an approval ledger, a workflow state machine, canonical
repository truth, or an automatic continuation controller.

**PonyExpress (Professor → Daneel / agents).** The Professor's explicit
communication channel toward the agent system, with durable append-only
traceability and correlation so an instruction can be followed through
delegation and responses (`correlation_id = P123`).

**Runtime utilities.** Read-only `model-context` (provider/model/reasoning —
runtime info, not Daneel's operating model), opt-in `quota` read/guard, a
`cycle` duration/copy helper, and a non-invasive `notifier`. None takes over
the host.

## What is not available yet

1. The legacy permanent agent roster and orchestration engines — not restored;
   specialists are now ephemeral and composed from skills/operations.
2. The historical relay state machine (T0–T11/T12) — not restored; only the
   L07 handoff/correlation/delivery/acknowledgement/trace is recovered.
3. Global ARAYA integration — none, and none is planned: integration is
   explicit/scoped by design.
4. Most legacy domain skills remain deferred (84 of 128 reviewed) — see
   `docs/legacy-skills-review.md`.

## Install

```bash
# Install the core + capability foundation into a target directory (default: cwd).
bash araya-install.sh --target /path/to/project

# Opt-in: install the project-scoped Pi adapter (adds /araya to that project only).
bash araya-install.sh --target /path/to/project --adapter pi

# Opt-in: build the reproducible ChatGPT bundle.
bash araya-install.sh --adapter chatgpt
```

Default installation never touches your global `~/.pi`. Pi integration is
explicit and project-scoped. The installer refuses to write into the Pi user
layer (`~/.pi/agent/`) or into a target named `daneel`.

## Pi behavior

Running `pi` starts **Daneel**, the Professor's personal right-hand Pi-level
agent. Daneel is a Pi **user-layer** agent and is **not** part of ARAYA —
ARAYA never hooks, owns, or configures global Pi. ARAYA does not require
Daneel, and Daneel does not require ARAYA; they are independent.

## Automatic ARAYA project context

When you run `pi` inside this repository:

```bash
cd ~/github/mahg-es/araya
pi
```

Pi automatically loads `AGENTS.md`, so the active agent is **Daneel plus this
repository's ARAYA AX3 v0.5.0 operating context**. You do **not** need to run
`/araya` here.

The `/araya` command is only for intentionally bringing ARAYA context into a
*different* project where the project-scoped adapter has been installed:

```bash
cd /path/to/other/project
pi
/araya <task>
```

Outside the ARAYA repository, ARAYA context does not leak into unrelated
projects.

## Use with Pi

- Inside this repository, run `pi` — the ARAYA AX3 v0.5.0 context loads
  automatically (see "Automatic ARAYA project context").
- In another project, install the project-scoped adapter (`--adapter pi`) and
  run `/araya <task>` to open an explicit ARAYA session there.
- ARAYA never hooks global Pi; Daneel (the Professor's Pi user-layer agent)
  remains independent of ARAYA.

## Use the CLI

The CLI is agent-first; humans may also use it. Run from the repository (or an
installed target):

```bash
python3 cli/araya --help
python3 cli/araya --json status
python3 cli/araya --json operation list
python3 cli/araya --json skills list
python3 cli/araya --json capabilities
python3 cli/araya --json runtime model-context
```

Exit codes: `0` success, `1` operation failure, `2` usage error. See
`docs/usage/` for details.

## Build / use the ChatGPT bundle

```bash
bash bundle/chatgpt/build.sh
```

This produces `bundle/chatgpt/dist/ARAYA-AX3-v0.5.0-chatgpt.zip` (name,
description, instructions, and the 10 Knowledge files) for import into a custom
ChatGPT. See `docs/usage/`. The build validates the README before packaging, so
a bundle can never be produced against a stale README.

## Repository structure

```text
araya/
├── GPT-CONFIGURATION.md            operating kernel (always-on)
├── K01–K10                         canonical Knowledge (deep policy)
├── ADOPTION-RECORD.md, ARAYA-AX3-v0.5.0-CANONICAL-AUDIT.md, SHA256SUMS.txt
│                                   adoption + integrity evidence
├── AGENTS.md                       Pi project context (auto-loaded in this repo)
├── araya-install.sh                installer (core + foundation + opt-in adapters)
├── cli/                            agent-first CLI + shared library (stdlib only)
├── operations/                     deterministic operations catalog (JSON)
├── skills/                         progressive-disclosure skills (index + SKILL.md)
├── capabilities/                   capability registry (maps to skills/operations)
├── communications/
│   ├── postoffice/                 agent ↔ agent messaging + trace
│   └── ponyexpress/                Professor → agent channel
├── runtime/                        notifier, quota, model-context, cycle
├── delegation/                     capability resolver + ephemeral agent factory
├── demo/                           vertical demonstration (real product behavior)
├── adapters/
│   └── pi/                         explicit, opt-in Pi adapter
├── bundle/chatgpt/                 reproducible ChatGPT bundle
├── docs/                           architecture ADRs, usage, legacy inventory
└── tests/                          integrity, installer, adapter, bundle, CLI tests
```

## Where the core lives

The canonical core is the 13 byte-identical files at the repository root:
`GPT-CONFIGURATION.md`, `K01`–`K10`, `ADOPTION-RECORD.md`,
`ARAYA-AX3-v0.5.0-CANONICAL-AUDIT.md`, and `SHA256SUMS.txt`. Verify with:

```bash
sha256sum -c SHA256SUMS.txt
```

## Where adapters live

- Pi: `adapters/pi/`
- ChatGPT: `bundle/chatgpt/`

Both consume the same canonical core; neither forks or rewrites it. The
capability foundation's shared library (`cli/araya_lib/`) is the single
implementation consumed by the CLI and any future host adapter.

## Ownership boundary — Daneel

`DANEEL != ARAYA`. **Daneel** is the Professor's personal, Pi-level agent
(`~/.pi/agent/SYSTEM.md`, `~/.pi/agent/APPEND_SYSTEM.md`,
`~/.pi/agent/daneel/`). ARAYA does not own, install, modify, generate, or
delete Daneel or other Pi user resources. The installer is enforced to respect
this boundary (`tests/test-installer.sh`). The name `Daneel` is reserved; ARAYA
never creates a persona named `daneel`.

## Important limitations / debts

1. Of the 128 legacy skills reviewed, 84 remain deferred (`LATER`) and are not
   yet recovered — see `docs/legacy-skills-review.md` / `.json`.
2. No automated cross-project delegation/state store; ARAYA is per-project and
   host-scoped. The library composes the scoped worker request and records the
   handoff/result, but the actual native subagent invocation is performed by
   the agent-facing caller (Daneel) at the adapter boundary — the library does
   not spawn subagents itself.
3. The ChatGPT bundle is for a custom GPT; there is no hosted ARAYA service.
4. Daneel's private memory/identity is not versioned inside ARAYA; if it needs
   backup/versioning, that must live in a private location independent of ARAYA.
5. The CLI is stdlib-only Python; there is no MCP adapter yet (only where
   interoperability justifies it).

## Legacy skills review

The full legacy skill corpus (128 skills) was reviewed evidence-first
(`docs/legacy-skills-review.md` + `docs/legacy-skills-review.json`):

- Reviewed: **128**
- KEEP: **3** (already-canonical)
- COMBINE: **12** (absorbed into 2 canonical skills)
- REPLACE_BY_OPERATION: **1**
- DROP: **28** (legacy machinery + SDLC ceremony)
- LATER: **84** (deferred, re-reviewed individually)

Wave 1 recovered `test-authoring` and `security-review` (foundational
engineering). Provenance is retained per canonical skill via
`source_provenance`; no legacy skill is lost (it remains in Git history).

## Next product increment

Wave 2 selective recovery of the remaining legacy skills, prioritized by
product value (see `docs/legacy-skills-review.md`).
