---
name: "araya-operation-runtime"
description: "Mandatory operation-first protocol for every active ARAYA agent — resolve requested work to a governed operation from the Operation Catalog before any raw implementation; declare OPERATION_GAP when none applies. Use before executing any task that could be covered by a governed operation."
---

# araya-operation-runtime

- **Name:** araya-operation-runtime
- **Version:** 1.0.0
- **Status:** active (mandatory for every active operational agent)
- **Owner:** daneel
- **Source:** ponny-express-10010 (REQ-046)

## Binding rule

> **No raw implementation when a governed ARAYA operation already performs the requested work.**

## Protocol (always, in order)

1. **Interpret** the requested outcome (what is actually being asked?).
2. **Query the Operation Catalog** — `araya operation resolve "<intent>" --json` or the `araya_operation_resolve` Pi tool.
3. **Select** the governed operation when one applies (`found: true`, `confidence: 1`).
4. **Read its contract** — `araya operation describe <operation-id> --json` (inputs, side effects, authority, evidence).
5. **Use the available adapter** — CLI, Pi custom tool, or Pi slash command. Never re-implement the handler.
6. **Validate the OperationResult** — contract-valid structure, `passed` backed by checks and evidence.
7. **Continue only** when `passed: true`, or when the contract explicitly allows a non-success branch.
8. **Declare OPERATION_GAP** when no suitable operation exists (see below).

## OPERATION_GAP

When the catalog returns `found: false`, you may create a temporary script **only after** producing this record:

```json
{
  "type": "OPERATION_GAP",
  "requested_capability": "",
  "catalog_searched": true,
  "candidates_reviewed": [],
  "reason_not_reusable": "",
  "temporary_solution": "",
  "side_effects": [],
  "reusability_score": 0,
  "proposed_operation_id": "",
  "proposed_owner": "manu"
}
```

Workflow: agent identifies gap → Manu evaluates WHAT/business value → Daneel records and coordinates → Professor decides priority when strategic → specialist implements a governed operation when approved → temporary script deprecated or incorporated.

**Promotion to a governed operation becomes mandatory** when the script is reused, the task is recurring, or the task touches governance, Git safety, gates, releases, evidence, or repository truth.

Do not make every one-off script a product. Do not use OPERATION_GAP to bypass an existing operation.

## What this skill is NOT

- It is not the operation documentation (the catalog carries contracts).
- It does not authorize new operations (Manu/Professor do).
- It does not replace domain skills; it gates how work starts.
