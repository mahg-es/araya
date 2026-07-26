# 03 — Decisions — BATCH-TRUTH-CONTINUITY-20260726

Decisions taken autonomously under ponny-express-10007 authorization. Each lists alternatives and rationale.

| # | Decision | Alternatives | Rationale / Evidence |
|---|---|---|---|
| D1 | Run directory lives in framework evidence worktree (`.araya/runs/BATCH-TRUTH-CONTINUITY-20260726/`) and ships with PR-F2 | portfolio repo; outside Git | VIO-003 resolution established `.araya/runs/`; the batch's evidence+reports are framework-centric; Git-preservable |
| D2 | PR-F2 branch = `feature/evidence-and-context-preservation` carries FASE 1 + FASE 4 (capsules v2) | two separate PRs | Batch allows combining when diff stays reviewable; both are additive-only (no modification of tracked files), single theme: continuity |
| D3 | Untracked evidence **copied**, originals left untouched in canonical checkout | move; clean | Explicit batch rule; preservation must not destroy the only pre-existing copy until Git holds it |
| D4 | FASE 3.5 `actor_role`: treat as **functional role class**, not agent name — see ADR draft in PR-F1; do NOT add `CLARA` to enum | add CLARA; rename TERESA→TEST_GATE | Enum already mixes classes (`SPECIALIST`); Clara acts as SPECIALIST in EXECUTING per `workflow.yaml` + gate test; Teresa owns TESTING as functional role per contract §9. Contract offers no *unequivocal* ruling on naming symmetry → per batch rule: no schema change, ADR draft with options |
| D5 | Capsule set v1 preserved unmodified; v2 written to `session-2026-07-26-v2/` | overwrite v1 | Batch rule: "No sobrescribas el set anterior. Consérvalo como evidencia histórica." |
| D6 | Gates invoked as subagents with the exact candidate SHA: Teresa (TEST_GATE) then Rolando (REALITY_AUTHORITY); Manu for PR-P1 semantics | self-certify | FASE 7 protocol + REQ-042 gates + contract separation of duties; Daneel never self-verifies |
| D7 | `.pi/loops.json` excluded from preservation | commit it | Batch rule: timestamp-only change |
| D8 | Hooks (FASE 5.3): build idempotent installer + sandbox tests in portfolio PR-P2; do NOT activate in canonical checkouts tonight | install directly | Batch: "No instales hooks a ciegas"; activation changes live Git behavior of canonical checkouts — installer + tests + documentation, activation decision recorded for Professor |
| D9 | Merge method for dev-* merges: GitHub PR merge (merge commit), never squash/rebase | squash | Branch governance: `--no-ff` merge commit REQUIRED |
| D10 | Portfolio traceability PR (PR-P1) built on `origin/dev-araya-portfolio` `f9689af` which already contains PRs #291/#292/#293 | cherry-pick 1e84210/cb71346 | Fetch proved all registrations already merged; cherry-pick would duplicate. FASE 2 = verify + traceability matrix + metadata correction only |
