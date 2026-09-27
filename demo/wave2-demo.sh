#!/usr/bin/env bash
set -Eeuo pipefail

# wave2-demo.sh — real end-to-end demonstration of Wave 2 recovery
# (architecture-diagram + api-design), composed with adr-write, executed by a
# REAL ephemeral Pi subagent worker.
#
#   Professor instruction (PonyExpress, correlation P124)
#   → capability resolution (selects architecture-diagram + api-design + adr-write)
#   → deterministic operations (canonical integrity check)
#   → real ephemeral Pi subagent worker (native subagent mechanism)
#   → worker produces a real Mermaid C4 diagram + OpenAPI 3.1 spec + an ADR
#   → PostOffice trace (instruction → delegation → result)
#   → final structured result

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

ARAYA="python3 $REPO_ROOT/cli/araya"
PROJECT="$(mktemp -d)"
RUN="$REPO_ROOT/demo/.run"
mkdir -p "$RUN"
CORRELATION="P124"
TASK="design the architecture diagrams and OpenAPI spec for the ARAYA PostOffice tracing API"
# Committed, preserved example output (verifiable artifacts).
DEMO_OUT="$REPO_ROOT/demo/wave2-example"
mkdir -p "$DEMO_OUT"

phase1() {
  echo "== 1. Professor instruction (PonyExpress) =="
  $ARAYA --json --project "$PROJECT" ponyexpress send \
    --recipient daneel --subject "$TASK" --correlation "$CORRELATION"

  echo "== 2. Capability resolution (select Wave 2 skills) =="
  $ARAYA --json --project "$PROJECT" delegate "$TASK"

  echo "== 3. Deterministic operations (real) =="
  $ARAYA --json operation execute git.repository-sanity repo="$REPO_ROOT" > "$RUN/w2-op-result.json"

  echo "== 4. Worker handoff (PostOffice delegation) + worker prompt =="
  $ARAYA --json --project "$PROJECT" delegate run --correlation "$CORRELATION" \
    "$TASK" > "$RUN/w2-worker-request.json"

  WORKER="$(python3 - "$RUN/w2-worker-request.json" <<'PY'
import json, sys
print(json.load(open(sys.argv[1]))["worker_name"])
PY
)"
  HANDOFF="$(python3 - "$RUN/w2-worker-request.json" <<'PY'
import json, sys
print(json.load(open(sys.argv[1]))["handoff_message_id"])
PY
)"
  SKILLS="$(python3 - "$RUN/w2-worker-request.json" <<'PY'
import json, sys
print(",".join(json.load(open(sys.argv[1]))["skills"]))
PY
)"
  OPS="$(python3 - "$RUN/w2-worker-request.json" <<'PY'
import json, sys
print(",".join(json.load(open(sys.argv[1]))["operations"]) or "none")
PY
)"

  python3 - "$RUN/w2-worker-request.json" "$RUN/w2-worker-prompt.txt" <<'PY'
import json, sys
req = json.load(open(sys.argv[1]))
open(sys.argv[2], "w").write(req["worker_prompt"])
# also write a task brief for the worker
print(f"worker: {req['worker_name']}")
print(f"correlation: {req['correlation_id']}")
print(f"handoff: {req['handoff_message_id']}")
print(f"skills: {','.join(req['skills'])}")
print(f"operations: {','.join(req['operations']) or 'none'}")
PY

  cat > "$RUN/w2-state.json" <<JSON
{"correlation": "$CORRELATION", "worker": "$WORKER", "handoff": "$HANDOFF", "project": "$PROJECT", "demo_out": "$DEMO_OUT"}
JSON

  # Append the design intent to the worker prompt so the worker writes real
  # artifacts into $DEMO_OUT.
  cat >> "$RUN/w2-worker-prompt.txt" <<PROMPT

WORKING DIRECTORY (write artifacts here): $DEMO_OUT

