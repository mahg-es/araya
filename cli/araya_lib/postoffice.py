"""PostOffice — agent-to-agent messaging + historical trace.

A messaging + trace library/skill, nothing more. It is explicitly NOT an
authority, an approval ledger, a workflow state machine, canonical repository
truth, or an automatic continuation controller.

Messages carry: sender, recipient, timestamp, correlation id, message type,
subject, body, and an optional acknowledgement — plus traceability to the
originating work.
"""
from __future__ import annotations

import os
from typing import Any, Optional

from .store import AppendOnlyJsonl, new_id, now_iso


class PostOffice:
    def __init__(self, root: str):
        self.root = str(root)
        self.store = AppendOnlyJsonl(self._thread_path(root))

    @staticmethod
    def _thread_path(root: str) -> str:
        return os.path.join(root, ".araya", "postoffice", "thread.jsonl")

    def send(
        self,
        sender: str,
        recipient: str,
        subject: str,
        body: str = "",
        message_type: str = "note",
        correlation_id: Optional[str] = None,
    ) -> dict:
        msg = {
            "id": new_id("msg"),
            "sender": sender,
            "recipient": recipient,
            "timestamp": now_iso(),
            "correlation_id": correlation_id,
            "message_type": message_type,
            "subject": subject,
            "body": body,
            "acknowledged": False,
            "acknowledged_at": None,
        }
        return self.store.append(msg)

    def read_all(self) -> list:
        return self.store.read_all()

    def get(self, message_id: str) -> Optional[dict]:
        for m in self.read_all():
            if m.get("id") == message_id:
                return m
        return None

    def ack(self, message_id: str, ack_by: Optional[str] = None) -> Optional[dict]:
        """Record an acknowledgement as a new appended record (never in-place)."""
        original = self.get(message_id)
        if original is None:
            return None
        return self.store.append({
            "id": new_id("ack"),
            "message_type": "acknowledgement",
            "refers_to": message_id,
            "acknowledged_by": ack_by or original.get("recipient"),
            "timestamp": now_iso(),
            "correlation_id": original.get("correlation_id"),
            "subject": f"ack: {original.get('subject', '')}",
            "body": "",
        })

    def trace(self, correlation_id: str) -> list:
        """Return every message sharing a correlation id, in append order."""
        return [m for m in self.read_all() if m.get("correlation_id") == correlation_id]


__all__ = ["PostOffice"]
