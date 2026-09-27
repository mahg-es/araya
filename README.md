# ARAYA — AX3 v0.5.0

ARAYA is an AI-engineer operating model: a minimal always-on kernel plus ten
canonical Knowledge files that govern authority, Repository Truth, stages, ADRs,
product delivery, Git publication, installation bundles, orchestration, and
templates. v0.5.0 is the active canonical governance (adopted 2026-09-20).

This repository is the clean, repository-owned distribution of that operating
model, plus two explicit host integrations (Pi and ChatGPT) that consume the
same canonical core.

## What is here

| Path | Responsibility |
|---|---|
| `GPT-CONFIGURATION.md` | Operating kernel (always-on instructions) |
| `K01`–`K10` | Canonical Knowledge (deep policy) |
| `ADOPTION-RECORD.md`, `ARAYA-AX3-v0.5.0-CANONICAL-AUDIT.md`, `SHA256SUMS.txt` | Adoption + integrity evidence |
| `araya-install.sh` | Repository installer (core + opt-in adapters) |
| `adapters/pi/` | Explicit, opt-in Pi adapter |
| `bundle/chatgpt/` | Reproducible ChatGPT bundle |
| `docs/` | Architecture ADR, usage, legacy inventory |
| `tests/` | Integrity, installer, adapter, and bundle tests |

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
explicit and project-scoped.

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
ChatGPT. See `docs/usage/`.

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
