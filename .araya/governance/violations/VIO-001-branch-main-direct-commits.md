# VIO-001 — Direct Commits to Main

**Violation ID:** VIO-001
**Rule Violated:** BRANCH-002 (Direct commits to main are governance violations)
**Severity:** HIGH
**Status:** RESOLVED — Remediation Batch 1 restored branch governance

## Timeline
- **Period:** 2026-05-29 to 2026-05-30
- **Commits affected:** 14 direct commits to main (v0.5.9 → v0.6.6)
- **Root cause:** `--delete-branch` flag on PR merges deleted dev-mahg, causing subsequent commits to land on main

## Resolution
- dev-mahg restored from main tip (Remediation Batch 1)
- `--delete-branch` flag discontinued
- ADR-001 documented the restoration
- Process change: dev-mahg now persists between batches

## Evidence
- Git log: 14 commits between last PR merge (221883e) and restoration (5badf5f)
- ADR-001: .araya/governance/adrs/adr-001-branch-restoration.md
- Remediation Batch 1 PR: #47

## Preventative Measures
- dev-mahg is now persistent (not deleted on merge)
- All future work targets dev-mahg → PR → main
