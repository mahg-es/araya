"""Relay — recovered as L07 only: handoff, correlation, delivery,
acknowledgement, trace.

This is NOT the historical T0–T11/T12 relay state machine and carries no
lifecycle authority. A handoff is a PostOffice message with an explicit
correlation to a PonyExpress instruction, so an instruction can be followed
through delegation and results.
"""
from __future__ import annotations

from typing import Optional

from .postoffice import PostOffice


class Relay:
    def __init__(self, root: str):
        self.root = str(root)
        self.postoffice = PostOffice(root)

    def handoff(
        self,
        sender: str,
        recipient: str,
        instruction_id: str,
        subject: str,
        body: str = "",
    ) -> dict:
        """Deliver a handoff correlated to a PonyExpress instruction."""
        return self.postoffice.send(
            sender=sender,
            recipient=recipient,
            subject=subject,
            body=body,
            message_type="handoff",
            correlation_id=instruction_id,
        )

    def deliver(self, message_id: str, body: str = "") -> Optional[dict]:
        """Record delivery of a prior handoff (append-only)."""
        original = self.postoffice.get(message_id)
        if original is None:
            return None
        return self.postoffice.send(
            sender=original.get("sender", ""),
            recipient=original.get("recipient", ""),
            subject=f"delivery: {original.get('subject', '')}",
            body=body,
            message_type="delivery",
            correlation_id=original.get("correlation_id"),
        )

    def ack(self, message_id: str, ack_by: Optional[str] = None) -> Optional[dict]:
        return self.postoffice.ack(message_id, ack_by)

    def trace(self, correlation_id: str) -> list:
        return self.postoffice.trace(correlation_id)


__all__ = ["Relay"]
