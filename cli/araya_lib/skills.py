"""Skills — progressive-disclosure skill library.

A skill is the primary unit of reusable procedural specialization. Discovery
follows progressive disclosure:

1. minimal metadata is always discoverable (skills/index.json),
2. full skill instructions load only when the skill is selected (SKILL.md),
3. scripts/resources load only when needed.

The full skill library is never loaded into every context.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Optional


class Skills:
    def __init__(self, root: str):
        self.root = str(root)
        self._index: dict = {}
        self._loaded = False
        self._errors: list[str] = []

    @property
    def index_path(self) -> Path:
        return Path(self.root) / "skills" / "index.json"

    def load_index(self) -> dict:
        """Load only the metadata index — never the full skill bodies."""
        self._index = {}
        self._errors = []
        if not self.index_path.is_file():
            self._errors.append(f"skills index missing: {self.index_path}")
            self._loaded = True
            return {"loaded": 0, "errors": list(self._errors)}
        try:
            data = json.loads(self.index_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            self._errors.append(f"skills index parse error: {e}")
            self._loaded = True
            return {"loaded": 0, "errors": list(self._errors)}
        skills = data.get("skills", [])
        for s in skills:
            self._index[s.get("name", "")] = s
        self._loaded = True
        return {"loaded": len(self._index), "errors": list(self._errors)}

    def list(self) -> list:
        if not self._loaded:
            self.load_index()
        return sorted(self._index.values(), key=lambda s: s.get("name", ""))

    def names(self) -> list:
        return [s.get("name") for s in self.list()]

    def get(self, name: str) -> Optional[dict]:
        """Return full skill record with the SKILL.md body loaded on selection."""
        if not self._loaded:
            self.load_index()
        meta = self._index.get(name)
        if meta is None:
            return None
        body = ""
        rel = meta.get("path") or f"{name}/SKILL.md"
        skill_file = Path(self.root) / "skills" / rel
        if skill_file.is_file():
            body = skill_file.read_text(encoding="utf-8")
        record = dict(meta)
        record["name"] = name
        record["body"] = body
        return record

    def resolve(self, query: str) -> dict:
        """Deterministic resolution: exact name → tag → capability keyword."""
        q = query.strip().lower()
        if q in self._index:
            return {"found": True, "skill": q, "via": "exact-name"}
        for s in self.list():
            if q in [t.lower() for t in s.get("tags", [])]:
                return {"found": True, "skill": s["name"], "via": "tag"}
            for c in s.get("capabilities", []):
                if q == c.lower():
                    return {"found": True, "skill": s["name"], "via": "capability"}
        return {"found": False, "skill": None, "via": None}


__all__ = ["Skills"]
