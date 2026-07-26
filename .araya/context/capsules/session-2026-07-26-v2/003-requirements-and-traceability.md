# 003 — REQ-040→045: States and Traceability — v2
> Capsule ID: 003 | Initiative: req-04x | Status: LIVE
> Session: 2026-07-26-v2 | Portfolio: dev-araya-portfolio 7e3d357 | Framework: dev-mahg 38197e6
> Canonical matrix: `portfolio/projects/araya-portfolio/requirements/req-04x-traceability-matrix.md` (PR #294)

## REQ-040 — hetzner-lab agent access
`req-040.md`. Status: **new** (2026-07-20). No implementation. In indices since PR #294.

## REQ-041 — ARAYA Relay MVP (design)
`req-041-araya-relay-mvp.md`. Status: **design** (authority alignment phase; updated 2026-07-25; supersedes REQ-033/034). Design delivered in framework `dev-mahg`: PR #78 merge `c269780`, PR #79 merge `7fcc9b0`. Gates: Teresa FIX→resolved `92a4e5b`; Rolando VERIFIED WITH OBSERVATION `5696140`. Motor implementation = REQ-042.

## REQ-042 — Relay Motor MVP
`req-042-araya-relay-motor-mvp.md`. Status: **new**. Registered via portfolio PR #291 (merge `af0c2b5`, tracked on origin/dev-araya-portfolio). Motor NOT implemented. Gates not emitted. **Blocked** by: (a) REQ-043 acceptance criterion 24 — Slice A must pass Teresa/Rolando gates on exact SHA (never emitted for `0902ac6`); (b) PE-0007 BLOCKs B1–B4 (active 2026-07-26). Registration verified PE-0012 (4/4).

## REQ-043 — Agent Capability, Skill and Runtime Alignment
`REQ-043-araya-agent-capability-skill-runtime-alignment.md`. Status: **delivered-in-dev** — Slice A implementation merged to framework `dev-mahg`: PR #80 (`788606d`) + recovery PR #81 (`0902ac6`). NOT released in `main` (`8928c1d`, BRANCH-010). Hardening PR #82 (`38197e6`): Sonia roster, CANONICAL-CONTEXT, skill frontmatter, ADR-009.
Acceptance NOT met: criterion 20 (Teresa PASS on merge SHA) and 21 (Rolando VERIFIED on merge SHA) never emitted for `0902ac6`; Manu SPEC_APPROVED pending (Aisha spec: DRAFT — PENDING MANU REVIEW). Do NOT mark Accepted without Professor/Manu evidence.
Slice B (specialist hardening): not started.

## REQ-044 — Capability Activation and Context Continuity
`REQ-044-ARAYA-Capability-Activation-and-Context-Continuity.md`. Status: **new**. Registered PR #293 (merge `f9689af`). No lifecycle implemented. Neo/Trinity verified `dormant` (araya.yaml + `.pi/agents/` @0902ac6 and @38197e6).

## REQ-045 — Compress and Compact
`REQ-045-ARAYA-compress-and-compact.md`. Status: **new**. Registered PR #293 (merge `f9689af`). Capsule set v1 produced (Sonia, session-2026-07-26) — preserved as historical, superseded by v2 (this set) pending acceptance. Requirement NOT closed.

## Index integrity (PR #294)
Both indices updated in the same change (portfolio/AGENTS.md convention): REQ-040→045 added to `index.md` + `REQ-MANIFEST.md`; pre-existing drift repaired (REQ-025 added to manifest; duplicate REQ-016 removed; counts → 27 professor-authored / 51 total). Gates on `ce1f078`: Manu PASS, Teresa PASS (7/7), Rolando VERIFIED (6/6). Merge: `7e3d357`.

## Registration PR evidence
| PR | Merge SHA | Content |
|---|---|---|
| #291 | `af0c2b5` | req-042 registration |
| #292 | `125c53a` | REQ-043 registration |
| #293 | `f9689af` | REQ-044 + REQ-045 registration |
| #294 | `7e3d357` | traceability recovery + index repair |

> v2 rule: every state claim above is git-verified at the SHAs shown. `delivered-in-dev` ≠ accepted ≠ released.
