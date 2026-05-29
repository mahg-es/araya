---
name: secrets
description: "Audit, design, and implement secrets management strategies — detecting hardcoded"
---
---

# Secrets

Audit, design, and implement secrets management strategies — detecting hardcoded
credentials, generating secure configuration, and enforcing secrets hygiene across
the development lifecycle.

## What problem this solves
Hardcoded secrets in source code are the #1 cause of credential leaks. This skill
detects exposed secrets, designs secure storage patterns, and generates
configuration that keeps secrets out of code, logs, and version control.

## When to use
When setting up a new project, before any code reaches a shared repository,
during security audits, or when a credential needs to be rotated.

## Input
Project configuration, environment variable patterns, or repository to audit.

## Output
1. **Secrets Audit Report** (if auditing existing code):
   ```markdown
   # Secrets Audit: my-project/
   
   | File | Finding | Severity | Action |
   |------|---------|----------|--------|
   | `.env` tracked by git | AWS keys in VCS history | Critical | Revoke keys, run BFG/git-filter-repo, add `.env` to `.gitignore` |
   | `config.ts:12` | Hardcoded JWT secret | Critical | Move to env var, rotate secret |
   | `docker-compose.yml:8` | Default PostgreSQL password | High | Use `POSTGRES_PASSWORD_FILE` with Docker secrets |
   | `README.md:45` | Example with real API key | High | Replace with placeholder, revoke key |
   ```

2. **Secrets Configuration** (for new projects):
   - `.env.example`: Template with placeholder values
   - `.gitignore`: Ensure `.env`, `*.pem`, `credentials.json` excluded
   - Secret storage strategy based on environment:
     - **Dev**: `.env` file (gitignored) + `.env.example` (committed)
     - **CI/CD**: GitHub Secrets / GitLab CI Variables
     - **Production**: Vault, AWS Secrets Manager, or Kubernetes SealedSecrets
   - Rotation schedule and procedure document

## Steps
1. **Audit phase** — scan for secrets:
   - Check if `.env` or credential files are tracked by git
   - Scan source code for patterns: `password =`, `secret =`, `apiKey =`, `token =`, `BEGIN RSA`, connection strings with credentials
   - Check `docker-compose.yml` for hardcoded passwords
   - Check documentation and README for exposed real values
2. **Remediation phase** — for each finding:
   - Rotate any exposed credential IMMEDIATELY (no delay — assume compromised)
   - Remove from git history with BFG or `git filter-repo`
   - Replace with environment variable reference
   - Add to `.gitignore` if file-based
3. **Design phase** — secrets architecture:
   - All secrets live in environment variables or secret managers
   - `.env.example` committed with `REPLACE_ME` / `your-*-here` placeholders
   - Production secrets never touch developer machines
   - Access logged: who accessed what secret, when, from where
4. Generate README section: "Secrets Management" explaining setup for new developers
5. Share findings with Diana for threat model updates

## Rules
- Any hardcoded secret found in source code → rotate immediately, then fix the code
- `.env` must ALWAYS be in `.gitignore` — verify with `git ls-files .env` before committing
- Use language-specific best practices: `python-dotenv` (Python), `dotenv` (Node), env vars (Go)
- Docker: use secrets mounts or `_FILE` variants; never `environment:` with passwords
- CI/CD: use platform secret stores; secrets must be masked in logs
- Production: secrets rotated every 90 days minimum; on suspicion of exposure, rotate immediately
- Audit before every major release and after any team member departure
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
