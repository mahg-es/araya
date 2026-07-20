#!/usr/bin/env python3
"""Local PostOffice loop for ARAYA Project Coordinator.

This tool is intentionally narrow: it reads and writes only the repository-local
.araya/postoffice message loop and never executes message content.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from session_identity import session_identity_for_frontmatter  # noqa: E402 (REQ-024 Slice 1)


POSTOFFICE_REL = Path(".araya/postoffice")
LEDGER_REL = Path(".araya/ax/ledger")
LEDGER_FILE = "score.ndjson"
INBOX = "inbox"
OUTBOX = "outbox"
ARCHIVE = "archive"
ARCHIVED_THREADS = "archived-threads"
INDEX_FILE = "index.jsonl"
SEQ_COUNTER_FILE = ".seq_counter"
MAX_BODY_BYTES = 65_536
ID_RE = re.compile(r"^MSG-\d{8}-\d{6}-[a-f0-9]{8}$")
STATUS_VALUES = {"new", "claimed", "read", "replied", "archived", "blocked"}
DIRECTION_VALUES = {"inbound", "outbound"}
DISPOSITION_VALUES = {"PASS", "SUCCESS", "STOP", "ASK", "FIX", "ESCALATE", "BLOCK", "AUDIT"}
LIVE_STATUSES = {"new", "claimed", "read", "replied", "blocked"}
EVENT_TYPE_VALUES = {"created", "mark-read", "mark-claimed", "mark-replied", "mark-blocked", "archive", "compact"}
LIFECYCLE_TRANSITIONS = {
    ("new", "read"),
    ("new", "claimed"),
    ("claimed", "replied"),
    ("claimed", "blocked"),
    ("read", "replied"),
    ("new", "replied"),
    ("new", "blocked"),
    ("read", "blocked"),
    ("replied", "archived"),
    ("blocked", "archived"),
    ("read", "archived"),
}
THREAD_HEADER = "# PostOffice Thread"
ARCHIVE_THREAD_HEADER = "# Archived PostOffice Thread"


class PostOfficeError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def detect_model() -> str:
    """Detect model from environment. Returns 'unknown' if not detectable."""
    for env_var in ("PI_MODEL", "MODEL_ID", "LLM_MODEL"):
        val = os.environ.get(env_var, "").strip()
        if val:
            return val
    return "unknown"


def detect_model_source() -> str:
    """Detect model source from environment. Returns 'unknown' if not detectable."""
    for env_var in ("PI_MODEL_SOURCE", "MODEL_SOURCE"):
        val = os.environ.get(env_var, "").strip()
        if val and val in ("env", "config", "user-declared", "tool-reported", "unknown"):
            return val
    if os.environ.get("PI_MODEL") or os.environ.get("MODEL_ID") or os.environ.get("LLM_MODEL"):
        return "tool-reported"
    return "unknown"


def archive_target_dir(root: Path, message_id: str) -> Path:
    """Return archive/YYYY/MM/ directory for a message, derived from its ID prefix."""
    m = re.match(r"MSG-(\d{4})(\d{2})\d{2}-", message_id)
    if m:
        year, month = m.group(1), m.group(2)
        return safe_postoffice_path(root, ARCHIVE, year, month)
    return safe_postoffice_path(root, ARCHIVE)


def repo_root() -> Path:
    start = Path(__file__).resolve().parent
    for candidate in (start, *start.parents):
        if (candidate / ".git").exists():
            return candidate
    raise PostOfficeError("RepositoryRootNotFound", "tool must run from this repository checkout")


def sync_postoffice(root: Path) -> bool:
    """Fetch origin and sync .araya/postoffice/ from upstream.

    Uses git-stash to preserve local postoffice modifications: stashes local
    changes, checks out the upstream version, then pops the stash back on
    top so local state (newly posted messages, mark-read/replied status
    changes) survives the sync.  If stash-pop produces a conflict, the
    stash is left in place for manual resolution rather than silently
    corrupting state.

    Returns True on success, False when git is unavailable, there is no
    network, upstream is not configured, or a conflict prevents safe
    completion.
    """
    try:
        subprocess.run(
            ["git", "fetch", "origin"],
            cwd=root, capture_output=True, timeout=30, check=False,
        )
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "@{upstream}"],
            cwd=root, capture_output=True, text=True, timeout=10, check=False,
        )
        upstream = result.stdout.strip()
        if not upstream or result.returncode != 0:
            return False

        # Stash local postoffice changes so they survive the checkout
        stash_result = subprocess.run(
            ["git", "stash", "push", "-m", "sync_postoffice auto-stash",
             "--", ".araya/postoffice/"],
            cwd=root, capture_output=True, text=True, timeout=15, check=False,
        )
        had_stash = stash_result.returncode == 0 and "No local changes" not in stash_result.stdout

        # Checkout upstream version of postoffice
        subprocess.run(
            ["git", "checkout", upstream, "--", ".araya/postoffice/"],
            cwd=root, capture_output=True, timeout=10, check=False,
        )

        # Restore local changes on top
        if had_stash:
            pop = subprocess.run(
                ["git", "stash", "pop"],
                cwd=root, capture_output=True, text=True, timeout=15, check=False,
            )
            if pop.returncode != 0:
                # Conflict — leave stash intact, signal failure
                return False

        return True
    except Exception:
        return False


def resolve_inside(base: Path, candidate: Path, *, label: str) -> Path:
    try:
        resolved = candidate.resolve(strict=False)
    except OSError as exc:
        raise PostOfficeError("ValidationFailure", f"cannot resolve {label}: {exc}") from exc
    try:
        resolved.relative_to(base)
    except ValueError as exc:
        raise PostOfficeError("SecurityBlocked", f"{label} escapes repository root") from exc
    return resolved


def safe_postoffice_path(root: Path, *parts: str) -> Path:
    if any(Path(part).is_absolute() for part in parts):
        raise PostOfficeError("ValidationFailure", "absolute output paths are not allowed")
    if any(".." in Path(part).parts for part in parts):
        raise PostOfficeError("ValidationFailure", "path traversal is not allowed")
    postoffice = (root / POSTOFFICE_REL).resolve(strict=False)
    path = (postoffice.joinpath(*parts)).resolve(strict=False)
    try:
        path.relative_to(postoffice)
    except ValueError as exc:
        raise PostOfficeError("SecurityBlocked", "path escapes PostOffice root") from exc
    return path


def check_no_symlink_escape(root: Path, path: Path, *, label: str) -> None:
    current = path
    seen: list[Path] = []
    while current != root and current not in seen:
        seen.append(current)
        if current.exists() and current.is_symlink():
            target = current.resolve(strict=True)
            try:
                target.relative_to(root)
            except ValueError as exc:
                raise PostOfficeError("SecurityBlocked", f"{label} symlink escapes repository root") from exc
        current = current.parent


def emit(payload: dict[str, Any], fmt: str) -> None:
    if fmt == "json":
        print(json.dumps(payload, indent=2, sort_keys=True))
        return
    if payload.get("ok"):
        print(payload.get("summary", "ok"))
    else:
        error = payload.get("error", {})
        print(f"{error.get('code', 'Error')}: {error.get('message', 'unknown error')}")
    for item in payload.get("items", []):
        if isinstance(item, dict):
            print(" - " + " | ".join(f"{k}={v}" for k, v in item.items()))
        else:
            print(f" - {item}")


def response(command: str, ok: bool, **fields: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "schema_version": 1,
        "command": command,
        "ok": ok,
        "postoffice": str(POSTOFFICE_REL),
    }
    payload.update(fields)
    return payload


def error_response(command: str, exc: PostOfficeError) -> dict[str, Any]:
    return response(command, False, error={"code": exc.code, "message": exc.message})


def read_frontmatter(path: Path) -> tuple[dict[str, str | None], str]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise PostOfficeError("ValidationFailure", f"{path.name} is missing YAML frontmatter")
    end = text.find("\n---\n", 4)
    if end == -1:
        raise PostOfficeError("ValidationFailure", f"{path.name} has unterminated YAML frontmatter")
    raw = text[4:end]
    body = text[end + 5 :]
    data: dict[str, str | None] = {}
    for line in raw.splitlines():
        if not line.strip():
            continue
        if ":" not in line:
            raise PostOfficeError("ValidationFailure", f"invalid frontmatter line in {path.name}")
        key, value = line.split(":", 1)
        value = value.strip()
        if len(value) >= 2 and value[0] == '"' and value[-1] == '"':
            value = value[1:-1].replace('\\"', '"').replace("\\\\", "\\")
        data[key.strip()] = None if value == "null" else value
    return data, body


def message_paths(root: Path) -> list[Path]:
    paths: list[Path] = []
    for folder in (INBOX, OUTBOX, ARCHIVE):
        base = safe_postoffice_path(root, folder)
        if not base.exists():
            continue
        check_no_symlink_escape(root, base, label=folder)
        paths.extend(sorted(base.rglob("MSG-*.md")))
    return paths


def message_summary(path: Path) -> dict[str, Any]:
    meta, body = read_frontmatter(path)
    required = {"id", "created_at", "from", "to", "subject", "status", "direction", "related_branch", "related_pr", "body_sha256"}
    missing = sorted(required - set(meta))
    if missing:
        raise PostOfficeError("ValidationFailure", f"{path.name} missing fields: {', '.join(missing)}")
    if meta["status"] not in STATUS_VALUES:
        raise PostOfficeError("ValidationFailure", f"{path.name} has invalid status")
    if meta["direction"] not in DIRECTION_VALUES:
        raise PostOfficeError("ValidationFailure", f"{path.name} has invalid direction")
    digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
    if meta["body_sha256"] != digest:
        raise PostOfficeError("ValidationFailure", f"{path.name} body_sha256 mismatch")
    seq_value = meta.get("seq")
    return {
        "id": meta["id"],
        "seq": None if seq_value is None else int(str(seq_value)),
        "created_at": meta["created_at"],
        "from": meta["from"],
        "to": meta["to"],
        "subject": meta["subject"],
        "status": meta["status"],
        "direction": meta["direction"],
        "path": str(path.relative_to(repo_root())),
    }


def load_message(root: Path, message_id: str) -> tuple[Path, dict[str, str | None], str]:
    path = find_message(root, message_id)
    meta, body = read_frontmatter(path)
    return path, meta, body


def serialize_frontmatter(meta: dict[str, str | None], body: str) -> str:
    lines = ["---"]
    for key, value in meta.items():
        lines.append(f"{key}: {yaml_scalar(value)}")
    lines.append("---")
    return "\n".join(lines) + "\n" + body


def validate_transition(current_status: str, next_status: str) -> None:
    if current_status not in STATUS_VALUES:
        raise PostOfficeError("ValidationFailure", f"invalid current status: {current_status}")
    if next_status not in STATUS_VALUES:
        raise PostOfficeError("ValidationFailure", f"invalid next status: {next_status}")
    if (current_status, next_status) not in LIFECYCLE_TRANSITIONS:
        raise PostOfficeError("ValidationFailure", f"invalid status transition: {current_status} -> {next_status}")


def rewrite_message(
    path: Path,
    meta: dict[str, str | None],
    body: str,
    *,
    new_status: str,
) -> None:
    current_status = str(meta.get("status") or "")
    validate_transition(current_status, new_status)
    meta["status"] = new_status
    path.write_text(serialize_frontmatter(meta, body), encoding="utf-8")


def message_subject(meta: dict[str, str | None]) -> str:
    return str(meta.get("subject") or "")


def message_from(meta: dict[str, str | None]) -> str | None:
    value = meta.get("from")
    return None if value is None else str(value)


def message_to(meta: dict[str, str | None]) -> str | None:
    value = meta.get("to")
    return None if value is None else str(value)


def current_utc() -> datetime:
    return datetime.now(timezone.utc)


def utc_timestamp(value: datetime | None = None) -> str:
    return (value or current_utc()).strftime("%Y-%m-%dT%H:%M:%SZ")


def event_id_for(event_at: str, event_type: str, message_id: str | None, message_path: str | None, actor: str | None, body_sha256: str | None) -> str:
    seed = "\0".join(
        [
            event_at,
            event_type,
            message_id or "",
            message_path or "",
            actor or "",
            body_sha256 or "",
        ]
    )
    return f"EVT-{hashlib.sha256(seed.encode('utf-8')).hexdigest()[:12]}"


def index_path(root: Path) -> Path:
    path = safe_postoffice_path(root, INDEX_FILE)
    check_no_symlink_escape(root, path.parent, label="index.jsonl")
    return path


def seq_counter_path(root: Path) -> Path:
    path = safe_postoffice_path(root, SEQ_COUNTER_FILE)
    check_no_symlink_escape(root, path.parent, label=".seq_counter")
    return path


def archived_threads_dir(root: Path) -> Path:
    path = safe_postoffice_path(root, ARCHIVED_THREADS)
    check_no_symlink_escape(root, path.parent, label="archived-threads")
    return path


def message_snapshot(root: Path, path: Path) -> dict[str, Any]:
    meta, body = read_frontmatter(path)
    digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
    return {
        "path": str(path.relative_to(root)),
        "meta": meta,
        "body": body,
        "body_sha256": digest,
        "status": str(meta.get("status") or ""),
    }


def current_message_snapshots(root: Path) -> dict[str, dict[str, Any]]:
    return {snapshot["meta"]["id"]: snapshot for snapshot in (message_snapshot(root, path) for path in message_paths(root))}


def parse_thread_blocks(path: Path) -> list[dict[str, Any]]:
    text = path.read_text(encoding="utf-8")
    blocks: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    for line in text.splitlines():
        if line.startswith("## "):
            if current is not None:
                blocks.append(current)
            header = line[3:]
            if " - " not in header:
                raise PostOfficeError("ValidationFailure", f"invalid thread header: {line}")
            event_at, message_id = header.rsplit(" - ", 1)
            seq = None
            if event_at.startswith("#") and " " in event_at:
                seq_token, event_at = event_at.split(" ", 1)
                if seq_token[1:].isdigit():
                    seq = int(seq_token[1:])
            current = {"event_at": event_at.strip(), "message_id": message_id.strip(), "lines": []}
            if seq is not None:
                current["seq"] = seq
            continue
        if current is not None:
            current["lines"].append(line)
    if current is not None:
        blocks.append(current)
    return blocks


def parse_bullet_value(lines: list[str], prefix: str) -> str | None:
    for line in lines:
        if line.startswith(prefix):
            value = line[len(prefix):].strip()
            if value.startswith("`") and value.endswith("`") and len(value) >= 2:
                return value[1:-1]
            return value
    return None


def parse_status_transition(lines: list[str]) -> tuple[str | None, str | None]:
    status = parse_bullet_value(lines, "- Status: ")
    if status is None or "->" not in status:
        return None, None
    left, right = status.split("->", 1)
    return left.strip(" `"), right.strip(" `")


def thread_block_to_event(block: dict[str, Any], *, body_sha256: str | None) -> dict[str, Any] | None:
    lines = [str(line) for line in block["lines"] if str(line).strip()]
    event_type = parse_bullet_value(lines, "- Event: ")
    direction = parse_bullet_value(lines, "- Direction: ")
    actor_from = parse_bullet_value(lines, "- From: ")
    actor_to = parse_bullet_value(lines, "- To: ")
    subject = parse_bullet_value(lines, "- Subject: ") or ""
    message_path = parse_bullet_value(lines, "- Message: ")
    seq_value = parse_bullet_value(lines, "- Seq: ")
    if not message_path:
        return None
    if event_type is None:
        event_type = "created"
        status = "new"
        actor = actor_from
    else:
        previous_status, status = parse_status_transition(lines)
        if event_type == "mark-blocked" and status is None:
            status = "blocked"
        if event_type == "archive" and status is None:
            status = "archived"
        actor = actor_to
    if event_type not in EVENT_TYPE_VALUES:
        raise PostOfficeError("ValidationFailure", f"invalid thread event: {event_type}")
    event: dict[str, Any] = {
        "event_id": event_id_for(block["event_at"], event_type, block["message_id"], message_path, actor, body_sha256),
        "event_at": block["event_at"],
        "event_type": event_type,
        "message_id": block["message_id"],
        "message_path": message_path,
        "from": actor_from,
        "to": actor_to,
        "subject": subject,
        "status": status,
        "direction": direction,
        "actor": actor,
        "body_sha256": body_sha256,
    }
    if seq_value is not None:
        event["seq"] = int(seq_value)
    elif block.get("seq") is not None:
        event["seq"] = block["seq"]
    previous_status, next_status = parse_status_transition(lines)
    if previous_status is not None:
        event["previous_status"] = previous_status
    if next_status is not None:
        event["next_status"] = next_status
    reason = parse_bullet_value(lines, "- Reason: ")
    if reason is not None:
        event["reason"] = reason
    archived_path = parse_bullet_value(lines, "- Archived path: ")
    if archived_path is not None:
        event["archived_path"] = archived_path
    return event


def index_file_is_bootstrapped(root: Path) -> bool:
    path = index_path(root)
    return path.exists() and path.read_text(encoding="utf-8").strip() != ""


def bootstrap_index(root: Path) -> None:
    path = index_path(root)
    snapshots = current_message_snapshots(root)
    created_events: list[dict[str, Any]] = []
    for message_id, snapshot in sorted(snapshots.items()):
        meta = snapshot["meta"]
        created_events.append(
            {
                "event_id": event_id_for(
                    str(meta.get("created_at") or utc_timestamp()),
                    "created",
                    str(meta.get("id") or message_id),
                    snapshot["path"],
                    str(meta.get("from") or ""),
                    snapshot["body_sha256"],
                ),
                "event_at": str(meta.get("created_at") or utc_timestamp()),
                "event_type": "created",
                "message_id": str(meta.get("id") or message_id),
                "message_path": snapshot["path"],
                "from": meta.get("from"),
                "to": meta.get("to"),
                "subject": meta.get("subject"),
                "status": "new",
                "direction": meta.get("direction"),
                "actor": meta.get("from"),
                "body_sha256": snapshot["body_sha256"],
            }
        )
    thread_path = safe_postoffice_path(root, "thread.md")
    check_no_symlink_escape(root, thread_path, label="thread.md")
    thread_events: list[dict[str, Any]] = []
    if thread_path.exists():
        for block in parse_thread_blocks(thread_path):
            event = thread_block_to_event(block, body_sha256=snapshots.get(block["message_id"], {}).get("body_sha256"))
            if event is not None and event["event_type"] != "created":
                thread_events.append(event)
    records = created_events + thread_events
    path.write_text("\n".join(json.dumps(record, sort_keys=True) for record in records) + ("\n" if records else ""), encoding="utf-8")


def ensure_index(root: Path) -> None:
    if not index_file_is_bootstrapped(root):
        bootstrap_index(root)


def read_index_events(root: Path) -> list[dict[str, Any]]:
    ensure_index(root)
    path = index_path(root)
    events: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError as exc:
            raise PostOfficeError("ValidationFailure", f"invalid index.jsonl line: {exc}") from exc
        if not isinstance(event, dict):
            raise PostOfficeError("ValidationFailure", "index.jsonl line must be an object")
        events.append(event)
    return events


def historical_message_count_from_index(root: Path) -> int:
    return len({
        str(event["message_id"])
        for event in read_index_events(root)
        if event.get("message_id") is not None
    })


def existing_message_seqs(root: Path) -> set[int]:
    seen: set[int] = set()
    for record in current_message_records(root):
        seq = record["meta"].get("seq")
        if seq is None:
            continue
        try:
            seq_int = int(str(seq))
        except ValueError as exc:
            raise PostOfficeError("ValidationFailure", f"invalid seq in {record['path'].name}: {seq}") from exc
        if seq_int in seen:
            raise PostOfficeError("SeqCollision", f"duplicate seq detected: {seq_int}")
        seen.add(seq_int)
    return seen


def read_seq_counter(root: Path) -> int | None:
    path = seq_counter_path(root)
    if not path.exists():
        return None
    text = path.read_text(encoding="utf-8").strip()
    if not text:
        return None
    try:
        return int(text)
    except ValueError as exc:
        raise PostOfficeError("ValidationFailure", f"invalid seq counter: {text}") from exc


def allocate_seq(root: Path) -> int:
    existing = existing_message_seqs(root)
    last_seq = read_seq_counter(root)
    if last_seq is None:
        last_seq = historical_message_count_from_index(root)
    seq = last_seq + 1
    if seq in existing:
        raise PostOfficeError("SeqCollision", f"seq collision detected: {seq}")
    seq_counter_path(root).write_text(f"{seq}\n", encoding="utf-8")
    return seq


def append_index_event(root: Path, event: dict[str, Any]) -> None:
    path = index_path(root)
    path.parent.mkdir(parents=True, exist_ok=True)
    check_no_symlink_escape(root, path, label="index.jsonl")
    line = json.dumps(event, sort_keys=True)
    needs_separator = path.exists() and path.stat().st_size > 0 and not path.read_text(encoding="utf-8").endswith("\n")
    with path.open("a", encoding="utf-8") as handle:
        if needs_separator:
            handle.write("\n")
        handle.write(line + "\n")


def current_message_records(root: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for path in message_paths(root):
        meta, body = read_frontmatter(path)
        records.append(
            {
                "path": path,
                "meta": meta,
                "body": body,
                "body_sha256": hashlib.sha256(body.encode("utf-8")).hexdigest(),
                "status": str(meta.get("status") or ""),
            }
        )
    return records


def grouped_events(root: Path) -> tuple[dict[str, list[dict[str, Any]]], dict[str, dict[str, Any]]]:
    records = current_message_records(root)
    snapshots = {str(record["meta"]["id"]): record for record in records}
    events = read_index_events(root)
    groups: dict[str, list[dict[str, Any]]] = {}
    for event in events:
        message_id = event.get("message_id")
        if not message_id:
            continue
        groups.setdefault(str(message_id), []).append(event)
    for message_id, record in snapshots.items():
        groups.setdefault(message_id, [])
        if not groups[message_id]:
            meta = record["meta"]
            groups[message_id].append(
                {
                    "event_id": event_id_for(
                        str(meta.get("created_at") or utc_timestamp()),
                        "created",
                        message_id,
                        str(record["path"].relative_to(repo_root())),
                        str(meta.get("from") or ""),
                        record["body_sha256"],
                    ),
                    "event_at": str(meta.get("created_at") or utc_timestamp()),
                    "event_type": "created",
                    "message_id": message_id,
                    "message_path": str(record["path"].relative_to(repo_root())),
                    "from": meta.get("from"),
                    "to": meta.get("to"),
                    "subject": meta.get("subject"),
                    "status": "new",
                    "direction": meta.get("direction"),
                    "actor": meta.get("from"),
                    "body_sha256": record["body_sha256"],
                }
            )
    return groups, snapshots


def render_event_block(event: dict[str, Any], *, message_path: str) -> str:
    seq = event.get("seq")
    seq_prefix = f"#{seq} " if seq is not None else ""
    lines = [f"## {seq_prefix}{event['event_at']} - {event['message_id']}"]
    if event["event_type"] != "created":
        lines.append(f"- Event: `{event['event_type']}`")
    if seq is not None:
        lines.append(f"- Seq: `{seq}`")
    lines.append(f"- Direction: `{event.get('direction')}`")
    lines.append(f"- From: `{event.get('from')}`")
    lines.append(f"- To: `{event.get('to')}`")
    lines.append(f"- Subject: {event.get('subject', '')}")
    lines.append(f"- Message: `{message_path}`")
    if event["event_type"] == "created":
        lines.append(f"- Status: `{event.get('status')}`")
    elif event.get("previous_status") is not None and event.get("next_status") is not None:
        lines.append(f"- Status: `{event['previous_status']}` -> `{event['next_status']}`")
    elif event.get("status") is not None:
        lines.append(f"- Status: `{event['status']}`")
    if event.get("reason") is not None:
        lines.append(f"- Reason: {event['reason']}")
    if event.get("archived_path") is not None:
        lines.append(f"- Archived path: `{event['archived_path']}`")
    return "\n".join(lines)


def render_thread_document(title: str, intro: str, entries: list[str]) -> str:
    lines = [title, "", intro]
    if entries:
        lines.append("")
        lines.extend(entries)
    lines.append("")
    return "\n".join(lines)


def rebuild_thread_views(root: Path) -> dict[str, Any]:
    events_by_message, snapshots = grouped_events(root)
    live_entries: list[str] = []
    archived_by_month: dict[str, list[str]] = {}
    live_count = 0
    for message_id in sorted(events_by_message.keys()):
        events = events_by_message[message_id]
        snapshot = snapshots.get(message_id)
        if snapshot is None:
            continue
        meta = snapshot["meta"]
        message_status = str(meta.get("status") or snapshot["status"] or "")
        current_path = str(snapshot["path"].relative_to(repo_root()))
        rendered_blocks = [render_event_block(event, message_path=str(event.get("message_path") or current_path)) for event in events if event.get("event_type") != "compact"]
        if message_status == "archived":
            archive_event = next((event for event in events if event.get("event_type") == "archive"), None)
            if archive_event is not None:
                month = str(archive_event["event_at"])[:7]
            else:
                month = str(meta.get("created_at") or utc_timestamp())[:7]
            archived_by_month.setdefault(month, []).extend(rendered_blocks)
        else:
            live_entries.extend(rendered_blocks)
            live_count += len(rendered_blocks)
    thread_path = safe_postoffice_path(root, "thread.md")
    check_no_symlink_escape(root, thread_path, label="thread.md")
    thread_path.write_text(
        render_thread_document(
            THREAD_HEADER,
            "This thread is the live human-readable view of the ARAYA Project Coordinator local PostOffice loop.\n\nAgents must not read thread.md by default. Use inspect, summary, list, pending --to <role>, and read each pending <message-id> first.",
            live_entries,
        ),
        encoding="utf-8",
    )
    archived_root = archived_threads_dir(root)
    archived_root.mkdir(parents=True, exist_ok=True)
    archived_files: list[str] = []
    for month, entries in sorted(archived_by_month.items()):
        archived_file = archived_root / f"{month}.md"
        archived_file.write_text(
            render_thread_document(
                ARCHIVE_THREAD_HEADER,
                "Archived thread history. This file is for audit use, not default agent context.",
                entries,
            ),
            encoding="utf-8",
        )
        archived_files.append(str(archived_file.relative_to(root)))
    return {
        "live_thread_entries": live_count,
        "archived_thread_files": archived_files,
    }


def count_thread_entries(root: Path) -> int:
    thread = safe_postoffice_path(root, "thread.md")
    check_no_symlink_escape(root, thread, label="thread.md")
    if not thread.exists():
        return 0
    return sum(1 for line in thread.read_text(encoding="utf-8").splitlines() if line.startswith("## "))


def record_event(
    root: Path,
    *,
    event_type: str,
    event_at: str,
    message_id: str | None,
    message_path: str | None,
    actor: str | None,
    from_actor: str | None,
    to_actor: str | None,
    subject: str | None,
    status: str | None,
    direction: str | None,
    body_sha256: str | None = None,
    details: dict[str, Any] | None = None,
) -> dict[str, Any]:
    event = {
        "event_id": event_id_for(event_at, event_type, message_id, message_path, actor, body_sha256),
        "event_at": event_at,
        "event_type": event_type,
        "message_id": message_id,
        "message_path": message_path,
        "from": from_actor,
        "to": to_actor,
        "subject": subject,
        "status": status,
        "direction": direction,
        "actor": actor,
        "body_sha256": body_sha256,
    }
    if details:
        event.update(details)
    append_index_event(root, event)
    return event


def cmd_inspect(args: argparse.Namespace) -> dict[str, Any]:
    root = repo_root()
    if not getattr(args, "no_sync", False):
        sync_postoffice(root)
    postoffice = safe_postoffice_path(root)
    folders = {
        name: safe_postoffice_path(root, name).exists()
        for name in (INBOX, OUTBOX, ARCHIVE)
    }
    files = {
        "README.md": safe_postoffice_path(root, "README.md").exists(),
        "PROTOCOL.md": safe_postoffice_path(root, "PROTOCOL.md").exists(),
        "thread.md": safe_postoffice_path(root, "thread.md").exists(),
        "index.jsonl": safe_postoffice_path(root, INDEX_FILE).exists(),
        "archived-threads": safe_postoffice_path(root, ARCHIVED_THREADS).exists(),
    }
    count = len(message_paths(root))
    return response(
        "inspect",
        True,
        summary=f"PostOffice ready at {POSTOFFICE_REL} with {count} message(s)",
        repository=str(root),
        exists=postoffice.exists(),
        folders=folders,
        files=files,
        message_count=count,
        max_body_bytes=MAX_BODY_BYTES,
    )


def cmd_summary(args: argparse.Namespace) -> dict[str, Any]:
    root = repo_root()
    if not getattr(args, "no_sync", False):
        sync_postoffice(root)
    ensure_index(root)
    message_paths_list = message_paths(root)
    summaries = [message_summary(path) for path in message_paths_list]
    counts_by_box = {
        INBOX: len([path for path in message_paths_list if path.parent.name == INBOX]),
        OUTBOX: len([path for path in message_paths_list if path.parent.name == OUTBOX]),
        ARCHIVE: len([path for path in message_paths_list if ARCHIVE in path.parts]),
    }
    counts_by_status: dict[str, int] = {status: 0 for status in STATUS_VALUES}
    for item in summaries:
        counts_by_status[item["status"]] = counts_by_status.get(item["status"], 0) + 1
    events = read_index_events(root)
    latest_message = max(summaries, key=lambda item: str(item["created_at"])) if summaries else None
    latest_event = events[-1]["event_id"] if events else None
    archived_files = sorted(
        str(path.relative_to(root))
        for path in archived_threads_dir(root).glob("*.md")
    ) if archived_threads_dir(root).exists() else []
    return response(
        "summary",
        True,
        summary="PostOffice summary",
        counts={
            "boxes": counts_by_box,
            "status": counts_by_status,
            "messages": len(summaries),
        },
        latest_message_id=None if latest_message is None else latest_message["id"],
        latest_event_id=latest_event,
        live_thread_entries=count_thread_entries(root),
        archived_thread_files=archived_files,
    )


def cmd_compact(args: argparse.Namespace) -> dict[str, Any]:
    root = repo_root()
    ensure_index(root)
    compact_at = utc_timestamp()
    record_event(
        root,
        event_type="compact",
        event_at=compact_at,
        message_id=None,
        message_path=None,
        actor="system",
        from_actor=None,
        to_actor=None,
        subject="compact",
        status=None,
        direction=None,
        details={"summary": "PostOffice views compacted"},
    )
    view_counts = rebuild_thread_views(root)
    return response(
        "compact",
        True,
        summary="PostOffice views compacted",
        live_thread_entries=view_counts["live_thread_entries"],
        archived_thread_files=view_counts["archived_thread_files"],
        index_entries=len(read_index_events(root)),
    )


def cmd_list(args: argparse.Namespace) -> dict[str, Any]:
    root = repo_root()
    if not getattr(args, "no_sync", False):
        sync_postoffice(root)
    items = [message_summary(path) for path in message_paths(root)]
    return response("list", True, summary=f"{len(items)} message(s)", items=items)


def find_message(root: Path, message_id: str) -> Path:
    if not ID_RE.match(message_id):
        raise PostOfficeError("ValidationFailure", "invalid message id")
    matches = [path for path in message_paths(root) if path.stem == message_id]
    if not matches:
        raise PostOfficeError("NotFound", f"message not found: {message_id}")
    if len(matches) > 1:
        raise PostOfficeError("ValidationFailure", f"duplicate message id: {message_id}")
    return matches[0]


def cmd_read(args: argparse.Namespace) -> dict[str, Any]:
    root = repo_root()
    if not getattr(args, "no_sync", False):
        sync_postoffice(root)
    path = find_message(root, args.message_id)
    meta, body = read_frontmatter(path)
    summary = message_summary(path)
    return response("read", True, summary=f"read {args.message_id}", metadata=meta, message=summary, body=body)


def body_from_file(root: Path, body_file: str) -> str:
    candidate = Path(body_file)
    if ".." in candidate.parts:
        raise PostOfficeError("ValidationFailure", "body file path traversal is not allowed")
    resolved = resolve_inside(root, candidate if candidate.is_absolute() else root / candidate, label="body file")
    check_no_symlink_escape(root, resolved, label="body file")
    if not resolved.is_file():
        raise PostOfficeError("NotFound", "body file not found")
    size = resolved.stat().st_size
    if size > MAX_BODY_BYTES:
        raise PostOfficeError("SizeLimitExceeded", f"body file exceeds {MAX_BODY_BYTES} bytes")
    return resolved.read_text(encoding="utf-8")


def body_from_stdin() -> str:
    data = sys.stdin.buffer.read(MAX_BODY_BYTES + 1)
    if len(data) > MAX_BODY_BYTES:
        raise PostOfficeError("SizeLimitExceeded", f"stdin body exceeds {MAX_BODY_BYTES} bytes")
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise PostOfficeError("ValidationFailure", "stdin body must be valid UTF-8") from exc


def yaml_scalar(value: Any) -> str:
    if value is None:
        return "null"
    if isinstance(value, int):
        return str(value)
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def append_thread(root: Path, created_at: str, message_id: str, direction: str, actor_from: str, actor_to: str, subject: str, rel_path: str) -> None:
    thread = safe_postoffice_path(root, "thread.md")
    check_no_symlink_escape(root, thread, label="thread.md")
    entry = (
        f"\n## {created_at} - {message_id}\n\n"
        f"- Direction: `{direction}`\n"
        f"- From: `{actor_from}`\n"
        f"- To: `{actor_to}`\n"
        f"- Subject: {subject}\n"
        f"- Message: `{rel_path}`\n"
    )
    with thread.open("a", encoding="utf-8") as handle:
        handle.write(entry)


def _parse_pr(body: str) -> int | None:
    """Parse 'PR: #NNN' from message body, return int or None."""
    match = re.search(r"^PR:\s*#(\d+)", body, re.MULTILINE)
    return int(match.group(1)) if match else None


def _parse_commit(body: str) -> str | None:
    """Parse 'Commit: <sha>' from message body, return str or None."""
    match = re.search(r"^Commit:\s*([a-f0-9]{7,40})", body, re.MULTILINE)
    return match.group(1) if match else None


def _derive_evidence_ref(body: str, message_id: str, pr: int | None, commit: str | None) -> str:
    """ADR-0011 D4: evidence_ref must always point somewhere real, never stay
    null. Prefer an explicit PR/commit citation already parsed from the body;
    otherwise fall back to the message_id itself, since REQ-019/020 discipline
    already requires raw evidence to live in the message body -- the message
    IS the evidence record when no PR/commit line is present."""
    if pr is not None:
        return f"PR #{pr}"
    if commit is not None:
        return f"commit {commit}"
    return f"message {message_id}"


def parse_disposition(body: str) -> str | None:
    """Return the validated Disposition term from a message body, if present."""
    match = re.search(r"^Disposition:\s*(\S+)", body, re.MULTILINE)
    if match is None:
        return None
    term = match.group(1).rstrip(".")
    if term not in DISPOSITION_VALUES:
        raise PostOfficeError(
            "ValidationFailure",
            f"invalid disposition '{term}' — must be one of {sorted(DISPOSITION_VALUES)}"
        )
    return term


def write_disposition_ledger(root: Path, body: str, message_id: str, from_actor: str, to: str, model: str | None = None, model_source: str | None = None, related_pr: str | None = None) -> None:
    """If body contains 'Disposition: <TERM>', append one line to the score ledger.

    related_pr (structured frontmatter field) is preferred when present;
    body parsing (_parse_pr) is the legacy fallback for messages that
    only carry a 'PR: #NNN' line in the body."""
    term = parse_disposition(body)
    if term is None:
        return
    ledger_path = (root / LEDGER_REL / LEDGER_FILE).resolve()
    if not str(ledger_path).startswith(str(root.resolve())):
        raise PostOfficeError("SecurityBlocked", "ledger path escapes repository root")
    ledger_path.parent.mkdir(parents=True, exist_ok=True)
    # Prefer structured related_pr; fall back to body parsing (legacy)
    if related_pr is not None:
        pr = int(related_pr)
    else:
        pr = _parse_pr(body)
    commit = _parse_commit(body)
    entry = {
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "message_id": message_id,
        "disposition": term,
        "producer": to,
        "emitter": from_actor,
        "pr": pr,
        "commit": commit,
        "evidence_ref": _derive_evidence_ref(body, message_id, pr, commit),
        "note": None,
        "model": model or detect_model(),
        "model_source": model_source or detect_model_source(),
    }
    with ledger_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry, ensure_ascii=False) + "\n")


def read_disposition_ledger(root: Path) -> list[dict[str, Any]]:
    ledger_path = (root / LEDGER_REL / LEDGER_FILE).resolve()
    if not str(ledger_path).startswith(str(root.resolve())):
        raise PostOfficeError("SecurityBlocked", "ledger path escapes repository root")
    if not ledger_path.exists():
        return []
    entries: list[dict[str, Any]] = []
    for line in ledger_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        entries.append(json.loads(stripped))
    return entries


def increment_count(mapping: dict[str, int], key: str) -> None:
    mapping[key] = mapping.get(key, 0) + 1


def cmd_model_stats(args: argparse.Namespace) -> dict[str, Any]:
    root = repo_root()
    entries = read_disposition_ledger(root)
    by_model: dict[str, int] = {}
    by_model_source: dict[str, int] = {}
    by_disposition: dict[str, int] = {}
    by_model_disposition: dict[str, dict[str, int]] = {}

    for entry in entries:
        model = str(entry.get("model") or "unknown")
        model_source = str(entry.get("model_source") or "unknown")
        disposition = str(entry.get("disposition") or "unknown")
        increment_count(by_model, model)
        increment_count(by_model_source, model_source)
        increment_count(by_disposition, disposition)
        model_bucket = by_model_disposition.setdefault(model, {})
        increment_count(model_bucket, disposition)

    return response(
        "model-stats",
        True,
        summary=f"{len(entries)} disposition ledger entries summarized by model",
        ledger=str((LEDGER_REL / LEDGER_FILE).as_posix()),
        total_entries=len(entries),
        by_model=dict(sorted(by_model.items())),
        by_model_source=dict(sorted(by_model_source.items())),
        by_disposition=dict(sorted(by_disposition.items())),
        by_model_disposition={model: dict(sorted(counts.items())) for model, counts in sorted(by_model_disposition.items())},
    )


def create_message(
    *,
    from_actor: str,
    to: str,
    subject: str,
    body: str,
    related_branch: str | None = None,
    related_pr: str | None = None,
    model: str | None = None,
    model_source: str | None = None,
    to_session_id: str | None = None,
) -> dict[str, Any]:
    root = repo_root()
    if len(body.encode("utf-8")) > MAX_BODY_BYTES:
        raise PostOfficeError("SizeLimitExceeded", f"body exceeds {MAX_BODY_BYTES} bytes")
    stored_body = body.rstrip() + "\n"
    parse_disposition(stored_body)
    now = datetime.now(timezone.utc)
    created_at = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    stamp = now.strftime("%Y%m%d-%H%M%S")
    direction = "inbound" if to == "Codex" else "outbound"
    folder = INBOX if direction == "inbound" else OUTBOX
    digest = hashlib.sha256(stored_body.encode("utf-8")).hexdigest()
    shortid = hashlib.sha256(f"{created_at}\0{from_actor}\0{to}\0{subject}\0{digest}".encode("utf-8")).hexdigest()[:8]
    message_id = f"MSG-{stamp}-{shortid}"
    filename = f"{message_id}.md"
    target = safe_postoffice_path(root, folder, filename)
    check_no_symlink_escape(root, target.parent, label=folder)
    if target.exists():
        raise PostOfficeError("ValidationFailure", f"message already exists: {message_id}")
    seq = allocate_seq(root)
    frontmatter = {
        "id": message_id,
        "seq": seq,
        "created_at": created_at,
        "from": from_actor,
        "to": to,
        "subject": subject,
        "status": "new",
        "claimed_by": None,
        "claimed_at": None,
        "direction": direction,
        "related_branch": related_branch,
        "related_pr": related_pr,
        "body_sha256": digest,
        "model": model or detect_model(),
        "model_source": model_source or detect_model_source(),
    }
    # REQ-024 Slice 1: inject session identity if available (graceful no-op otherwise)
    session_fm = session_identity_for_frontmatter(root)
    frontmatter["from_session_id"] = session_fm.get("from_session_id")
    frontmatter["from_session_metadata"] = session_fm.get("from_session_metadata")
    frontmatter["to_session_id"] = to_session_id
    lines = ["---"]
    for key, value in frontmatter.items():
        lines.append(f"{key}: {yaml_scalar(value)}")
    lines.extend(["---", stored_body.rstrip(), ""])
    target.write_text("\n".join(lines), encoding="utf-8")
    rel_path = str(target.relative_to(root))
    record_event(
        root,
        event_type="created",
        event_at=created_at,
        message_id=message_id,
        message_path=rel_path,
        actor=from_actor,
        from_actor=from_actor,
        to_actor=to,
        subject=subject,
        status="new",
        direction=direction,
        body_sha256=digest,
        details={"seq": seq},
    )
    rebuild_thread_views(root)
    write_disposition_ledger(root, stored_body, message_id, from_actor, to, model=model or detect_model(), model_source=model_source or detect_model_source(), related_pr=related_pr)
    return response(
        "post",
        True,
        summary=f"posted {message_id} to {folder}",
        message_id=message_id,
        seq=seq,
        path=rel_path,
        direction=direction,
        body_sha256=digest,
    )


def cmd_post(args: argparse.Namespace) -> dict[str, Any]:
    root = repo_root()
    body = body_from_stdin() if args.body_stdin else body_from_file(root, args.body_file)
    return create_message(
        from_actor=args.from_actor,
        to=args.to,
        subject=args.subject,
        body=body,
        related_branch=args.related_branch,
        related_pr=args.related_pr,
        model=getattr(args, "model", None),
        model_source=getattr(args, "model_source", None),
        to_session_id=getattr(args, "to_session", None),
    )


def transition_common(args: argparse.Namespace, next_status: str, *, event: str) -> dict[str, Any]:
    root = repo_root()
    path, meta, body = load_message(root, args.message_id)
    current_status = str(meta.get("status") or "")
    validate_transition(current_status, next_status)
    rewrite_message(path, meta, body, new_status=next_status)
    event_at = utc_timestamp()
    record_event(
        root,
        event_type=event,
        event_at=event_at,
        message_id=str(meta.get("id") or args.message_id),
        message_path=str(path.relative_to(root)),
        actor=message_to(meta) or message_from(meta),
        from_actor=message_from(meta),
        to_actor=message_to(meta),
        subject=message_subject(meta),
        status=next_status,
        direction=str(meta.get("direction")) if meta.get("direction") is not None else None,
        body_sha256=str(meta.get("body_sha256") or body and hashlib.sha256(body.encode("utf-8")).hexdigest()),
        details={"previous_status": current_status, "next_status": next_status, "seq": meta.get("seq")},
    )
    rebuild_thread_views(root)
    return response(
        event,
        True,
        summary=f"{event} {args.message_id}",
        message_id=args.message_id,
        status=next_status,
        path=str(path.relative_to(root)),
    )


def cmd_mark_claimed(args: argparse.Namespace) -> dict[str, Any]:
    root = repo_root()
    path, meta, body = load_message(root, args.message_id)
    current_status = str(meta.get("status") or "")
    if current_status != "new":
        raise PostOfficeError("AlreadyClaimed", f"message {args.message_id} is already {current_status}")
    claimed_at = utc_timestamp()
    validate_transition(current_status, "claimed")
    meta["status"] = "claimed"
    meta["claimed_by"] = args.claimed_by
    meta["claimed_at"] = claimed_at
    path.write_text(serialize_frontmatter(meta, body), encoding="utf-8")
    record_event(
        root,
        event_type="mark-claimed",
        event_at=claimed_at,
        message_id=str(meta.get("id") or args.message_id),
        message_path=str(path.relative_to(root)),
        actor=args.claimed_by or message_to(meta) or message_from(meta),
        from_actor=message_from(meta),
        to_actor=message_to(meta),
        subject=message_subject(meta),
        status="claimed",
        direction=str(meta.get("direction")) if meta.get("direction") is not None else None,
        body_sha256=str(meta.get("body_sha256") or hashlib.sha256(body.encode("utf-8")).hexdigest()),
        details={
            "previous_status": current_status,
            "next_status": "claimed",
            "seq": meta.get("seq"),
            "claimed_by": args.claimed_by,
            "claimed_at": claimed_at,
        },
    )
    rebuild_thread_views(root)
    return response(
        "mark-claimed",
        True,
        summary=f"claimed {args.message_id}",
        message_id=args.message_id,
        status="claimed",
        claimed_by=args.claimed_by,
        claimed_at=claimed_at,
        path=str(path.relative_to(root)),
    )


def cmd_mark_read(args: argparse.Namespace) -> dict[str, Any]:
    return transition_common(args, "read", event="mark-read")


def cmd_mark_replied(args: argparse.Namespace) -> dict[str, Any]:
    return transition_common(args, "replied", event="mark-replied")


def cmd_mark_blocked(args: argparse.Namespace) -> dict[str, Any]:
    root = repo_root()
    path, meta, body = load_message(root, args.message_id)
    current_status = str(meta.get("status") or "")
    validate_transition(current_status, "blocked")
    rewrite_message(path, meta, body, new_status="blocked")
    record_event(
        root,
        event_type="mark-blocked",
        event_at=utc_timestamp(),
        message_id=str(meta.get("id") or args.message_id),
        message_path=str(path.relative_to(root)),
        actor=message_to(meta) or message_from(meta),
        from_actor=message_from(meta),
        to_actor=message_to(meta),
        subject=message_subject(meta),
        status="blocked",
        direction=str(meta.get("direction")) if meta.get("direction") is not None else None,
        body_sha256=str(meta.get("body_sha256") or hashlib.sha256(body.encode("utf-8")).hexdigest()),
        details={"previous_status": current_status, "next_status": "blocked", "reason": args.reason, "seq": meta.get("seq")},
    )
    rebuild_thread_views(root)
    return response(
        "mark-blocked",
        True,
        summary=f"blocked {args.message_id}",
        message_id=args.message_id,
        status="blocked",
        reason=args.reason,
        path=str(path.relative_to(root)),
    )


def cmd_archive(args: argparse.Namespace) -> dict[str, Any]:
    root = repo_root()
    path, meta, body = load_message(root, args.message_id)
    current_status = str(meta.get("status") or "")
    validate_transition(current_status, "archived")
    rewrite_message(path, meta, body, new_status="archived")
    archive_dir = archive_target_dir(root, str(meta.get("id") or args.message_id))
    check_no_symlink_escape(root, archive_dir, label="archive")
    archive_dir.mkdir(parents=True, exist_ok=True)
    target = archive_dir / path.name
    if target.exists():
        raise PostOfficeError("ValidationFailure", f"archived message already exists: {target.name}")
    shutil.move(str(path), str(target))
    record_event(
        root,
        event_type="archive",
        event_at=utc_timestamp(),
        message_id=str(meta.get("id") or args.message_id),
        message_path=str(target.relative_to(root)),
        actor=message_to(meta) or message_from(meta),
        from_actor=message_from(meta),
        to_actor=message_to(meta),
        subject=message_subject(meta),
        status="archived",
        direction=str(meta.get("direction")) if meta.get("direction") is not None else None,
        body_sha256=str(meta.get("body_sha256") or hashlib.sha256(body.encode("utf-8")).hexdigest()),
        details={"previous_status": current_status, "next_status": "archived", "seq": meta.get("seq")},
    )
    rebuild_thread_views(root)
    return response(
        "archive",
        True,
        summary=f"archived {args.message_id}",
        message_id=args.message_id,
        status="archived",
        path=str(target.relative_to(root)),
    )


def cmd_latest(args: argparse.Namespace) -> dict[str, Any]:
    root = repo_root()
    if not getattr(args, "no_sync", False):
        sync_postoffice(root)
    summaries = [message_summary(path) for path in message_paths(root)]
    if not summaries:
        return response("latest", True, summary="no messages", message=None)
    # Filter by recipient if specified
    if hasattr(args, 'to_actor') and args.to_actor:
        summaries = [s for s in summaries if str(s.get("to", "")).lower() == args.to_actor.lower()]
        if not summaries:
            return response("latest", True, summary=f"no messages for {args.to_actor}", message=None)
    latest = sorted(summaries, key=lambda item: str(item["created_at"]))[-1]
    path = find_message(root, str(latest["id"]))
    meta, body = read_frontmatter(path)
    return response("latest", True, summary=f"latest {latest['id']}", message=latest, metadata=meta, body=body)


def cmd_sweep(args: argparse.Namespace) -> dict[str, Any]:
    """Batch-archive all replied messages. Optionally include read messages."""
    root = repo_root()
    include_read = getattr(args, "include_read", False)
    statuses = {"replied"}
    if include_read:
        statuses.add("read")

    # Collect all outbox messages with target statuses
    outbox_dir = safe_postoffice_path(root, OUTBOX)
    to_archive: list[Path] = []
    if outbox_dir.is_dir():
        for fpath in sorted(outbox_dir.glob("MSG-*.md")):
            msg_id = fpath.stem
            meta, _ = read_frontmatter(fpath)
            status = str(meta.get("status", ""))
            if status in statuses:
                to_archive.append(fpath)

    if not to_archive:
        return response("sweep", True, summary="nothing to archive", archived=0, skipped=0)

    archived = 0
    skipped = 0
    for fpath in to_archive:
        msg_id = fpath.stem
        try:
            # Check if already in archive (can happen after merge bringing archive state)
            archive_target = archive_target_dir(root, msg_id) / fpath.name
            if archive_target.exists():
                # Already archived — just remove outbox duplicate, don't call _archive_one
                # (which would fail on duplicate message_id from find_message scanning both boxes)
                fpath.unlink()
                skipped += 1
                continue
            _archive_one(root, msg_id)
            archived += 1
        except Exception:
            skipped += 1

    rebuild_thread_views(root)
    return response(
        "sweep",
        True,
        summary=f"archived {archived} message(s), skipped {skipped}",
        archived=archived,
        skipped=skipped,
        criteria=f"status in {sorted(statuses)}",
    )


def _archive_one(root: Path, message_id: str) -> None:
    """Archive a single message (reused by both cmd_archive and cmd_sweep)."""
    path, meta, body = load_message(root, message_id)
    current_status = str(meta.get("status") or "")
    if current_status not in ("replied", "read", "blocked"):
        raise PostOfficeError("ValidationFailure", f"cannot archive message with status '{current_status}'")
    rewrite_message(path, meta, body, new_status="archived")
    archive_dir = archive_target_dir(root, str(meta.get("id") or message_id))
    check_no_symlink_escape(root, archive_dir, label="archive")
    archive_dir.mkdir(parents=True, exist_ok=True)
    target = archive_dir / path.name
    if target.exists():
        raise PostOfficeError("ValidationFailure", f"archived message already exists: {target.name}")
    shutil.move(str(path), str(target))
    record_event(
        root,
        event_type="archive",
        event_at=utc_timestamp(),
        message_id=message_id,
        message_path=str(target.relative_to(root)),
        actor=message_to(meta) or message_from(meta),
        from_actor=message_from(meta),
        to_actor=message_to(meta),
        subject=message_subject(meta),
        status="archived",
        direction=str(meta.get("direction")) if meta.get("direction") is not None else None,
        body_sha256=str(meta.get("body_sha256") or body and hashlib.sha256(body.encode("utf-8")).hexdigest()),
        details={"previous_status": current_status, "next_status": "archived", "seq": meta.get("seq")},
    )



def cmd_pending(args):
    """Show all new (unclaimed) messages addressed to a role, oldest first."""
    root = repo_root()
    if not getattr(args, "no_sync", False):
        sync_postoffice(root)
    outbox_dir = safe_postoffice_path(root, OUTBOX)
    target = getattr(args, "to", None)

    items = []
    if outbox_dir.is_dir():
        pending_items: list[dict[str, Any]] = []
        for fpath in sorted(outbox_dir.glob("MSG-*.md")):
            meta, _ = read_frontmatter(fpath)
            status = str(meta.get("status", ""))
            if status != "new":
                continue
            if target and str(meta.get("to", "")).lower() != target.lower():
                continue
            pending_items.append(message_summary(fpath))
        items = sorted(
            pending_items,
            key=lambda item: (
                str(item.get("created_at") or ""),
                item.get("seq") if item.get("seq") is not None else 0,
                str(item.get("id") or ""),
            ),
        )

    return response(
        "pending",
        True,
        summary=f"{len(items)} pending message(s){" for " + target if target else ""}",
        items=items,
        filter={"status": "new", "to": target} if target else {"status": "new"},
    )
def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="ARAYA local PostOffice loop")
    parser.add_argument("--format", choices=("json", "text"), default="json")
    parser.add_argument("--no-sync", action="store_true", help="skip git-fetch + postoffice sync before read commands")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("inspect")
    sub.add_parser("list")
    read = sub.add_parser("read")
    read.add_argument("message_id")
    sub.add_parser("summary")
    post = sub.add_parser("post")
    post.add_argument("--from", dest="from_actor", required=True)
    post.add_argument("--to", required=True)
    post.add_argument("--subject", required=True)
    body = post.add_mutually_exclusive_group(required=True)
    body.add_argument("--body-file")
    body.add_argument("--body-stdin", action="store_true")
    post.add_argument("--related-branch", default=None)
    post.add_argument("--related-pr", default=None)
    post.add_argument("--to-session", default=None, help="REQ-024: target a specific session by session_id")
    post.add_argument("--model", default=None, help="model identifier (e.g., deepseek-v4-pro)")
    post.add_argument("--model-source", default=None, choices=("env", "config", "user-declared", "tool-reported", "unknown"), help="source of model info")
    mark_read = sub.add_parser("mark-read")
    mark_read.add_argument("message_id")
    mark_claimed = sub.add_parser("mark-claimed")
    mark_claimed.add_argument("message_id")
    mark_claimed.add_argument("--claimed-by", default=None)
    mark_replied = sub.add_parser("mark-replied")
    mark_replied.add_argument("message_id")
    mark_blocked = sub.add_parser("mark-blocked")
    mark_blocked.add_argument("message_id")
    mark_blocked.add_argument("--reason", required=True)
    archive = sub.add_parser("archive")
    archive.add_argument("message_id")
    sub.add_parser("compact")
    sub.add_parser("model-stats")
    sweep = sub.add_parser("sweep")
    pending = sub.add_parser("pending")
    pending.add_argument("--to", help="filter by recipient role")
    sweep.add_argument("--include-read", action="store_true", help="also archive messages with status 'read'")
    sub.add_parser("latest")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    handlers = {
        "inspect": cmd_inspect,
        "list": cmd_list,
        "read": cmd_read,
        "summary": cmd_summary,
        "post": cmd_post,
        "mark-read": cmd_mark_read,
        "mark-claimed": cmd_mark_claimed,
        "mark-replied": cmd_mark_replied,
        "mark-blocked": cmd_mark_blocked,
        "archive": cmd_archive,
        "compact": cmd_compact,
        "model-stats": cmd_model_stats,
        "sweep": cmd_sweep,
        "pending": cmd_pending,
        "latest": cmd_latest,
    }
    try:
        payload = handlers[args.command](args)
        emit(payload, args.format)
        return 0
    except PostOfficeError as exc:
        emit(error_response(args.command, exc), args.format)
        return 1


if __name__ == "__main__":
    sys.exit(main())
