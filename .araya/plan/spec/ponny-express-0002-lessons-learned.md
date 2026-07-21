# ponny-express-0002 — Lessons Learned

**Incident ID:** ponny-express-0002
**Document Type:** Post-Incident Analysis
**Author:** Sonia — PM Head Orchestrator
**Date:** 2026-07-22 01:15 CEST
**Status:** Active
**Triggered by:** Governance bypass — direct commit on main, zero-PR integration, local merges

---

## 1. Root Cause Analysis

### 1.1 The 5 Whys

| Why? | Answer |
|------|--------|
| **Why did 9a544aa land on main?** | The Professor was on `main` when he committed, instead of on a feature branch. |
| **Why was the Professor on main?** | No pre-commit hook, no branch protection, and no automated guard prevented committing on `main`. |
| **Why was there no guard?** | Branch protection on GitHub (`dev-mahg` and `main`) was never configured. Pre-commit hooks were never implemented. The governance exists on paper (BRANCH-002) but not in code. |
| **Why was governance only on paper?** | ARAYA governance remediation (GTR-001) fixed documentation but did not implement technical enforcement. The assumption was that process discipline alone would suffice. |
| **Why did the recovery itself violate governance?** | Under time pressure to "fix it fast," the correct PR workflow was bypassed in favor of local merges — the same shortcut that caused the original incident. The stash + revert + reapply pattern was technically correct but executed outside the governance framework. |

### 1.2 Root Cause Statement

**Primary:** Governance rules exist in documentation but lack technical enforcement.
Humans under time pressure take shortcuts. Without automated gates (pre-commit hooks,
branch protection, required PRs), the gap between "what should happen" and "what
actually happens" widens until an incident occurs.

**Secondary:** The recovery process itself was not governed. When deviation was
detected (Daneel BLOCK), the response was a rapid local fix rather than a governed,
traced, and PR-reviewed remediation. The same shortcuts were replicated.

**Tertiary:** Verification claims ("2 PR recovery verified") were made without
evidence. The gate agents (Daneel, Manu) produced reports but those reports were
never committed — making them invisible to repository history.

---

## 2. What Failed in the Process

### 2.1 Pre-Commit: No Automated Guard

| What should have happened | What actually happened |
|---------------------------|------------------------|
| `git commit` on `main` should be blocked by a pre-commit hook | Commit `9a544aa` landed on `main` without any warning or block |
| Feature work should start with `git checkout -b feature/xxx` | Work was done directly on `main` |

**Consequence:** A single `git commit` on the wrong branch contaminated the release branch.

### 2.2 Integration: PR Workflow Bypassed

| What should have happened | What actually happened |
|---------------------------|------------------------|
| Feature branch → `git push origin` → GitHub PR → review → `merge --no-ff` → dev-mahg | Feature branch → `git push origin` → `git checkout dev-mahg` → `git merge <branch>` (FF) → `git push` |
| Merge commits in the DAG provide audit trail | Zero merge commits. Linear history indistinguishable from direct commits. |
| GitHub PR page provides review comments, CI results, approval record | No PR page exists. No review record exists. |

**Consequence:** The two feature branches (`feature/req-002-revert-9a544aa` and
`feature/req-001-clean-reapply`) exist on origin but their integration into `dev-mahg`
has zero PR traceability. The reflog is the only evidence of how they were merged.

### 2.3 Direct Commit on Integration Branch

| What should have happened | What actually happened |
|---------------------------|------------------------|
| All commits on `dev-mahg` arrive via PR merge | `bbd312b` was committed directly on `dev-mahg` |

**Consequence:** Even the audit documentation itself violated the branch flow it
was documenting.

### 2.4 Gate Reports Not Committed

| What should have happened | What actually happened |
|---------------------------|------------------------|
| Daneel and Manu produce reports → committed via PR to dev-mahg | Reports written as local files, never `git add`-ed, never committed |

**Consequence:** The two most critical gate approvals (Daneel "DELIVERED" and Manu
"PO APPROVED") exist only as untracked files. They have no Git history, no timestamp
in the DAG, no traceable authorship. They are invisible to anyone cloning the repository.

### 2.5 Main Reset Without Authorization

