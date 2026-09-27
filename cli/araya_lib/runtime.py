"""Runtime utilities — small, reusable, non-invasive helpers.

These are runtime *information/utility* surfaces, not governance:

- model-context: read-only metadata (provider, model, reasoning level, session).
  This is runtime information, NOT Daneel's operating model.
- quota: read/guard consumption against a limit (explicit, opt-in).
- cycle: cycle duration / copy / UX helper.
- notifier: non-invasive notifications/events.

None of these takes over the host, installs global hooks, or owns authority.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any, Optional

from .store import AppendOnlyJsonl, new_id, now_iso

_MODEL_ENV_KEYS = (
    "ARAYA_PROVIDER",
    "ARAYA_MODEL",
    "ARAYA_REASONING",
    "ARAYA_SESSION",
    "ARAYA_MODEL_ID",
)


def model_context(env: Optional[dict] = None) -> dict:
    """Read-only runtime metadata. Never writes anything; reads only a
    documented set of environment variables, returning 'unknown' when absent."""
    e = os.environ if env is None else env
    ctx = {
        "provider": e.get("ARAYA_PROVIDER") or "unknown",
        "model": e.get("ARAYA_MODEL") or e.get("ARAYA_MODEL_ID") or "unknown",
        "reasoning_level": e.get("ARAYA_REASONING") or "unknown",
        "session": e.get("ARAYA_SESSION") or "unknown",
    }
    ctx["read_only"] = True
    return ctx


class Quota:
    """Read/guard consumption against a limit. Explicit and opt-in: nothing is
    enforced globally; the guard only returns a verdict when invoked."""

    def __init__(self, root: str):
        self.root = str(root)
        self.ledger = AppendOnlyJsonl(
            os.path.join(root, ".araya", "runtime", "quota.jsonl"))

    def record(self, amount: int, unit: str = "tokens", label: str = "") -> dict:
        return self.ledger.append({
            "id": new_id("quota"),
            "timestamp": now_iso(),
            "amount": int(amount),
            "unit": unit,
            "label": label,
        })

    def used(self) -> int:
        return sum(int(m.get("amount", 0)) for m in self.ledger.read_all()
                   if not m.get("__corrupt__"))

    def guard(self, limit: int) -> dict:
        used = self.used()
        return {
            "used": used,
            "limit": int(limit),
            "remaining": int(limit) - used,
            "within_limit": used <= int(limit),
        }


class Cycle:
    """Cycle duration / copy / UX helper. No governance cycles are recreated."""

    def __init__(self, root: str):
        self.root = str(root)
        self._state_path = Path(root) / ".araya" / "runtime" / "cycle.json"

    def start(self, name: str) -> dict:
        token = new_id("cycle")
        record = {"token": token, "name": name, "started_at": now_iso(),
                  "started_epoch": time.time()}
        self._write_state(record)
        return record

    def end(self, token: str) -> dict:
        record = self._read_state()
        if not record or record.get("token") != token:
            return {"token": token, "error": "no active cycle with that token"}
        seconds = round(time.time() - float(record.get("started_epoch", 0)), 3)
        record["ended_at"] = now_iso()
        record["duration_seconds"] = seconds
        self._write_state(record, started=False)
        return record

    def _read_state(self) -> dict:
        if not self._state_path.is_file():
            return {}
        try:
            return json.loads(self._state_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}

    def _write_state(self, record: dict, started: bool = True) -> None:
        self._state_path.parent.mkdir(parents=True, exist_ok=True)
        self._state_path.write_text(
            json.dumps(record, indent=2, sort_keys=True) + "\n", encoding="utf-8")


class Notifier:
    """Non-invasive notifications/events: append to a local event log only.
    No OS-level hooks, no global interception, nothing that can fail silently
    into a takeover."""

    def __init__(self, root: str):
        self.root = str(root)
        self.log = AppendOnlyJsonl(
            os.path.join(root, ".araya", "runtime", "notifications.jsonl"))

    def notify(self, event: str, payload: Optional[dict] = None) -> dict:
        return self.log.append({
            "id": new_id("ntf"),
            "timestamp": now_iso(),
            "event": event,
            "payload": payload or {},
        })


__all__ = ["model_context", "Quota", "Cycle", "Notifier"]
