# K05 — Install Bundle Procedure and Delivery-Time Preflight

**ARAYA AX3 Candidate Governance Version:** 0.5.0
**Baseline Canonical Governance:** 0.4.2
**Status:** ADOPTED / ACTIVE CANONICAL
K05 owns the reusable Install Bundle contract for repository-mutating, repository-auditing, and repository-validating deliveries.

## 1. Delivery contract

When a bundle is the correct delivery mechanism, use:

```text
One-time:
1 permanent generic installer

Per governed bundle operation:
1 ZIP
1 SHA-256 published directly
1 Git Bash command
```

Do not multiply artifacts when one governed ZIP can contain them.

The Bundle Contract defines how a bundle must behave when a bundle is used. It does not require a bundle for every governed operation.

Prefer repository-native permanent tooling for routine repeatable operations once that capability exists and is proven.

Bundles are preferred for:

- bootstrap;
- installation or upgrade of durable tooling/capability;
- recovery when normal repository-native tooling is unavailable or damaged;
- especially sensitive infrastructure/governance changes that benefit from a closed transport artifact;
- exceptional transport where no appropriate repo-native channel exists.

Do not normally create a separate bundle for:

- routine validation;
- ordinary release/deploy;
- normal health checks;
- normal smoke checks;
- common diagnostics;
- every Implementation Slice;
- every deterministic microgate of one authorized transition.

One bundle may contain multiple compatible slices when they form one coherent governed transaction.

Bundle boundaries should correspond to a capability, transaction, recovery, or exceptional transport boundary. Do not mechanically mirror Implementation Slice boundaries.

Before creating an additional bundle, apply the K01 Granularity / Process-Theater Guard.

Do not require manual user movement, renaming, unpacking, or reorganization of bundle files when the permanent installer or repository tooling can safely perform that work deterministically.

The generic installer lives by convention at:

```text
~/bin/araya-install.sh
```

Repository Truth may define another governed path.


## 1.1 Permanent installer state and reuse

The generic installer is a persistent capability. Never infer that it is missing merely because the current GPT/session cannot observe the user's local filesystem.

Classify installer state exactly:

```text
PRESENT
MISSING
UNKNOWN
```

Rules:

```text
UNKNOWN != MISSING
PRESENT → REUSE
MISSING → INSTALL / RECOVER through the governed one-time installer procedure
UNKNOWN → runtime discovery; reuse if present; do not represent as missing
```

Default path unless Repository Truth defines another governed path:

```text
~/bin/araya-install.sh
```

Do not recreate, replace, or ask the user to reinstall a proven-present installer merely because a new bundle, GPT session, or conversation exists.

When installer state is UNKNOWN at bundle-delivery time, the user-facing invocation must safely test the governed installer path at runtime. If absent, fail clearly with an actionable installer-missing result; do not silently substitute another installer or invent installation state.

## 2. Bundle root contract

Each bundle contains:

```text
ARAYA-BUNDLE.env
MANIFEST.sha256
APPLY.sh
```

`APPLY.sh` is mandatory. A governed bundle without `APPLY.sh`, or a delivery without an exact executable invocation for that bundle, is a delivery defect and must not be presented as ready for execution.


Optional:

```text
README.md
payload/
docs/
rollback/
tests/
evidence/
```

`ARAYA-BUNDLE.env`:

```text
FORMAT=ARAYA_BUNDLE
FORMAT_VERSION=1.0.0
BUNDLE_ID=<unique-readable-id>
ENTRYPOINT=APPLY.sh
```

Do not change the generic installer merely because a bundle changes; change it only when the bundle-format contract changes.

## 3. Integrity

External integrity:

- publish the ZIP SHA-256 directly;
- do not require a separate `.sha256` download.

Internal integrity:

- `MANIFEST.sha256` covers governed files except itself;
- reject absolute paths, Windows drive escapes, `../`, undeclared files, or hash mismatch.

## 4. Generic installer behavior

The current Bundle Contract requires the installer to run from Git Bash.

The installer must:

- validate Git Bash/MSYS execution;
- verify external SHA-256 before extraction;
- extract to temporary storage;
- validate format and manifest;
- validate `APPLY.sh` syntax;
- execute from actual repository root;
- clean temporary extraction on success/failure;
- not push;
- not alter PR state;
- expose failures;
- terminate with an explicit disposition.

## 5. APPLY.sh contract

Use:

```bash
set -Eeuo pipefail
```

Validate as applicable:

- supported shell/runtime;
- required commands;
- repository root/identity;
- branch;
- local and remote/canonical HEAD;
- clean working tree;
- worktrees;
- required ADR/plan/version identity;
- exact scope;
- environment/config;
- cleanup behavior.

Use clear immutable constants for governed identities and separate variables for process-local paths/state.

## 6. Transactional mutation

For mutating bundles:

```text
preconditions
↓
isolated temporary worktree
↓
apply candidate payload
↓
temporary gates/runtime
↓
cleanup temporary resources
↓
apply same governed change to real branch
↓
real gates/runtime
↓
local commit when authorized
↓
post-commit audit
↓
push as separate boundary
```

Do not mutate the real branch first when the same change can be validated safely in isolation.

Restore the real branch if failure occurs before an authorized commit.

Audit bundles are read-only and must not edit, commit, amend, push, change PR state, or create tags.

## 7. Delivery-time preflight

Before handing a bundle/procedure to the user, validate every assumption that is testable in the producing environment.

At minimum validate or feature-detect as applicable:

- referenced repository paths/artifacts;
- shell syntax;
- manifest integrity;
- required command availability or portable fallback;
- path normalization assumptions;
- environment/tool fingerprints;
- required entrypoints;
- exact user-facing execution command;
- mandatory `clear &&` prefix for Git Bash bundle invocation;
- static preconditions.

