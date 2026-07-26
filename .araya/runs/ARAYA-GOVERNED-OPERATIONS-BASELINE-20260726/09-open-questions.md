# 09 — Open Questions — ARAYA-GOVERNED-OPERATIONS-BASELINE-20260726

| # | Question | Evidence | Status |
|---|---|---|---|
| Q1 | Canonical checkouts (both repos) remain stale with pre-existing untracked files. Cleanup + ff sync? | git status both repos; D-R1 in 07-runtime-installation.md | OPEN — Professor decision (was Q5/Q6 in prior cycles) |
| Q2 | Fresh-session interactive verification of the new slash commands and Pi custom tools cannot be exercised from inside this session. Static verification done (installed file == gate-tested source). | 07-runtime-installation.md verification table | OPEN — next Professor session |
| Q3 | REQ-043's Manu SPEC_APPROVED still pending (carried from prior cycles). | req-043-aisha-architecture.md DRAFT | OPEN — Professor/Manu |
| Q4 | `/araya:trace --validate` now reports NOT_IMPLEMENTED. Is a real orphan-detection implementation wanted, and in which requirement? | PHASE 10 correction | OPEN — Manu decision |
| Q5 | daneel-persona.ts is corrected in repo but was never installed globally (no installed copy found). Install it, or keep it repo-only? | ls ~/.pi/agent/extensions (no persona file) | OPEN — Professor decision |
| Q6 | Skills full-tree sync (all 128) vs per-file sync used tonight. | 07-runtime-installation.md | OPEN — next install cycle |
| Q7 | Design-only future operations (6 contracts) need explicit future authorization before any implementation. | operations/*.yaml design-only | REGISTERED (by design) |
