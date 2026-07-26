# 007 — Open Findings (Corrected Register) — v2
> Capsule ID: 007 | Initiative: audit-findings | Status: CORRECTED
> Session: 2026-07-26-v2 | Framework: dev-mahg 38197e6 | Portfolio: dev-araya-portfolio ae4cc2d
> Supersedes v1 capsule 007 (which described F-001/F-002/F-003/F-008 as open — stale).

## Aurora Matrix findings — real state (git-verified 2026-07-26)

| ID | v1 claim | REAL STATE | Evidence |
|---|---|---|---|
| F-001 Teresa/Clara | ⛔ CRITICAL open | **RESOLVED** | araya.yaml: teresa=Independent Test Gate, clara=Test Automation Engineer; prompts aligned (5a29c7d); Sonia roster fixed (PR #82, `4073e3e`); gate test 31/31 asserts mapping |
| F-002 Aurora 4 skills | ⛔ HIGH deferred | **RESOLVED** | skills-lifecycle, spof-detection, organizational-health exist on disk; hiring-recommendations removed from araya.yaml (0 refs); gate test asserts exact set |
| F-003 Giskard operational refs | ⛔ HIGH open | **RESOLVED** (operational) | 0 refs in araya.yaml + prompts/agents/; CANONICAL-CONTEXT rewritten (PR #82) marking retired/superseded; `tests/canonical-context-test.js` enforces. Residue: outbox MSG-20260725-183610 `to: giskard` → preserved + discrepancy record; historical mentions in specs/postoffice thread allowed (T-031) |
| F-004 CLARA enum | ⚠️ MEDIUM open | **ADR-009 DRAFT** | `.araya/governance/adrs/adr-009-*.md`: actor_role = functional class (Option A recommended; Clara emits as SPECIALIST). Schema unchanged. Decision: Professor |
| F-005 bare agents | ⚠️ MEDIUM | **BY DESIGN (Neo/Trinity) / OPEN (Sofia)** | Neo+Trinity dormant per design (REQ-044 lineage). Sofia active-bare — capability decision pending (Aurora/Professor) |
| F-006 Daneel can_write_code | ⚠️ LOW open | **RESOLVED** | `can_write_code: false` in araya.yaml; generated profile COORDINATOR |
| F-007 Rolando permissions | ℹ️ OK | CONFIRMED | unchanged, gate-tested |
| F-008 Teresa prompt stale | ⛔ HIGH open | **RESOLVED** | `prompts/agents/teresa.md` = Independent Test Gate (5a29c7d); `.pi/agents/teresa.md` regenerated TEST_GATE |

## PE-0007 BLOCKs — remediation state (portfolio PR #295, merge `ae4cc2d`)

| BLOCK | State 2026-07-26 | Evidence |
|---|---|---|
| B1 /tmp worktrees | **VIOLATION ELIMINATED** | 3 worktrees removed without --force after safety proof (clean, 0 untracked, no unique commits, SHAs ancestors of origin/main+dev); Rolando VERIFIED removal evidence (PR #295 gate item 4) |
| B2 hooks inactive | **REMEDIATION DELIVERED, ACTIVATION PENDING** | `ops/install/install-git-hooks.sh` + templates + sandbox suite 8/8 + README (PR #295); canonical `.git/hooks/` untouched — activation = Professor decision |
| B3 empty AX3 | **RESOLVED** | 26/26 AX3.md complete; `tests/test_ax3_nonempty.py` enforces (5/5 OK); classification register in run records |
| B4 portfolio not self-governing | **RESOLVED (tracking)** | `portfolio/projects/araya/canon-rule-001.md` tracked (PR #295) |

Formal PE-0007 closure requires Rolando's incident-level re-evaluation + a valid recipient for the re-routed BLOCKs (Q7 — Professor decision; original dispatch went to retired Giskard).

## Other open items
- **Q1:** Manu SPEC_APPROVED for Aisha architecture (REQ-043) — DRAFT PENDING MANU REVIEW; blocks REQ-043 acceptance + REQ-042 start.
- **Q2:** `req-001-teresa-final-test-report.md` absent — REQ-001 evidence gap.
- **REQ-043 gates:** Teresa PASS / Rolando VERIFIED never emitted on merge SHA `0902ac6` (criteria 20/21). Strongest verified SHA: `4073e3e` (PR #82 gates) which contains the delivery.
- **Manu observation (PR #294):** index.md header counts APC-scoped items only; acceptable but flagged for clarity follow-up.
- **Teresa observation (PR #294):** req-040 Agent Metadata still placeholder text.

> v2 rule: every finding carries its verifying SHA/PR. No finding copied forward without re-verification.
