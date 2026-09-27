# AGENTS.md — ARAYA AX3 v0.5.0

This repository is governed by the ARAYA AX3 v0.5.0 operating model.

## Operating model

- Kernel (always-on): `GPT-CONFIGURATION.md`
- Knowledge (deep policy): `K01`–`K10`
- Adoption/integrity: `ADOPTION-RECORD.md`,
  `ARAYA-AX3-v0.5.0-CANONICAL-AUDIT.md`, `SHA256SUMS.txt`

Before material work, read the kernel and the K files relevant to the task.
Repository Truth is the highest authority. Never invent facts, IDs, approvals,
paths, roles, versions, or governance decisions.

## Host integrations

- Pi is a host, not something ARAYA globally owns. Plain Pi stays plain Pi.
- The Pi adapter (`adapters/pi/`) is explicit and project-scoped.
- The ChatGPT bundle (`bundle/chatgpt/`) consumes the same core.

## Ownership boundary — Daneel and Pi user resources

- `DANEEL != ARAYA`. **Daneel** is the Professor's personal, Pi-level agent.
  It lives in the Pi user layer (`~/.pi/agent/agents/daneel.md` and
  `~/.pi/agent/daneel/`). ARAYA does **not** own, install, modify, generate,
  or delete Daneel.
- The name **Daneel** is reserved to the Professor's personal agent. ARAYA
  must never create a persona named `daneel` (the historical `araya.yaml`-
  generated "daneel" verifier persona is **not** the Professor's agent and must
  not be reused under that name).
- The installer (`araya-install.sh`) writes only to the target directory it is
  given. It refuses to write into the Pi user layer (`~/.pi/agent/`) or into a
  target named `daneel`.

## Working here

- The canonical kernel files (`GPT-CONFIGURATION.md`, `K01`–`K10`,
  `ADOPTION-RECORD.md`, `ARAYA-AX3-v0.5.0-CANONICAL-AUDIT.md`,
  `SHA256SUMS.txt`) must remain byte-identical to the v0.5.0 canon. Repository
  Truth owns their content; do not edit them here.
- Product glue (README, installer, adapters, bundle, docs, tests) lives
  alongside the core. Keep it minimal, accurate, and current.
