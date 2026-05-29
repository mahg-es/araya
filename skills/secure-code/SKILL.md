---
name: secure-code
description: "Review source code for security vulnerabilities following OWASP ASVS and CWE Top 25."
---
---

# Secure Code

Review source code for security vulnerabilities following OWASP ASVS and CWE Top 25.
Identify and fix injection flaws, broken authentication, sensitive data exposure,
and other common weaknesses.

## What problem this solves
Developers introduce security bugs. Static analysis tools catch some, but contextual
review catches the rest. This skill performs expert security code review focused on
the most dangerous vulnerability classes, producing actionable fixes with code examples.

## When to use
Before merging any security-sensitive PR, during code review of authentication,
authorization, input handling, or data access code.

## Input
Source code files to review (one or more files).

## Output
A security review report:

```markdown
# Security Code Review: src/auth/login.ts

## Finding S-01: SQL Injection via string concatenation
**Severity:** Critical | **CWE:** CWE-89 | **Line:** 42

### Vulnerable
`const query = "SELECT * FROM users WHERE email = '" + email + "'";`

### Fixed
`const query = "SELECT * FROM users WHERE email = $1";`
`const result = await db.query(query, [email]);`

---

## Finding S-02: Password in log statement
**Severity:** High | **CWE:** CWE-532 | **Line:** 18

### Vulnerable
`console.log("Login attempt:", { email, password });`

### Fixed
`console.log("Login attempt for:", email);`
`// Never log credentials, tokens, or PII`

---

## Summary
- Critical: 1 | High: 1 | Medium: 0 | Low: 0
- Overall: FAIL — Critical finding blocks merge
```

## Steps
1. Read the source code with focus on security-sensitive patterns
2. Check against OWASP Top 10 / CWE Top 25:
   - **Injection**: SQL, NoSQL, command, LDAP, XPath — parameterize all queries
   - **Authentication**: Password handling, token storage, session management
   - **Sensitive Data**: Logging, error messages, client-side storage, URL parameters
   - **Access Control**: Authorization checks, direct object references, missing ownership checks
   - **Input Validation**: Type checking, length limits, character whitelisting, file uploads
   - **Cryptography**: Hardcoded keys, weak algorithms (MD5, SHA1), missing salt/IV
   - **Error Handling**: Stack traces in responses, information leakage via error messages
   - **Configuration**: Debug mode in production, default credentials, missing security headers
3. For each finding, provide:
   - Severity (Critical/High/Medium/Low)
   - CWE reference
   - Vulnerable code snippet with line number
   - Fixed code snippet
   - Why it matters (exploitation scenario, 1-2 sentences)
4. Rate overall: PASS (no Critical/High) or FAIL (blocking issues)
5. Share with Diana for threat model correlation and Valentina for fixes

## Rules
- Every SQL/NoSQL query must use parameterized statements — never string concatenation
- Never log credentials, tokens, PII, or session IDs
- Authentication: passwords hashed with bcrypt (cost ≥ 12), tokens short-lived, refresh rotation
- Error responses must never expose stack traces, database errors, or internal paths
- Input validation: whitelist over blacklist; validate type, length, format, range
- CORS: explicit origins, not `*`; CSP headers on all HTML responses
- A single Critical finding blocks the PR from merging — remediation required first
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
