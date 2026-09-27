#!/usr/bin/env bash
set -Eeuo pipefail

# test-readme-contract.sh — gate that prevents publishing a bundle/release when
# the README contradicts the product or is clearly stale.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

[[ -f README.md ]] || { echo "FAIL: README.md missing"; exit 1; }

# 1. Every README contract question must be answered (section headers present).
REQUIRED_HEADERS=(
  "What is ARAYA?"
  "Current state"
  "What works now"
  "What is not available yet"
  "Install"
  "Pi behavior"
  "Automatic ARAYA project context"
  "Use with Pi"
  "Build / use the ChatGPT bundle"
  "Repository structure"
  "Important limitations / debts"
  "Next product increment"
)

for h in "${REQUIRED_HEADERS[@]}"; do
  grep -qF "$h" README.md || { echo "FAIL: README missing section: $h"; exit 1; }
done

# 2. README must state the canonical version currently adopted.
VERSION="$(sed -n 's/^Version: *//p' ADOPTION-RECORD.md | head -1 | tr -d '[:space:]')"
[[ -n "$VERSION" ]] || { echo "FAIL: cannot read version from ADOPTION-RECORD.md"; exit 1; }
grep -qF "$VERSION" README.md || { echo "FAIL: README does not mention canonical version $VERSION"; exit 1; }

# 3. README must carry the Daneel ownership boundary (DANEEL != ARAYA).
grep -q 'DANEEL != ARAYA' README.md || { echo "FAIL: README missing Daneel ownership boundary"; exit 1; }

# 3b. README must not claim Daneel is part of ARAYA, and must describe the real
#     Pi behavior: Daneel is the default user-level identity, ARAYA context is
#     automatic inside this repository, and /araya is NOT required here.
grep -qF 'Running `pi` starts **Daneel**' README.md \
  || { echo "FAIL: README does not state Daneel is the default Pi identity"; exit 1; }
grep -qF 'You do **not** need to run' README.md \
  || { echo "FAIL: README does not state /araya is not required inside the repo"; exit 1; }
if grep -qF 'Plain pi stays plain Pi' README.md; then
  echo "FAIL: README still claims plain Pi has no identity (Daneel is the default identity)"; exit 1
fi

# 4. Canonical integrity must hold (README describes a product whose core is intact).
sha256sum -c SHA256SUMS.txt >/dev/null || { echo "FAIL: canonical integrity broken"; exit 1; }

echo "README_CONTRACT=PASS"
echo "README_VERSION=$VERSION"
