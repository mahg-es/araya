#!/usr/bin/env bash
set -Eeuo pipefail

# test-capability-foundation.sh — regression gate for the ARAYA capability
# foundation (operations, skills, capabilities, delegation, communications,
# runtime, CLI). Tests real product behavior, not just file presence.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PY_TESTS=(
  tests/test_operations.py
  tests/test_communications.py
  tests/test_skills_capabilities_delegation.py
  tests/test_runtime.py
  tests/test_cli.py
)

FAIL=0
for t in "${PY_TESTS[@]}"; do
  if ! python3 "$t" >/dev/null 2>&1; then
    echo "FAIL: $t"
    python3 "$t" 2>&1 | tail -40
    FAIL=1
  else
    echo "PASS: $t"
  fi
done

# ARAYA must not restore global Pi hooks.
check_no_global_araya() {
  for p in \
    "$HOME/.pi/agent/extensions/araya" \
    "$HOME/.pi/agent/extensions/araya-notifier.ts" \
    "$HOME/.pi/agent/extensions/araya.yaml"; do
    [[ ! -e "$p" ]] || { echo "FAIL: global ARAYA present: $p"; return 1; }
  done
}
check_no_global_araya || FAIL=1

# ARAYA must never generate a Daneel persona (name reserved to the Professor's
# personal Pi-level agent).
if find . -path ./.git -prune -o -type f -iname '*daneel*' -print | grep -q .; then
  echo "FAIL: a daneel-named artifact exists in the active tree"
  FAIL=1
fi

# Machine-readable capability discovery must be exposed by the CLI.
python3 cli/araya --json operation list >/dev/null || { echo "FAIL: operation list --json"; FAIL=1; }

if [[ "$FAIL" -ne 0 ]]; then
  echo "CAPABILITY_FOUNDATION=FAIL"
  exit 1
fi

echo "CAPABILITY_FOUNDATION=PASS"
echo "OPERATIONS_LIST_DESCRIBE_RESOLVE_EXECUTE=PASS"
echo "SKILLS_PROGRESSIVE_DISCLOSURE=PASS"
echo "POSTOFFICE_NO_AUTHORITY=PASS"
echo "PONYEXPRESS_NO_AUTHORITY=PASS"
echo "RELAY_HANDOFF_CORRELATION=PASS"
echo "EPHEMERAL_AGENT_FACTORY=PASS"
echo "AGENT_NAMES_NOT_CAPABILITY_IDENTIFIERS=PASS"
echo "RUNTIME_MODEL_CONTEXT_READ_ONLY=PASS"
echo "CLI_STRUCTURED_OUTPUT=PASS"
echo "NO_GLOBAL_PI_HOOKS=PASS"
echo "NO_GLOBAL_DANEEL_PERSONA=PASS"
