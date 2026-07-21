#!/bin/bash
# ARAYA Git Preflight — mandatory before any write, commit, or push
# Usage: source .araya/hooks/preflight.sh

echo "=== ARAYA PREFLIGHT ==="
echo "Branch:       $(git branch --show-current)"
echo "HEAD:         $(git rev-parse --short HEAD)"

git fetch origin --prune --quiet 2>/dev/null

MAIN_LOCAL=$(git rev-parse HEAD 2>/dev/null || echo "N/A")
MAIN_REMOTE=$(git rev-parse origin/main 2>/dev/null || echo "N/A")
INT_REMOTE=$(git rev-parse origin/dev-mahg 2>/dev/null || echo "N/A")
TAGS=$(git tag --list | wc -l)

echo "origin/main:  ${MAIN_REMOTE:0:7}"
echo "origin/dev-m: ${INT_REMOTE:0:7}"
echo "Tags:         $TAGS"

# ─── Critical checks ──────────────────────────────────────────────────
BRANCH=$(git branch --show-current)

if [ "$BRANCH" = "main" ]; then
  echo "❌ ERROR: You are on 'main'. Switch to a feature/* branch."
  return 1
fi

if [ "$BRANCH" = "dev-mahg" ] && [ -n "$(git status --porcelain=v1)" ]; then
  echo "❌ ERROR: dev-mahg has uncommitted changes. Stash or commit to a feature."
  return 1
fi

if [ "$BRANCH" != feature/* ] && [ "$BRANCH" != hotfix/* ]; then
  echo "⚠️  WARNING: Not on feature/* or hotfix/* branch."
fi

echo "=== PREFLIGHT OK ==="
