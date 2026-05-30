---
change_id: CHG-YYYY-NNN
title: "[Title]"
status: draft
owner: manu
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
requirement_ids: []
acceptance_ids: []
task_ids: []
evidence_ids: []
delivery_id: ""
drr_id: ""
iar_id: ""
cr_id: ""
---

# [Title]

## Lifecycle States

| State | Description |
|-------|-------------|
| **Draft** | Initial creation, not yet reviewed |
| **Planned** | Tasks defined, dependencies mapped |
| **Approved** | Manu approved, ready for execution |
| **Executing** | Implementation in progress |
| **Review** | Under review (architecture, security, QA) |
| **Validated** | All ACs passed, ready for delivery |
| **Archived** | Delivered and closed |

## Traceability Chain

```
REQ-001
 ├── AC-001
 │   ├── TASK-001
 │   └── TASK-002
 └── AC-002
     └── TASK-003
         └── EVD-001
             └── DEL-001
                 ├── DRR-001
                 ├── IAR-001
                 └── CR-001
```

## Artifact References

| Artifact | ID | Status |
|----------|-----|--------|
| Requirement | REQ-001 | |
| Acceptance | AC-001 | |
| Task | TASK-001 | |
| Evidence | EVD-001 | |
| Delivery | DEL-001 | |
| Review | DRR-001 | |
| Impact | IAR-001 | |
| Change Request | CR-001 | |

## Validation

- [ ] No orphan requirements
- [ ] No orphan acceptance criteria
- [ ] No orphan tasks
- [ ] No broken references
- [ ] Full traceability chain exists
