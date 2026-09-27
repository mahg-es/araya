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

## Working here

- The canonical kernel files (`GPT-CONFIGURATION.md`, `K01`–`K10`,
  `ADOPTION-RECORD.md`, `ARAYA-AX3-v0.5.0-CANONICAL-AUDIT.md`,
  `SHA256SUMS.txt`) must remain byte-identical to the v0.5.0 canon. Repository
  Truth owns their content; do not edit them here.
- Product glue (README, installer, adapters, bundle, docs, tests) lives
  alongside the core. Keep it minimal, accurate, and current.
