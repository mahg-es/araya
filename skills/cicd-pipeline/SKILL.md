---
name: cicd-pipeline
description: "Design and generate CI/CD pipeline configurations (GitHub Actions, GitLab CI, or"
---
---

# CI/CD Pipeline

Design and generate CI/CD pipeline configurations (GitHub Actions, GitLab CI, or
similar) that automate build, test, security scan, and deployment workflows.

## What problem this solves
Manual builds and deployments are error-prone, slow, and unreproducible. This
skill produces CI/CD pipelines that run on every push — building, testing,
scanning, and deploying with quality gates that block unsafe changes.

## When to use
When setting up a new repository, adding automation to an existing project,
or when the current CI/CD pipeline fails to enforce quality gates.

## Input
Project language, framework, test runner, deployment target, and security requirements.

## Output
- `.github/workflows/ci.yml`: Build → Test → Security Scan → Quality Gate
- `.github/workflows/cd.yml`: Deploy to staging → Smoke tests → Deploy to production
- `.github/workflows/pr-validation.yml`: PR title check, branch naming, required reviews
- Pipeline README: Diagram, triggers, secrets needed, troubleshooting

## Steps
1. Determine CI platform (default: GitHub Actions for GitHub-hosted repos)
2. Design pipeline stages:

   **CI (on push to any branch):**
   - `lint`: Formatting, linting, type checking (fail fast — 2 min max)
   - `build`: Compile/transpile, verify dependencies (5 min max)
   - `test`: Unit + integration tests with coverage threshold (10 min max)
   - `security-scan`: SAST, dependency audit, secret scanning (5 min max)
   - `quality-gate`: All above must pass before merge allowed

   **CD (on push to main/dev):**
   - `build-image`: Docker build with multi-stage caching
   - `deploy-staging`: Deploy to staging environment
   - `smoke-tests`: Basic health check against staging
   - `deploy-prod`: Manual approval gate → deploy to production
   - `rollback`: Automated rollback if health checks fail

3. Configure caching: dependencies, Docker layers, build artifacts
4. Set up secrets: repository secrets for API keys, tokens, deployment credentials
5. Add branch protection rules in pipeline: required checks before merge
6. Generate PR template with checklist: tests pass, security scan clean, docs updated
7. Document pipeline stages, triggers, and failure recovery in README

## Rules
- CI must complete in under 15 minutes — longer pipelines discourage frequent commits
- Security scanning is mandatory in every pipeline — no bypass for "quick fixes"
- Coverage threshold: 80% minimum for new code; pipeline fails below threshold
- Deployment to production requires manual approval (GitHub Environments protection)
- Docker image tags: use `git sha` for uniqueness, never `latest` for deployments
- Rollback must be automated — if smoke tests fail after deploy, revert to previous image
- Secrets: never echo or log; use GitHub Secrets or equivalent; rotate quarterly
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
