# Legacy capability inventory (deferred review)

The legacy ARAYA runtime was archived (see the `archive/araya-legacy-*` Git
branches). This inventory lists its capability groups for later individual
review. Nothing here is reintroduced automatically.

| Capability group | Legacy location | Notes | Candidate dispositions |
|---|---|---|---|
| Agent personas (roster) | `prompts/agents/`, `.pi/agents/` | Elena, Sonia, Aisha, … | agent / drop |
| Skills library (~130) | `skills/` | Domain + orchestration skills | skill / reimplement later / drop |
| Orchestration engines | `src/araya/` | workflow/model/quality/budget/circuit | reimplement later / drop |
| CLI | `src/cli.ts`, `dist/cli.js` | ARAYA CLI | CLI capability / drop |
| Git operation gates | `operations/*.yaml` | PR/merge/release gates | reimplement later |
| Bundle tooling | `ops/bootstrap-installer.sh`, `ops/make-bundle.sh` | legacy bundle builder | reimplement later |
| Global Pi extensions | `extensions/araya`, `araya-notifier`, `araya-quota-guard`, `daneel-persona` | global hooks (removed) | drop |
| PostOffice / AX ledger | `.araya/postoffice`, `.araya/ax` | message/ledger state store | reimplement later / drop |
| Runtime enforcement | `.araya/operating-model` | S1/S6 lifecycle gates | reimplement later |

## Disposition policy

Each future capability receives exactly one disposition:

```text
skill
agent
CLI capability
library
reimplement later
drop
```

A capability is reintroduced only after an individual product-value review.
