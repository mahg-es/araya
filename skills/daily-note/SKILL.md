---
name: daily-note
description: "Capture structured daily knowledge — what was accomplished, what was learned,"
---
---

# Daily Note

Capture structured daily knowledge — what was accomplished, what was learned,
what decisions were made, and what's next — building a personal knowledge
base that compounds over time.

## What problem this solves
Ideas, decisions, and learnings evaporate within days if not captured. Daily
notes are the atomic unit of a Personal Knowledge Management (PKM) system —
capturing today's work so next month's self can find it, connect it, and
build on it.

## When to use
At the end of every working day. After significant decisions or discoveries.
When The Data Professor wants to record what was accomplished or learned.

## Input
Day's activities, decisions made, insights gained, open questions, tomorrow's plan.

## Output
```markdown
# 2026-05-28 — Wednesday

## Accomplishments
- [x] Wave 3A complete — 39 skills implemented for existing ARAYA agents
- [x] .araya/plan/ structure dogfooded on pi/ itself
- [x] 10 critical DevOps skills documented (Docker, K8s, CI/CD, security, testing)
- [x] All 11 agent prompt files updated with cross-agent coordination notes

## Decisions Made
- **ADR-012:** Agent naming follows apostolic convention (NT names) for new agents
- **Architecture:** `.araya/plan/{spec,bdd,tdd}/` for all planning artifacts
- **Process:** ARAYA questions to The Data Professor must be numbered [1][2][3]
- **Priority:** Wave 1 (critical core) → Wave 2 (4 new agent MVP) → Wave 3 (backfill)

## Insights & Learnings
- The pi event system is well-designed — `agent_end` fires reliably and was easy to hook
- SKILL.md files follow a consistent template that balances structure with flexibility
- The hardest part of skill design is scoping — where does one skill end and another begin?
- Skills that include concrete code examples are 3x more useful than abstract descriptions

## Open Questions
- [ ] Should `seo-optimize` be a shared skill (Lucas + Aquila) or separate implementations?
- [ ] When will ARAYA skills be connected to actual tool execution (not just documentation)?
- [ ] What's the deployment strategy for ARAYA — npm package, git repo, or local symlinks?
- [ ] Should we add a `CONTRIBUTING.md` for skill contributions from other agents?

## Tomorrow's Plan
- [ ] Wave 3B: 8 remaining new agent MVP skills
- [ ] Test ARAYA notifier extension with `/reload`
- [ ] Update long-term memory with today's decisions
- [ ] Brief Sonia on `.araya/plan/` decision and 12 new agents

## Connections
- [[ARAYA Brainstorming Session]] — 12 new agents, naming convention, folder structure
- [[pi Extension System]] — event hooks, custom tools, TUI components
- [[MAHG Standards]] — project-office governance, quality gates
- [[Wave 3A Implementation]] — 39 skill SKILL.md files created

## Reflection
Today was highly productive — 39 skills in one session. The template-based
approach scales well. Key insight: skills should reference each other and
their owning agents. Tomorrow's challenge: maintaining quality while
moving fast. Consider peer review from Sonia or Priscila.

---
**Tags:** #araya #skills #implementation #architecture #pkm
**Mood:** Productive, focused
**Energy:** High
```

## Steps
1. Review the day: what did you accomplish? What was attempted but not completed?
2. Document decisions: what was decided, by whom, with what rationale?
3. Capture insights: what did you learn? What surprised you? What patterns emerged?
4. List open questions: what needs a decision or research?
5. Plan tomorrow: what's the priority? What depends on external input?
6. Link to related notes: connect today's work to past notes and projects
7. Add metadata: tags, mood, energy level (for future pattern recognition)
8. Write to knowledge hub or daily notes folder

## Rules
- Write today, not tomorrow — memory degrades within 24 hours
- Decisions get their own section — they're the most valuable thing to find later
- Every decision needs rationale — "chose X" without "because Y" is useless in 6 months
- Link to related notes — connections are what make notes valuable over time
- Be specific: "Fixed bug in auth middleware" not "Worked on auth"
- Open questions drive tomorrow's agenda — don't let them sit unanswered
- Daily notes are for you — write in your voice, optimize for future-you's search
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