Design a real OpenAPI 3.1 spec for the ARAYA PostOffice tracing API: the
endpoints to send/read/ack messages and trace by correlation id. Then create a
C4 Context-level Mermaid diagram of the ARAYA PostOffice subsystem. Finally
write a short ADR recording the decision to represent PostOffice as an
advisory, non-authority messaging channel with correlation ids.

Save three files in $DEMO_OUT: openapi.yaml, architecture.mmd, ADR-tracing-api.md.

Report: (1) what you produced, (2) confirm the three files exist, (3) PASS/FAIL.
PROMPT

  echo
  echo "selected skills: $SKILLS"
  echo "operations: $OPS"
  echo
  echo "NEXT (agent-facing caller): invoke the native subagent with the"
  echo "contents of $RUN/w2-worker-prompt.txt, then run:"
  echo "  bash demo/wave2-demo.sh complete"
  echo
  echo "PHASE1=PASS"
}

phase2() {
  CORRELATION="$(python3 -c 'import json;print(json.load(open("'"$RUN"'/w2-state.json"))["correlation"])')"
  WORKER="$(python3 -c 'import json;print(json.load(open("'"$RUN"'/w2-state.json"))["worker"])')"
  PROJECT="$(python3 -c 'import json;print(json.load(open("'"$RUN"'/w2-state.json"))["project"])')"
  DEMO_OUT="$(python3 -c 'import json;print(json.load(open("'"$RUN"'/w2-state.json"))["demo_out"])')"

  if [[ ! -f "$RUN/w2-worker-result.txt" ]]; then
    echo "ERROR: $RUN/w2-worker-result.txt missing — run the native subagent first" >&2
    exit 1
  fi
  RESULT_BODY="$(cat "$RUN/w2-worker-result.txt")"

  echo "== 5. Ephemeral worker result recorded (PostOffice result) =="
  $ARAYA --json --project "$PROJECT" delegate result \
    --correlation "$CORRELATION" --worker "$WORKER" --status PASS \
    --body "$RESULT_BODY" > "$RUN/w2-delegate-result.json"

  echo "== 6. PostOffice trace (instruction → delegation → result) =="
  $ARAYA --json --project "$PROJECT" postoffice trace "$CORRELATION"

  echo "== 7. Real product artifacts produced by the worker =="
  for f in openapi.yaml architecture.mmd "ADR-tracing-api.md"; do
    if [[ -s "$DEMO_OUT/$f" ]]; then
      echo "  [PASS] $f ($(wc -l < "$DEMO_OUT/$f") lines)"
    else
      echo "  [FAIL] $f missing or empty" >&2
      exit 1
    fi
  done

  echo
  echo "== 8. Final structured result =="
  python3 - "$RUN/w2-op-result.json" "$RUN/w2-worker-request.json" "$RESULT_BODY" "$DEMO_OUT" <<'PY'
import json, sys, os
op = json.load(open(sys.argv[1]))
req = json.load(open(sys.argv[2]))
body = sys.argv[3].strip()
out = sys.argv[4]
artifacts = {f: os.path.exists(os.path.join(out, f)) for f in
             ("openapi.yaml", "architecture.mmd", "ADR-tracing-api.md")}
print(json.dumps({
    "demo": "wave2",
    "correlation_id": req["correlation_id"],
    "instruction_origin": "ponyexpress",
    "capabilities": req["capabilities"],
    "skills": req["skills"],
    "skill_count": len(req["skills"]),
    "operations": req["operations"],
    "artifacts_produced": artifacts,
    "op_integrity_passed": op["status"],
    "worker_report": body[:400],
    "outcome": "PASS" if all(artifacts.values()) and op["status"]=="PASS" else "FAIL"
}, indent=2, default=str))
PY
  echo
  echo "PHASE2=PASS"
}

case "${1:-phase1}" in
  phase1|"") phase1 ;;
  complete) phase2 ;;
  *) echo "usage: $0 [phase1|complete]"; exit 2 ;;
esac
