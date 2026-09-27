"""Operations Catalog — deterministic operations registry.

Recovers the useful concept of the legacy Operations Catalog (list, describe,
resolve, execute) without any of the legacy ceremony:

- no mandatory operation lookup before every task,
- no OPERATION_GAP,
- no global preflight,
- no authority/state ownership.

Operations are declared as JSON in `operations/catalog/`. Handlers are plain
deterministic functions. Resolution is exact-id → alias → declared intent;
there is no probabilistic matching presented as certainty.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Callable, Optional

from .git_ops import (
    git_repository_sanity,
    git_merge_gate,
    git_feature_pr_gate,
    git_feature_start,
)
from .process import run
from .result import OperationResult, check, build_result, now_iso

VALID_STATUSES = ("active", "design-only", "deprecated")
VALID_RISK = ("read-only", "low", "medium", "high")


class DefinitionError(Exception):
    pass


def test_execute(input_: dict, ctx: dict) -> OperationResult:
    """Deterministic test runner: run a test command and return a structured
    PASS/FAIL result. Skills that would otherwise teach the agent how to run a
    test tool should instead invoke this operation."""
    started = now_iso()
    command = str(input_.get("command", "") or "").strip()
    cmd = input_.get("cmd")
    args = [str(a) for a in (input_.get("args") or [])]
    cwd = str(input_.get("cwd") or ctx.get("root") or os.getcwd())
    checks = []
    evidence = []

    if not command and not cmd:
        return build_result(
            operation_id="test.execute",
            version="1.0.0",
            checks=[check("command_provided", False, "no test command given")],
            subject={"cwd": cwd},
            started_at=started,
        )

    if command:
        parts = command.split()
        r = run(parts[0], parts[1:], cwd)
        display = command
    else:
        r = run(str(cmd), args, cwd)
        display = " ".join([str(cmd), *args])

    checks.append(check("exit_code_zero", r["code"] == 0, f"exit={r['code']}"))
    evidence.append(f"exit={r['code']}")
    tail = r["stdout"].strip()[-1500:]
    if tail:
        evidence.append(tail)
    if r["stderr"].strip():
        evidence.append("stderr: " + r["stderr"].strip()[-1500:])

    return build_result(
        operation_id="test.execute",
        version="1.0.0",
        checks=checks,
        subject={"command": display, "cwd": cwd},
        evidence=evidence,
        side_effects=[f"ran test command: {display}"],
        started_at=started,
    )


def _validate_definition(d: dict) -> list:
    errors = []
    required = ("operation_id", "version", "status", "domain", "title",
                "description", "side_effects", "risk_level", "adapters")
    for k in required:
        if k not in d:
            errors.append(f"missing field: {k}")
    if d.get("status") not in VALID_STATUSES:
        errors.append(f"invalid status: {d.get('status')}")
    if d.get("risk_level") not in VALID_RISK:
        errors.append(f"invalid risk_level: {d.get('risk_level')}")
    return errors


HANDLERS: dict[str, Callable[[dict, dict], OperationResult]] = {
    "git.repository-sanity": git_repository_sanity,
    "git.merge-gate": git_merge_gate,
    "git.feature-pr-gate": git_feature_pr_gate,
    "git.feature-start": git_feature_start,
    "test.execute": test_execute,
}


class OperationRegistry:
    def __init__(self, root: str):
        self.root = str(root)
        self._definitions: dict[str, dict] = {}
        self._alias_index: dict[str, str] = {}
        self._intent_index: dict[str, str] = {}
        self._errors: list[str] = []

    @property
    def catalog_dir(self) -> Path:
        return Path(self.root) / "operations" / "catalog"

    def load(self) -> dict:
        self._definitions = {}
        self._alias_index = {}
        self._intent_index = {}
        self._errors = []
        catalog = self.catalog_dir
        if not catalog.is_dir():
            self._errors.append(f"operations catalog missing: {catalog}")
            return {"loaded": 0, "errors": list(self._errors)}

        for file in sorted(catalog.glob("*.json")):
            try:
                data = json.loads(file.read_text(encoding="utf-8"))
            except json.JSONDecodeError as e:
                self._errors.append(f"{file.name}: JSON parse error: {e}")
                continue
            errs = _validate_definition(data)
            if errs:
                self._errors.append(f"{file.name}: {'; '.join(errs)}")
                continue
            op_id = data["operation_id"]
            if op_id in self._definitions:
                self._errors.append(f"{file.name}: duplicate operation_id {op_id}")
                continue
            for a in data.get("aliases", []):
                if a in self._alias_index and self._alias_index[a] != op_id:
                    self._errors.append(
                        f"{file.name}: duplicate alias '{a}' (maps to {self._alias_index[a]})")
                else:
                    self._alias_index[a] = op_id
            for i in data.get("intents", []):
                key = i.lower()
                if key not in self._intent_index:
                    self._intent_index[key] = op_id
            self._definitions[op_id] = data

        return {"loaded": len(self._definitions), "errors": list(self._errors)}

    def list(self, status: Optional[str] = None) -> list:
        out = list(self._definitions.values())
        if status:
            out = [d for d in out if d.get("status") == status]
        return sorted(out, key=lambda d: d["operation_id"])

    def describe(self, op_id: str) -> Optional[dict]:
        return self._definitions.get(op_id)

    def has_handler(self, op_id: str) -> bool:
        return op_id in HANDLERS

    def resolve(self, query: str) -> dict:
        q = query.strip()
        if q in self._definitions:
            return {"found": True, "operation_id": q, "confidence": 1, "via": "exact-id"}
        if q in self._alias_index:
            return {"found": True, "operation_id": self._alias_index[q],
                    "confidence": 1, "via": "alias"}
        key = q.lower()
        if key in self._intent_index:
            return {"found": True, "operation_id": self._intent_index[key],
                    "confidence": 1, "via": "intent"}
        return {"found": False, "operation_id": None, "confidence": 0, "via": None}

    def search(self, term: str) -> list:
        t = term.lower()
        out = []
        for d in self.list():
            haystack = " ".join([
                d["operation_id"], d.get("title", ""), d.get("description", ""),
                *d.get("aliases", []), *d.get("intents", []),
            ]).lower()
            if t in haystack:
                out.append(d)
        return out

    def execute(self, op_id: str, input_: Optional[dict] = None) -> OperationResult:
        input_ = input_ or {}
        if op_id not in self._definitions:
            raise ValueError(f"unknown operation: {op_id}")
        d = self._definitions[op_id]
        if d.get("status") != "active":
            raise ValueError(
                f"operation {op_id} is {d.get('status')} — not executable")
        handler = HANDLERS.get(op_id)
        if handler is None:
            raise ValueError(f"operation {op_id} has no handler registered")
        return handler(input_, {"root": self.root})


__all__ = ["OperationRegistry", "DefinitionError"]
