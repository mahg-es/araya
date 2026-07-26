#!/usr/bin/env python3
"""ARAYA Operational-Reference Validator (ponny-express-10008, FASE 4).

Distinguishes historical context from active operation. FAILS (exit 1) on:

  - PostOffice queue message with `to/from: <retired>` and a LIVE status
    (new/claimed/read/replied/blocked)
  - `assigned_to: <retired>` with `status: active`
  - `next_owner: <retired>` anywhere
  - `reports_to <retired>` (or reports_to: <retired>) in active agent profiles
    (araya.yaml, prompts/agents/, .pi/agents/, .araya/generated/)
  - retired agent inside Relay routing fields (enums, owner_role, recipients)
  - fixture usage of a retired agent OUTSIDE tests/ scope

ACCEPTS (structurally, not by keyword):
  - archived / superseded / cancelled message statuses
  - `former_recipient:`, `original_recipient:`, `historical: true` fields
  - archive directories (explicitly archived evidence)
  - tests/ fixtures (test scope) — files must reference the retired name only
    alongside guard/rejection vocabulary
  - dated evidence records (specs, runs, capsules, reports) — these are
    historical by path; only live routing fields are failed there

Usage:
  python3 src/operational_reference_validator.py            # full repo scan
  python3 src/operational_reference_validator.py --staged   # staged files only

Exit: 0 clean, 1 violations, 2 usage error.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RETIRED_JSON = ROOT / ".araya" / "governance" / "retired-agents.json"

LIVE_STATUSES = {"new", "claimed", "read", "replied", "blocked"}
NON_OPERATIONAL_STATUSES = {"archived", "superseded", "cancelled", "invalid-recipient"}
GUARD_VOCABULARY = re.compile(
    r"retired|RETIRED_OPERATIONAL_ACTOR|is_retired_agent|assert_routable|supersed|cancel|reject|fixture",
    re.IGNORECASE,
)
FIELD_RE = re.compile(
    r"^\s*(to|from|assigned_to|owner|next_owner|route_to|target_agent|reports_to|recipient|actor|actor_id|fallback_owner)"
    r"\s*:\s*\"?([A-Za-z_-]+)\"?\s*$"
)

violations: list[str] = []
notes: list[str] = []


def retired_ids() -> frozenset:
    try:
        data = json.loads(RETIRED_JSON.read_text(encoding="utf-8"))
        ids = {str(a.get("id", "")).strip().lower() for a in data.get("retired_agents", [])}
        ids.discard("")
        return frozenset(ids) or frozenset({"giskard"})
    except Exception:
        return frozenset({"giskard"})


RETIRED = retired_ids()


def is_retired(name: str) -> bool:
    return name.strip().lower() in RETIRED


def parse_frontmatter(text: str) -> tuple[dict, str]:
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.S)
    if not m:
        return {}, text
    meta = {}
    for line in m.group(1).splitlines():
        fm = re.match(r"^([A-Za-z_]+):\s*(.*)$", line)
        if fm:
            meta[fm.group(1)] = fm.group(2).strip().strip('"').strip("'")
    return meta, m.group(2)


def fail(path: str, line_no: int, rule: str, detail: str):
    violations.append(f"{path}:{line_no}: OPERATIONAL_INVALID [{rule}] {detail}")


def note(msg: str):
    notes.append(msg)


# ─── Scope classifiers ───────────────────────────────────────────────────────

def scan_postoffice_queue(path: Path, rel: str):
    meta, _ = parse_frontmatter(path.read_text(encoding="utf-8"))
    if not meta:
        return
    status = str(meta.get("status", "")).strip().lower()
    for field in ("to", "from"):
        value = str(meta.get(field, ""))
        if not is_retired(value):
            continue
        if status in LIVE_STATUSES:
            fail(rel, 1, "live-message-retired-actor", f"{field}: {value} with status: {status}")
        elif status in NON_OPERATIONAL_STATUSES:
            note(f"{rel}: retired actor '{value}' with non-operational status '{status}' — allowed")
        else:
            fail(rel, 1, "ambiguous-status", f"{field}: {value} with unclassified status: {status!r}")


def scan_profile(path: Path, rel: str):
    text = path.read_text(encoding="utf-8")
    for i, line in enumerate(text.splitlines(), 1):
        if re.search(r"reports?\s+to\s+(the\s+)?", line, re.I) or re.search(r"reports_to\s*:", line, re.I):
            for agent in RETIRED:
                if re.search(rf"reports?\s+to\s+{agent}\b", line, re.I) or re.search(rf"reports_to:\s*{agent}\b", line, re.I):
                    if re.search(r"retired|superseded|non-operational|historical|former", line, re.I):
                        continue
                    fail(rel, i, "active-profile-reports-to-retired", line.strip()[:120])


def scan_routing_fields(path: Path, rel: str, *, in_tests: bool):
    text = path.read_text(encoding="utf-8")
    if in_tests and GUARD_VOCABULARY.search(text):
        return  # negative fixture scope
    for i, line in enumerate(text.splitlines(), 1):
        m = FIELD_RE.match(line)
        if not m:
            continue
        field, value = m.group(1), m.group(2)
        if not is_retired(value):
            continue
        if field == "next_owner":
            fail(rel, i, "next-owner-retired", line.strip()[:120])
        elif field in {"to", "from", "assigned_to", "owner", "route_to", "target_agent", "recipient", "actor", "actor_id", "fallback_owner", "reports_to"}:
            # outside queues/profiles these fields are only failed in operational scopes
            fail(rel, i, f"routing-field-retired({field})", line.strip()[:120])


def scan_relay(path: Path, rel: str):
    text = path.read_text(encoding="utf-8")
    if path.name == "acceptance-test-spec.md":
        return  # negative test spec (T-030/T-031) — allowed by design
    for i, line in enumerate(text.splitlines(), 1):
        for agent in RETIRED:
            if re.search(rf"\b{agent}\b", line, re.I):
                fail(rel, i, "relay-operational-reference", line.strip()[:120])


def iter_tracked_files():
    out = subprocess.run(
        ["git", "-C", str(ROOT), "ls-files"], capture_output=True, text=True, check=True
    ).stdout.splitlines()
    return [ROOT / f for f in out if f.strip()]


def iter_staged_files():
    out = subprocess.run(
        ["git", "-C", str(ROOT), "diff", "--cached", "--name-only", "--diff-filter=ACM"],
        capture_output=True, text=True, check=True,
    ).stdout.splitlines()
    return [ROOT / f for f in out if f.strip()]


def main() -> int:
    staged = "--staged" in sys.argv[1:]
    files = iter_staged_files() if staged else iter_tracked_files()

    for path in files:
        if not path.is_file():
            continue
        rel = str(path.relative_to(ROOT))
        if rel.startswith("node_modules/") or rel.startswith(".git/"):
            continue
        if path.suffix.lower() not in {".md", ".yaml", ".yml", ".json", ".py", ".ts", ".js", ".jsonl"}:
            continue

        # archive scope: explicitly archived evidence — always allowed
        if "/archive/" in rel or "archived-threads/" in rel:
            continue

        # live PostOffice queues
        if rel.startswith(".araya/postoffice/inbox/") or rel.startswith(".araya/postoffice/outbox/"):
            if path.name.endswith(".discrepancy-record.md"):
                continue  # annotation record, not a message
            scan_postoffice_queue(path, rel)
            continue

        # active profiles / runtime
        if rel == "araya.yaml" or rel.startswith("prompts/agents/") or rel.startswith(".pi/agents/") or rel.startswith(".araya/generated/"):
            scan_profile(path, rel)
            scan_routing_fields(path, rel, in_tests=False)
            continue

        # relay operational definitions
        if rel.startswith(".araya/relay/"):
            scan_relay(path, rel)
            continue

        # test scope (fixtures allowed only with guard vocabulary)
        if rel.startswith("tests/"):
            scan_routing_fields(path, rel, in_tests=True)
            continue

        # governance data source of retired agents itself
        if rel == ".araya/governance/retired-agents.json":
            continue

        # evidence/docs scope: dated records — only explicit live routing fields fail
        if rel.startswith((".araya/plan/", ".araya/runs/", ".araya/context/", ".araya/efficiency/", "docs/", "portfolio/", "planning/", "governance/")):
            meta, _ = parse_frontmatter(path.read_text(encoding="utf-8")) if path.suffix == ".md" else ({}, "")
            if meta and str(meta.get("status", "")).lower() in LIVE_STATUSES:
                for field in ("to", "from"):
                    if is_retired(str(meta.get(field, ""))):
                        fail(rel, 1, "live-message-retired-actor", f"{field} with status {meta['status']}")
            continue

        # source code default: routing fields fail (guard modules contain the retired id by design)
        if rel.startswith("src/"):
            if "operational_reference_validator" in rel or "postoffice_loop" in rel or "retired-agents" in rel:
                continue
            scan_routing_fields(path, rel, in_tests=False)
            continue

    print("ARAYA Operational-Reference Validator")
    print("=====================================")
    print(f"retired agents: {', '.join(sorted(RETIRED))}")
    print(f"files scanned: {len(files)}")
    if notes:
        print("\nNotes (allowed, non-operational):")
        for n in notes:
            print(f"  ~ {n}")
    if violations:
        print("\nViolations:")
        for v in violations:
            print(f"  ✗ {v}")
        print(f"\nRESULT: FAIL ({len(violations)} operational-invalid reference(s))")
        return 1
    print("\nRESULT: PASS (zero active retired-agent references)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
