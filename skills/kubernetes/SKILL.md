---
name: kubernetes
description: "Design Kubernetes manifests, Helm charts, and orchestration strategies for deploying"
---
---

# Kubernetes

Design Kubernetes manifests, Helm charts, and orchestration strategies for deploying
and scaling containerized applications in production clusters.

## What problem this solves
Docker Compose works for development; Kubernetes handles production — scaling,
rolling updates, self-healing, service discovery, and resource management across
clusters. This skill produces production-grade K8s manifests.

## When to use
When deploying to production, when a service needs auto-scaling, when designing
multi-service architectures with service mesh requirements, or when migrating
from Docker Compose to Kubernetes.

## Input
Docker Compose configuration or service architecture description.

## Output
- `k8s/base/`: Namespace, Deployments, Services, ConfigMaps, Secrets
- `k8s/overlays/`: Environment-specific overlays (dev, staging, prod)
- `k8s/helm/`: Helm chart (optional, for complex services)
- `k8s/README.md`: Deployment instructions and architecture diagram

## Steps
1. Inventory services: replicas needed, CPU/memory requests, ports, dependencies
2. Design namespace strategy: one namespace per project/environment
3. Create base manifests (Kustomize structure):
   - `namespace.yaml`: Project namespace
   - `deployment.yaml`: Per-service Deployment with resource limits
   - `service.yaml`: ClusterIP (internal) or LoadBalancer (external)
   - `configmap.yaml`: Non-sensitive configuration
   - `secret.yaml`: SealedSecrets or ExternalSecrets references (no plaintext)
4. Add probes:
   - `livenessProbe`: Restart if unresponsive
   - `readinessProbe`: Remove from service if not ready
   - `startupProbe`: Allow slow-starting services extra time
5. Configure resource management:
   - `requests`: Guaranteed minimum (50-200m CPU, 128-512Mi memory)
   - `limits`: Hard cap (500m-2 CPU, 256Mi-2Gi memory)
6. Set pod disruption budgets for production services (min 1 available)
7. Create overlays for dev/staging/prod — different replica counts, resource limits
8. Add network policies: deny-all by default, allow specific ingress/egress
9. Document deployment: `kubectl apply -k k8s/overlays/prod`

## Rules
- Every Deployment must have liveness + readiness probes
- Resource requests = limits in dev; requests < limits in prod (burstable)
- Never store plaintext secrets in manifests — use SealedSecrets or ExternalSecrets
- Pod disruption budget for any service with replicas > 1
- NetworkPolicy deny-all default, then whitelist only required traffic
- Use Kustomize (or Helm) — never raw kubectl apply with env-specific values
- Container images must use digests, not tags, in production manifests
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
