# ARAYA — AX3 v0.5.0

## What is ARAYA?

ARAYA is an AI-engineer **operating model**: a minimal always-on kernel plus ten
canonical Knowledge files (`K01`–`K10`) that govern authority, Repository
Truth, stages, ADRs, product delivery, Git publication, installation bundles,
orchestration, and templates.

This repository is the clean, repository-owned distribution of that operating
model, plus two explicit host integrations (Pi and ChatGPT) that consume the
same canonical core. ARAYA is a methodology that runs *on top of* a host — it
does not own the host.

## Current state

- **Active canonical:** AX3 v0.5.0 (adopted 2026-09-20).
- **Status:** clean core installed; Pi adapter and ChatGPT bundle working.
- The legacy ARAYA runtime (global Pi hooks, orchestration engines, agent
  roster) is **archived** on Git branches (`archive/araya-legacy-*`) and is
  **not** part of the active product. Legacy capabilities return only after an
  individual product-value review (see `docs/LEGACY-CAPABILITY-INVENTORY.md`).

## What works now

1. Canonical core integrity (`sha256sum -c SHA256SUMS.txt`).
2. Repository installer (`araya-install.sh`): core-only by default, opt-in
   adapters, never touches global `~/.pi`.
3. Explicit, project-scoped Pi adapter (`/araya <task>` in a project).
4. Reproducible ChatGPT bundle (`bundle/chatgpt/build.sh`).

## What is not available yet

1. Legacy capabilities (agent roster, skills library, orchestration engines,
   CLI, git-operation gates, PostOffice/ledger, runtime enforcement) — archived
   and deferred; none are reintroduced automatically.
2. No global ARAYA integration, and none is planned: integration is
   explicit/scoped by design.

## Install

```bash
# Install the core into a target directory (default: current directory).
bash araya-install.sh --target /path/to/project

# Opt-in: install the project-scoped Pi adapter (adds /araya to that project only).
bash araya-install.sh --target /path/to/project --adapter pi

# Opt-in: build the reproducible ChatGPT bundle.
bash araya-install.sh --adapter chatgpt
```

Default installation never touches your global `~/.pi`. Pi integration is
explicit and project-scoped. The installer refuses to write into the Pi user
layer (`~/.pi/agent/`) or into a target named `daneel`.

## Use with Pi

Plain `pi` stays plain Pi — ARAYA never globally hooks Pi.

To open an explicit ARAYA session in a project where the Pi adapter is
installed, run:

```text
/araya <task>
```

This loads the AX3 v0.5.0 operating context (kernel + K01–K10) for that task.
See `docs/usage/`.

## Build / use the ChatGPT bundle

```bash
bash bundle/chatgpt/build.sh
```

This produces `bundle/chatgpt/dist/ARAYA-AX3-v0.5.0-chatgpt.zip` (name,
description, instructions, and the 10 Knowledge files) for import into a custom
ChatGPT. See `docs/usage/`. The build validates the README before packaging, so
a bundle can never be produced against a stale README.

## Repository structure

| Path | Responsibility |
|---|---|
| `GPT-CONFIGURATION.md` | Operating kernel (always-on instructions) |
| `K01`–`K10` | Canonical Knowledge (deep policy) |
| `ADOPTION-RECORD.md`, `ARAYA-AX3-v0.5.0-CANONICAL-AUDIT.md`, `SHA256SUMS.txt` | Adoption + integrity evidence |
| `araya-install.sh` | Repository installer (core + opt-in adapters) |
| `adapters/pi/` | Explicit, opt-in Pi adapter |
| `bundle/chatgpt/` | Reproducible ChatGPT bundle |
| `docs/` | Architecture ADR, usage, legacy inventory |
| `tests/` | Integrity, installer, adapter, bundle, README-contract tests |

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

Both consume the same canonical core; neither forks or rewrites it.

## Ownership boundary — Daneel

`DANEEL != ARAYA`. **Daneel** is the Professor's personal, Pi-level agent
(`~/.pi/agent/agents/daneel.md`). ARAYA does not own, install, modify,
generate, or delete Daneel or other Pi user resources. The installer is
enforced to respect this boundary (`tests/test-installer.sh`).

## Important limitations / debts

1. Legacy capabilities are archived, not ported — re-review is a separate,
   future increment.
2. No automated cross-project delegation/state store; ARAYA is per-project and
   host-scoped.
3. The ChatGPT bundle is for a custom GPT; there is no hosted ARAYA service.

## Next product increment

Legacy capability inventory review and prioritization (see
`docs/LEGACY-CAPABILITY-INVENTORY.md`).
