#!/usr/bin/env python3
"""Loop silence guard — REQ-025 mechanism.

Governs what an agent does when a periodic PostOffice check wakes to zero
pending messages ("empty wake"). Implements the REQ-025 silence rule:

- A persistent counter of consecutive empty wakes lives outside the
  versioned tree (default ``.pi/loop-silence-count``) so it never creates
  commits or noise in repository truth.
- Any wake with 1+ pending messages resets the counter to 0.
- 2 consecutive empties -> verdict ASK (ask the Professor once).
- 3 consecutive empties -> verdict WAIT (do not repeat the ASK).
- 4+ consecutive empties -> verdict STOP with a pause signal
  (``action.pause = True``). ``action.delete`` is ALWAYS False — no loop
  is ever deleted by this guard; deletion requires an explicit Professor
  instruction (REQ-025 criteria 4-5).
- ``--reset`` zeroes the counter, e.g. when a paused loop resumes
  (criterion 6).

The guard only reports verdicts and signals; the acting agent (or loop
prompt) decides what to do with them under the protocols in force.

Usage:
    python3 src/loop_silence_guard.py [--to daneel] [--counter PATH]
        [--ask-threshold 2] [--stop-threshold 4] [--reset] [--no-sync]
        [--format {json,text}]
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Callable

ASK_THRESHOLD_DEFAULT = 2
STOP_THRESHOLD_DEFAULT = 4
VERDICTS = ("MESSAGES", "EMPTY", "ASK", "WAIT", "STOP", "RESET")


class GuardError(Exception):
    """Domain error with a machine-readable code."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def repo_root() -> Path:
    """Locate the repository root by walking upward looking for .git."""
    current = Path.cwd().resolve()
    for candidate in (current, *current.parents):
        if (candidate / ".git").exists():
            return candidate
    raise GuardError("NotARepository", "could not locate repository root (.git)")


def default_counter_path(root: Path) -> Path:
    return root / ".pi" / "loop-silence-count"


def read_counter(path: Path) -> int:
    """Read the silence counter; missing or corrupt content means 0.

    A corrupt counter is not an error worth dying on inside a periodic
    loop: treating it as 0 simply restarts the escalation cycle, which is
    the safe direction (worst case is one extra ASK, never a lost STOP).
    """
    try:
        text = path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return 0
    try:
        value = int(text)
    except ValueError:
        return 0
    return max(value, 0)


def write_counter(path: Path, value: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"{value}\n", encoding="utf-8")


def evaluate(
    pending_count: int,
    silence_count: int,
    *,
    ask_threshold: int = ASK_THRESHOLD_DEFAULT,
    stop_threshold: int = STOP_THRESHOLD_DEFAULT,
) -> dict[str, Any]:
    """Pure verdict logic. Returns the full verdict payload.

    Given how many messages are pending and how many consecutive empty
    wakes have already happened, decide the verdict and the new counter
    value. Never returns a delete signal — deletion is Professor-only.
    """
    if pending_count < 0:
        raise GuardError("ValidationFailure", "pending_count cannot be negative")
    if ask_threshold < 1 or stop_threshold <= ask_threshold:
        raise GuardError(
            "ValidationFailure",
            "thresholds must satisfy 1 <= ask_threshold < stop_threshold",
        )

    action = {"ask": False, "pause": False, "delete": False, "notify": False}

    if pending_count >= 1:
        return {
            "verdict": "MESSAGES",
            "new_count": 0,
            "pending_count": pending_count,
            "action": action,
        }

    new_count = silence_count + 1
    if new_count >= stop_threshold:
        verdict = "STOP"
        action["pause"] = True
        action["notify"] = True
    elif new_count == ask_threshold:
        verdict = "ASK"
        action["ask"] = True
    elif new_count > ask_threshold:
        verdict = "WAIT"
    else:
        verdict = "EMPTY"

    return {
        "verdict": verdict,
        "new_count": new_count,
        "pending_count": 0,
        "action": action,
    }


