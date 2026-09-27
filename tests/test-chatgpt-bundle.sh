#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

OUT="$(bash bundle/chatgpt/build.sh)"
echo "$OUT" | grep -q 'ARAYA ChatGPT bundle result: PASS' \
  || { echo "$OUT"; echo "FAIL: bundle build failed"; exit 1; }

ZIP="bundle/chatgpt/dist/ARAYA-AX3-v0.5.0-chatgpt.zip"
[[ -f "$ZIP" ]] || { echo "FAIL: bundle zip missing"; exit 1; }

echo "$OUT" | grep -q 'KNOWLEDGE_FILES=10' || { echo "FAIL: knowledge count wrong"; exit 1; }
echo "$OUT" | grep -q 'INSTRUCTIONS_MATCH=PASS' || { echo "FAIL: instructions mismatch"; exit 1; }

echo "CHATGPT_BUNDLE_TEST=PASS"
echo "BUNDLE_ZIP=$ZIP"
