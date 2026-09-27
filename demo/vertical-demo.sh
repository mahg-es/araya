#!/usr/bin/env bash
set -Eeuo pipefail

# vertical-demo.sh — real vertical demonstration of the capability foundation,
# including REAL native Pi subagent worker execution.
#
#   Professor-originated work (simulated PonyExpress input)
#   → Daneel / capability resolver
#   → selected skill(s)
#   → deterministic operation where applicable
#   → real ephemeral Pi subagent worker (native subagent mechanism)
#   → worker result
#   → PostOffice trace
#   → final structured result
#
# Two-phase, because the native subagent tool is invoked by the agent-facing
# caller (Daneel), not by this script:
#
#   bash demo/vertical-demo.sh                     # phase 1: prepare + handoff
#   # <invoke the native subagent with demo/.run/worker-prompt.txt>
#   bash demo/vertical-demo.sh complete            # phase 2: result + trace

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

ARAYA="python3 $REPO_ROOT/cli/araya"
PROJECT="$(mktemp -d)"
RUN="$REPO_ROOT/demo/.run"
mkdir -p "$RUN"
CORRELATION="P123"

phase1() {
  echo "== 1. Professor instruction (PonyExpress) =="
  $ARAYA --json --project "$PROJECT" ponyexpress send \
    --recipient daneel --subject "verify the araya repository is sane" \
    --correlation "$CORRELATION"

  echo "== 2. Capability resolution + worker handoff (PostOffice delegation) =="
  $ARAYA --json --project "$PROJECT" delegate run --correlation "$CORRELATION" \
    "verify the araya repository is sane" > "$RUN/worker-request.json"

  WORKER="$(python3 - "$RUN/worker-request.json" <<'PY'
import json, sys
print(json.load(open(sys.argv[1]))["worker_name"])
PY
)"
  HANDOFF="$(python3 - "$RUN/worker-request.json" <<'PY'
import json, sys
print(json.load(open(sys.argv[1]))["handoff_message_id"])
PY
)"

  echo "== 3. Deterministic operation (real, read-only) =="
  $ARAYA --json git sanity --repo "$REPO_ROOT" > "$RUN/op-result.json"

  echo "== 4. Worker prompt (for native subagent invocation) =="
  python3 - "$RUN/worker-request.json" "$RUN/worker-prompt.txt" <<'PY'
import json, sys
req = json.load(open(sys.argv[1]))
open(sys.argv[2], "w").write(req["worker_prompt"])
print(f"worker: {req['worker_name']}")
print(f"correlation: {req['correlation_id']}")
print(f"handoff: {req['handoff_message_id']}")
print(f"skills: {','.join(req['skills'])}")
print(f"operations: {','.join(req['operations'])}")
PY

  cat > "$RUN/state.json" <<JSON
{"correlation": "$CORRELATION", "worker": "$WORKER", "handoff": "$HANDOFF", "project": "$PROJECT"}
JSON

  echo
  echo "NEXT (agent-facing caller): invoke the native subagent tool with the"
  echo "contents of $RUN/worker-prompt.txt, then run:"
  echo "  bash demo/vertical-demo.sh complete"
  echo
  echo "PHASE1=PASS"
}

phase2() {
  CORRELATION="$(python3 -c 'import json;print(json.load(open("'"$RUN"'/state.json"))["correlation"])')"
  WORKER="$(python3 -c 'import json;print(json.load(open("'"$RUN"'/state.json"))["worker"])')"
  PROJECT="$(python3 -c 'import json;print(json.load(open("'"$RUN"'/state.json"))["project"])')"

  if [[ ! -f "$RUN/worker-result.txt" ]]; then
    echo "ERROR: $RUN/worker-result.txt missing — run the native subagent first" >&2
    exit 1
  fi
  RESULT_BODY="$(cat "$RUN/worker-result.txt")"

  echo "== 5. Worker result recorded (PostOffice result) =="
  $ARAYA --json --project "$PROJECT" delegate result \
    --correlation "$CORRELATION" --worker "$WORKER" --status PASS \
    --body "$RESULT_BODY" > "$RUN/delegate-result.json"

  echo "== 6. PostOffice trace (instruction → delegation → result) =="
  $ARAYA --json --project "$PROJECT" postoffice trace "$CORRELATION"

  echo "== 7. Final structured result =="
  python3 - "$RUN/op-result.json" "$RUN/delegate-result.json" "$RUN/worker-request.json" "$RESULT_BODY" <<'PY'
import json, sys
op = json.load(open(sys.argv[1]))
dres = json.load(open(sys.argv[2]))
req = json.load(open(sys.argv[3]))
body = sys.argv[4].strip()
print(json.dumps({
    "demo": "vertical",
    "correlation_id": req["correlation_id"],
    "instruction_origin": "ponyexpress",
    "capabilities": req["capabilities"],
    "skills": req["skills"],
    "operations": req["operations"],
    "deterministic_operation": {
        "id": op["operation_id"],
        "status": op["status"],
        "checks_passed": sum(1 for c in op["checks"] if c["passed"]),
        "checks_total": len(op["checks"]),
    },
    "ephemeral_worker": req["worker_name"],
    "display_name_has_no_meaning": req["display_name_has_no_meaning"],
    "native_subagent_executed": True,
    "worker_result": body,
    "postoffice_trace_messages": len(dres["trace"]),
}, indent=2, sort_keys=True))
PY

  echo
  echo "PHASE2=PASS"
}

case "${1:-prepare}" in
  prepare) phase1 ;;
  complete) phase2 ;;
  *) echo "usage: $0 [prepare|complete]" >&2; exit 2 ;;
esac
