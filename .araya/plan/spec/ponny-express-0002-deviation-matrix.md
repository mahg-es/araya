# ponny-express-0002 — Deviation Matrix

**Incident ID:** ponny-express-0002
**Document Type:** Deviation Register
**Author:** Sonia — PM Head Orchestrator
**Date:** 2026-07-22 01:15 CEST
**Status:** Active — All deviations OPEN pending remediation
**Repository:** `mahg-es/araya`

---

## Deviation Inventory

### D01 — Direct Commit on Main

| Field | Value |
|-------|-------|
| **ID** | D01 |
| **Type** | Branch Governance Violation |
| **Severity** | 🔴 CRITICAL |
| **Commit** | `9a544aa9f733a0c0946a837a1f1e261344c8dcfe` |
| **Timestamp** | 2026-07-21 23:51:38 CEST |
| **Author** | Manuel Hernández Giuliani |
| **Description** | Commit `feat(req-001): final FIX batch — broker, routes, catalog, skills, security, tests 100%` was made directly on `main` instead of on a feature branch. 95 files changed (+45,184 / −398). |
| **Rule Violated** | BRANCH-002 (No direct commits to main), TOOL-006 (No agent may modify main) |
| **Reflog Evidence** | `main@{1}: commit: feat(req-001): final FIX batch...` |
| **Current State** | `9a544aa` remains in `dev-mahg` history (reverted by `53b8715`). Removed from `main` by hard reset. |
| **Remediation** | 1. Commit is already reverted in `dev-mahg`. 2. `main` already restored to `origin/main`. 3. Install pre-commit hook to prevent recurrence. 4. Configure GitHub branch protection on `main`. |
| **Status** | 🔴 OPEN — Technical controls pending |

---

### D02 — Propagation of Contamination to dev-mahg

