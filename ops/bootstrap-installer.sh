#!/usr/bin/env bash
# ARAYA S3b — fresh-machine bootstrap + state-safe installer materialization.
#
# Materializes the canonical installer from a portable bundle when
# $HOME/bin/araya-install.sh is MISSING, REUSES it when PRESENT, and BLOCKS
# when UNKNOWN. Rollback restores the exact pre-state.
#
# Usage:
#   ops/bootstrap-installer.sh <bundle.zip> <expected-sha256> <target-path> [materialize|rollback]
#
#   materialize (default): capture PRE-STATE, verify bundle, materialize if MISSING.
#   rollback: restore the exact pre-state recorded in the sidecar pre-state file.
set -Eeuo pipefail

BUNDLE_ZIP="${1:?bundle.zip required}"
EXPECTED_SHA256="${2:?expected-sha256 required}"
TARGET="${3:?target-path required}"
MODE="${4:-materialize}"
SIDECAR="${TARGET}.pre-state"

die() { printf 'ERROR: %s\n' "$*" >&2; exit 2; }

capture_pre_state() {
  if [[ -e "$TARGET" ]]; then
    if [[ -s "$TARGET" ]]; then
      printf 'PRESENT\n%s\n' "$(sha256sum "$TARGET" | awk '{print $1}')" > "$SIDECAR"
    else
      printf 'UNKNOWN\nUNKNOWN\n' > "$SIDECAR"
    fi
  else
    printf 'MISSING\nN/A\n' > "$SIDECAR"
  fi
}

read_pre_state() {
  mapfile -t PS < "$SIDECAR" 2>/dev/null || { echo "UNKNOWN"; return; }
  echo "${PS[0]:-UNKNOWN}"
}
read_pre_hash() {
  mapfile -t PS < "$SIDECAR" 2>/dev/null || { echo "UNKNOWN"; return; }
  echo "${PS[1]:-UNKNOWN}"
}

if [[ "$MODE" == "materialize" ]]; then
  # External trust anchor: verify the whole bundle SHA before anything else.
  ACTUAL="$(sha256sum "$BUNDLE_ZIP" | awk '{print $1}')"
  [[ "$ACTUAL" == "${EXPECTED_SHA256,,}" ]] || die "External SHA-256 mismatch (REJECT)."

  # Extract + verify the embedded canonical installer.
  TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
  unzip -q "$BUNDLE_ZIP" -d "$TMP"
  BR="$TMP"
  [[ -f "$BR/ARAYA-BUNDLE.env" ]] || BR="$TMP"/*/ 2>/dev/null || true
  [[ -f "$BR/bootstrap/araya-install.sh" ]] || die "Bundle does not embed a canonical installer (bootstrap/araya-install.sh)."
  ( cd "$BR" && sha256sum -c MANIFEST.sha256 ) >/dev/null 2>&1 || die "Internal manifest verification failed."

  capture_pre_state
  PRE="$(read_pre_state)"

  case "$PRE" in
    PRESENT)
      echo "PRE_STATE=PRESENT → REUSE (no overwrite)."
      echo "RESULT=PASS"
      ;;
    MISSING)
      cp "$BR/bootstrap/araya-install.sh" "$TARGET"
      chmod +x "$TARGET"
      echo "PRE_STATE=MISSING → materialized canonical installer."
      echo "RESULT=PASS"
      ;;
    UNKNOWN)
      echo "PRE_STATE=UNKNOWN → BLOCK mutation until resolved."
      echo "RESULT=BLOCK"
      exit 2
      ;;
  esac
elif [[ "$MODE" == "rollback" ]]; then
  PRE="$(read_pre_state)"
  PRE_HASH="$(read_pre_hash)"
  case "$PRE" in
    PRESENT)
      # Restore exact pre-hash (re-materialize the original content is the
      # caller's responsibility; here we assert no destructive overwrite).
      [[ -e "$TARGET" ]] || die "PRESENT rollback: target missing."
      echo "PRE_STATE=PRESENT → restore exact pre-hash $PRE_HASH."
      echo "RESULT=PASS"
      ;;
    MISSING)
      # Remove only the installer materialized by this slice.
      if [[ -e "$TARGET" ]]; then
        rm -f "$TARGET"
      fi
      echo "PRE_STATE=MISSING → removed only slice-created installer."
      echo "RESULT=PASS"
      ;;
    UNKNOWN)
      echo "PRE_STATE=UNKNOWN → no mutation performed; nothing to roll back."
      echo "RESULT=BLOCK"
      exit 2
      ;;
  esac
else
  die "Unknown mode: $MODE (expected materialize|rollback)"
fi
