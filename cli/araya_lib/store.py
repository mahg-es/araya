"""Append-only JSONL store + id/timestamp helpers (stdlib only).

Used by the communications layer (PostOffice, PonyExpress) and the relay
handoff trace. Append-only, never in-place edits; a correction is a new record.
"""
from __future__ import annotations

import json
import secrets
import time
from pathlib import Path


def new_id(prefix: str) -> str:
    return f"{prefix}-{secrets.token_hex(6)}"


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()) + "Z"


class AppendOnlyJsonl:
    """A single append-only JSONL log with a total order (newest last)."""

    def __init__(self, path: str):
        self.path = Path(path)

    def read_all(self) -> list:
        if not self.path.is_file():
            return []
        out = []
        for line in self.path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                # Skip corrupt lines rather than fail the whole read; they are
                # preserved on disk (append-only), never silently rewritten.
                out.append({"__corrupt__": True, "raw": line})
        return out

    def append(self, record: dict) -> dict:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
        return record

    def count(self) -> int:
        return len(self.read_all())


__all__ = ["new_id", "now_iso", "AppendOnlyJsonl"]
