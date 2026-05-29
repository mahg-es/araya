---
name: student-assessment
description: "Design competency-based student assessments — rubrics, automated grading,"
---
---

# Student Assessment

Design competency-based student assessments — rubrics, automated grading,
knowledge checks, and performance evaluation — measuring learning outcomes
and providing actionable feedback.

## What problem this solves
"Did they learn?" can't be answered by completion rates. Assessment measures
what students can actually DO after training — not just that they clicked
through slides. This skill designs assessments that are fair, measurable, and
automated where possible.

## When to use
When designing training labs and courses. When certifying student competency.
When evaluating curriculum effectiveness.

## Input
Learning objectives, lab content, competency requirements, assessment format.

## Output
Assessment design with rubrics, test items, automated checks, and feedback
mechanisms for each learning objective.

## Steps
1. Map learning objectives to assessment methods: which objectives need practical tests vs. knowledge checks?
2. Design rubrics: what does "competent" look like per objective?
   - Exemplary: exceeds expectations, can explain reasoning
   - Competent: meets all requirements independently
   - Developing: needs guidance or misses edge cases
   - Beginner: cannot complete without substantial help
3. Create assessment items per objective:
   - Practical: build X, fix Y, optimize Z — scored by output correctness
   - Knowledge: multiple choice, short answer — scored by answer matching
   - Reflection: explain your approach — scored by rubric
4. Automate grading where possible: test suites, output validation, schema checks
5. Design feedback: specific, actionable, encouraging — "In step 3, your JOIN missed the date filter. Add it and re-run."
6. Validate assessment: test with actual students, check for fairness and clarity

## Rules
- Assess what you teach — no testing concepts not covered in material
- Practical assessments > knowledge checks — doing proves learning better than recalling
- Rubrics must be specific: "uses proper indexing" not "good code quality"
- Automated grading where possible — consistent, immediate, scalable
- Feedback must be actionable: "fix X by doing Y" not "needs improvement"
- Passing threshold defined before assessment — 80% minimum for competency
- Coordinate with Eunice (lab design) and training-module (course structure)
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
