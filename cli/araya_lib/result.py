"""Deterministic operation result contract (recovered from the legacy
operations runtime, with all authority/role coupling removed)."""
from __future__ import annotations

import json
import time
from dataclasses import dataclass, field, asdict
from typing import Any, Optional

RESULT_STATUSES = ("PASS", "FAIL", "BLOCK", "SKIP", "NOT_IMPLEMENTED")


@dataclass
class Check:
    id: str
    passed: bool
    blocking: bool = True
    detail: str = ""
    evidence: list = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class OperationResult:
    operation_id: str
    operation_version: str
    passed: bool
    status: str
    checks: list
    failed_checks: list
    blocking_reasons: list
    warnings: list
    evidence: list
    side_effects: list
    evaluated_sha: Optional[str]
    started_at: str
    completed_at: str
    duration_ms: int
    subject: Optional[dict] = None

    def to_dict(self) -> dict:
        d = asdict(self)
        d["checks"] = [c.to_dict() if isinstance(c, Check) else c for c in self.checks]
        return d

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2, sort_keys=True)


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()) + "Z"


def check(
    id: str,
    passed: bool,
    detail: str = "",
    evidence: Optional[list] = None,
    blocking: bool = True,
) -> Check:
    return Check(id=id, passed=passed, blocking=blocking, detail=detail,
                 evidence=evidence or [])


def build_result(
    operation_id: str,
    version: str,
    checks: list,
    subject: Optional[dict] = None,
    warnings: Optional[list] = None,
    evidence: Optional[list] = None,
    side_effects: Optional[list] = None,
    evaluated_sha: Optional[str] = None,
    started_at: Optional[str] = None,
    status_override: Optional[str] = None,
) -> OperationResult:
    started = started_at or now_iso()
    completed = now_iso()
    t0 = time.time()
    failed = [c.id for c in checks if (not c.passed) and c.blocking]
    blocking_reasons = [
        f"{c.id}: {c.detail or 'failed'}" for c in checks
        if (not c.passed) and c.blocking
    ]
    passed = len(failed) == 0
    status = status_override or ("PASS" if passed else "FAIL")
    return OperationResult(
        operation_id=operation_id,
        operation_version=version,
        passed=passed,
        status=status,
        checks=checks,
        failed_checks=failed,
        blocking_reasons=blocking_reasons,
        warnings=warnings or [],
        evidence=evidence or [],
        side_effects=side_effects or [],
        evaluated_sha=evaluated_sha,
        started_at=started,
        completed_at=completed,
        duration_ms=int((time.time() - t0) * 1000),
        subject=subject,
    )


def validate_result(result: OperationResult) -> list:
    """Contract validation — returns a list of violations (empty = valid)."""
    errors = []
    if result.status not in RESULT_STATUSES:
        errors.append(f"status not in {RESULT_STATUSES}: {result.status}")
    if result.operation_id == "":
        errors.append("operation_id is empty")
    if result.passed and result.status != "PASS":
        errors.append("passed=True but status != PASS")
    if not result.passed and result.status == "PASS":
        errors.append("passed=False but status == PASS")
    if result.checks and any(not isinstance(c, Check) for c in result.checks):
        errors.append("checks contains non-Check entries")
    return errors


__all__ = [
    "Check", "OperationResult", "RESULT_STATUSES", "check", "build_result",
    "validate_result", "now_iso",
]
