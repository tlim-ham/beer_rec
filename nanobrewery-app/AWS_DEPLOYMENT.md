# AWS Deployment Guide

This document describes how to build, containerize, and deploy the Nanobrewery app to AWS using ECR and ECS Fargate.

---

## Architecture

```
Browser
  └─► ALB (Application Load Balancer)
         ├─ /api/*  /health  /docs  /redoc  ──► beer-backend ECS service (port 8002)
         └─ /*                               ──► beer-frontend ECS service (port 80)
```

- **Frontend** — React/Vite app built into static files, served by nginx
- **Backend** — FastAPI app running under Uvicorn, includes XGBoost model and Gemini API integration
- **Two separate ECR repositories**, one image per service
- **Single ALB** with path-based routing and HTTPS via ACM certificate
- **ALB lives in dedicated public subnets** (IGW-only route table) separate from ECS task subnets

---

## Prerequisites

- AWS CLI configured (`aws configure`)
- Docker Desktop running
- An AWS account with permissions for ECR, ECS, ALB, ACM, Secrets Manager, CloudWatch, IAM, and EC2
- A domain name with DNS managed by your institution or Route 53

---

## 1. Store the Gemini API Key

Never pass secrets as plain environment variables. Store the key in Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name beer-rec/gemini-api-key \
  --secret-string "your_actual_gemini_api_key_here"
```

Note the full ARN returned (including the 6-character suffix). You will need it in the task definition.

---

## 2. Create ECR Repositories

```bash
aws ecr create-repository --repository-name beer-backend
aws ecr create-repository --repository-name beer-frontend
```

---

## 3. Create the ECS IAM Execution Role

```bash
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version":"2012-10-17",
    "Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},
    "Action":"sts:AssumeRole"}]}'

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
```

---

## 4. Create CloudWatch Log Groups

ECS requires these to exist before tasks can start — it will not create them automatically.

```bash
aws logs create-log-group --log-group-name /ecs/beer-backend
aws logs create-log-group --log-group-name /ecs/beer-frontend
```

---

## 5. Create the ECS Cluster

```bash
aws ecs create-cluster --cluster-name beer-rec --capacity-providers FARGATE
```

---

## 6. Enable VPC DNS Hostnames

Required for Fargate tasks to resolve AWS service endpoints (ECR, Secrets Manager).

```bash
aws ec2 modify-vpc-attribute \
  --vpc-id <YOUR_VPC_ID> \
  --enable-dns-hostnames
```

---

## 7. Create Dedicated ALB Subnets

The ALB must be in subnets with an IGW-only route table. If your VPC has routes to a transit gateway or VPN for campus/private networks, using shared subnets causes asymmetric routing that breaks connections from those networks.

```bash
# Create two subnets in different AZs (adjust CIDRs to fit your VPC)
aws ec2 create-subnet \
  --vpc-id <YOUR_VPC_ID> \
  --cidr-block <CIDR_1> \
  --availability-zone <AZ_1>

aws ec2 create-subnet \
  --vpc-id <YOUR_VPC_ID> \
  --cidr-block <CIDR_2> \
  --availability-zone <AZ_2>

# Create a route table with only the IGW route
aws ec2 create-route-table --vpc-id <YOUR_VPC_ID>

aws ec2 create-route \
  --route-table-id <NEW_RTB_ID> \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id <YOUR_IGW_ID>

# Associate both ALB subnets with the new route table
aws ec2 associate-route-table --route-table-id <NEW_RTB_ID> --subnet-id <ALB_SUBNET_1>
aws ec2 associate-route-table --route-table-id <NEW_RTB_ID> --subnet-id <ALB_SUBNET_2>
```

---

## 8. Build and Push Docker Images

Build context for both Dockerfiles is the `nanobrewery-app/` directory.

```bash
# Authenticate with ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Backend
docker build -f Dockerfile.backend -t beer-backend .
docker tag beer-backend:latest \
  <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/beer-backend:latest
docker push \
  <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/beer-backend:latest

# Frontend — VITE_API_BASE_URL is baked into the JS bundle at build time.
# Use your final public URL (domain or ALB DNS name).
# Rebuild this image whenever the URL changes.
docker build -f Dockerfile.frontend \
  --build-arg VITE_API_BASE_URL=https://your-domain.edu \
  -t beer-frontend .
docker tag beer-frontend:latest \
  <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/beer-frontend:latest
docker push \
  <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/beer-frontend:latest
```

---

## 9. Register Task Definitions

Fill in your values in `backend-task.json` and `frontend-task.json`, then register them:

```bash
aws ecs register-task-definition --cli-input-json file://backend-task.json
aws ecs register-task-definition --cli-input-json file://frontend-task.json
```

Placeholders to replace in the task definition files:

| Placeholder | Value |
|---|---|
| `<YOUR_ACCOUNT_ID>` | Your 12-digit AWS account ID |
| `<GEMINI_SECRET_ARN>` | Full ARN from step 1 (including 6-character suffix) |
| `<YOUR_FRONTEND_URL>` | e.g. `https://your-domain.edu` |

---

## 10. Create the ALB and Target Groups

