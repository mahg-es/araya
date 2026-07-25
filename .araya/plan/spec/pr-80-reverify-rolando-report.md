# PR #80 Re-Verification — Reality Verification Report

**Verifier:** Rolando — Reality Authority
**Date:** 2026-07-25
**SHA:** 582e7b7 (`fix(req-043): add source hash headers to generated files, fix claude-cli format`)
**Prior Disposition:** DISCREPANCY (from prior verification)
**Trigger:** Professor's request to re-verify after fix

---

## Disposition: DISCREPANCY

The fix at SHA 582e7b7 is **incomplete**. Two defects persist, causing `--check`
to exit 1 (not 0). Generated artifacts were regenerated during verification but
still fail the validator.

---

## Gate Inspection Results

### Gate 1: Directory existence — PASS ✅
All 4 adapter directories exist: `.araya/generated/{pi,codex,claude-cli,agy}/`

### Gate 2: Generated marker — PASS ✅
All 120 profiles contain `# GENERATED — DO NOT EDIT`.

### Gate 3: Source hash header — FAIL ❌
**120 errors across all 4 adapters × 30 agents.**

Validator regex (`src/araya/generate/validator.ts:151`):
```js
/^# Source hash: ([a-f0-9]+)$/m
```

Generator writes (`src/araya/generate/index.ts:562,642,680,714`):
```ts
lines.push(`# Source hash: ${agent.provenance.generated_hash || "unset"}`);
```

- `agent.provenance.generated_hash` is **always `null`** — it is never set from the
  canonical source manifest.
- Fallback `"unset"` does NOT match regex `[a-f0-9]+` (u, n, s, e, t are not hex chars).
- Verdict: Line IS present in regenerated files as `# Source hash: unset`, but
  validator treats it as "missing hash header" because the regex rejects it.

**Evidence:**
- `.araya/generated/pi/sonia.md` line 2: `# Source hash: unset`
- `.araya/generated/claude-cli/sonia.md` line 2: `# Source hash: unset`
- Canonical hash: `3c869d8ede35d92d422857f9e72a67c948cca02fc19aae931e9a98b794e423b7`
- Regenerated files still write "unset"

### Gate 4: Source hash match — BLOCKED by Gate 3
Cannot be evaluated until Gate 3 is resolved.

### Gate 5: Role title present — PASS ✅ (no errors reported)

### Gate 6: Permissions.can_write_code — FAIL ❌
**30 errors in claude-cli adapter only.**

Generator (`src/araya/generate/index.ts:687`):
```ts
lines.push(`Permissions: can_write_code=${agent.permissions.can_write_code}`);
```

Validator (`src/araya/generate/validator.ts:217`):
```ts
if (!content.includes(`can_write_code: ${expected}`) &&
    !content.includes(`canWriteCode: ${expected}`))
```

- Output: `Permissions: can_write_code=false` (uses `=`)
- Check: looks for `can_write_code: false` (uses `: `)
- The substring `can_write_code: false` does NOT appear in `can_write_code=false`
- Pi, codex, and agy adapters use `can_write_code: false` and pass — only claude-cli fails

**Evidence:**
- `.araya/generated/claude-cli/sonia.md` line 6: `Permissions: can_write_code=false`

### Gate 7: Skills exist — PASS ✅ (no errors reported)

### Gate 8: Skills referenced — PASS ✅ (no errors reported)

### Gate 9-12: piAdapterValidator — WARNING ⚠️
2 warnings: rolando and daneel lack `.pi/agents/<name>.md`. Non-blocking.

---

## What the Commit Changed

The diff `5a29c7d..582e7b7` for `src/araya/generate/index.ts`:

- Added 2 lines per adapter function (pi, codex, claude-cli, agy):
  ```ts
  lines.push(`# Source hash: ${agent.provenance.generated_hash || "unset"}`);
  lines.push();
  ```
- Total: +8 lines

**What was NOT fixed:**
1. The `generated_hash` fallback is always `"unset"` — the actual manifest hash is
   never assigned to `agent.provenance.generated_hash`.
2. The `can_write_code: false` vs `can_write_code=false` format mismatch for
   claude-cli was not addressed.

---

## Exit Code

```bash
$ npx ts-node src/araya/generate/index.ts --check 2>&1; echo "EXIT: $?"
EXIT: 1
```

**Expected: 0. Actual: 1.**

---

## Required Remediation

1. **Source hash:** Either:
   - Set `agent.provenance.generated_hash` from `manifest.combined_hash` during
     generation (preferred), OR
   - Accept `"unset"` as a valid hash placeholder in the validator regex
2. **Claude-cli format:** Change line 687 from `=` to `: `:
   ```ts
   lines.push(`Permissions: can_write_code: ${agent.permissions.can_write_code}`);
   ```
   OR update validator line 217 to also check for `can_write_code=${expected}`

---

## Reality Confidence Score

| Level | Score | Notes |
|-------|-------|-------|
| Configured | 100% | Files exist |
| Implemented | 100% | Code exists |
| Running | 70% | Generator runs, outputs 120 profiles |
| Operational | 0% | `--check` exits 1, drift detected |
| Independently Verified | 100% | This report |

**Reality Confidence: 54%** (Operational fails)

---

## Binding Disposition

**DISCREPANCY** — Fix at SHA 582e7b7 is incomplete. Two verifiable defects
remain. `--check` exits 1. All 12 gates do NOT pass.

---

Rolando — Reality Authority
Independent Verification — Report to Giskard
