# 001 — Canonical Rules (Permanent Governance) — v2
> Capsule ID: 001 | Initiative: canonical-rules-permanent | Status: CANONICAL
> Session: 2026-07-26-v2 | Framework: dev-mahg 38197e6 | Supersedes v1 capsule 001

## 1. AX3 Contract Hierarchy (CANONICAL)
Every agent MUST read the root `AX3.md` fully, walk the chain to each target path before editing, use the nearest `AX3.md` as local contract (children concretize, never weaken), and run the AX3 postflight after meaningful changes. Root `AX3.md` is self-describing (commit 8928c1d). Validation: `/araya:ax3 --check`, `tests/ax3-test.js` (exit 0 at 38197e6-candidate 4073e3e).

## 2. Branch Governance (CANONICAL)
`feature/* → dev-mahg → main`. Direct commits/pushes to `main` and `dev-mahg` PROHIBITED. Merge method: merge commit (`--no-ff`). Merged feature branches deleted local+remote (BRANCH-005). Capability delivered only when in `dev-mahg` (BRANCH-009); released only when in `main` (BRANCH-010). Co-authored-by AI trailers PROHIBITED. Verified live: framework `main`=8928c1d, `dev-mahg`=38197e6 (2026-07-26).

## 3. canon-rule-001 — Workspace Hygiene (CANONICAL)
All Git worktrees ONLY under `~/github/mahg-es/worktrees/<repository>/<name>`. Never alongside repos, never in `/tmp`. Violation = BLOCK-level incident. Live violation tracked: PE-0007-B1 (3 portfolio worktrees in `/tmp`, still present 2026-07-26).

## 4. ADR-008 — Universal Agent Tool Access (CANONICAL)
All agents permanently hold read/grep/find, bash, PostOffice read+write. Restrictions only: security, destructive ops, secrets, scope, main-branch. No per-invocation re-approval.

## 5. Versioning (CANONICAL)
Major.Revision.Hotfix. Max Revision 73, Max Hotfix 5, 0.73.5→1.0.0. NOT SemVer.

## 6. Evidence & Repository Truth (CANONICAL)
Evidence > Claims. Workspace ≠ Delivered. Uncommitted ≠ Progress. Reports declare Workspace, Feature Branch, dev-mahg, main, Release Tag, Production. Configured ≠ Implemented ≠ Executable ≠ Operational ≠ Independently Verified.

## 7. PostOffice Protocol (CANONICAL)
`.araya/postoffice/thread.md` — advisory, never a gate. Read at cycle start, write at cycle end. Governance acts (BLOCK, VERIFIED, DISCREPANCY) travel through it. Governance acts require a VALID recipient (see capsule 007, Giskard outbox discrepancy).

## 8. Pi 0.82.1 Skill Contract (CANONICAL — new in v2)
Every `skills/<name>/SKILL.md` MUST carry YAML frontmatter with non-empty `name` and `description` plus non-empty body. Missing `description` FAILS validation. Enforcement: `tests/skill-frontmatter-test.js` (637 checks, exit 0 at candidate 4073e3e). Repo is the corrected source; sync to `~/.pi/agent/skills/araya/` is install-time copy.

## 9. Cross-Cutting Skills (MANDATORY)
`araya-command-and-delegation-expert`, `ax3`, `ax-postoffice`, `token-efficiency` for every agent; `relay-participant` additionally for every Relay-capable actor; `araya-operation-runtime` for every ACTIVE operational agent (REQ-046, 2026-07-26 — operation-first protocol; dormant agents excluded).

## 10. Delivery Modes (CANONICAL)
full / standard / quick / review / repair — unchanged from v1.

## 11. Constitutional Extracts (CANONICAL)
GOV: requirements before implementation, ACs before implementation, validation before delivery, no silent scope changes. SEC: no hardcoded secrets; critical vulnerabilities block. ENG: implementation follows approved specs; no orphan artifacts. HR: only qualified agents; Aurora proposes, Professor approves. REAL: no run records = violation; operational ≠ independently verified. TOOL: baseline access permanent; main-branch and secrets restrictions absolute.

> v2 source: git-verified state 2026-07-26, PR #82 (38197e6), PR #294 (7e3d357).
