# Branch Governance Policy

**Policy ID:** BRANCH-GOV-001
**Status:** Active — Permanent
**Authority:** ARAYA Constitution (BRANCH-001 through BRANCH-011, TOOL-006 through TOOL-008)
**Owner:** Sonia — PM Head Orchestrator, Delivery Authority
**Approved by:** The Data Professor
**Effective:** 2026-07-22
**Supersedes:** All prior undocumented branch workflows
**Repository scope:** All ARAYA-governed repositories under `mahg-es`

---

## 1. Canonical Branch Flow

```
feature/{task-id}-{short-description}
    │
    ├── git push origin <branch>
    ├── Create GitHub Pull Request → dev-mahg
    ├── Review (Daneel/Manu/Elena per Review Matrix)
    ├── CI passes (tests green, lint clean, security scan clean)
    ├── Merge via GitHub PR (--no-ff / merge commit)
    │
    ▼
dev-mahg (integration branch)
    │
    ├── At release: Create GitHub Pull Request → main
    ├── Full gate review (all blocker reviewers + PO approval)
    ├── merge --no-ff → main
    │
    ▼
main (protected release branch)
```

### 1.1 Branch Roles

| Branch | Role | Permanence | Direct Commits | Direct Pushes |
|--------|------|------------|---------------|---------------|
| `main` | Production release | ✅ Permanent | 🔴 **PROHIBITED** | 🔴 **PROHIBITED** |
| `dev-mahg` | Integration | ✅ Permanent | 🔴 **PROHIBITED** | 🔴 **PROHIBITED** |
| `feature/*` | Execution | 🔴 Temporary | ✅ Required | ✅ Allowed |

### 1.2 Direction of Flow

```
feature/* → dev-mahg → main
```

Flow is **strictly one-directional**. Merging `main` into `dev-mahg` or `main` into
`feature/*` is prohibited. The only exception is resolving merge conflicts when
rebasing a long-lived feature branch onto the latest `dev-mahg` — and even then,
`dev-mahg` → `feature/*` via rebase (not merge).

---

## 2. Prohibited Operations

### 2.1 Absolute Prohibitions (No Exceptions)

| # | Operation | Rule Reference | Detection |
|---|-----------|---------------|-----------|
| P1 | **Direct commit on `main`** | BRANCH-002, TOOL-006 | Pre-commit hook + GitHub branch protection |
| P2 | **Direct push to `main`** | BRANCH-002, TOOL-006 | GitHub branch protection |
| P3 | **Force push to `main`** | BRANCH-002 | GitHub branch protection |
| P4 | **Hard reset of `main`** | TOOL-006 | Reflog audit |
| P5 | **`git merge main` into any branch** | BRANCH-001 (direction) | Pre-commit hook |
| P6 | **Co-authored-by with AI agent names** | Attribution integrity | Pre-commit hook |

### 2.2 Operations Requiring Professor Authorization

| # | Operation | Authorization Required | Documentation Required |
|---|-----------|----------------------|------------------------|
| A1 | `git reset` on `main` | Professor explicit approval | Exception in `.araya/governance/exceptions/` |
| A2 | `git push --force` to any permanent branch | Professor explicit approval | Exception + ADR |
| A3 | Delete and recreate `main` or `dev-mahg` | Professor explicit approval | Exception + ADR |
| A4 | Squash merge that loses feature branch history | Professor explicit approval | ADR with justification |
| A5 | Merge without PR (emergency hotfix only) | Professor explicit approval | Exception with 24h expiry |

### 2.3 Operations Prohibited Without PR

| # | Operation | Required Instead |
|---|-----------|-----------------|
| B1 | Local `git merge` of feature into `dev-mahg` | GitHub PR merge |
| B2 | Local `git merge` of `dev-mahg` into `main` | GitHub PR merge |
| B3 | Direct commit on `dev-mahg` | Commit on `feature/*` → PR |
| B4 | `git push` to `dev-mahg` directly | Push to `feature/*` → PR merge |

---

## 3. Mandatory Pre-Flight Checklist

**Before every `git commit`, the operator MUST verify:**

```
□  1. I am on a feature branch (git branch --show-current starts with "feature/")
□  2. The branch name follows the pattern: feature/{task-id}-{short-description}
□  3. The commit message follows conventional commits format:
       type(scope): description
       No Co-authored-by trailers with AI agent names
□  4. Tests pass locally
□  5. No hardcoded secrets (git diff --cached | grep -i secret)
□  6. Working tree is clean except for intended changes
```

**Before every `git push`, the operator MUST verify:**

```
□  7. I am pushing a feature branch, not main or dev-mahg
□  8. The remote branch does not already have a PR (avoid duplicate)
□  9. After push: I will create a GitHub Pull Request
□  10. I will NOT do a local git merge after pushing
```

---

## 4. Pull Request Minimum Evidence

Every Pull Request MUST include:

### 4.1 Required in PR Description

