---
name: cloud-deploy
description: "Provision and deploy cloud infrastructure using Infrastructure as Code (Terraform,"
---
---

# Cloud Deploy

Provision and deploy cloud infrastructure using Infrastructure as Code (Terraform,
Pulumi, or CloudFormation) — designing scalable, secure, and cost-effective cloud
environments with automated deployment pipelines.

## What problem this solves
Manual cloud provisioning leads to snowflake servers, configuration drift, and
"it works on my machine" production failures. IaC codifies infrastructure in
version-controlled files — reproducible, auditable, and automatically deployable
across AWS, OCI, Hetzner, or any cloud provider.

## When to use
When setting up cloud infrastructure for a new project. When migrating between
cloud providers. When the current infrastructure has configuration drift.
When manual console changes are causing production issues.

## Input
Application architecture, scaling requirements, budget constraints, cloud provider
preference (AWS, OCI, Hetzner, or ask The Data Professor).

## Output
```hcl
# terraform/main.tf — AWS Infrastructure for ARAYA API

terraform {
  required_version = ">= 1.8"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "araya-terraform-state"
    key    = "production/terraform.tfstate"
    region = "eu-west-1"
    encrypt = true
  }
}

provider "aws" {
  region = "eu-west-1"
}

# VPC + Networking
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "5.0"

  name = "araya-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false  # One per AZ for HA
  enable_vpn_gateway = false

  tags = {
    Environment = "production"
    Project     = "araya"
    ManagedBy   = "terraform"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "araya-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Service
resource "aws_ecs_service" "api" {
  name            = "araya-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.api.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "main" {
  identifier = "araya-postgres"
  engine     = "postgres"
  engine_version = "16"
  instance_class = "db.t4g.medium"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true

  db_name  = "araya"
  username = "araya_admin"
  password = random_password.db.result  # Generated, stored in Secrets Manager

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 30
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "araya-postgres-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  tags = {
    Environment = "production"
    Project     = "araya"
  }
}
```

## Steps
1. **Choose cloud provider** — if not specified, ask The Data Professor: [1] AWS, [2] OCI, [3] Hetzner
2. **Design network:** VPC, public/private subnets, NAT gateway, security groups
3. **Design compute:** ECS/EKS (AWS), OKE (OCI), or VMs (Hetzner) based on containerization needs
4. **Design data layer:** Managed database (RDS, OCI Database, managed Postgres) with encryption + backups
5. **Implement IaC:** Terraform (multi-cloud) or cloud-native (CloudFormation, OCI Resource Manager)
6. **Configure CI/CD:** GitHub Actions → Terraform plan on PR, apply on merge to main
7. **Set up monitoring:** CloudWatch (AWS), OCI Monitoring, or Prometheus + Grafana (Hetzner)
8. **Document:** architecture diagram, cost estimate, deployment instructions, rollback procedure

## Rules
- Infrastructure must be defined as code — no manual console changes in production
- Terraform state must be stored remotely (S3, Terraform Cloud) with encryption + locking
- Production database: encryption at rest, automated backups, deletion protection, multi-AZ
- Security groups: deny-all default, whitelist only required traffic by port + source
- Tags on every resource: Environment, Project, ManagedBy, CostCenter
- Secrets never in `.tf` files — use AWS Secrets Manager, OCI Vault, or `sops`-encrypted values
- Terraform plan must be reviewed before apply — automated in CI, manual approval for production
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
