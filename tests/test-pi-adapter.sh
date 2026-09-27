#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ADAPTER="$REPO_ROOT/adapters/pi"

[[ -f "$ADAPTER/prompts/araya.md" ]] || { echo "FAIL: missing prompts/araya.md"; exit 1; }

# The adapter is a prompt template: it must have a description in frontmatter.
sed -n '1,5p' "$ADAPTER/prompts/araya.md" | grep -q '^description:' \
  || { echo "FAIL: adapter is not a valid prompt template (no description)"; exit 1; }

# It must reference the canonical core.
grep -q 'GPT-CONFIGURATION.md' "$ADAPTER/prompts/araya.md" \
  || { echo "FAIL: adapter does not reference the kernel"; exit 1; }
grep -q 'K01' "$ADAPTER/prompts/araya.md" \
  || { echo "FAIL: adapter does not reference the Knowledge files"; exit 1; }

# It must NOT be a global extension (no executable hooks).
[[ ! -f "$ADAPTER/index.ts" ]] || { echo "FAIL: adapter must not be an extension"; exit 1; }

echo "PI_ADAPTER_TEST=PASS"
echo "ADAPTER_IS_PROMPT_TEMPLATE=PASS"
