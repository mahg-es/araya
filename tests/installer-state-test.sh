#!/usr/bin/env bash
# ARAYA S3b — installer PRE-STATE / rollback / UNKNOWN-block tests (REQ-050).
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BOOTSTRAP="$ROOT/ops/bootstrap-installer.sh"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT

PASS=0; FAIL=0
check() { local label="$1" cond="$2"; if [ "$cond" = "1" ]; then PASS=$((PASS+1)); echo "ok   $label"; else FAIL=$((FAIL+1)); echo "FAIL $label"; fi; }

# Build a bundle embedding the canonical installer
PAYLOAD="$WORK/payload"; mkdir -p "$PAYLOAD"; echo x > "$PAYLOAD/MARKER.txt"
BUNDLE="$WORK/B.zip"
EXT_SHA="$("$ROOT/ops/make-bundle.sh" "S3B-STATE" "$PAYLOAD" "$ROOT/araya-install.sh" "$BUNDLE" | awk '{print $1}')"

FAKE="$WORK/home"; mkdir -p "$FAKE"
TARGET="$FAKE/araya-install.sh"

# ── Test C: PRE=UNKNOWN → mutation blocked (host mutation count 0) ──────
# Simulate UNKNOWN honestly: a zero-length target exists (present but empty → UNKNOWN).
: > "$TARGET"   # empty file → UNKNOWN (present but not a valid installer)
set +e
OUT="$("$BOOTSTRAP" "$BUNDLE" "$EXT_SHA" "$TARGET" materialize 2>&1)"
RC=$?
set -e
check "UNKNOWN pre-state → mutation blocked (non-zero)" "$([ "$RC" != "0" ] && echo 1)"
check "UNKNOWN pre-state → target still empty (HOST_MUTATION_COUNT=0)" "$([ ! -s "$TARGET" ] && echo 1)"

# ── Test B: PRE=MISSING → materialize + rollback removes only created ────
rm -f "$TARGET" "$TARGET.pre-state"
OUT="$("$BOOTSTRAP" "$BUNDLE" "$EXT_SHA" "$TARGET" materialize)"
check "MISSING → materializes installer" "$([ -x "$TARGET" ] && echo 1)"
check "materialized == canonical" "$([ "$(sha256sum "$TARGET" | awk '{print $1}')" = "$(sha256sum "$ROOT/araya-install.sh" | awk '{print $1}')" ] && echo 1)"
# put an unrelated sibling file to prove rollback removes only slice-created installer
UNRELATED="$FAKE/keep-me.txt"; echo keep > "$UNRELATED"
"$BOOTSTRAP" "$BUNDLE" "$EXT_SHA" "$TARGET" rollback >/dev/null
check "MISSING rollback removes only slice-created installer" "$([ ! -e "$TARGET" ] && echo 1)"
check "MISSING rollback preserves unrelated files" "$([ -e "$UNRELATED" ] && echo 1)"

# ── Test A: PRE=PRESENT → reuse + rollback restores exact pre-hash ───────
rm -f "$TARGET" "$TARGET.pre-state" "$UNRELATED"
echo "PRE-EXISTING-INSTALLER-CONTENT" > "$TARGET"; chmod +x "$TARGET"
PRE_HASH="$(sha256sum "$TARGET" | awk '{print $1}')"
OUT="$("$BOOTSTRAP" "$BUNDLE" "$EXT_SHA" "$TARGET" materialize)"
check "PRESENT → REUSE (no overwrite)" "$([ "$(sha256sum "$TARGET" | awk '{print $1}')" = "$PRE_HASH" ] && echo 1)"
"$BOOTSTRAP" "$BUNDLE" "$EXT_SHA" "$TARGET" rollback >/dev/null
check "PRESENT rollback preserves exact pre-hash" "$([ "$(sha256sum "$TARGET" | awk '{print $1}')" = "$PRE_HASH" ] && echo 1)"

echo
echo "$PASS passed, $FAIL failed"
[ "$FAIL" = "0" ]