```bash
# Create ALB in the dedicated ALB subnets from step 7
aws elbv2 create-load-balancer \
  --name beer-rec-alb \
  --subnets <ALB_SUBNET_1> <ALB_SUBNET_2> \
  --security-groups <YOUR_SG_ID>

# Target groups (IP mode required for Fargate)
aws elbv2 create-target-group \
  --name beer-backend-tg \
  --protocol HTTP --port 8002 \
  --target-type ip --vpc-id <YOUR_VPC_ID> \
  --health-check-path /health

aws elbv2 create-target-group \
  --name beer-frontend-tg \
  --protocol HTTP --port 80 \
  --target-type ip --vpc-id <YOUR_VPC_ID> \
  --health-check-path /health

# HTTP listener — default to frontend, redirect to HTTPS
aws elbv2 create-listener \
  --load-balancer-arn <ALB_ARN> \
  --protocol HTTP --port 80 \
  --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}"

# HTTPS listener — requires ACM certificate (see step 11)
aws elbv2 create-listener \
  --load-balancer-arn <ALB_ARN> \
  --protocol HTTPS --port 443 \
  --certificates CertificateArn=<ACM_CERT_ARN> \
  --default-actions Type=forward,TargetGroupArn=<FRONTEND_TG_ARN>

# Path rule to route API traffic to the backend on the HTTPS listener
aws elbv2 create-rule \
  --listener-arn <HTTPS_LISTENER_ARN> \
  --priority 10 \
  --conditions '[{"Field":"path-pattern","Values":["/api/*","/health","/docs","/redoc"]}]' \
  --actions Type=forward,TargetGroupArn=<BACKEND_TG_ARN>
```

---

## 11. SSL Certificate (ACM)

```bash
aws acm request-certificate \
  --domain-name your-domain.edu \
  --validation-method DNS
```

Provide the DNS validation CNAME record to whoever manages your DNS. Once validated the certificate status changes to `ISSUED`. Keep the validation CNAME in DNS permanently — ACM uses it for automatic renewal.

---

## 12. Create ECS Services

```bash
aws ecs create-service \
  --cluster beer-rec \
  --service-name beer-backend \
  --task-definition beer-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<ECS_SUBNET_1>,<ECS_SUBNET_2>],securityGroups=[<YOUR_SG_ID>],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<BACKEND_TG_ARN>,containerName=beer-backend,containerPort=8002"

aws ecs create-service \
  --cluster beer-rec \
  --service-name beer-frontend \
  --task-definition beer-frontend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<ECS_SUBNET_1>,<ECS_SUBNET_2>],securityGroups=[<YOUR_SG_ID>],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<FRONTEND_TG_ARN>,containerName=beer-frontend,containerPort=80"
```

---

## 13. DNS

Add a CNAME record pointing your domain to the ALB DNS name:

```
your-domain.edu  →  beer-rec-alb-xxxxxxxxxx.us-east-1.elb.amazonaws.com
```

---

## Updating the Application

### Backend code changed
```bash
docker build -f Dockerfile.backend -t beer-backend .
docker tag beer-backend:latest <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/beer-backend:latest
docker push <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/beer-backend:latest
aws ecs update-service --cluster beer-rec --service beer-backend --force-new-deployment
```

### Frontend code changed
```bash
docker build -f Dockerfile.frontend \
  --build-arg VITE_API_BASE_URL=https://your-domain.edu \
  -t beer-frontend .
docker tag beer-frontend:latest <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/beer-frontend:latest
docker push <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/beer-frontend:latest
aws ecs update-service --cluster beer-rec --service beer-frontend --force-new-deployment
```

### Environment variable or task definition changed
```bash
# Edit backend-task.json or frontend-task.json, then:
aws ecs register-task-definition --cli-input-json file://backend-task.json
aws ecs update-service \
  --cluster beer-rec \
  --service beer-backend \
  --task-definition beer-backend:<NEW_REVISION> \
  --force-new-deployment
```

Always specify `--task-definition beer-backend:<REVISION>` explicitly — ECS does not automatically promote a service to the latest task definition revision.

---

## Local Testing with Docker Compose

```bash
cp .env.example .env
# Add your GEMINI_API_KEY to .env

docker compose up --build
# Frontend: http://localhost
# Backend API: http://localhost:8002
# API docs: http://localhost:8002/docs
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Tasks fail with `log group does not exist` | CloudWatch log groups not created | `aws logs create-log-group --log-group-name /ecs/beer-backend` |
| Tasks fail with `ECR i/o timeout` | `enableDnsHostnames` disabled on VPC | `aws ec2 modify-vpc-attribute --vpc-id <VPC> --enable-dns-hostnames` |
| Tasks fail with `ECR i/o timeout` (still) | Transient ECR connectivity issue | Re-run `--force-new-deployment` |
| "Failed to generate recommendations" | `VITE_API_BASE_URL` baked in with wrong URL | Rebuild frontend image with correct URL |
| CORS errors in browser | `ALLOWED_ORIGINS` doesn't match frontend URL | Update env var in task definition, re-register, redeploy |
| App works off-campus but not on-campus | Asymmetric routing via transit gateway | Move ALB to dedicated subnets with IGW-only route table |
| New task definition not picked up | `update-service` without `--task-definition` flag | Always pass `--task-definition <family>:<revision>` explicitly |
| ACM certificate not renewing | Validation CNAME removed from DNS | Re-add the ACM DNS validation CNAME record |

---

## Key Constraints

- **Sessions are in-memory** — the backend stores chat sessions in a Python dict. Keep `desired-count 1` on the backend service; scaling to multiple tasks will cause chat sessions to fail when requests hit different tasks. A Redis-backed session store would be needed to scale beyond one task.
- **`VITE_API_BASE_URL` is a build-time value** — Vite bakes it into the JavaScript bundle. Rebuild the frontend image any time the backend URL changes.
- **`GEMINI_API_KEY` must never be in the image** — always inject it at runtime via Secrets Manager and the task definition `secrets` field.
