---
name: cloud-provision
description: "Provision cloud infrastructure — AWS, OCI, Hetzner — with Infrastructure as Code"
---
---

# Cloud Provision

Provision cloud infrastructure — AWS, OCI, Hetzner — with Infrastructure as Code
(Terraform/Pulumi). Design VPCs, compute, storage, databases, and networking
for scalable, secure, and cost-optimized cloud environments.

## What problem this solves
Clicking through cloud consoles creates unreproducible, undocumented infrastructure.
This skill codifies cloud resources in Terraform modules — versioned, auditable,
and deployable by CI/CD — supporting multi-cloud strategies across AWS, OCI,
and Hetzner.

## When to use
When deploying to cloud. When migrating between providers. When scaling
infrastructure. When Junia needs to design the platform layer.

## Input
Architecture requirements, cloud provider preference, budget, compliance needs.

## Output
A Terraform module structure with VPC, compute, storage, and database configurations.

## Steps
1. Confirm cloud provider with The Data Professor: [1] AWS, [2] OCI, [3] Hetzner
2. Design network: VPC, subnets (public/private), NAT, security groups
3. Provision compute: ECS/EKS (AWS), OKE (OCI), VMs (Hetzner)
4. Configure storage: S3/OCI Object Storage, encrypted, versioned
5. Deploy database: RDS (AWS), OCI Database, managed Postgres — encrypted, backups
6. Set up IAM: least-privilege roles, service accounts, resource-level permissions
7. Write Terraform with remote state, encryption, and locking

## Rules
- Infrastructure as Code always — zero manual console changes in production
- Remote Terraform state with encryption and locking (S3 + DynamoDB or Terraform Cloud)
- Database: encrypted at rest, automated backups, deletion protection enabled
- Tags on every resource: Environment, Project, Owner, CostCenter, ManagedBy
- Secrets in vault (Secrets Manager, OCI Vault), never in .tf files
- Security groups: deny-all default, explicit allows by port + source CIDR
- Deploy via CI/CD — Terraform plan on PR, manual approval for production apply
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
