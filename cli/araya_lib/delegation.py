"""Delegation — capability resolver + ephemeral agent factory.

This is the smallest useful delegation surface, NOT a sovereign runtime and NOT
an orchestration engine:

    task
    → determine capabilities needed
    → discover relevant skills
    → discover existing deterministic operations
    → execute directly if no specialist is needed
    → otherwise compose an ephemeral specialist agent (delegate via the host's
      native subagent mechanism)
    → trace communication through PostOffice
    → return result

Specialist agents are ephemeral workers. Their display names are randomly
assigned and have no architectural meaning — capabilities and skills determine
specialization, not names. There is no durable workflow state.
"""
from __future__ import annotations

import secrets
from typing import Any, Optional

from .capabilities import Capabilities
from .operations import OperationRegistry
from .skills import Skills
from .matching import matches


def random_display_name() -> str:
    """A display name with no architectural meaning (capabilities, not names,
    determine specialization)."""
    return f"agent-{secrets.token_hex(3)}"


class Delegation:
    def __init__(self, root: str):
        self.root = str(root)
        self.capabilities = Capabilities(root)
        self.skills = Skills(root)
        self.operations = OperationRegistry(root)
        self.capabilities.load()
        self.skills.load_index()
        self.operations.load()

    def resolve(self, task: str) -> dict:
        """Determine capabilities, skills, and deterministic operations for a
        task using deterministic matching (no probabilistic certainty claims)."""
        t = task.lower()
        capability_ids = []
        skill_names = []
        operation_ids = []

        for cap in self.capabilities.list():
            hay = " ".join([
                cap.get("id", ""), cap.get("description", ""),
                *cap.get("skills", []), *cap.get("operations", []),
            ])
            if matches(hay, task):
                capability_ids.append(cap.get("id"))
                for s in cap.get("skills", []):
                    if s not in skill_names:
                        skill_names.append(s)
                for op in cap.get("operations", []):
                    if op not in operation_ids:
                        operation_ids.append(op)

        # Also match skills directly by tag/keyword.
        for s in self.skills.list():
            hay = " ".join([
                s.get("name", ""), s.get("description", ""), *s.get("tags", []),
                *s.get("capabilities", []),
            ])
            if matches(hay, task):
                if s.get("name") not in skill_names:
                    skill_names.append(s.get("name"))

        # And operations directly by id/alias/intent keyword.
        for op in self.operations.list():
            hay = " ".join([
                op["operation_id"], op.get("title", ""), op.get("description", ""),
                *op.get("aliases", []), *op.get("intents", []),
            ])
            if matches(hay, task):
                if op["operation_id"] not in operation_ids:
                    operation_ids.append(op["operation_id"])

        needs_specialist = bool(skill_names) and not operation_ids
        return {
            "task": task,
            "capabilities": capability_ids,
            "skills": skill_names,
            "operations": operation_ids,
            "needs_specialist": needs_specialist,
            "execute_directly": bool(operation_ids),
        }

    def compose_ephemeral_agent(
        self,
        task: str,
        skills: Optional[list] = None,
        operations: Optional[list] = None,
        tools: Optional[list] = None,
        permissions: Optional[list] = None,
        model: Optional[dict] = None,
    ) -> dict:
        """Compose an ephemeral specialist agent from task + selected skills +
        tools/operations + scoped context + permissions + runtime model."""
        resolved = self.resolve(task)
        selected_skills = skills if skills is not None else resolved["skills"]
        selected_ops = operations if operations is not None else resolved["operations"]
        skill_bodies = []
        for name in selected_skills:
            rec = self.skills.get(name)
            if rec:
                skill_bodies.append({
                    "name": name,
                    "instructions": rec.get("body", ""),
                })
        return {
            # Randomly assigned; has no architectural meaning.
            "name": random_display_name(),
            "display_name_has_no_meaning": True,
            "persistent": False,
            "task": task,
            "capabilities": resolved["capabilities"],
            "skills": [s["name"] for s in skill_bodies],
            "skill_instructions": skill_bodies,
            "operations": selected_ops,
            "tools": tools or [],
            "permissions": permissions or ["read-only"],
            "runtime_model": model if model is not None else {},
            "scoped_context": {
                "root": self.root,
                "deterministic_operations_available": selected_ops,
            },
        }


__all__ = ["Delegation", "random_display_name"]