| What should have happened | What actually happened |
|---------------------------|------------------------|
| If main needs correction → file an exception, get Professor approval, execute with traceability | `git reset --hard origin/main` executed without documented exception |

**Consequence:** While the reset was technically correct (restored main to canonical state),
it violated the explicit prohibition against touching main and left no exception record.

### 2.6 No Post-Incident Cleanup

| What should have happened | What actually happened |
|---------------------------|------------------------|
| After recovery: working tree clean, stash archived, all reports committed | Working tree dirty (2 modified, 2 untracked), stash orphan, reports uncommitted |

**Consequence:** The incident's artifacts remain scattered across the working tree,
stash, and reflog — not consolidated, not committed, not traceable.

---

## 3. Controls That Were Missing

### 3.1 Technical Controls

| Control | Status at Time of Incident | Priority for Remediation |
|---------|---------------------------|--------------------------|
| **Pre-commit hook**: block commits on `main` | ❌ Not implemented | 🔴 CRITICAL |
| **GitHub branch protection on `main`**: require PRs, block direct pushes | ❌ Not configured | 🔴 CRITICAL |
| **GitHub branch protection on `dev-mahg`**: require PRs | ❌ Not configured (API returns 404) | 🔴 CRITICAL |
| **Required merge strategy**: `--no-ff` (merge commit required) | ❌ Not enforced | 🟡 HIGH |
| **CI check**: verify branch name ≠ `main` before allowing merge | ❌ Not implemented | 🟡 MEDIUM |

### 3.2 Process Controls

| Control | Status at Time of Incident | Priority for Remediation |
|---------|---------------------------|--------------------------|
| **Pre-commit checklist**: verify branch, verify no Co-authored-by AI names | ❌ Not documented | 🟡 HIGH |
| **Post-incident playbook**: governed steps for recovery after a BLOCK | ❌ Does not exist | 🟡 HIGH |
| **Exception process**: how to request and document a main reset exception | ❌ Not documented | 🟡 MEDIUM |
| **Gate report archival**: all gate reports must be committed before closure | ⚠️ Documented (GOV-005) but not followed | 🟡 MEDIUM |

### 3.3 Cultural Controls

| Control | Status at Time of Incident |
|---------|---------------------------|
| "Don't touch main" reflex | ⚠️ Understood intellectually but not internalized |
| "No PR = not done" reflex | ❌ PR workflow seen as optional, not mandatory |
| "Commit the evidence" reflex | ❌ Gate reports treated as working documents, not immutable records |

---

## 4. How This Is Prevented in the Future

### 4.1 Immediate Technical Fixes (AWU 4+)

1. **Pre-commit hook** — Install a hook in `.git/hooks/pre-commit` that blocks commits on `main`, `dev-mahg`, or any branch not matching `feature/*`. Deliverable: hook script + installation instruction in AGENTS.md.

2. **GitHub Branch Protection** — Configure branch protection rules on `mahg-es/araya`:
   - `main`: Require pull request before merging, require approvals, block direct pushes.
   - `dev-mahg`: Require pull request before merging.
   - Deliverable: Applied protection rules verified by `gh api`.

3. **Co-authored-by pre-commit check** — Extend the pre-commit hook to scan the commit message for `Co-authored-by:` trailers that contain ARAYA agent names. Block the commit with an explanation.

### 4.2 Process Improvements

4. **Branch Governance Policy** — Codify and publish `.araya/governance/policies/branch-governance.md` as the single source of truth for branch workflow. (Delivered in this AWU.)

