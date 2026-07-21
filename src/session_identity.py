#!/usr/bin/env python3
"""Session identity for REQ-024 Slice 1 — structured session identifiers.

Each ARAYA agent session carries a unique, stable, non-reusable session ID
plus structured metadata (agent/role, project, runtime, model, status, etc.).
This module reads, creates, and validates the session-identity file stored at
``.araya/session.json`` (repository-local, unversioned).  It is consumed by
``postoffice_loop.py`` (``create_message``) so that every outgoing message
records ``from_session_id`` and ``from_session_metadata`` in addition to the
existing free-text ``from``/``to`` fields.

Covers REQ-024 criteria 1 (unique, stable, lifecycle-bound session ID) and
2 (published session metadata — all 11 metadata slots).
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SESSION_FILE = ".araya/session.json"
REGISTRY_FILE = ".araya/session_registry.json"

# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

METADATA_SLOTS: list[tuple[str, str, type]] = [
    ("agent_name", "agent_name", str),
    ("agent_role", "agent_role", str),
    ("scope", "scope", str),
    ("project", "project", str),
    ("repository", "repository", str),
    ("runtime", "runtime", str),
    ("provider", "provider", str),
    ("model", "model", str),
    ("capability_tier", "capability_tier", str),
    ("declared_capabilities", "declared_capabilities", list),
    ("known_constraints", "known_constraints", list),
]

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


class SessionIdentityError(Exception):
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
    raise SessionIdentityError("NotARepository", "could not locate repository root (.git)")


def session_path(root: Path | None = None) -> Path:
    """Absolute path to the session identity file."""
    return (root or repo_root()) / SESSION_FILE


def generate_session_id() -> str:
    """UUID v4, stable for the lifecycle of this session file."""
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def touch_activity(path: Path) -> None:
    """Update last_activity_at without rewriting the whole file."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return
    data["last_activity_at"] = now_iso()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def read_session(root: Path | None = None) -> dict[str, Any]:
    """Read the current session identity. Returns the full dict if it exists
    and is valid, otherwise raises SessionIdentityError with code NotFound."""
    sp = session_path(root)
    if not sp.exists():
        raise SessionIdentityError("NotFound", f"no session identity file at {sp}")
    try:
        data = json.loads(sp.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SessionIdentityError("ValidationFailure", f"invalid JSON in {sp}: {exc}") from exc
    _validate_structure(data)
    return data


def read_session_or_none(root: Path | None = None) -> dict[str, Any] | None:
    """Graceful variant: returns None when the file is missing or corrupt.
    Callers that want backward compatibility without session IDs use this."""
    try:
        return read_session(root)
    except SessionIdentityError:
        return None


def write_session(
    root: Path | None = None,
    *,
    agent_name: str,
    agent_role: str,
    scope: str,
    project: str,
    repository: str,
    runtime: str,
    provider: str,
    model: str,
    capability_tier: str = "medium",
    declared_capabilities: list[str] | None = None,
    known_constraints: list[str] | None = None,
) -> dict[str, Any]:
    """Create or overwrite a session identity file. Generates a fresh session_id
    and sets operational_status to 'active'."""
    sp = session_path(root)
    sp.parent.mkdir(parents=True, exist_ok=True)
    now = now_iso()
    data: dict[str, Any] = {
        "session_id": generate_session_id(),
        "agent_name": agent_name,
        "agent_role": agent_role,
        "scope": scope,
        "project": project,
        "repository": repository,
        "runtime": runtime,
        "provider": provider,
        "model": model,
        "capability_tier": capability_tier,
        "operational_status": "active",
        "started_at": now,
        "last_activity_at": now,
        "declared_capabilities": declared_capabilities or [],
        "known_constraints": known_constraints or [],
    }
    sp.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return data


def ensure_session(
    root: Path | None = None,
    *,
    agent_name: str,
    agent_role: str,
    scope: str,
    project: str,
    repository: str,
    runtime: str,
    provider: str,
    model: str,
    capability_tier: str = "medium",
    declared_capabilities: list[str] | None = None,
    known_constraints: list[str] | None = None,
) -> dict[str, Any]:
    """Idempotent: read existing session or create one. Returns the session dict."""
    try:
        session = read_session(root)
        touch_activity(session_path(root))
        return session
    except SessionIdentityError:
        return write_session(
            root,
            agent_name=agent_name,
            agent_role=agent_role,
            scope=scope,
            project=project,
            repository=repository,
            runtime=runtime,
            provider=provider,
            model=model,
            capability_tier=capability_tier,
            declared_capabilities=declared_capabilities,
            known_constraints=known_constraints,
        )


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------


def _validate_structure(data: dict[str, Any]) -> None:
    required = {"session_id", "agent_name", "agent_role", "scope", "project",
                "repository", "runtime", "provider", "model"}
    missing = required - set(data)
    if missing:
        raise SessionIdentityError(
            "ValidationFailure",
            f"session.json missing required fields: {', '.join(sorted(missing))}",
        )
    for field, _, expected_type in METADATA_SLOTS:
        if field in data:
            if not isinstance(data[field], expected_type):
                raise SessionIdentityError(
                    "ValidationFailure",
                    f"session.json field '{field}' expected {expected_type.__name__}, "
                    f"got {type(data[field]).__name__}",
                )
    valid_statuses = {"active", "busy", "paused", "closed", "unavailable"}
    status = data.get("operational_status", "active")
    if status not in valid_statuses:
        raise SessionIdentityError(
            "ValidationFailure",
            f"operational_status must be one of {sorted(valid_statuses)}",
        )
    if data.get("session_id", "").strip() == "":
        raise SessionIdentityError("ValidationFailure", "session_id must not be empty")


def session_identity_for_frontmatter(root: Path | None = None) -> dict[str, str | None]:
    """Read session and return the two fields to inject into message frontmatter.
    Returns empty dict if no session file exists (graceful no-op)."""
    session = read_session_or_none(root)
    if session is None:
        return {}
    return {
        "from_session_id": session["session_id"],
        "from_session_metadata": json.dumps(session, sort_keys=True),
    }


# ---------------------------------------------------------------------------
# Session Registry — REQ-024 Slice 2b (criterion 4: session discovery)
# ---------------------------------------------------------------------------


def registry_path(root: Path | None = None) -> Path:
    """Absolute path to the session registry file."""
    return (root or repo_root()) / REGISTRY_FILE


def read_registry(root: Path | None = None) -> dict[str, Any]:
    """Read the registry. Returns empty dict when missing or corrupt."""
    rp = registry_path(root)
    try:
        return json.loads(rp.read_text(encoding="utf-8"))  # type: ignore[no-any-return]
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def write_registry(data: dict[str, Any], root: Path | None = None) -> None:
    rp = registry_path(root)
    rp.parent.mkdir(parents=True, exist_ok=True)
    rp.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def register_in_registry(
    session_data: dict[str, Any],
    root: Path | None = None,
) -> dict[str, Any]:
    """Add or update a session entry in the registry, keyed by session_id.
    Writes a lightweight summary — omits full declared_capabilities/
    known_constraints to keep the registry compact."""
    registry = read_registry(root)
    sid = session_data.get("session_id")
    if not sid:
        raise SessionIdentityError("ValidationFailure", "session_data missing session_id")
    now = now_iso()
    entry = {
        "session_id": session_data["session_id"],
        "agent_name": session_data.get("agent_name"),
        "agent_role": session_data.get("agent_role"),
        "scope": session_data.get("scope"),
        "project": session_data.get("project"),
        "runtime": session_data.get("runtime"),
        "provider": session_data.get("provider"),
        "model": session_data.get("model"),
        "capability_tier": session_data.get("capability_tier"),
        "operational_status": session_data.get("operational_status", "active"),
        "last_registered_at": now,
    }
    # Preserve first_seen_at if already registered
    existing = registry.get("sessions", {}).get(sid, {})
    if "first_registered_at" in existing:
        entry["first_registered_at"] = existing["first_registered_at"]
    else:
        entry["first_registered_at"] = now
    sessions = registry.get("sessions", {})
    sessions[sid] = entry
    registry["sessions"] = sessions
    registry["updated_at"] = now
    write_registry(registry, root)
    return entry


def list_registry(root: Path | None = None) -> dict[str, Any]:
    """Return the full registry dict (sessions key + metadata)."""
    return read_registry(root)


def available_sessions(
    root: Path | None = None,
    *,
    scope: str | None = None,
    capability_tier: str | None = None,
) -> list[dict[str, Any]]:
    """Return sessions that are active or busy (not closed/unavailable/paused).
    Optionally filter by scope and/or capability_tier."""
    registry = read_registry(root)
    sessions = registry.get("sessions", {})
    active_statuses = {"active", "busy"}
    result = []
    for s in sessions.values():
        status = s.get("operational_status", "active")
        if status not in active_statuses:
            continue
        if scope is not None and s.get("scope") != scope:
            continue
        if capability_tier is not None and s.get("capability_tier") != capability_tier:
            continue
        result.append(s)
    return result


def register_current_session(root: Path | None = None) -> dict[str, Any] | None:
    """Convenience: read the current session.json and register it.
    Returns the registry entry, or None if no session.json exists."""
    session = read_session_or_none(root)
    if session is None:
        return None
    return register_in_registry(session, root)


def select_session(
    root: Path | None = None,
    *,
    capability_tier: str | None = None,
    scope: str | None = None,
    agent_role: str | None = None,
) -> dict[str, Any] | None:
    """Select the best available session matching the given requirements.

    Simple policy (no over-design for multi-session not yet real):
    1. Exact match on capability_tier + scope + agent_role from available
    2. Fallback: match on capability_tier + scope (any role)
    3. Fallback: match on capability_tier (any scope, any role)
    4. Return None if nothing matches.
    """
    available = available_sessions(root, scope=scope, capability_tier=capability_tier)
    if agent_role is not None:
        role_match = [s for s in available if s.get("agent_role") == agent_role]
        if role_match:
            return role_match[0]
    if available:
        return available[0]
    # Fallback: any available session with the right capability_tier
    if capability_tier is not None:
        fallback = available_sessions(root, capability_tier=capability_tier)
        if fallback:
            return fallback[0]
    return None


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="ARAYA session identity and registry (REQ-024)")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--list", action="store_true", help="list all registered sessions")
    group.add_argument("--available", action="store_true", help="list available (active/busy) sessions")
    group.add_argument("--register", action="store_true", help="register the current session")
    group.add_argument("--select", action="store_true", help="select the best available session for a task")
    parser.add_argument("--scope", help="filter by scope (with --available or --select)")
    parser.add_argument("--tier", help="filter by capability_tier (with --available or --select)")
    parser.add_argument("--role", help="filter by agent_role (with --select)")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    try:
        root = repo_root()
        if args.list:
            registry = list_registry(root)
            sessions = registry.get("sessions", {})
            if not sessions:
                print("No sessions registered.")
            else:
                print(json.dumps(registry, indent=2, sort_keys=True))
        elif args.available:
            available = available_sessions(root, scope=args.scope, capability_tier=args.tier)
            if not available:
                print("No available sessions.")
            else:
                print(json.dumps(available, indent=2, sort_keys=True))
        elif args.register:
            entry = register_current_session(root)
            if entry is None:
                print("No session.json found — create one first.", file=sys.stderr)
                return 1
            print(json.dumps(entry, indent=2, sort_keys=True))
        elif args.select:
            result = select_session(root, capability_tier=args.tier, scope=args.scope, agent_role=args.role)
            if result is None:
                print("No matching session found.")
            else:
                print(json.dumps(result, indent=2, sort_keys=True))
        else:
            _build_parser().print_help()
        return 0
    except SessionIdentityError as exc:
        print(f"{exc.code}: {exc.message}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
