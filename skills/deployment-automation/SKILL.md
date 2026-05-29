---
name: deployment-automation
description: "Automate deployments — CI/CD pipelines for static sites, Docker containers,"
---
---

# Deployment Automation

Automate deployments — CI/CD pipelines for static sites, Docker containers,
and cloud infrastructure — ensuring every commit that passes quality gates
reaches production safely and consistently.

## What problem this solves
Manual deployments are error-prone ("I forgot to update the config"), slow
("waiting for the right person"), and unrepeatable. Deployment automation
codifies the deployment process in CI/CD pipelines — every deployment is
identical, auditable, and reversible.

## When to use
When deploying any project to production. When deploying static sites to
GitHub Pages/Cloudflare/Netlify. When deploying Docker containers to
cloud or VPS.

## Input
Project type (static site, Docker, serverless), hosting platform, domain,
environment configuration.

## Output
CI/CD pipeline configuration for automated build, test, deploy, and rollback.

## Steps
1. Determine deployment target: GitHub Pages (static), Cloudflare Pages, Netlify, VPS, cloud
2. Configure CI/CD pipeline:
   - On push to main: build → test → deploy to production
   - On PR: build → test → deploy to preview/staging
3. Set up environment-specific configuration: secrets, env vars, domain names
4. Add deployment verification: health check after deploy, smoke tests
5. Configure rollback: if health checks fail, automatically revert to previous deployment
6. Set up SSL/TLS: auto-renewing certificates via Let's Encrypt or CDN
7. Add deployment notifications: Slack/Discord on success/failure

## Rules
- Deploy from CI/CD, never from local machine — "works on my machine" is not a deployment strategy
- Preview deployments for every PR — see changes before merge
- Health check after every deployment — verify the app is actually running
- Automated rollback if health checks fail — never leave a broken deployment live
- Secrets in CI/CD platform secret store, never in config files
- SSL/TLS mandatory — no production deployment without HTTPS
- Coordinate with Isla (infrastructure) and cicd-pipeline (quality gates)
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
