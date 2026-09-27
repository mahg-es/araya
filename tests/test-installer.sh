#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

check_no_global_araya() {
  for p in \
    "$HOME/.pi/agent/extensions/araya" \
    "$HOME/.pi/agent/extensions/araya-notifier.ts" \
    "$HOME/.pi/agent/extensions/araya.yaml" \
    "$HOME/.pi/agent/extensions/runtime-model-context.ts" \
    "$HOME/.pi/agent/extensions/req-046-cycle-copy.ts"; do
    [[ ! -e "$p" ]] || { echo "FAIL: global ARAYA present: $p"; return 1; }
  done
}

check_no_global_araya

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 1. Core-only install into a clean target directory.
TARGET="$TMP/project"
bash araya-install.sh --target "$TARGET" > "$TMP/core.log" 2>&1
grep -q 'ARAYA installer result: PASS' "$TMP/core.log"

( cd "$TARGET" && sha256sum -c SHA256SUMS.txt >/dev/null )

# 2. No global Pi change.
check_no_global_araya

# 3. Opt-in Pi adapter (project-scoped).
bash araya-install.sh --target "$TARGET" --adapter pi > "$TMP/pi.log" 2>&1
grep -q 'ARAYA installer result: PASS' "$TMP/pi.log"
[[ -f "$TARGET/.pi/prompts/araya.md" ]] || { echo "FAIL: pi adapter missing"; exit 1; }
grep -q 'global Pi (~/.pi) was NOT modified' "$TMP/pi.log"

check_no_global_araya

echo "INSTALLER_TEST=PASS"
echo "CORE_INSTALL=PASS"
echo "PI_ADAPTER_PROJECT_SCOPED=PASS"
echo "NO_GLOBAL_PI_TAKEOVER=PASS"