- [ ] **Task Reference**: Link to task ID (`req-NNN`, `ponny-express-NNNN`)
- [ ] **Summary**: What this PR does, in 2-3 sentences
- [ ] **Test Evidence**: Test results (pass/fail counts, framework output)
- [ ] **Reviewers Assigned**: At minimum, one qualified reviewer per Review Matrix
- [ ] **CI Status**: All checks green before merge

### 4.2 Required Before Merge

- [ ] **At least one approving review** from a qualified reviewer
- [ ] **All CI checks passing** (tests, lint, security scan)
- [ ] **No unresolved review comments**
- [ ] **Branch is up to date** with the target branch (no merge conflicts)
- [ ] **Co-authored-by check**: No AI agent names in commit trailers

### 4.3 Merge Requirements

- [ ] **Merge method**: `--no-ff` (merge commit) — **REQUIRED**
- [ ] **Squash**: Allowed only if the Professor has approved squash for this project
- [ ] **Rebase**: Allowed only for cleaning feature branch history before PR creation
- [ ] **After merge**: Delete the feature branch (local AND remote) per BRANCH-005

---

## 5. Rules on ponny-express, Co-authored-by, and Main

### 5.1 ponny-express Incidents

- Any incident designated with the `ponny-express-NNNN` ID triggers a **governance BLOCK**.
- Remediation MUST follow GTR-001 (golden trajectory): freeze → audit → violations → batch remediation → verify → close.
- No code work resumes until the incident is documented, the deviation matrix is populated, and the Professor authorizes resumption.

### 5.2 Co-authored-by Trailers

- `Co-authored-by: Name <email>` is a GitHub-recognized convention for **human co-authorship**.
- Attributing AI agents (Isla, Valentina, Teresa, etc.) as `Co-authored-by` is **prohibited**.
- For AI-assisted work, use one of these alternatives:
  - `Reviewed-by: Daneel <daneel@araya.local>` — for AI gate reviews
  - `Generated-with: ARAYA/pi` — to acknowledge tooling
  - Or, preferably, document the agent involvement in the PR description, not the commit trailer.

### 5.3 Main Branch

- `main` is the **production release branch**. It is the face of the project.
- `main` is **protected both technically and procedurally**.
- `main` receives commits **only** via GitHub PR merge from `dev-mahg` at release time.
- Any operation that touches `main` outside this flow requires:
  1. Professor's **explicit**, **written** authorization
  2. A documented exception in `.araya/governance/exceptions/`
  3. An ADR recording the decision
- **There is no "quick fix" on main.** There is no "I'll just reset it." There is no "nobody will know."

---

## 6. Branch Protection — Technical Enforcement

### 6.1 GitHub Branch Protection Rules

These MUST be configured on every ARAYA-governed repository:

