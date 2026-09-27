"""PonyExpress — the Professor's explicit communication channel toward the
agent system (Daneel / agents).

Durable, append-only, and correlated: an instruction can be followed through
delegation and responses by its correlation id. PonyExpress is NOT an authority
database — the Professor's actual authority exists independently of the
transport.
"""
from __future__ import annotations

import os
from typing import Optional

from .store import AppendOnlyJsonl, new_id, now_iso


class PonyExpress:
    def __init__(self, root: str):
        self.root = str(root)
        self.store = AppendOnlyJsonl(self._thread_path(root))

    @staticmethod
    def _thread_path(root: str) -> str:
        return os.path.join(root, ".araya", "ponyexpress", "inbox.jsonl")

    def send(
        self,
        recipient: str,
        subject: str,
        body: str = "",
        sender: str = "professor",
        correlation_id: Optional[str] = None,
    ) -> dict:
        """A Professor-originated instruction. The correlation id is the durable
        trace key carried into PostOffice delegation and results."""
        instruction_id = correlation_id or new_id("P")
        msg = {
            "id": instruction_id,
            "sender": sender,
            "recipient": recipient,
            "timestamp": now_iso(),
            "subject": subject,
            "body": body,
            "channel": "ponyexpress",
        }
        return self.store.append(msg)

    def read_all(self) -> list:
        return self.store.read_all()

    def get(self, instruction_id: str) -> Optional[dict]:
        for m in self.read_all():
            if m.get("id") == instruction_id:
                return m
        return None


__all__ = ["PonyExpress"]
