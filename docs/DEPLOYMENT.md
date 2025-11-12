# 🚀 Guia de Deployment - Plataforma de Gestão Imobiliária 360

## Visão Geral

Este documento detalha todos os processos de deployment da plataforma, desde o ambiente local até produção.

## 📋 Pré-requisitos

### Desenvolvimento Local
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+ (ou via Docker)
- Redis 7+ (ou via Docker)
- Git

### Produção
- Conta AWS (recomendado)
- Domain registrado
- Certificado SSL
- Credenciais de APIs externas

## 🏠 Desenvolvimento Local

### Opção 1: Docker Compose (Recomendado)

```bash
# 1. Clone o repositório
git clone <repo-url>
cd crmob360-claudecode

# 2. Configure variáveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Inicie todos os serviços
docker-compose up -d

# 4. Verifique os logs
docker-compose logs -f

# 5. Acesse:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:4000
# - API Docs: http://localhost:4000/api/docs
```

### Opção 2: Manual (Desenvolvimento)

#### Backend
```bash
cd backend

# Instalar dependências
npm install

# Configurar .env
cp .env.example .env
# Edite .env com suas configurações

# Rodar migrations
npm run migration:run

# Iniciar em modo dev
npm run start:dev
```

#### Frontend
```bash
cd frontend

# Instalar dependências
npm install

# Configurar .env
cp .env.example .env.local
# Edite .env.local

# Iniciar em modo dev
npm run dev
```

## 🧪 Testes

### Backend
```bash
cd backend

# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend
```bash
cd frontend

# Testes
npm run test

# Type checking
npm run type-check

# Lint
npm run lint
```

## 🏗️ Build para Produção

### Backend
```bash
cd backend
npm run build

# Inicia versão de produção
npm run start:prod
```

### Frontend
```bash
cd frontend
npm run build

# Inicia versão de produção
npm start
```

## ☁️ Deploy em Cloud (AWS)

### Arquitetura Recomendada

```
┌─────────────────────────────────────────────────────────┐
│                     CloudFront (CDN)                     │
└──────────────┬──────────────────────────────────────────┘
               │
        ┌──────┴───────┐
        │              │
   ┌────▼────┐    ┌───▼────┐
   │   S3    │    │  ALB   │
   │Frontend │    │Backend │
   └─────────┘    └───┬────┘
                      │
            ┌─────────┴─────────┐
            │                   │
      ┌─────▼─────┐      ┌─────▼─────┐
      │  ECS/EKS  │      │  ECS/EKS  │
      │ (Backend) │      │ (Workers) │
      └─────┬─────┘      └─────┬─────┘
            │                  │
    ┌───────┴──────────────────┴───────┐
    │                                  │
┌───▼────┐                      ┌──────▼─────┐
│   RDS  │                      │ElastiCache │
│Postgres│                      │   Redis    │
└────────┘                      └────────────┘
```

### Passo a Passo (AWS ECS)

#### 1. Preparar Infraestrutura

```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar credenciais
aws configure
```

#### 2. Criar RDS PostgreSQL

```bash
# Via AWS Console ou CLI
aws rds create-db-instance \
  --db-instance-identifier crmob360-prod-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16.1 \
  --allocated-storage 100 \
  --storage-type gp3 \
  --master-username admin \
  --master-user-password <STRONG_PASSWORD> \
  --vpc-security-group-ids <SG_ID> \
  --db-subnet-group-name <SUBNET_GROUP> \
  --backup-retention-period 7 \
  --multi-az
```

#### 3. Criar ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id crmob360-prod-redis \
  --engine redis \
  --cache-node-type cache.t3.medium \
  --num-cache-nodes 1 \
  --engine-version 7.0
```

#### 4. Build e Push Docker Images

```bash
# Login no ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Create repositories
aws ecr create-repository --repository-name crmob360/backend
aws ecr create-repository --repository-name crmob360/frontend

# Build e push backend
cd backend
docker build -f ../docker/Dockerfile.backend -t crmob360/backend:latest .
docker tag crmob360/backend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/crmob360/backend:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/crmob360/backend:latest

# Build e push frontend
cd ../frontend
docker build -f ../docker/Dockerfile.frontend -t crmob360/frontend:latest .
docker tag crmob360/frontend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/crmob360/frontend:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/crmob360/frontend:latest
```

#### 5. Criar ECS Cluster

```bash
aws ecs create-cluster --cluster-name crmob360-prod
```

#### 6. Task Definitions

**Backend Task Definition** (`backend-task-def.json`):
```json
{
  "family": "crmob360-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/crmob360/backend:latest",
      "portMappings": [
        {
          "containerPort": 4000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "4000" }
      ],
      "secrets": [
        {
          "name": "DB_HOST",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<ACCOUNT_ID>:secret:crmob360/db_host"
        },
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<ACCOUNT_ID>:secret:crmob360/db_password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/crmob360-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:4000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register task:
```bash
aws ecs register-task-definition --cli-input-json file://backend-task-def.json
```

#### 7. Criar ECS Service

```bash
aws ecs create-service \
  --cluster crmob360-prod \
  --service-name backend \
  --task-definition crmob360-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET1>,<SUBNET2>],securityGroups=[<SG_ID>],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<TG_ARN>,containerName=backend,containerPort=4000"