def pending_count_via_postoffice(root: Path, to_role: str, no_sync: bool) -> int:
    """Count pending messages for a role via postoffice_loop.py (subprocess).

    The PostOffice tool is installed in .araya/tools/ (REQ-003).
    It is discovered relative to the project root so that the guard
    works from any project without hardcoded absolute paths.
    """
    script = root / ".araya" / "tools" / "postoffice_loop.py"
    cmd = [sys.executable, str(script)]
    if no_sync:
        cmd.append("--no-sync")
    cmd += ["pending", "--to", to_role]
    result = subprocess.run(cmd, cwd=root, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        raise GuardError(
            "PostOfficeFailure",
            f"postoffice_loop pending failed: {result.stderr.strip() or result.stdout.strip()}",
        )
    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise GuardError("PostOfficeFailure", f"invalid JSON from pending: {exc}") from exc
    return len(payload.get("items", []))


def run_guard(
    root: Path,
    *,
    to_role: str,
    counter_path: Path | None = None,
    ask_threshold: int = ASK_THRESHOLD_DEFAULT,
    stop_threshold: int = STOP_THRESHOLD_DEFAULT,
    reset: bool = False,
    no_sync: bool = False,
    pending_fn: Callable[[], int] | None = None,
) -> dict[str, Any]:
    """Execute one guard cycle and return the JSON-able result payload."""
    counter = counter_path or default_counter_path(root)

    if reset:
        write_counter(counter, 0)
        return _response(
            True,
            verdict="RESET",
            silence_count=0,
            pending_count=0,
            counter_path=str(counter),
            action={"ask": False, "pause": False, "delete": False, "notify": False},
            summary="silence counter reset to 0",
        )

    if pending_fn is None:
        pending_fn = lambda: pending_count_via_postoffice(root, to_role, no_sync)

    pending = pending_fn()
    previous = read_counter(counter)
    outcome = evaluate(
        pending,
        previous,
        ask_threshold=ask_threshold,
        stop_threshold=stop_threshold,
    )
    write_counter(counter, outcome["new_count"])

    verdict = outcome["verdict"]
    summaries = {
        "MESSAGES": f"{pending} pending message(s) for {to_role}; counter reset to 0",
        "EMPTY": f"empty wake 1/{stop_threshold}: silent",
        "ASK": f"empty wake {outcome['new_count']}/{stop_threshold}: ASK the Professor once",
        "WAIT": f"empty wake {outcome['new_count']}/{stop_threshold}: waiting, ASK already issued",
        "STOP": f"empty wake {outcome['new_count']}/{stop_threshold}: STOP — pause the loop (never delete) and notify",
    }
    return _response(
        True,
        verdict=verdict,
        silence_count=outcome["new_count"],
        pending_count=pending,
        counter_path=str(counter),
        action=outcome["action"],
        summary=summaries[verdict],
    )


def _response(ok: bool, **fields: Any) -> dict[str, Any]:
    return {"command": "loop-silence-guard", "ok": ok, **fields}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="ARAYA loop silence guard (REQ-025)")
    parser.add_argument("--format", choices=("json", "text"), default="json")
    parser.add_argument("--to", default="daneel", help="role to check pending messages for")
    parser.add_argument("--counter", type=Path, default=None, help="override counter file path")
    parser.add_argument("--ask-threshold", type=int, default=ASK_THRESHOLD_DEFAULT)
    parser.add_argument("--stop-threshold", type=int, default=STOP_THRESHOLD_DEFAULT)
    parser.add_argument("--reset", action="store_true", help="zero the counter and exit")
    parser.add_argument("--no-sync", action="store_true", help="pass --no-sync through to pending")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        root = repo_root()
        result = run_guard(
            root,
            to_role=args.to,
            counter_path=args.counter,
            ask_threshold=args.ask_threshold,
            stop_threshold=args.stop_threshold,
            reset=args.reset,
            no_sync=args.no_sync,
        )
    except GuardError as exc:
        result = _response(False, error={"code": exc.code, "message": exc.message})

    if args.format == "json":
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        if result["ok"]:
            print(result["summary"])
        else:
            print(f"{result['error']['code']}: {result['error']['message']}", file=sys.stderr)
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