Do not knowingly defer trivial detectable failures to the user.

An artifact that fails before meaningful execution because of an avoidable producer-side preflight defect is a delivery defect.

If a requirement cannot be validated in the producing environment, make the runtime check explicit and fail with a precise actionable message.


## 8. Git Bash and MSYS path safety

Commands delivered under this Bundle Contract must work in Git Bash.

When Docker must receive a Linux container path without MSYS path rewriting, use the appropriate conversion exclusion, for example:

```bash
MSYS2_ARG_CONV_EXCL='*' docker compose ...
```

Do not assume `docker compose run SERVICE COMMAND` replaces a fixed image `ENTRYPOINT`; use an explicit `--entrypoint` when required by the proven image contract.

## 9. Local ignored environments

Do not package secrets or sensitive local paths.

When temporary worktrees need ignored environment files:

- prove the source is ignored;
- copy only when required;
- restrict permissions;
- prove destination remains ignored;
- preserve clean Git status;
- remove during cleanup.

Never place credentials/secrets/local sensitive paths in ZIP, README, manifest, logs, commits, or PR content.

## 10. Docker isolation and cleanup

When Docker is used, isolate project/container/network/volume identities per lane.

Cleanup must run on success and failure.

For resources created by the governed bundle/lane, cleanup must account for:

- containers;
- volumes;
- networks;
- local images created specifically for that governed operation when they are not a proven reusable artifact.

Do not delete shared or pre-existing resources outside the governed scope.

Evidence must prove the governed resources are clean after execution, with explicit checks equivalent to:

```text
PASS docker-containers-clean
PASS docker-volumes-clean
PASS docker-networks-clean
PASS docker-images-clean-or-preserved-by-reuse-contract
```

Reuse proven images/runtime when K04 fingerprint rules allow; do not rebuild merely because a new bundle exists.

## 11. Commits and publication

Bundles never auto-push.

Local commit/amend is allowed only when the approved plan/authority permits it.

Before commit:

- required gates PASS;
- exact scope;
- `git diff --check` or repository equivalent PASS;
- temporary resources clean;
- required UAT/evidence gates satisfied when applicable;
- required repository-native Gold/canonical gate satisfied when Repository Truth defines one.

After commit:

- working tree clean;
- message and scope exact when governed;
- post-commit audit;
- push remains separate.

## 12. Evidence

Each bundle must persist two local outcome artifacts.

### 12.1 Full governed execution evidence

Default Bundle Contract location:

```text
~/Downloads/<BUNDLE-ID>.txt
```

Repository Truth may define another governed location.

This file records the complete governed execution evidence needed to reconstruct and audit the operation, as applicable:

```text
BUNDLE / INSTALLER IDENTITY
AUDIT CONTRACT
BASELINE
PRECONDITIONS
OPERATIONS EXECUTED
GATES
RUNTIME / PERSISTENCE
CLEANUP
FINAL REPOSITORY AUDIT
PRODUCT / ENGINEERING EVIDENCE REFERENCES
FAILURE DETAILS
RESULT
NEXT
Disposition
```

"Complete" means complete governed evidence, not indiscriminate shell tracing, environment dumping, or secret capture.

Never persist credentials, tokens, secrets, sensitive local values, or unnecessary host-specific data merely to make the log verbose.

### 12.2 Compact GPT handoff result

Each bundle must also emit:

```text
~/Downloads/<BUNDLE-ID>.result.txt
```

Repository Truth may define another governed location.

The compact governed terminal result must be mirrored verbatim into this file so the user can copy/paste the result into a GPT without uploading the full evidence artifact.

Prefer compact linear output:

```text
KEY=VALUE
PASS
FAIL
BLOCK
NEXT
SHA256
PATH
Disposition
```

Include only material operational state, identities, gates, evidence paths, exact blocker information, and the next governed operation.

Both successful execution and governed blocking must produce the full evidence file and the compact result file whenever execution reached the bundle's governed entrypoint sufficiently to do so.

A governed operation may correctly report:

```text
RESULT=BLOCK
ARAYA installer result: PASS
```

when the installer itself executed correctly and a governed gate blocked the requested operation.

Do not claim PASS without explicit evidence.

## 13. Automated UAT evidence packaging

When Robot Framework UAT evidence is part of a bundle, prefer:

```text
evidence/acceptance/
├── output.xml
├── report.html
├── log.html
├── screenshots/
└── uat-manifest.json
```

Include only artifacts actually produced and governed.

The UAT manifest should identify the Product Increment, acceptance criteria, flow, exact candidate, environment, dataset/fixture, result, and artifact hashes as applicable.

Do not include secrets.

K04 owns the meaning of Automated UAT results; this file owns packaging only.

## 14. Standard response contract

Normal bundle delivery communication is minimal and terminal-friendly.

Present only:

```text
Artifact / download
SHA-256
Exact Git Bash command
Compact result-file path
One material next-step sentence when needed
Disposition
```

Every user-facing Git Bash bundle invocation must begin with:

```bash
clear &&
```

`clear` belongs in the delivered user-facing invocation, not inside `APPLY.sh`.

The exact invocation is mandatory. Do not require the user to remember to ask for the execution command.

When installer state is UNKNOWN, the exact invocation must perform safe runtime discovery of the governed installer path and reuse it when present.

Increase response verbosity only when a human authority decision, clarification, material blocker, or material risk requires additional information. Do not repeat design rationale, governance explanation, or implementation commentary during routine bundle execution.

One ZIP, one hash, one exact command, local full evidence, local compact GPT handoff, no automatic push.

