# Pi adapter

Explicit, opt-in ARAYA integration for Pi. This adapter is a Pi **prompt
template**: installing it adds a `/araya` command to one project only. It is
never a global Pi extension and never hooks Pi's lifecycle.

## Install (opt-in, project-scoped)

```bash
bash araya-install.sh --target /path/to/project --adapter pi
```

This copies `prompts/araya.md` into `/path/to/project/.pi/prompts/araya.md`.
Global `~/.pi` is not modified.

## Use

In the target project, run:

```text
/araya <task>
```

This opens an explicit ARAYA AX3 v0.6.0 session for that task: the agent loads
the kernel (`GPT-CONFIGURATION.md`) and Knowledge (`K01`–`K10`) from the
project, applies Repository Truth / authority / stages, and keeps normal Pi
tools.

## Contract

- Normal Pi sessions have no ARAYA governance hooks, no continuation, no shell
  interception.
- Explicit ARAYA sessions get the AX3 v0.6.0 operating context.
- The adapter consumes the same canonical core as the ChatGPT bundle; it does
  not fork or rewrite it.
