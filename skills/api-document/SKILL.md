---
name: api-document
description: "Generate comprehensive API documentation — reference docs, getting-started"
---
---

# API Document

Generate comprehensive API documentation — reference docs, getting-started
guides, authentication tutorials, code examples in multiple languages —
turning OpenAPI specs into developer-friendly documentation.

## What problem this solves
APIs without documentation are unusable. Developers spend hours reading source
code to understand endpoints. This skill transforms OpenAPI specifications
into complete, example-rich documentation that developers can follow in minutes.

## When to use
When an API is ready for external or internal developers. When documentation
is outdated or missing. When onboarding new developers.

## Input
OpenAPI specification, authentication details, example use cases.

## Output
API documentation with reference, guides, authentication, code samples,
and error catalog.

## Steps
1. Read the OpenAPI specification for complete endpoint inventory
2. Create getting-started guide: authentication, base URL, first request in 5 minutes
3. Document each endpoint: method, path, parameters, request/response schemas, example
4. Add code examples in 2+ languages (curl, Python, JavaScript minimum)
5. Explain authentication: how to get a token, how to use it, how to refresh
6. Document errors: every status code, what it means, how to fix it
7. Add rate limiting info: limits, headers, what happens when exceeded
8. Generate with Swagger UI, Redoc, or custom static docs

## Rules
- Getting-started guide: developer makes first successful API call in < 5 minutes
- Every endpoint documented with: request example, response example, error responses
- Code examples in at least 2 languages (curl + Python or JavaScript)
- Authentication: step-by-step, not just "add Bearer token"
- Error catalog: every error code explained with fix instructions
- Versioning: document current version, deprecation notices, migration guides
- Coordinate with Priscila (writer) and Valentina (backend developer)
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
