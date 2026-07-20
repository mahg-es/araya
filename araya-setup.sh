#!/usr/bin/env bash
set -e

CANONICAL="$(cd "$(dirname "$0")" && pwd)"
TARGET="$HOME/.pi/agent"
FORCE=false
PROJECT_PATH=""
[ "$1" = "--force" ] && FORCE=true
# Parse --project <path>
if [ "$1" = "--project" ]; then
  PROJECT_PATH="$2"
  shift 2
fi

echo ""
echo "ARAYA v0.3.3 - Setup"
echo "Canonical: $CANONICAL"
echo ""

# --- Extensions ---
echo "=== Extensions ==="
EXT_DIR="$TARGET/extensions"
mkdir -p "$EXT_DIR"

# ARAYA main extension
if [ "$FORCE" = true ]; then
  rm -f "$EXT_DIR/araya.ts" "$EXT_DIR/araya/index.ts" 2>/dev/null || true
fi

if [ -e "$EXT_DIR/araya.ts" ]; then
  echo "  [SKIP] araya.ts (exists)"
else
  ln -sf "$CANONICAL/extensions/araya/index.ts" "$EXT_DIR/araya.ts"
  echo "  [OK] araya.ts -> $CANONICAL/extensions/araya/index.ts"
fi

mkdir -p "$EXT_DIR/araya"
if [ -e "$EXT_DIR/araya/index.ts" ]; then
  echo "  [SKIP] araya/index.ts (exists)"
else
  ln -sf "$CANONICAL/extensions/araya/index.ts" "$EXT_DIR/araya/index.ts"
  echo "  [OK] araya/index.ts -> $CANONICAL/extensions/araya/index.ts"
fi

# Subagent extension
PI_PKG_DIR=$(dirname "$(dirname "$(which pi)")")
PI_PKG="$PI_PKG_DIR/lib/node_modules/@earendil-works/pi-coding-agent"
SUBAGENT_SRC="$PI_PKG/examples/extensions/subagent"

if [ -f "$SUBAGENT_SRC/index.ts" ]; then
  mkdir -p "$EXT_DIR/subagent"
  if [ "$FORCE" = true ]; then
    rm -f "$EXT_DIR/subagent/index.ts" "$EXT_DIR/subagent/agents.ts" 2>/dev/null || true
  fi
  if [ -e "$EXT_DIR/subagent/index.ts" ]; then
    echo "  [SKIP] subagent (exists)"
  else
    ln -sf "$SUBAGENT_SRC/index.ts" "$EXT_DIR/subagent/index.ts"
    ln -sf "$SUBAGENT_SRC/agents.ts" "$EXT_DIR/subagent/agents.ts"
    echo "  [OK] subagent extension installed"
  fi
fi

# Notifier
if [ -f "$CANONICAL/extensions/araya-notifier.ts" ]; then
  rm -f "$EXT_DIR/araya-notifier.ts" 2>/dev/null || true
  ln -sf "$CANONICAL/extensions/araya-notifier.ts" "$EXT_DIR/araya-notifier.ts"
  echo "  [OK] notifier installed"
fi

# araya.yaml — always symlink, never copy
rm -f "$EXT_DIR/araya.yaml" 2>/dev/null || true
ln -sf "$CANONICAL/araya.yaml" "$EXT_DIR/araya.yaml"
echo "  [OK] araya.yaml linked"

# --- Agents ---
echo ""
echo "=== Agent Definitions ==="
AGENTS_DIR="$TARGET/agents"
mkdir -p "$AGENTS_DIR"
AGENTS_SRC="$CANONICAL/.pi/agents"

if [ -d "$AGENTS_SRC" ]; then
  count=0
  for f in "$AGENTS_SRC"/*.md; do
    name=$(basename "$f")
    if [ "$FORCE" = true ] || [ ! -f "$AGENTS_DIR/$name" ]; then
      cp "$f" "$AGENTS_DIR/$name"
      count=$((count + 1))
    fi
  done
  echo "  [OK] $count agents installed (total: $(ls "$AGENTS_SRC"/*.md 2>/dev/null | wc -l))"
else
  echo "  [ERR] Agent source not found: $AGENTS_SRC"
  exit 1
fi

# --- Skills ---
echo ""
echo "=== Skills ==="
SKILLS_DIR="$TARGET/skills"
mkdir -p "$SKILLS_DIR"

if [ "$FORCE" = true ]; then
  rm -f "$SKILLS_DIR/araya" 2>/dev/null || true
fi

if [ -L "$SKILLS_DIR/araya" ]; then
  echo "  [SKIP] skills (exists)"
else
  ln -sf "$CANONICAL/skills" "$SKILLS_DIR/araya"
  echo "  [OK] skills -> $CANONICAL/skills"
fi

# --- Prompts ---
echo ""
echo "=== Prompt Templates ==="
PROMPTS_DIR="$TARGET/prompts"
mkdir -p "$PROMPTS_DIR"

if [ "$FORCE" = true ]; then
  rm -f "$PROMPTS_DIR/araya" 2>/dev/null || true
fi

if [ -L "$PROMPTS_DIR/araya" ]; then
  echo "  [SKIP] prompts (exists)"
else
  ln -sf "$CANONICAL/prompts" "$PROMPTS_DIR/araya"
  echo "  [OK] prompts -> $CANONICAL/prompts"
fi

# --- Project-local agents ---
echo ""
echo "=== Project-local Agents ==="
if [ -d "$CANONICAL/.pi/agents" ]; then
  echo "  [OK] $(ls "$CANONICAL/.pi/agents"/*.md 2>/dev/null | wc -l) agents in .pi/agents/"
fi

# --- Project tools (--project flag) ---
if [ -n "$PROJECT_PATH" ]; then
  echo ""
  echo "=== Project Tools -> $PROJECT_PATH ==="
  TOOLS_DIR="$PROJECT_PATH/.araya/tools"
  mkdir -p "$TOOLS_DIR"
  for tool in postoffice_loop.py session_identity.py loop_silence_guard.py ax_audit.py; do
    if [ -f "$CANONICAL/src/$tool" ]; then
      cp "$CANONICAL/src/$tool" "$TOOLS_DIR/$tool"
      echo "  [OK] $tool"
    else
      echo "  [WARN] $tool not found in Framework src/"
    fi
  done
  echo "  Tools installed in .araya/tools/ — invoke as: python3 .araya/tools/<tool>.py"
fi

# --- Done ---
echo ""
echo "=== Done ==="
echo ""
echo "  Agents:     $(ls "$AGENTS_DIR"/*.md 2>/dev/null | wc -l)"
echo "  Skills:     $(find "$SKILLS_DIR/araya" -name 'SKILL.md' 2>/dev/null | wc -l)"
echo "  Extensions: $(ls "$EXT_DIR"/*.ts "$EXT_DIR"/*/index.ts 2>/dev/null | wc -l)"
echo "  Prompts:    $(ls "$PROMPTS_DIR/araya/agents/"*.md 2>/dev/null | wc -l)"
echo ""
echo "  Run /reload in pi to activate"
echo "  Test: /araya run --mode standard \"Hello ARAYA\""
