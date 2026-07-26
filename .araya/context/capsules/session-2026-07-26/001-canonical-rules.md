# 001 — Canonical Rules (Permanent Governance)
> Capsule ID: 001 | Initiative: canonical-rules-permanent | Status: CANONICAL
> Session: 2026-07-26 | Framework HEAD: 0902ac6 | Token budget: ~2500

---

## 1. AX3 Contract Hierarchy (CANONICAL)

**Source:** `AGENTS.md` + root `AX3.md` + child AX3 chain

Every agent MUST:
1. Check if `AX3.md` exists at the project root.
2. If it exists → read it completely. The root `AX3.md` is the binding contract.
3. Walk from repository root to each target path, reading every `AX3.md` found.
4. Use the nearest `AX3.md` as the local contract. A child may concretize but never weaken a parent.
5. After meaningful changes → run AX3 postflight: update affected `AX3.md` files and Child AX3 Indexes.

**Current AX3 tree:** 10 files: root `AX3.md` + 9 child AX3 (`governance`, `graph`, `knowledge`, `learning`, `plan`, `postoffice`, `relay`, `reports`, `topology`, `trajectories`).

**Violation:** 26 AX3.md had zero domain content (PE-0007-B3). Some now filled.

---

## 2. Branch Governance (CANONICAL)

**Policy:** `branch-governance.md` §1.1

```
feature/{task-id}-{short-description} → dev-mahg → main
```

| Branch | Role | Direct Commits | Direct Pushes |
|--------|------|---------------|---------------|
| `main` | Production release | 🔴 PROHIBITED | 🔴 PROHIBITED |
| `dev-mahg` | Integration | 🔴 PROHIBITED | 🔴 PROHIBITED |
| `feature/*` | Execution | ✅ Required | ✅ Allowed |

**Binding rules:**
- **BRANCH-001:** feature/* → dev-mahg → main. One-directional flow.
- **BRANCH-002:** Direct commits to main = governance violation.
- **BRANCH-005:** Merged feature branches must be deleted both locally and remotely.
- **BRANCH-009:** Capability not delivered until it exists in dev-mahg.
- **BRANCH-010:** Capability not released until it exists in main.
- **TOOL-006:** No agent may modify `main` directly.
- Merge method: `--no-ff` (merge commit) REQUIRED.
- Co-authored-by with AI agent names PROHIBITED.

**Violations:** VIO-001 (14 direct commits to main, May 2026 — RESOLVED).

---

## 3. canon-rule-001 — Workspace Hygiene (CANONICAL)

**Source:** `AGENTS.md` §Workspace Hygiene

> All Git worktrees MUST be created exclusively under `~/github/mahg-es/worktrees/<repository>/<worktree-name>`.

**Never** create worktrees alongside repositories (e.g., `~/github/mahg-es/araya-something`).

**Violation = BLOCK-level incident.**

**Active BLOCK:** PE-0007-B1 — 3 worktrees in `/tmp` (merged PR #273 but not removed).

---

## 4. ADR-008 — Universal Agent Tool Access (CANONICAL)

**Authority:** The Data Professor, 2026-07-20

All ARAYA agents have permanent access to:
- `read`, `grep`, `find` — file inspection (TOOL-001)
- `bash` — command execution, Git, tests, scripts (TOOL-002)
- PostOffice read (TOOL-003) and write (TOOL-004)

**Restrictions only for:** security, destructive operations, secrets, scope, main-branch.

This authorization is permanent, universal. No per-agent or per-invocation re-approval.

---

## 5. Versioning (CANONICAL)

**Standard:** Major.Revision.Hotfix. NOT SemVer.

| Constraint | Value |
|-----------|-------|
| Max Revision | 73 |
| Max Hotfix | 5 |
| Rollover | 0.73.5 → 1.0.0 |
| HOTFIX range | 0..5 (TECH-006) |

---

## 6. ARAYA Identity & Authority (CANONICAL)

| Authority | Agent | Owns | Approval |
|-----------|-------|------|----------|
| STRATEGIC | Professor | Direction, major decisions | Final |
| PRODUCT | Manu 👑 | WHAT: vision, requirements, ACs, backlog | Pre-implementation + Pre-delivery |
| CAPABILITY | Aurora 🌟 | WHO CAN: registry, gaps, workforce | GAR generation |
| DELIVERY | Sonia 👩‍💼 | HOW: planning, coordination, risk | Sprint scope |
| REALITY | Rolando 🛡️ | IS IT TRUE: verification, audits | Binding dispositions |

**Retired:** Giskard — no operational role. No entry in araya.yaml, no prompt, no skills, no Relay role. Relay T-030: any operational Giskard reference = BLOCK.

---

## 7. Evidence & Repository Truth (CANONICAL)

**REAL-006 to REAL-010:**
- Repository is the default source of truth.
- Every report must declare: Workspace, Feature Branch, dev-mahg, main, Release Tag, Production.
- Capability cannot be reported completed unless in target branch.
- Working tree changes ≠ delivered. Uncommitted work ≠ project progress.

**Evidence > Claims.** Workspace ≠ Delivered.

---

## 8. PostOffice Protocol (CANONICAL)

- `.araya/postoffice/thread.md` — inter-agent communication.
- Advisory, never a gate. Read at cycle start, write at cycle end.
- All agents have PostOffice R/W per ADR-008.
- Governance acts (BLOCK, VERIFIED, DISCREPANCY) travel through PostOffice.

---

## 9. Cross-Cutting Skills (MANDATORY)

Every ARAYA agent MUST carry:

| Skill | Purpose |
|-------|---------|
| `araya-command-and-delegation-expert` | Command discovery, manual consultation, capability-aware delegation |
| `ax3` | AX3 contract hierarchy — preflight/postflight |
| `ax-postoffice` | PostOffice communication protocol |
| `token-efficiency` | Token consumption optimization |
| `relay-participant` | Relay protocol participation (required for all Relay-capable agents) |

**Validation:** Agent missing any of first 4 AX skills = invalid. Missing `relay-participant` valid only for non-Relay agents.

---

## 10. Delivery Modes (CANONICAL)

| Mode | Phases | When Used |
|------|--------|----------|
| **full** | sdd → bdd → tdd → implementation → review → security → validation → docs | New features, architecture changes, security-sensitive |
| **standard** | plan → tests → implementation → review → validation | Normal feature work |
| **quick** | review only | Docs, naming fixes, UI text, minor config |
| **review** | review → security | Code review, PR review, architecture review |
| **repair** | tests → validation | Fixing failed tests, broken builds, lint |

---

## 11. Constitutional Rules — Key Extracts

| Domain | Key Rules |
|--------|-----------|
| **GOV** | Requirements before implementation. ACs before implementation. Validation before delivery. No silent scope changes. |
| **SEC** | No hardcoded secrets. Security findings cannot be ignored. Critical vulnerabilities block delivery. |
| **ENG** | Implementation follows approved specs. Traceability valid. No orphan artifacts. Unix philosophy + composition. |
| **HR** | Only qualified agents. Missing capabilities block. Aurora proposes, Professor approves. Separation of duties. |
| **REAL** | Configured ≠ Operational. Operational ≠ Independently Verified. Work without run records = violation. |
| **TOOL** | Baseline access permanent. Main-branch restriction absolute. Secrets restriction absolute. |
| **BRANCH** | See §2 above. |

---

> **Capsule generated:** 2026-07-26 | Sonia (PM Head Orchestrator)
> **Canonical sources:** CANONICAL-CONTEXT.md, constitution.md, branch-governance.md, AGENTS.md, ADR-008, AX3.md root + child chain
