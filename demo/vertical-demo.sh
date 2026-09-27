#!/usr/bin/env bash
set -Eeuo pipefail

# vertical-demo.sh — one real vertical demonstration of the capability
# foundation:
#
#   Professor-originated work (simulated PonyExpress input)
#   → Daneel / capability resolution
#   → selected skill(s)
#   → deterministic operation (git.repository-sanity, real repo)
#   → ephemeral specialist composition
#   → PostOffice trace
#   → structured result

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

ARAYA="python3 $REPO_ROOT/cli/araya"
PROJECT="$(mktemp -d)"
trap 'rm -rf "$PROJECT"' EXIT

CORRELATION="P123"

echo "== 1. Professor instruction (PonyExpress) =="
$ARAYA --json --project "$PROJECT" ponyexpress send \
  --recipient daneel --subject "verify the araya repository is sane" \
  --correlation "$CORRELATION"

echo "== 2. Capability resolution (task → capabilities/skills/operations) =="
RESOLUTION="$($ARAYA --json delegate "verify the araya repository is sane")"

echo "== 3. Selected skill + deterministic operation =="
SKILLS="$(python3 - "$RESOLUTION" <<'PY'
import json, sys
d = json.loads(sys.argv[1])
print(",".join(d["resolution"]["skills"]))
PY
)"
echo "selected skills: $SKILLS"

OP_RESULT="$($ARAYA --json git sanity --repo "$REPO_ROOT")"

echo "== 4. Ephemeral specialist (name has no architectural meaning) =="
AGENT_NAME="$(python3 - "$RESOLUTION" <<'PY'
import json, sys
d = json.loads(sys.argv[1])
print(d["ephemeral_agent"]["name"])
PY
)"
echo "ephemeral agent: $AGENT_NAME"

echo "== 5. PostOffice handoff + result (correlation $CORRELATION) =="
$ARAYA --json --project "$PROJECT" relay handoff \
  --sender daneel --recipient "$AGENT_NAME" --instruction "$CORRELATION" \
  --subject "verify repository sanity"
$ARAYA --json --project "$PROJECT" relay handoff \
  --sender "$AGENT_NAME" --recipient daneel --instruction "$CORRELATION" \
  --subject "result: repository sanity $(python3 - "$OP_RESULT" <<'PY'
import json, sys
print(json.loads(sys.argv[1])["status"])
PY
)"

echo "== 6. Trace the instruction through delegation to result =="
$ARAYA --json --project "$PROJECT" relay trace "$CORRELATION"

echo "== 7. Structured result =="
python3 - "$RESOLUTION" "$OP_RESULT" "$CORRELATION" <<'PY'
import json, sys
resolution = json.loads(sys.argv[1])
op = json.loads(sys.argv[2])
correlation = sys.argv[3]
print(json.dumps({
    "demo": "vertical",
    "correlation_id": correlation,
    "instruction_origin": "ponyexpress",
    "capabilities": resolution["resolution"]["capabilities"],
    "skills": resolution["resolution"]["skills"],
    "operations": resolution["resolution"]["operations"],
    "deterministic_operation": {
        "id": op["operation_id"],
        "status": op["status"],
        "checks_passed": sum(1 for c in op["checks"] if c["passed"]),
        "checks_total": len(op["checks"]),
    },
    "ephemeral_agent_name": resolution["ephemeral_agent"]["name"],
    "display_name_has_no_meaning": resolution["ephemeral_agent"]["display_name_has_no_meaning"],
    "postoffice_trace": True,
}, indent=2, sort_keys=True))
PY

echo "VERTICAL_DEMO=PASS"
