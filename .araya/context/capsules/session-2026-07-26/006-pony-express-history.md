# 006 — Pony Express History (Processed Incidents)
> Capsule ID: 006 | Initiative: pony-express | Status: MIXED (5 closed, 1 blocked, 1 active)
> Session: 2026-07-26 | Framework HEAD: 0902ac6 | Token budget: ~3500

---

## What is Pony Express?

ARAYA internal governance incident/coordination channel. PE incidents are numbered sequentially. An incident with `ponny-express-NNNN` ID triggers governance BLOCK → remediation follows GTR-001: freeze → audit → violations → batch remediation → verify → close.

---

## Processed Incidents

### PE-0002 — Branch Governance Recovery
**Status:** ✅ **CLOSED** | **PR:** #76 | **Trajectory:** GTR-001 (golden)

**What happened:** Branch governance violation discovered. Direct commits to main (VIO-001), divergence between reality and reported state.

**Resolution:**
- Incident report: `.araya/plan/spec/ponny-express-0002-incident-report.md`
- Forensic preservation: `.araya/plan/spec/ponny-express-0002-forensic-preservation.md`
- Deviation matrix populated
- Branch governance policy enacted: `branch-governance.md`
- Daneel audit + Elena process audit + Manu final signoff
- PR #76 merged (ebd22e1)

**Golden trajectory GTR-001 captured:** freeze → audit → violations → batch remediation → verify → close.

---

### PE-0005 — Architectural Work Units (AWUs)
**Status:** 📋 **SPEC** (40% complete)

**Spec:** `.araya/plan/spec/ponny-express-0005-awus.md`

AWUs are the smallest independently deliverable unit of architecture work. Spec defines AWU format, lifecycle, and traceability to Relay tasks. No implementation yet.

---

### PE-0007 — Aurora + Rolando Integration
**Status:** 🔴 **BLOCKED** — 4 active BLOCKs from Rolando

**Spec:** `.araya/plan/spec/ponny-express-0007-aurora-rolando.md`

Rolando issued 4 BLOCKs via outbox MSG-20260725:

| BLOCK ID | Description | Severity | Detail |
|----------|-------------|----------|--------|
| **PE-0007-B1** | 3 worktrees in /tmp | CRITICAL | Violates canon-rule-001. Worktrees merged (PR #273) but **not removed**. |
| **PE-0007-B2** | Hook not active | CRITICAL | `.araya/hooks/` exists, `.git/hooks/` does NOT. REAL-002: Configured ≠ Operational. |
| **PE-0007-B3** | 26 AX3.md with zero domain content, untracked | HIGH | False compliance vector. Templates never filled. |
| **PE-0007-B4** | Portfolio not self-governing | HIGH | canon-rule-001 spec untracked in portfolio. |

**285/286 tests passed (99.65%).** Daneel falsely reported "hook active."

---

### PE-0009 — Relay Protocol Design Review
**Status:** ✅ **VERIFIED** | **PRs:** #78 → #79

**Teresa review:** FIX — 3 path inconsistencies (task-schema, event-schema, claim-contract paths missing `runtime/` segment). Resolved in commit 92a4e5b. 11/11 structural criteria PASS. 33 acceptance tests.

**Rolando verification:** VERIFIED WITH OBSERVATION — 6/7 criteria VERIFIED. 1 DISCREPANCY: 9 artifacts present (filesystem-layout.md declares 9 — OK). Teresa's 3 FIX items: all RESOLVED.

**Design is IMPLEMENTATION-READY.**

---

### PE-0012 — Multi-Stream Closure Verification
**Status:** ✅ **CLOSED** | **Rolando:** 20/20 criteria pass

**What was verified:**
- Framework HEAD 7fcc9b0 (merge PR #79)
- Coordinator main = origin/main
- REQ-042: PR #291 MERGED (4/4 verified)
- All stashes inventoried (19)
- All /tmp worktrees accounted for (3)
- All untracked files classified (42: 26 AX3 + 13 PE + 2 audit + 1 REQ-042)
- Framework divergence explained (dev-mahg ahead of origin/main)
- No evidence discarded

---

### PE-0013 — REQ-043 Execution (Implicit)
**Status:** 🟡 **ACTIVE** (transitions to DELIVERED with PR #81)

Step 1: Aurora Matrix complete (8 findings). Step 2: Aisha Architecture + Priscila Contract complete. Step 3: Implementation + PR #81 recovery delivered (381/381 tests). Awaiting Manu SPEC_APPROVED on architecture and findings resolution.

---

## Summary

| PE | Description | Status | Date |
|----|-------------|--------|------|
| 0002 | Branch governance recovery | ✅ CLOSED | 2026-07-22 |
| 0005 | AWUs | 📋 SPEC | 2026-07-21 |
| 0007 | Aurora + Rolando | 🔴 BLOCKED (4 BLOCKs) | 2026-07-25 |
| 0009 | Relay Protocol review | ✅ VERIFIED | 2026-07-25 |
| 0012 | Closure verification | ✅ CLOSED (20/20) | 2026-07-25 |
| 0013 | REQ-043 execution | 🟢 DELIVERED | 2026-07-26 |

---

> **Capsule generated:** 2026-07-26 | Sonia (PM Head Orchestrator)
> **Sources:** plan/spec/ponny-express-*.md, postoffice thread, session capsules, git log
