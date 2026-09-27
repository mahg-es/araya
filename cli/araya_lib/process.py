"""Process helpers — deterministic subprocess/git execution (stdlib only)."""
from __future__ import annotations

import subprocess
from typing import Optional


def run(cmd: str, args, cwd: str, timeout: int = 300) -> dict:
    """Run a command and return {code, stdout, stderr}. Never raises on a
    non-zero exit or missing binary."""
    try:
        p = subprocess.run(
            [cmd, *map(str, args)],
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return {"code": p.returncode, "stdout": p.stdout or "", "stderr": p.stderr or ""}
    except FileNotFoundError:
        return {"code": 127, "stdout": "", "stderr": f"command not found: {cmd}"}
    except subprocess.TimeoutExpired as e:
        out = e.stdout if isinstance(e.stdout, str) else ""
        return {"code": 124, "stdout": out, "stderr": f"timeout after {timeout}s"}


def git(root: str, args, timeout: int = 120) -> dict:
    return run("git", ["-C", root, *map(str, args)], root, timeout)


def is_hex(value: str, minimum: int = 7) -> bool:
    return bool(value) and len(value) >= minimum and all(
        c in "0123456789abcdefABCDEF" for c in value
    )


def shell_join(cmd: str, args) -> str:
    return " ".join([cmd, *map(str, args)])


__all__ = ["run", "git", "is_hex", "shell_join"]