5. **Pre-Commit Checklist** — A mandatory checklist (similar to a pilot's pre-flight) that every commit must satisfy: right branch? right message format? no AI Co-authored-by? tests passing? Review before commit, not after.

6. **Post-Incident Playbook** — Define governed steps for recovery after a governance BLOCK. Must include: freeze work → forensic snapshot → document deviations → create PR-based recovery → verify independently → close with Professor sign-off.

7. **Gate Report Immutability** — All gate reports (Daneel verification, Manu PO approval, Elena process audit) must be committed to the repository as part of the delivery. A delivery is not complete until all gate artifacts are in the DAG.

### 4.3 Cultural Reinforcement

8. **GTR-001 Pattern Compliance** — All future governance remediations must follow the GTR-001 golden trajectory: freeze → audit → document violations → remediate in small batches → verify each batch → close with health report.

9. **Personal Pre-Flight** — Before any `git commit`, the operator should ask: "Am I on a feature branch? Will this create a PR? Is the evidence committed?" This becomes muscle memory through repetition and hook enforcement.

---

## 5. What Went Right

Not everything failed. These are worth preserving:

| What Worked | Why It Matters |
|-------------|---------------|
| **Daneel detected the violation immediately** | The Reality Verification layer caught `9a544aa` on main and issued a BLOCK. The detection mechanism works. |
| **Elena independently verified Daneel's findings** | Two independent auditors reached the same conclusion. No false positive. |
| **The reflog preserved all evidence** | Git's reflog is the ultimate audit trail. Without it, the incident would be invisible. |
| **Content of REQ-001 was functionally correct** | 349/349 tests passing, catalog complete, delegation functional. The code was good; the process was not. |
| **The revert + clean reapply pattern was technically sound** | Separating the revert (remove violation) from the reapply (restore functionality) was the correct architectural decision — it just needed to happen inside the PR workflow. |
| **Stash preserved working state** | The stash captured the intermediate state including the postoffice entry. Evidence was not lost. |

---

## 6. Organizational Impact

### 6.1 On the ARAYA Governance Framework

This incident validates the need for **technical enforcement of governance rules**.
Paper governance is necessary but insufficient. The constitution (BRANCH-001 through
BRANCH-011, TOOL-006 through TOOL-008) is correct — but it must be backed by:

- Git hooks (cannot commit on wrong branch)
- GitHub branch protection (cannot push to wrong branch)
- CI gates (cannot merge without PR)
- Automated Co-authored-by scanning

### 6.2 On GTR-001 (Golden Trajectory)

GTR-001 established the pattern for governance remediation. ponny-express-0002
demonstrates that the pattern was not followed in the heat of incident response.
The next iteration of this trajectory should include an **urgency override**
clause: "Even under time pressure, do not bypass the PR workflow. A slow
governed fix is faster than a second incident."

### 6.3 On the Reality Verification Layer

Daneel's detection was fast and accurate. The gap is between detection and
remediation: after the BLOCK, there was no governed remediation playbook.
The system correctly said "STOP" but had no answer to "what now?"

---

## 7. Recommendations for Professor Approval

| # | Recommendation | Effort | Impact |
|---|---------------|--------|--------|
| R1 | Install pre-commit hook blocking commits on main/dev-mahg | Low | 🔴 Critical |
| R2 | Configure GitHub branch protection on main + dev-mahg | Low | 🔴 Critical |
| R3 | Codify Branch Governance Policy (this AWU delivers it) | This AWU | 🟡 High |
| R4 | Create Post-Incident Remediation Playbook | Medium | 🟡 High |
| R5 | Extend pre-commit hook to detect AI Co-authored-by | Low | 🟡 Medium |
| R6 | Document exception process for main reset | Low | 🟡 Medium |
| R7 | Commit and trace all current untracked gate reports | This AWU | 🟡 High |

---

## 8. References

- Daneel Audit: `.araya/plan/spec/ponny-express-0002-daneel-audit.md`
- Elena Audit: `.araya/plan/spec/ponny-express-0002-elena-audit.md`
- Forensic Preservation: `.araya/plan/spec/ponny-express-0002-forensic-preservation.md`
- Incident Report: `.araya/plan/spec/ponny-express-0002-incident-report.md`
- Deviation Matrix: `.araya/plan/spec/ponny-express-0002-deviation-matrix.md`
- GTR-001: `.araya/trajectories/golden/GTR-001-governance-remediation.md`
- VIO-001: `.araya/governance/violations/VIO-001-branch-main-direct-commits.md`
- ARAYA Constitution: `.araya/governance/constitution.md`
- Branch Governance Policy: `.araya/governance/policies/branch-governance.md`

---

*Sonia — PM Head Orchestrator, ARAYA*
*2026-07-22 01:15 CEST*
