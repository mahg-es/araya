---
name: docker
description: "Design and generate Dockerfiles, docker-compose configurations, and container"
---
---

# Docker

Design and generate Dockerfiles, docker-compose configurations, and container
strategies for development and production environments.

## What problem this solves
Applications need consistent, reproducible runtime environments. This skill
produces Docker configurations that work on any machine — from a clean OS install
to CI/CD pipelines — with proper layering, security, and multi-service orchestration.

## When to use
When setting up a new project, adding containerization to an existing project,
debugging Docker build issues, or optimizing image size and build times.

## Input
Project requirements: language, runtime, dependencies, services needed, ports,
volumes, and environment variables.

## Output
- `Dockerfile`: Multi-stage build with optimized layers
- `docker-compose.yml`: Multi-service orchestration with health checks
- `.dockerignore`: Exclude unnecessary files from context
- Optional: `docker-compose.override.yml` for development overrides

## Steps
1. Analyze the project: language, framework, database, caching, any external services
2. Choose base image: prefer official slim/alpine variants; avoid `latest` tags
3. Design multi-stage build:
   - Stage 1 (builder): install dependencies, compile
   - Stage 2 (runtime): copy artifacts only, minimal OS footprint
4. Configure security:
   - Run as non-root user (`USER 1000:1000`)
   - No secrets in image layers (use build args or secrets mounts)
   - Pin exact image digests in production
5. Design docker-compose:
   - One service per container
   - Health checks for every service
   - Named volumes for persistent data (never bind-mount in production)
   - Network isolation between services that don't need to communicate
6. Generate `.dockerignore` excluding: `node_modules`, `.git`, `*.md`, `.env`, `__pycache__`
7. Validate: `docker compose up --build -d` from clean state, all containers healthy
8. Document: include startup instructions, port mappings, and environment variables

## Rules
- Multi-stage builds always — builder and runtime must be separate stages
- Never run as root in production containers
- Pinned versions: `node:22.12-alpine`, not `node:latest`
- Health checks on every service in docker-compose
- `.env` files must be in `.gitignore` and `.dockerignore` — provide `.env.example` instead
- Image size target: < 200MB for interpreted languages, < 50MB for compiled
- Test with `docker compose down -v && docker compose up --build -d` for reproducibility
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
