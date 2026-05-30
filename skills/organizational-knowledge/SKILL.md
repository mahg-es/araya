---
name: organizational-knowledge
description: "ARAYA organizational knowledge management — standards, patterns, ADRs, lessons learned, technology preferences, and project reconstitution."
---

# Organizational Knowledge

Manage ARAYA's organizational memory. Capture standards, patterns,
lessons learned, and technology preferences. Reconstruct existing
projects into governed baselines.

## Knowledge Types

| Prefix | Type | Example |
|--------|------|---------|
| STD | Standard | README must be updated for every feature |
| PAT | Pattern | Use medallion architecture for data lakes |
| ANTI | Anti-pattern | Avoid premature microservice decomposition |
| ADR | Architecture Decision | Why we chose FastAPI over Flask |
| LESSON | Lesson Learned | SVG diagrams mandatory for README |
| PREF | Technology Preference | FastAPI preferred over Flask |

## Commands

- `/araya knowledge` — summary of organizational knowledge
- `/araya knowledge --search "<term>"` — search standards, ADRs, lessons
- `/araya learn "<lesson>"` — capture a structured lesson learned
- `/araya reconstitute` — analyze existing project and reconstruct reality
- `/araya reconstitute --deep` — full repository archaeology
- `/araya reconstitute --propose` — generate recovery roadmap

## Reconstitution Modes

| Mode | Scope |
|------|-------|
| `--quick` | Lightweight assessment |
| `--deep` | Full repo archaeology (git, docs, architecture) |
| `--propose` | Generate recovered specs + roadmap |

## Recovery Options

Every reconstitution ends with:
1. Minimal Cleanup
2. Moderate Re-Baselining
3. Full Reconstitution
