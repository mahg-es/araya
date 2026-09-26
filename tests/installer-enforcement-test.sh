#!/usr/bin/env bash
# ARAYA pe45 — install must build + verify the runtime enforcement module so a
# successful installation cannot leave the governance hooks silently no-op.
# Exit code decides (0 = pass).
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODULE="$ROOT/dist/araya/operating-model/runtime-enforcement.js"
IDX_SRC="$ROOT/extensions/araya/index.ts"

PASS=0; FAIL=0
check() { local l="$1" c="$2"; if [ "$c" = "1" ]; then PASS=$((PASS+1)); echo "ok   $l"; else FAIL=$((FAIL+1)); echo "FAIL $l"; fi; }

cleanup() {
  [ -e "$ROOT/.operating-model-index.ts.testbak" ] && mv "$ROOT/.operating-model-index.ts.testbak" "$ROOT/src/araya/operating-model/index.ts" || true
  [ -e "$ROOT/.runtime-enforcement.ts.testbak" ] && mv "$ROOT/.runtime-enforcement.ts.testbak" "$ROOT/src/araya/operating-model/runtime-enforcement.ts" || true
  rm -rf "${TMP_HOME_A:-}" "${TMP_HOME_B:-}"
}
trap cleanup EXIT

# ── 1. clean build produces the mandatory module ─────────────────────────
rm -rf "$ROOT/dist"
( cd "$ROOT" && npm run build >/dev/null 2>&1 )
check "clean build produces dist/araya/operating-model/runtime-enforcement.js" "$([ -f "$MODULE" ] && echo 1)"

# ── 2. module loads and exports both enforcement functions ───────────────
if node -e 'const m=require(process.argv[1]); if(!m.enforcePreAction||!m.enforcePreDisposition)process.exit(1)' "$MODULE" >/dev/null 2>&1; then LOAD=1; else LOAD=0; fi
check "runtime enforcement module loads (enforcePreAction + enforcePreDisposition)" "$LOAD"

# ── 3. build failure → installer non-zero ────────────────────────────────
# Remove the module's dependency so tsc fails; install.sh must not report success.
mv "$ROOT/src/araya/operating-model/index.ts" "$ROOT/.operating-model-index.ts.testbak"
rm -rf "$ROOT/dist"
TMP_HOME_A="$(mktemp -d)"; mkdir -p "$TMP_HOME_A/.pi/agent"
set +e; HOME="$TMP_HOME_A" bash "$ROOT/install.sh" >/dev/null 2>&1; RC3=$?; set -e
mv "$ROOT/.operating-model-index.ts.testbak" "$ROOT/src/araya/operating-model/index.ts"
check "build failure → installer non-zero" "$([ "$RC3" != "0" ] && echo 1)"

# ── 4. missing module after a no-op build → installer non-zero ───────────
# runtime-enforcement.ts is a leaf; removing it makes tsc succeed but emit no
# module. install.sh must fail (not silently succeed).
mv "$ROOT/src/araya/operating-model/runtime-enforcement.ts" "$ROOT/.runtime-enforcement.ts.testbak"
rm -rf "$ROOT/dist"
TMP_HOME_B="$(mktemp -d)"; mkdir -p "$TMP_HOME_B/.pi/agent"
set +e; HOME="$TMP_HOME_B" bash "$ROOT/install.sh" >/dev/null 2>&1; RC4=$?; set -e
mv "$ROOT/.runtime-enforcement.ts.testbak" "$ROOT/src/araya/operating-model/runtime-enforcement.ts"
check "missing enforcement artifact → installer non-zero (not silently succeed)" "$([ "$RC4" != "0" ] && echo 1)"

# ── rebuild a clean artifact for the runtime assertions ──────────────────
rm -rf "$ROOT/dist"
( cd "$ROOT" && npm run build >/dev/null 2>&1 )

# ── 5. pre-action hook fail-closed (UNKNOWN state → block:true) ──────────
if node -e 'const m=require(process.argv[1]); const r=m.enforcePreAction(".","bash"); process.exit(r&&r.block===true?0:1)' "$MODULE" >/dev/null 2>&1; then PA=1; else PA=0; fi
check "pre-action: mutating tool blocked with block:true (not action:handled)" "$PA"
if node -e 'const m=require(process.argv[1]); const r=m.enforcePreAction(".","read"); process.exit(r===undefined?0:1)' "$MODULE" >/dev/null 2>&1; then RO=1; else RO=0; fi
check "pre-action: read-only tool NOT blocked" "$RO"

# ── 6. pre-disposition hook fail-closed (UNKNOWN state → continue:true) ──
if node -e 'const m=require(process.argv[1]); const r=m.enforcePreDisposition("."); process.exit(r&&r.continue===true?0:1)' "$MODULE" >/dev/null 2>&1; then PD=1; else PD=0; fi
check "pre-disposition: settlement rejected with continue:true" "$PD"

# ── 7. hook source must fail closed on missing module (no silent no-op) ──
check "hook source: tool_call catch returns block:true" "$(grep -q 'block: true' "$IDX_SRC" && echo 1)"
check "hook source: agent_before_settle catch returns continue:true" "$(grep -q 'continue: true' "$IDX_SRC" && echo 1)"

echo
echo "$PASS passed, $FAIL failed"
[ "$FAIL" = "0" ]