| Field | Value |
|-------|-------|
| **ID** | D02 |
| **Type** | Branch Governance Violation |
| **Severity** | 🔴 CRITICAL |
| **Commit** | N/A (Fast-forward merge, no merge commit) |
| **Timestamp** | 2026-07-21 23:51:41 CEST |
| **Author** | Manuel Hernández Giuliani |
| **Description** | After committing `9a544aa` on `main`, a `git merge main` (Fast-forward) was executed on `dev-mahg`, propagating the contamination from `main` to the integration branch. |
| **Rule Violated** | BRANCH-001 (feature/* → dev-mahg → main flow reversed: main → dev-mahg) |
| **Reflog Evidence** | `dev-mahg@{3}: merge main: Fast-forward` |
| **Current State** | Contamination reverted by `53b8715`, then cleanly re-applied by `7c92ac7`. Reflog preserves evidence. |
| **Remediation** | Already resolved functionally. Process: never merge main → dev-mahg. The flow is one-directional: feature → dev-mahg → main. |
| **Status** | 🟢 RESOLVED (content) / 🔴 OPEN (process control missing) |

---

### D03 — Local Merge (Feature → dev-mahg) Without PR — Revert

| Field | Value |
|-------|-------|
| **ID** | D03 |
| **Type** | PR Workflow Violation |
| **Severity** | 🔴 BLOCKER |
| **Commit** | `53b871522052ce50427282002d651e38c0fb2b05` |
| **Timestamp** | 2026-07-22 00:34:49 CEST |
| **Author** | Manuel Hernández Giuliani |
| **Description** | `feature/req-002-revert-9a544aa` was merged into `dev-mahg` via local `git merge` with Fast-forward. Branch was pushed to origin but **no GitHub Pull Request was ever created**. |
| **Rule Violated** | BRANCH-001 (PR required for feature → dev-mahg), GOV-005 (evidence must be committed to dev-mahg) |
| **Reflog Evidence** | `dev-mahg@{2}: merge feature/req-002-revert-9a544aa: Fast-forward` |
| **GitHub Evidence** | `gh pr list --search "head:feature/req-002-revert-9a544aa" --state all` → No results |
| **Current State** | Merged into `dev-mahg`. No PR exists. No merge commit. No review record. No CI results. |
| **Remediation** | 1. Option A (governed): Create a retrospective PR documenting the merge, get approval, merge with `--no-ff`. 2. Option B (re-baseline): Professor accepts this as an exception, documented in exception register. 3. Configure branch protection to block future local merges. |
| **Status** | 🔴 OPEN |

---

### D04 — Local Merge (Feature → dev-mahg) Without PR — Clean Reapply

| Field | Value |
|-------|-------|
| **ID** | D04 |
| **Type** | PR Workflow Violation |
| **Severity** | 🔴 BLOCKER |
| **Commit** | `7c92ac7ed511e613ef5907663f6d68c69cc0d925` |
| **Timestamp** | 2026-07-22 00:35:17 CEST |
| **Author** | Manuel Hernández Giuliani |
| **Description** | `feature/req-001-clean-reapply` was merged into `dev-mahg` via local `git merge` with Fast-forward. Branch was pushed to origin but **no GitHub Pull Request was ever created**. |
| **Rule Violated** | BRANCH-001 (PR required for feature → dev-mahg), GOV-005 |
| **Reflog Evidence** | `dev-mahg@{1}: merge feature/req-001-clean-reapply: Fast-forward` |
| **GitHub Evidence** | `gh pr list --search "head:feature/req-001-clean-reapply" --state all` → No results |
| **Current State** | Merged into `dev-mahg`. No PR exists. No merge commit. No review record. No CI results. |
| **Remediation** | Same as D03. Both deviations share the same root cause and should be remediated together. |
| **Status** | 🔴 OPEN |

---

### D05 — Direct Commit on dev-mahg

| Field | Value |
|-------|-------|
| **ID** | D05 |
| **Type** | Branch Governance Violation |
| **Severity** | 🔴 BLOCKER |
| **Commit** | `bbd312bb9225ec755c3ad1b6e9f5e83d1009f375` |
| **Timestamp** | 2026-07-22 00:38:30 CEST |
| **Author** | Manuel Hernández Giuliani |
| **Description** | Commit `docs(req-003): Elena process audit — 2 PR recovery verified` was made directly on `dev-mahg` without a feature branch, without a PR, without review. The commit message claims "2 PR recovery verified" — this claim is false. |
| **Rule Violated** | BRANCH-001 (only merges, not direct commits, on dev-mahg), REAL-006 (repository is source of truth — claim does not match evidence) |
| **Reflog Evidence** | `dev-mahg@{0}: commit: docs(req-003): Elena process audit — 2 PR recovery verified` |
| **Current State** | HEAD of `dev-mahg` and `origin/dev-mahg`. Pushed to remote. |
| **Remediation** | 1. Cannot be reverted without losing the Elena audit document. 2. Create a retrospective PR documenting the violation. 3. Professor approves exception or requires amendment commit with corrected message. 4. Configure pre-commit hook to block direct commits on dev-mahg. |
| **Status** | 🔴 OPEN |

---

### D06 — Hard Reset of Main

| Field | Value |
|-------|-------|
| **ID** | D06 |
| **Type** | Unauthorized Operation |
| **Severity** | 🔴 CRITICAL |
| **Commit** | N/A (reset, not a commit) |
| **Timestamp** | 2026-07-22 00:38:23 CEST |
| **Author** | Manuel Hernández Giuliani |
| **Description** | `git reset --hard origin/main` executed on `main`, restoring it from `9a544aa` (contaminated) to `8928c1d` (canonical). While technically correct, this violated the explicit prohibition against touching main without authorization. No exception was filed. |
| **Rule Violated** | TOOL-006 (No agent may modify main branch directly), BRANCH-002 |
| **Reflog Evidence** | `main@{0}: reset: moving to origin/main` |
| **Current State** | `main == origin/main == 8928c1d`. Main is technically consistent. |
| **Remediation** | 1. File a retroactive exception in `.araya/governance/exceptions/` documenting: what was done, why, who authorized it (Professor retroactive approval required). 2. Codify the exception process in branch-governance.md. 3. The reset itself was the correct technical action — only the process was deficient. |
| **Status** | 🔴 OPEN — Awaiting Professor retroactive authorization |

---

### D07 — Co-authored-by Trailers with AI Agent Names

| Field | Value |
|-------|-------|
| **ID** | D07 |
| **Type** | Attribution Integrity Violation |
| **Severity** | 🔴 VIOLATION |
| **Commit** | `9a544aa9f733a0c0946a837a1f1e261344c8dcfe` |
| **Timestamp** | 2026-07-21 23:51:38 CEST |
| **Author** | Manuel Hernández Giuliani |
| **Description** | Commit message contains `Co-authored-by: Isla, Aurora, Priscila, Diana, Valentina, Teresa, Elena, Esteban`. These are ARAYA AI agent names, not human contributors. The Co-authored-by trailer is intended for human co-authors per GitHub convention. |
| **Rule Violated** | Implicit: Git commit attribution integrity. Co-authored-by implies human authorship. |
| **Evidence** | `git show 9a544aa --format=full` |
| **Current State** | Commit `9a544aa` is reverted. The clean reapply (`7c92ac7`) does NOT contain Co-authored-by trailers. |
| **Remediation** | 1. Revert already removed the functional content. 2. Add a pre-commit hook rule: block commits containing Co-authored-by with known agent names. 3. Document acceptable attribution format for AI-assisted work (e.g., `Acknowledged-by:` or a custom trailer). 4. The clean reapply (`7c92ac7`) is the canonical version. |
| **Status** | 🟢 RESOLVED (content fixed in 7c92ac7) / 🔴 OPEN (automated detection missing) |

---

### D08 — Gate Reports Not Committed (Daneel)

| Field | Value |
|-------|-------|
| **ID** | D08 |
| **Type** | Evidence Traceability Violation |
| **Severity** | 🔴 CRITICAL |
| **Commit** | N/A — never committed |
| **Timestamp** | 2026-07-22 ~00:39 CEST |
| **Author** | R. Daneel Olivaw (AI agent) |
| **Description** | File `.araya/plan/spec/req-003-daneel-final.md` was written as an untracked local file. Never staged (`git add`), never committed, never pushed. Declares "DELIVERED" for REQ-003 but has zero Git traceability. |
| **Rule Violated** | REAL-009 (Working tree changes are not considered delivered), REAL-010 (Uncommitted work is not considered project progress), GOV-005 (Delivery evidence must be committed to dev-mahg) |
| **Evidence** | `git status`: `?? .araya/plan/spec/req-003-daneel-final.md` |
| **Current State** | Untracked file in working tree. At risk of loss if working tree is cleaned. |
| **Remediation** | 1. Create feature branch. 2. `git add` the file. 3. Commit with proper message. 4. Push. 5. Create GitHub PR. 6. Merge with `--no-ff` to dev-mahg. |
| **Status** | 🔴 OPEN |

---

### D09 — Gate Reports Not Committed (Manu)

| Field | Value |
|-------|-------|
| **ID** | D09 |
| **Type** | Evidence Traceability Violation |
| **Severity** | 🔴 CRITICAL |
| **Commit** | N/A — never committed |
| **Timestamp** | 2026-07-22 ~00:41 CEST |
| **Author** | Manu (Product Owner, AI agent) |
| **Description** | File `.araya/plan/spec/req-003-manu-final.md` was written as an untracked local file. Never staged, never committed, never pushed. Declares "PO APPROVED" but has zero Git traceability. |
| **Rule Violated** | REAL-009, REAL-010, GOV-005 |
| **Evidence** | `git status`: `?? .araya/plan/spec/req-003-manu-final.md` |
| **Current State** | Untracked file in working tree. At risk of loss if working tree is cleaned. |
| **Remediation** | Same as D08. Should be committed together as a single "gate reports archival" PR. |
| **Status** | 🔴 OPEN |

---

### D10 — Audit Reports Not Committed (ponny-express-0002)

| Field | Value |
|-------|-------|
| **ID** | D10 |
| **Type** | Evidence Traceability Violation |
| **Severity** | 🟡 HIGH |
| **Commit** | N/A — never committed |
| **Timestamp** | 2026-07-22 ~00:51 CEST (forensic), ~01:00 (Daneel audit), ~01:10 (Elena audit) |
| **Author** | R. Daneel Olivaw, Elena |
| **Description** | Three audit reports (`ponny-express-0002-daneel-audit.md`, `ponny-express-0002-elena-audit.md`, `ponny-express-0002-forensic-preservation.md`) exist as untracked files. These are the authoritative incident investigation documents and have zero Git traceability. |
| **Rule Violated** | REAL-009, REAL-010, GOV-005 |
| **Evidence** | `git status`: `?? .araya/plan/spec/ponny-express-0002-*.md` |
| **Current State** | Untracked files in working tree. |
| **Remediation** | 1. Commit all audit reports to the same feature branch as the gate reports. 2. This establishes the complete incident record in the DAG. |
| **Status** | 🔴 OPEN |

---

### D11 — Working Tree Dirty After "Recovery"

| Field | Value |
|-------|-------|
| **ID** | D11 |
| **Type** | Hygiene Violation |
| **Severity** | 🟡 HIGH |
| **Commit** | N/A — uncommitted modifications |
| **Timestamp** | 2026-07-22 (ongoing) |
| **Author** | N/A (timestamp regeneration) |
| **Description** | Two tracked files are modified but not committed: `.araya/catalog/catalog.json` (464 lines of timestamp bumps) and `.pi/loops.json` (2 lines, timestamp bump). These are automatic regenerations from tool execution. |
| **Rule Violated** | GOV-005 (Delivery completion requires clean state), DoD violation — working tree must be clean |
| **Evidence** | `git status --short`: `M .araya/catalog/catalog.json`, `M .pi/loops.json` |
| **Current State** | Dirty working tree. |
| **Remediation** | 1. If timestamps are the only change: `git checkout -- .araya/catalog/catalog.json .pi/loops.json` to discard. 2. Or commit them as a metadata update if the regeneration is meaningful. 3. Either way, working tree must be clean before next work cycle. |
| **Status** | 🔴 OPEN |

---

### D12 — Stash Orphan

| Field | Value |
|-------|-------|
| **ID** | D12 |
| **Type** | Evidence Management |
| **Severity** | 🟡 MEDIUM |
| **Commit** | `stash@{0}` — base `9a544aa` |
| **Timestamp** | 2026-07-22 00:34:33 CEST |
| **Author** | Manuel Hernández Giuliani |
| **Description** | Stash `stash@{0}` (WIP on dev-mahg: 9a544aa) was created during the incident recovery and never applied or dropped. Contains: `catalog.json` timestamps, `postoffice/thread.md` (Sonia entry), `loops.json` timestamps. The postoffice entry in the stash is NOT in the current working tree (FINDING-001 from forensic audit). |
| **Rule Violated** | Not a direct rule violation, but poor evidence management |
| **Evidence** | `git stash list`: `stash@{0}: WIP on dev-mahg: 9a544aa...` |
| **Current State** | Stash exists locally. Not pushed (stashes are local). At risk of accidental loss. |
| **Remediation** | 1. Archive stash as a branch: `git stash branch archive/incident-9a544aa-evidence stash@{0}`. 2. Push the archive branch to origin. 3. Delete the stash after archival. |
| **Status** | 🔴 OPEN |

---

### D13 — Zero Branch Protection on dev-mahg

| Field | Value |
|-------|-------|
| **ID** | D13 |
| **Type** | Infrastructure Security Gap |
| **Severity** | 🔴 CRITICAL |
| **Commit** | N/A — GitHub configuration |
| **Timestamp** | Pre-existing (verified 2026-07-22) |
| **Author** | N/A |
| **Description** | GitHub branch protection is **not configured** for `dev-mahg`. API returns HTTP 404 ("Branch not protected"). This means any collaborator can push directly to `dev-mahg` without a PR, without review, without CI checks. `main` protection status also needs verification. |
| **Rule Violated** | Absence of technical enforcement for BRANCH-001, BRANCH-002 |
| **Evidence** | `gh api repos/mahg-es/araya/branches/dev-mahg/protection` → HTTP 404 |
| **Current State** | No branch protection rules exist on either `main` or `dev-mahg`. |
| **Remediation** | 1. Configure branch protection on `main`: require PR, require approvals, block direct pushes. 2. Configure branch protection on `dev-mahg`: require PR. 3. Verify via `gh api` after configuration. |
| **Status** | 🔴 OPEN |

---

### D14 — No Merge Commits in Recovery Range

| Field | Value |
|-------|-------|
| **ID** | D14 |
| **Type** | Audit Trail Deficiency |
| **Severity** | 🟡 HIGH |
| **Commit** | N/A — absence of merge commits |
| **Timestamp** | 2026-07-22 |
| **Author** | N/A |
| **Description** | The range `8928c1d..bbd312b` contains **zero merge commits**. All integrations were Fast-forward merges that produce linear history indistinguishable from direct commits. `git log --merges dev-mahg --not origin/main` returns empty. |
| **Rule Violated** | Implicit: merge commits (`--no-ff`) are required for audit trail |
| **Reflog Evidence** | `git reflog dev-mahg`: two `merge ...: Fast-forward` entries |
| **Current State** | Linear DAG without merge commits. |
| **Remediation** | 1. Enforce `--no-ff` for all merges (can be set via `git config merge.ff false` on dev-mahg). 2. Configure GitHub to require merge commits. 3. Future merges will produce merge commits, making the DAG self-documenting. |
| **Status** | 🔴 OPEN |

---

## Summary Matrix

| ID | Type | Severity | Commit/SHA | Rule | Status |
|----|------|----------|-----------|------|--------|
| D01 | Direct commit on main | 🔴 CRITICAL | `9a544aa` | BRANCH-002, TOOL-006 | 🔴 OPEN |
| D02 | Contamination propagation | 🔴 CRITICAL | (FF merge) | BRANCH-001 | 🟢/🔴 MIXED |
| D03 | No PR — revert merge | 🔴 BLOCKER | `53b8715` | BRANCH-001, GOV-005 | 🔴 OPEN |
| D04 | No PR — clean reapply merge | 🔴 BLOCKER | `7c92ac7` | BRANCH-001, GOV-005 | 🔴 OPEN |
| D05 | Direct commit on dev-mahg | 🔴 BLOCKER | `bbd312b` | BRANCH-001 | 🔴 OPEN |
| D06 | Hard reset of main | 🔴 CRITICAL | (reset) | TOOL-006 | 🔴 OPEN |
| D07 | AI Co-authored-by | 🔴 VIOLATION | `9a544aa` | Attribution integrity | 🟢/🔴 MIXED |
| D08 | Daneel report uncommitted | 🔴 CRITICAL | (untracked) | REAL-009, REAL-010 | 🔴 OPEN |
| D09 | Manu report uncommitted | 🔴 CRITICAL | (untracked) | REAL-009, REAL-010 | 🔴 OPEN |
| D10 | Audit reports uncommitted | 🟡 HIGH | (untracked) | REAL-009, REAL-010 | 🔴 OPEN |
| D11 | Working tree dirty | 🟡 HIGH | (modified) | GOV-005 | 🔴 OPEN |
| D12 | Stash orphan | 🟡 MEDIUM | `stash@{0}` | Evidence mgmt | 🔴 OPEN |
| D13 | No branch protection | 🔴 CRITICAL | (GitHub config) | BRANCH-001, BRANCH-002 | 🔴 OPEN |
| D14 | No merge commits | 🟡 HIGH | (absence) | Audit trail | 🔴 OPEN |

**Totals:**
- 🔴 CRITICAL: 7
- 🔴 BLOCKER: 3
- 🔴 VIOLATION: 1
- 🟡 HIGH: 3
- 🟡 MEDIUM: 1

**Status: 14 deviations identified. 2 partially resolved (D02, D07). 12 fully open.**

---

*Sonia — PM Head Orchestrator, ARAYA*
*2026-07-22 01:15 CEST*