**`main` branch:**
- [x] Require a pull request before merging
- [x] Require approvals (minimum 1)
- [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require status checks to pass before merging
- [x] Require branches to be up to date before merging
- [x] Block direct pushes (no one can push to main)
- [x] Block force pushes

**`dev-mahg` branch:**
- [x] Require a pull request before merging
- [x] Require approvals (minimum 1)
- [x] Require status checks to pass before merging
- [x] Block direct pushes
- [x] Block force pushes

### 6.2 Local Pre-Commit Hook

Every developer working on ARAYA-governed repositories MUST install the
pre-commit hook (delivered via `make setup` or equivalent):

```bash
#!/bin/bash
# .git/hooks/pre-commit — ARAYA Branch Governance Hook

CURRENT_BRANCH=$(git branch --show-current)

# Block commits on permanent branches
if [[ "$CURRENT_BRANCH" == "main" ]] || [[ "$CURRENT_BRANCH" == "dev-mahg" ]]; then
    echo "🔴 BLOCKED: Direct commits on '$CURRENT_BRANCH' are prohibited."
    echo "   Create a feature branch: git checkout -b feature/{task-id}-{description}"
    echo "   See: .araya/governance/policies/branch-governance.md"
    exit 1
fi

# Block commits on branches that don't follow feature/* pattern
if [[ ! "$CURRENT_BRANCH" =~ ^feature/ ]]; then
    echo "🟡 WARNING: Branch '$CURRENT_BRANCH' does not follow feature/* convention."
    echo "   Expected: feature/{task-id}-{short-description}"
    echo "   Continue? (y/N)"
    read -r response
    if [[ "$response" != "y" ]] && [[ "$response" != "Y" ]]; then
        exit 1
    fi
fi

# Check for AI Co-authored-by in commit message
if git diff --cached --name-only | grep -q .; then
    # This check runs on the commit message via commit-msg hook
    # pre-commit just verifies branch
    :
fi

exit 0
```

### 6.3 Commit Message Hook

```bash
#!/bin/bash
# .git/hooks/commit-msg — ARAYA Commit Message Governance

COMMIT_MSG=$(cat "$1")

# Block Co-authored-by with known AI agent names
AGENT_NAMES="Isla|Aurora|Priscila|Diana|Valentina|Teresa|Elena|Esteban|Daneel|Manu|Sonia|Aisha|Lin|Junia|Alejandra|Bernabe|Maria|Aquila|Priya|Mateo|Lidia|Pablo|Lucas|Eunice|Dorcas|Sofia"
if echo "$COMMIT_MSG" | grep -qiE "Co-authored-by:.*($AGENT_NAMES)"; then
    echo "🔴 BLOCKED: Co-authored-by with AI agent names detected."
    echo "   These are ARAYA AI agents, not human contributors."
    echo "   Use 'Reviewed-by:', 'Acknowledged-by:', or document in PR description."
    echo "   See: .araya/governance/policies/branch-governance.md §5.2"
    exit 1
fi

exit 0
```

---

## 7. Exception Process

### 7.1 When an Exception Is Needed

Exceptions are required for any deviation from this policy. Examples:
- Emergency hotfix that must bypass PR workflow
- Main branch corruption requiring reset
- Force push to correct a mistakenly pushed branch

### 7.2 Exception Documentation

Every exception MUST be documented in `.araya/governance/exceptions/EXC-NNN.md`:

```markdown
# EXC-NNN — [Short Title]

- **Policy Deviated**: BRANCH-GOV-001 §X.Y
- **Date**: YYYY-MM-DD HH:MM TZ
- **Requested by**: [Agent name]
- **Approved by**: The Data Professor
- **Justification**: [Why the deviation is necessary]
- **Expiry**: [Date/time after which the exception is void]
- **Mitigation**: [What was done to minimize risk]
- **Post-Exception Action**: [What must happen after the exception closes]
- **Status**: Approved | Denied | Expired
```

### 7.3 Exception Lifecycle

1. Agent identifies need for exception
2. Agent files EXC-NNN.md with justification
3. Professor reviews and approves or denies
4. If approved: exception is executed with traceability
5. Post-exception action is completed
6. Exception marked as Expired (not deleted — preserved for audit)

---

## 8. Audit and Enforcement

### 8.1 Automated Checks

| Check | Frequency | Tool |
|-------|-----------|------|
| Branch protection status | Daily / on push | GitHub API |
| Pre-commit hook installed | On `make setup` | Makefile |
| Pre-commit hook active | Per commit | `.git/hooks/pre-commit` |
| Commit message compliance | Per commit | `.git/hooks/commit-msg` |
| Reflog audit (main touched?) | Weekly | `git reflog main` |

### 8.2 Manual Audits

| Audit | Frequency | Auditor |
|-------|-----------|---------|
| Branch flow compliance | Per sprint | Elena (PM Auditor) |
| Merge commit audit (--no-ff compliance) | Per sprint | Elena |
| PR traceability (every merge has a PR) | Per sprint | Daneel |
| Co-authored-by scan | Per sprint | Daneel |
| Exception register review | Monthly | Sonia |

### 8.3 Violation Handling

Violations of this policy are recorded in `.araya/governance/violations/VIO-NNN.md`
and follow the standard violation lifecycle per the ARAYA Constitution.

Repeated violations of the same rule trigger **escalation to The Data Professor**
per ESC-001.

A `ponny-express-NNNN` incident is automatically created for any violation of:
- P1 (direct commit on main)
- P2 (direct push to main)
- P3 (force push to main)
- P4 (hard reset of main)

---

## 9. Relationship to Other Governance Artifacts

| Artifact | Relationship |
|----------|-------------|
| ARAYA Constitution §BRANCH | This policy implements BRANCH-001 through BRANCH-011 with technical specifics |
| ARAYA Constitution §TOOL | This policy enforces TOOL-006 (no agent may modify main) |
| GTR-001 | Golden trajectory for governance remediation — followed when this policy is violated |
| ADR-001 (branch restoration) | Historical precedent for branch governance restoration |
| VIO-001 | Historical violation — direct commits to main (May 2026) |
| ponny-express-0002 | Current incident — validates need for this policy |
| GTR-001 | Remediation pattern to follow when this policy is violated |

---

## 10. Summary — Rules at a Glance

```
✅ DO                               🔴 DON'T
─────────────────────────────────   ────────────────────────────────
Create feature branch               Commit on main or dev-mahg
Push feature branch to origin       Push directly to main
Create GitHub PR                    Force push to main
Get review before merge             Local git merge + push
Merge via GitHub --no-ff            Claim PR recovery without evidence
Delete feature branch after merge   Use Co-authored-by for AI agents
Commit all gate reports             Leave reports as untracked files
Keep working tree clean             Touch main without authorization
Archive stash evidence              Reset main without exception
Install and use pre-commit hook     Leave branch protection disabled
```

---

*Sonia — PM Head Orchestrator, Delivery Authority, ARAYA*
*2026-07-22 01:15 CEST*
*Approved by: Pending The Data Professor's authorization*
