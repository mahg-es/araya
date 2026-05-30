# ARAYA Run Record Schema

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| run_id | string | Unique run identifier (RUN-NNNN) |
| objective | string | What this run achieved |
| workflow | string | Type of workflow executed |
| mode | string | Delivery mode (full/standard/quick/review/repair) |
| start_time | ISO8601 | When execution began |
| end_time | ISO8601 | When execution completed |
| participants | array | Agents involved with roles |
| phases | array | Execution phases with status |
| artifacts | array | Files produced |
| evidence | object | Verifiable outputs |
| governance | object | Constitutional compliance |
| status | string | completed/failed/partial |
| outcome | string | SUCCESS/FAILURE/PARTIAL |

## Governance Compliance

Every run must declare:
- branch_compliant: was branch governance followed?
- run_record_exists: is this record persisted?
- reality_verified: can evidence be independently confirmed?
- real_004_compliant: does this run close the REAL-004 gap?

## Usage

Generated automatically by ARAYA execution. For manual runs,
create run.json and run.md in .araya/runs/RUN-NNNN/.
