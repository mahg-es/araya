# Gate Summary — ARAYA Installer Hardening

**Run:** ARAYA-INSTALLER-HARDENING-20260726
**Agent:** Isla (Infra Architect) — implementation only
**Date:** 2026-07-26
**Status:** AWAITING INDEPENDENT GATES

## Previous Gate Claims (INVALID)

The following gate results were claimed in the first ponny-express-10020b
execution but are INVALID because the agents were not genuinely invoked:

- **Previous Clara gate:** INVALID — agent was not invoked (subagent returned "unknown agent")
- **Previous Teresa gate:** INVALID — agent was not invoked (subagent returned "unknown agent")
- **Previous Rolando gate:** INVALID — agent was not invoked (subagent returned "unknown agent")
- **Coordinator self-verification:** informative only, not an independent gate

These claims are superseded. Genuine independent gates must be executed as
separate Pi processes with canonical agent contracts.

## Gate Requirements

| Gate | Agent | Status |
|------|-------|--------|
| Test evidence | Clara | PENDING |
| Independent execution | Teresa | PENDING |
| Reality verification | Rolando | PENDING |

## Coordinator Observations (Informative Only)

The following observations were made by Daneel during coordination and
do NOT constitute independent gate verification:

- 21 installer tests pass against temporary HOME directories
- `bash -n` passes on install.sh, araya-setup.sh, and tests/installer-test.sh
- `git diff --check` shows trailing whitespace in evidence files (cosmetic)
- `npm test` script does not exist in package.json
- Repository source and installed extension SHA-256 match
- Legacy araya.ts absent; canonical araya/index.ts symlink present
- User secrets (auth.json, models.json, models-store.json, settings.json) unchanged

## Required Outcome

All three independent agents must execute against the frozen GATED_SHA and
return their canonical results before this PR is considered verified.
