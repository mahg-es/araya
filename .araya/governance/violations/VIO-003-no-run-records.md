# VIO-003 — Work Without Run Records

**Violation ID:** VIO-003
**Rule Violated:** REAL-004 (Work without run records is a governance violation)
**Severity:** HIGH
**Status:** RESOLVED — Remediation Batch 3 created RUN-0001

## Timeline
- **Period:** v0.5.9 → v0.6.6
- **Work affected:** ~15 commits across multiple batches executed without run records
- **Root cause:** .araya/runs/ was gitignored; run record creation not automated

## Resolution
- RUN-0001 created for Capability Registry Generation
- .araya/runs/ removed from .gitignore
- Run record schema documented (.araya/runs/_schema.md)

## Evidence
- RUN-0001: .araya/runs/RUN-0001/run.json
- Schema: .araya/runs/_schema.md
