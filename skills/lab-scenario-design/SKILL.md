---
name: lab-scenario-design
description: "Design hands-on educational laboratory exercises — realistic business scenarios"
---
---

# Lab Scenario Design

Design hands-on educational laboratory exercises — realistic business scenarios
with technical depth, clear learning objectives, step-by-step instructions,
troubleshooting guides, and student validation checkpoints.

## What problem this solves
Tutorials teach commands; labs teach competence. A well-designed lab places the
student in a realistic scenario with real data, real tools, and real problems
to solve — transforming passive reading into active skill-building. This skill
produces complete lab packages ready for classroom or self-study use.

## When to use
When creating a new training lab. When updating an existing lab for a new
curriculum. When converting lecture material into hands-on exercises.
When The Data Professor has a topic and wants to teach it hands-on.

## Input
Learning objectives, target audience (beginner, practitioner, architect),
technical stack, available infrastructure (Docker, cloud, local).

## Output
A complete lab package:

```
labs/lab_N/
├── README.md              # Briefing: business context, objectives, prerequisites, architecture
├── lab_N.md               # Step-by-step instructions with expected outputs
├── troubleshooting.md     # Common failures → symptom, cause, solution
├── assets/                # Diagrams, screenshots, reference files
└── solution/              # Completed lab for instructor reference
```

### README.md Structure
```markdown
# Lab 5: Bronze Batch Ingestion — Building the Data Foundation

## Business Context
ManTradeCoin processes 500,000+ trades daily from cryptocurrency exchanges.
Before any analysis can happen, raw trade data must be ingested reliably
into our data lake. As a Data Engineer, you'll build the Bronze layer —
the immutable, append-only foundation of our medallion architecture.

## Learning Objectives
After completing this lab, you will be able to:
1. Ingest semi-colon-delimited CSV files using explicit PySpark schemas
2. Apply medallion architecture principles (Bronze = raw, immutable)
3. Add audit columns (`record_source`, `ingestion_timestamp`) to every table
4. Validate row counts to prevent silent data loss
5. Write partitioned Parquet files to the data lake

## Prerequisites
- Completed Lab 4 (Spark Fundamentals) OR understand PySpark DataFrames
- Docker Desktop running (verify with `docker ps`)
- 4GB+ RAM available for Spark driver

## Architecture
┌──────────┐     ┌─────────────────┐     ┌──────────────────┐
│ CSV Files│────▶│ PySpark Job     │────▶│ Bronze Parquet   │
│ (source) │     │ (spark-submit)  │     │ (data/bronze/)   │
└──────────┘     └─────────────────┘     └──────────────────┘

## Setup
1. Clone the repository and navigate to `labs/lab_5/`
2. Run `docker compose up -d` — wait for all 4 containers to be healthy
3. Access Jupyter at `http://localhost:8888` (token: `lab5`)
4. Open `lab_5.ipynb` and follow instructions

## Lab Flow
1. Explore source data (5 min)
2. Define explicit schema (10 min)
3. Ingest with audit columns (15 min)
4. Validate row counts (5 min)
5. Verify Bronze output (10 min)

## Validation
✅ Checkpoint 1: All 500,000 rows in Bronze match source
✅ Checkpoint 2: Every row has `record_source` and `ingestion_timestamp`
✅ Checkpoint 3: Data is partitioned by date (check `data/bronze/` directory)
```

## Validation Checklist (for each lab)
### Beginner (Student 101)
- [ ] Can state the business problem in their own words
- [ ] All prerequisites are explicitly listed with verification steps
- [ ] Every technical term is defined on first use
- [ ] Every command says WHERE to run it (terminal / notebook / IDE)
- [ ] Clear success/failure indicators after each major step
- [ ] Troubleshooting for every command that could fail

### Practitioner (Student 202)
- [ ] All commands produce documented output
- [ ] Runs on clean Docker environment without modification
- [ ] Source data is accessible and correctly formatted
- [ ] Edge cases handled (empty files, missing data, wrong format)

### Architect (Student 909)
- [ ] Architecture explained with diagrams
- [ ] Design decisions justified (why Parquet, why append-only)
- [ ] Scalability discussed (what changes at 100M rows?)
- [ ] Enterprise realism (not a toy example)

## Steps
1. Define learning objectives: what should the student be able to do after this lab?
2. Design the business scenario: realistic problem with real data, not synthetic
3. Structure the lab: setup → exploration → implementation → validation → reflection
4. Write step-by-step instructions: every command, expected output, troubleshooting
5. Add validation checkpoints: after every major step, the student confirms success
6. Test from clean environment: `docker compose down -v && docker compose up --build -d`
7. Validate with three student profiles: beginner (clarity), practitioner (correctness), architect (principles)
8. Package with README (briefing) + lab instructions + troubleshooting + solution

## Rules
- Every lab must state prerequisites explicitly — no hidden assumptions
- Instructions must specify WHERE to execute every command
- Each lab needs: briefing (README.md), instructions (lab_N.md), troubleshooting, solution
- Validate with 3 student profiles: clarity, correctness, architectural principles
- Test from clean environment — "works on my machine" is insufficient
- Business context before technical content — why before how
- Coordinate with Eunice for curriculum fit and Bernabé for pipeline correctness
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
