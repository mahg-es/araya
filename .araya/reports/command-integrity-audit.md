# ARAYA Command Integrity Audit

**Date:** 2026-05-30
**Trigger:** `/araya compact` documented but not executable
**Methodology:** Repository truth — extension code vs README documentation

---

## Summary

| Metric | Count |
|--------|-------|
| Total registered commands | 36 |
| Documented in README | 20 |
| **Fully verified (code + docs)** | **14** |
| Registered but NOT documented | 22 |
| Documented but NOT registered | 0 |

---

## Verification Matrix (Sample)

| Command | Documented | Registered | Space-Routed | Executable | Maturity |
|---------|-----------|-----------|-------------|------------|----------|
| `/araya run` | ✅ | ✅ | ✅ | ✅ | Operational |
| `/araya help` | ✅ | ✅ | ✅ | ✅ | Operational |
| `/araya compact` | ❌ | ✅ | ✅ | ✅ (fixed) | Running |
| `/araya handoff` | ❌ | ✅ | ✅ | ✅ | Running |
| `/araya reconstitute` | ❌ | ✅ | ✅ | ✅ | Running |
| `/araya validate` | ❌ | ✅ | ❌ | ✅ | Running |
| `/araya constitution` | ✅ | ✅ | ❌ | ✅ | Operational |
| `/araya reality-check` | ✅ | ✅ | ❌ | ✅ | Operational |

**Maturity Scale:** Configured → Implemented → Running → Operational → Independently Verified

---

## 🔴 CMD-001 Violation (The Trigger)

| Command | Issue | Root Cause |
|---------|-------|-----------|
| `/araya compact` | Documented as capability, not executable | Registered as `araya:compact` only — space routing missing |

**CMD-001 rule violated:** Command documented without being executable.

---

## 🟡 Documentation Gaps (22 commands)

These 22 commands are registered and executable but not documented in README:

`ask`, `compact`, `graph`, `graph:prepare`, `handoff`, `improve`, `knowledge`, `learn`, `metrics`, `model:list`, `provider:list`, `reconstitute`, `route`, `spec:init`, `spec:list`, `team:assemble`, `team:list`, `team:recommend`, `team:risk`, `trajectory`, `usability-check`, `validate`

---

## New Constitutional Rule

### CMD-001

> No ARAYA command may be documented unless registered, executable, and verified.

---

## Remediation Plan

### Immediate (FIX — one PR)

1. Add 22 missing commands to README Slash Command Reference
2. Add CMD-001 to constitution
3. Verify `/araya compact` via space-routing

### Deferred (v0.8.x)

4. Add automated command verification (`/araya audit` checks command integrity)
5. Command maturity scoring in `/araya reality-check`

---

## Disposition

## FIX

One small PR to close the documentation gap. Then STOP — ARAYA is ready.

**22 commands need README entries. 0 commands need code fixes.**
