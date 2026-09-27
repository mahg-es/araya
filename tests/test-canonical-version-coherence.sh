#!/usr/bin/env bash
set -Eeuo pipefail

# test-canonical-version-coherence.sh — gate that prevents the canon from
# labelling a superseded version as the active canonical governance.
#
# Regression (2026-09-27): the v0.6.0 adoption inherited status blocks from the
# v0.5.0 canon that still claimed "ADOPTED / ACTIVE CANONICAL" and
# "v0.4.2 = ACTIVE CANONICAL / v0.5.0 = CANDIDATE ONLY". An independent
# verifier caught it on the merged SHA. This gate makes that class of defect
# mechanically visible instead of relying on a reader noticing it.
#
# The active version identity is read from Repository Truth
# (ADOPTION-RECORD.md), never hardcoded here.
#
# Invariants:
#   1. ADOPTION-RECORD declares the active version, its predecessor, and
#      ADOPTED / ACTIVE CANONICAL.
#   2. Exactly one canonical audit exists, for the active version, and it
#      states ACTIVE_CANONICAL / SUPERSEDES.
#   3. Every Knowledge file declares the active version + the active
#      predecessor as its baseline.
#   4. No line may label a non-active version "ACTIVE CANONICAL".
#   5. A fenced status block claiming "ACTIVE CANONICAL" must either name the
#      active version or be explicitly marked HISTORICAL / SUPERSEDED.
#   6. Active product files must not reference a non-active AX3 identity
#      (canonical audit filename, bundle name, operating-model version).
#
# Historical records are allowed: superseded-version facts may stay in the canon
# as long as they are explicitly marked historical/superseded and never claim
# current canonical status.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

fail() { echo "FAIL: $*"; exit 1; }

# ── 1. Active identity from the adoption record ────────────────────────────
ACTIVE="$(sed -n 's/^Version: *//p' ADOPTION-RECORD.md | head -1 | tr -d '[:space:]')"
[[ -n "$ACTIVE" ]] || fail "cannot read Version from ADOPTION-RECORD.md"
SUPERSEDES="$(sed -n 's/^Supersedes: *//p' ADOPTION-RECORD.md | head -1 | tr -d '[:space:]')"
[[ -n "$SUPERSEDES" ]] || fail "cannot read Supersedes from ADOPTION-RECORD.md"
[[ "$SUPERSEDES" != "$ACTIVE" ]] || fail "Supersedes must differ from Version"

grep -qx 'Status: ADOPTED / ACTIVE CANONICAL' ADOPTION-RECORD.md \
  || fail "ADOPTION-RECORD.md does not declare 'Status: ADOPTED / ACTIVE CANONICAL'"

# ── 2. Exactly one canonical audit, for the active version ─────────────────
AUDIT="ARAYA-AX3-${ACTIVE}-CANONICAL-AUDIT.md"
[[ -f "$AUDIT" ]] || fail "missing canonical audit for ${ACTIVE}: ${AUDIT}"
for f in ARAYA-AX3-*-CANONICAL-AUDIT.md; do
  [[ "$f" == "$AUDIT" ]] || fail "stale canonical audit for a non-active version: $f"
done
grep -qx "ACTIVE_CANONICAL=${ACTIVE}" "$AUDIT" \
  || fail "${AUDIT} does not state ACTIVE_CANONICAL=${ACTIVE}"
grep -qx "SUPERSEDES=${SUPERSEDES}" "$AUDIT" \
  || fail "${AUDIT} does not state SUPERSEDES=${SUPERSEDES}"

# ── 3. Every Knowledge file declares the active version + its predecessor ──
for f in K[0-9][0-9]-*.md; do
  grep -qx "\*\*ARAYA AX3 Candidate Governance Version:\*\* ${ACTIVE#v}" "$f" \
    || fail "${f} does not declare governance version ${ACTIVE#v}"
  grep -qx "\*\*Baseline Canonical Governance:\*\* ${SUPERSEDES#v}" "$f" \
    || fail "${f} does not declare baseline canonical ${SUPERSEDES#v}"
done

# ── 4 + 5. No stale canonical claim, marked or not ────────────────────────
scanned=(ADOPTION-RECORD.md ARAYA-AX3-*-CANONICAL-AUDIT.md K[0-9][0-9]-*.md README.md AGENTS.md)
violations=""
for f in "${scanned[@]}"; do
  out="$(awk -v file="$f" -v active="$ACTIVE" '
    function stale_version(line,   v) {
      if (match(line, /v[0-9]+\.[0-9]+\.[0-9]+[ \t]*=[ \t]*ACTIVE CANONICAL/)) {
        v = substr(line, RSTART, RLENGTH); sub(/[ \t]*=.*/, "", v)
        if (v != active) return v
      }
      return ""
    }
    function flush() {
      if (!inb) return
      if (blk ~ /ACTIVE CANONICAL/) {
        marked = (blk ~ /HISTORICAL|SUPERSEDED/)
        if (!marked && index(blk, active) == 0)
          printf "STALE_BLOCK %s:%d claims ACTIVE CANONICAL without naming %s or being marked HISTORICAL/SUPERSEDED\n", file, start, active
        n = split(blk, L, "\n")
        for (i = 1; i <= n; i++) {
          v = stale_version(L[i])
          if (v != "" && !marked)
            printf "STALE_VERSION %s:%d labels %s ACTIVE CANONICAL\n", file, start, v
        }
      }
    }
    /^```/ {
      if (inb) { flush(); inb = 0 } else { inb = 1; start = NR }
      blk = ""
      next
    }
    inb { blk = blk $0 "\n"; next }
    { v = stale_version($0); if (v != "") printf "STALE_VERSION %s:%d labels %s ACTIVE CANONICAL\n", file, NR, v }
    END { flush() }
  ' "$f")"
  [[ -z "$out" ]] || violations="${violations}${out}"$'\n'
done
[[ -z "$violations" ]] || fail "canonical version-coherence violation(s):
${violations}"

# ── 6. Active product files must not reference a non-active AX3 identity ───
for f in README.md AGENTS.md docs/INSTALLATION.md docs/usage/README.md \
         adapters/pi/README.md adapters/pi/prompts/araya.md \
         bundle/chatgpt/README.md bundle/chatgpt/build.sh araya-install.sh; do
  stale="$(grep -nE 'AX3-? ?v?[0-9]+\.[0-9]+\.[0-9]+' "$f" \
            | grep -vE "AX3 ${ACTIVE}|AX3-${ACTIVE}" || true)"
  [[ -z "$stale" ]] || fail "${f} references a non-active AX3 version:
${stale}"
done

echo "CANONICAL_VERSION_COHERENCE=PASS"
echo "ACTIVE_CANONICAL=${ACTIVE}"
echo "SUPERSEDES=${SUPERSEDES}"
echo "CANONICAL_AUDIT=${AUDIT}"
