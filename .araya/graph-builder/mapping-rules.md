# Deterministic Mapping Rules

Each rule transforms an existing artifact relationship into a graph edge.

| Rule ID | Source Pattern | Relationship | Example |
|---------|---------------|-------------|---------|
| MAP-001 | Agent skill declaration in araya.yaml | Agent OWNS Skill | Sonia OWNS pm-plan |
| MAP-002 | Technology preference in knowledge | Organization PREFERS Technology | ARAYA PREFERS Traefik |
| MAP-003 | AC linked to REQ in acceptance.md | AcceptanceCriteria VALIDATES Requirement | AC-001 VALIDATES REQ-001 |
| MAP-004 | Task linked to AC in proposal.md | Task IMPLEMENTS AcceptanceCriteria | TASK-001 IMPLEMENTS AC-001 |
| MAP-005 | Evidence linked to task | Evidence GENERATED Task | EVD-001 GENERATED TASK-001 |
| MAP-006 | Golden trajectory with agent | Agent PARTICIPATED_IN Trajectory | Valentina PARTICIPATED_IN GTR-001 |
| MAP-007 | DRR linked to delivery | DRR REVIEWS Delivery | DRR-001 REVIEWS DEL-001 |
| MAP-008 | IAR linked to DRR | IAR DEPENDS_ON DRR | IAR-001 DEPENDS_ON DRR-001 |
| MAP-009 | CR linked to IAR | CR GENERATED IAR | CR-001 GENERATED IAR-001 |
| MAP-010 | Skill related to capability | Skill RELATED_TO Capability | api-design RELATED_TO api_development |
| MAP-011 | Agent capability declaration | Agent HAS Capability | Diana HAS security_review |
| MAP-012 | Technology used in project | Project USES Technology | PMS USES FastAPI |
| MAP-013 | Constitutional rule governs domain | Rule GOVERNS Domain | GOV-001 GOVERNS governance |
| MAP-014 | Trajectory recommends pattern | Trajectory RECOMMENDS Pattern | GTR-001 RECOMMENDS PAT-003 |
| MAP-015 | Lesson learned from project | Project LEARNED_FROM Lesson | PMS LEARNED_FROM LESSON-005 |