```

#### 8. Configurar Application Load Balancer

```bash
# Criar ALB
aws elbv2 create-load-balancer \
  --name crmob360-alb \
  --subnets <SUBNET1> <SUBNET2> \
  --security-groups <SG_ID> \
  --scheme internet-facing

# Criar Target Group
aws elbv2 create-target-group \
  --name crmob360-backend-tg \
  --protocol HTTP \
  --port 4000 \
  --vpc-id <VPC_ID> \
  --target-type ip \
  --health-check-path /health

# Criar Listener
aws elbv2 create-listener \
  --load-balancer-arn <ALB_ARN> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<CERT_ARN> \
  --default-actions Type=forward,TargetGroupArn=<TG_ARN>
```

#### 9. Deploy Frontend (S3 + CloudFront)

```bash
# Criar bucket S3
aws s3 mb s3://crmob360-frontend

# Configurar bucket para hosting
aws s3 website s3://crmob360-frontend \
  --index-document index.html \
  --error-document 404.html

# Build e upload frontend
cd frontend
npm run build
aws s3 sync .next/static s3://crmob360-frontend/static --acl public-read
aws s3 sync public s3://crmob360-frontend/public --acl public-read

# Criar CloudFront distribution
aws cloudfront create-distribution --cli-input-json file://cloudfront-config.json

# Invalidate cache após deploy
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

## 🔄 Migrations

### Criar nova migration
```bash
cd backend
npm run migration:generate -- src/database/migrations/MigrationName
```

### Rodar migrations em produção
```bash
# Via ECS Task (one-off)
aws ecs run-task \
  --cluster crmob360-prod \
  --task-definition crmob360-backend \
  --overrides '{"containerOverrides":[{"name":"backend","command":["npm","run","migration:run"]}]}'
```

## 📊 Monitoramento

### CloudWatch Logs
```bash
# Ver logs do backend
aws logs tail /ecs/crmob360-backend --follow

# Criar alarmes
aws cloudwatch put-metric-alarm \
  --alarm-name crmob360-high-cpu \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --period 300 \
  --statistic Average \
  --threshold 80.0
```

### Application Performance Monitoring (APM)
Recomenda-se integrar:
- **Sentry** para error tracking
- **DataDog** ou **New Relic** para APM
- **Prometheus + Grafana** para métricas customizadas

## 🔐 Segurança

### Secrets Management
```bash
# Criar secrets no AWS Secrets Manager
aws secretsmanager create-secret \
  --name crmob360/db_password \
  --secret-string "super-secure-password"

aws secretsmanager create-secret \
  --name crmob360/jwt_secret \
  --secret-string "super-secure-jwt-secret"
```

### Configurar WAF
```bash
# Criar Web ACL
aws wafv2 create-web-acl \
  --name crmob360-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --rules file://waf-rules.json

# Associar ao ALB
aws wafv2 associate-web-acl \
  --web-acl-arn <WAF_ARN> \
  --resource-arn <ALB_ARN>
```

## 🔄 CI/CD Pipeline

O pipeline está configurado em `.github/workflows/ci-cd.yml`:

1. **Push to `develop`**: Deploy automático para Staging
2. **Push to `main`**: Deploy manual para Production (requer aprovação)
3. **Pull Requests**: Roda testes e build

### Aprovar Deploy para Produção
1. Acesse GitHub Actions
2. Selecione o workflow
3. Clique em "Review deployments"
4. Aprove para produção

## 🆘 Rollback

### Via AWS Console
1. ECS > Clusters > crmob360-prod > Services > backend
2. Update Service
3. Force new deployment com task definition anterior

### Via CLI
```bash
# Listar task definitions
aws ecs list-task-definitions --family-prefix crmob360-backend

# Update service para versão anterior
aws ecs update-service \
  --cluster crmob360-prod \
  --service backend \
  --task-definition crmob360-backend:PREVIOUS_VERSION \
  --force-new-deployment
```

## 📝 Checklist de Deploy

### Pré-Deploy
- [ ] Todos os testes passando
- [ ] Migrations testadas em staging
- [ ] Variáveis de ambiente configuradas
- [ ] Secrets atualizados
- [ ] Backup do banco de dados

### Deploy
- [ ] Build das imagens Docker
- [ ] Push para registry
- [ ] Update task definitions
- [ ] Run migrations
- [ ] Deploy services
- [ ] Verificar health checks

### Pós-Deploy
- [ ] Smoke tests
- [ ] Verificar logs
- [ ] Monitorar métricas
- [ ] Testar funcionalidades críticas
- [ ] Notificar equipe

## 📞 Suporte

Em caso de problemas durante deploy:
1. Verificar logs no CloudWatch
2. Verificar health checks
3. Consultar documentação interna
4. Contatar DevOps team

---

**Versão**: 2.0
**Última atualização**: Novembro 2025
