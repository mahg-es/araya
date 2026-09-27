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
from .store import new_id


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

    def compose_worker_request(
        self,
        task: str,
        correlation_id: Optional[str] = None,
        tools: Optional[list] = None,
        permissions: Optional[list] = None,
        model: Optional[dict] = None,
    ) -> dict:
        """Compose a fully-scoped worker request for the host's native subagent
        mechanism. This is the adapter boundary: the library produces the exact
        scoped input (task + selected skills + operations + context + permission
        + runtime model), and the agent-facing caller invokes the host's native
        subagent with it. No orchestration logic is duplicated here."""
        resolved = self.resolve(task)
        skill_bodies = []
        for name in resolved["skills"]:
            rec = self.skills.get(name)
            if rec:
                skill_bodies.append({"name": name, "instructions": rec.get("body", "")})
        return {
            "correlation_id": correlation_id or new_id("W"),
            "worker_name": random_display_name(),
            "display_name_has_no_meaning": True,
            "task": task,
            "capabilities": resolved["capabilities"],
            "skills": [s["name"] for s in skill_bodies],
            "skill_instructions": skill_bodies,
            "operations": resolved["operations"],
            "tools": tools or [],
            "permissions": permissions or ["read-only"],
            "runtime_model": model if model is not None else {},
            "scoped_context": {
                "root": self.root,
                "deterministic_operations_available": resolved["operations"],
                "cli": "python3 cli/araya",
            },
        }

    def worker_prompt(self, spec: dict) -> str:
        """Render the scoped prompt passed to the native subagent worker.
        The worker receives only the scoped task, selected skills, and the
        deterministic operations/context it needs — nothing else."""
        lines = [
            f"You are an ephemeral specialist worker named {spec.get('worker_name')}.",
            "Your display name is randomly assigned and has no meaning; your",
            "specialization comes from the scoped task, selected skills, and",
            "deterministic operations below — never from your name.",
            "",
            "Execute ONLY the scoped task. Use the tools available to you.",
            "Return a concise structured result.",
            "",
            f"SCOPED TASK: {spec.get('task')}",
            "",
            "PERMISSIONS: " + ", ".join(spec.get("permissions", []) or ["read-only"]),
        ]
        skills = spec.get("skill_instructions") or []
        if skills:
            lines.append("")
            lines.append("SELECTED SKILLS (procedural guidance):")
            for s in skills:
                lines.append(f"\n--- skill: {s['name']} ---\n{s['instructions'].strip()}")
        ops = spec.get("operations") or []
        if ops:
            lines.append("")
            lines.append("DETERMINISTIC OPERATIONS AVAILABLE (invoke rather than re-derive):")
            for op in ops:
                lines.append(f"  - {op}")
            root = (spec.get("scoped_context") or {}).get("root")
            cli = (spec.get("scoped_context") or {}).get("cli", "python3 cli/araya")
            if root:
                lines.append("")
                lines.append(f"Working root: {root}")
                lines.append(f"Invoke an operation with: cd {root} && {cli} --json operation execute <id> repo={root}")
        lines.append("")
        lines.append("After completing the task, report: (1) what you did, (2) the exact")
        lines.append("result/evidence, (3) a PASS or FAIL outcome.")
        return "\n".join(lines)


__all__ = ["Delegation", "random_display_name"]
