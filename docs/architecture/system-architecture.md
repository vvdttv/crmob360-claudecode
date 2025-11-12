# Arquitetura do Sistema - Plataforma de Gestão Imobiliária 360

## Visão Geral da Arquitetura

### Princípios Arquiteturais

1. **Monólito Modular**: Arquitetura modular que mantém todos os módulos em um único deployment, mas com separação clara de responsabilidades e possibilidade de evolução para microsserviços.

2. **Event-Driven**: Comunicação entre módulos via eventos (NestJS EventEmitter) para desacoplamento.

3. **LGPD-First**: Todas as operações de dados passam pelo "Master Switch" do Módulo 13.

4. **Multi-Tenancy**: Isolamento completo de dados por empresa (company_id).

5. **API-First**: Toda funcionalidade exposta via API REST/GraphQL.

## Stack Tecnológica

### Backend
```
┌─────────────────────────────────────────┐
│         NestJS Application              │
├─────────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐   │
│  │ M1  │  │ M5  │  │ M9  │  │ M13 │   │
│  │ CRM │  │Prop │  │Fin  │  │LGPD │   │
│  └─────┘  └─────┘  └─────┘  └─────┘   │
│  ... 13 Módulos Totais ...             │
├─────────────────────────────────────────┤
│  TypeORM │ Bull Queue │ Event Emitter  │
└─────────────────────────────────────────┘
           │           │           │
     ┌─────┴───┐  ┌───┴────┐  ┌──┴───┐
     │PostgreSQL│  │ Redis  │  │  S3  │
     └──────────┘  └────────┘  └──────┘
```

### Frontend
```
┌──────────────────────────────────────────┐
│        Next.js 14 (App Router)           │
├──────────────────────────────────────────┤
│  ┌────────────┐  ┌──────────────────┐   │
│  │ Dashboard  │  │ Portal Cliente   │   │
│  │ (Admin)    │  │ Portal Proprietá│   │
│  └────────────┘  └──────────────────┘   │
├──────────────────────────────────────────┤
│ React Query │ Zustand │ TailwindCSS     │
└──────────────────────────────────────────┘
```

## Fluxo de Dados Críticos

### 1. Fluxo de Captura de Lead com LGPD

```
┌─────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Site   │─────▶│ M13 LGPD │─────▶│  M4 IA   │─────▶│  M1 CRM  │
│Formulário│      │Consent   │      │Chatbot   │      │  Lead    │
└─────────┘      └──────────┘      └──────────┘      └──────────┘
                       │
                       ▼
              ┌──────────────┐
              │consent_logs  │
              │(auditável)   │
              └──────────────┘
```

**Passo a passo:**
1. Usuário preenche formulário no Site (M3)
2. Antes de salvar, sistema consulta M13 para obter termo de consentimento ativo
3. Usuário aceita termos → M13 cria registro em `consent_logs` com hash SHA256
4. Lead é criado no M1 com referência ao consent_log
5. M4 (Chatbot) VERIFICA permissões antes de enviar mensagens automatizadas
6. Se `permission_whatsapp_marketing = false`, pula envio automático

### 2. Fluxo de Matching e Automação

```
Lead criado (M1)
    │
    ▼
AI Scoring (M4) ────┐
    │               │
    ▼               ▼
Matching (M1+M5) ──▶ Notification
    │
    ▼
Automation Journey (M2)
    │
    ▼
M13: Check permissions
    │
    ├─ ✓ Can send email? ──▶ Send
    └─ ✗ No permission ────▶ Skip
```

### 3. Fluxo de Fechamento e Comissão

```
Proposta Aceita (M8.2)
    │
    ├──▶ Gatilho: Process Template (M6)
    │       └─ Tarefas automáticas (contrato, vistoria, etc)
    │
    ├──▶ Cálculo de Comissão (M8.4)
    │       └─ Motor de Regras aplica distribuição
    │           └─ Cria lançamentos em M9 (Financeiro)
    │
    └──▶ Atualiza Pipeline (M1)
            └─ Move para "Fechado"
```

## Estrutura de Módulos

### Módulos Core (Infraestrutura)
- **M13 - LGPD**: Base de conformidade, "Master Switch"
- **M12 - Platform**: Autenticação, usuários, permissões, multi-tenancy

### Módulos Front-Office
- **M1 - CRM**: Leads, funil, omnichannel, atividades
- **M2 - Marketing**: Email, automação, segmentação
- **M3 - Site Builder**: Construtor de sites integrado ao estoque

### Módulos de Inteligência
- **M4 - IA**: Scoring, chatbot, descrições, precificação
- **M5 - Properties**: Estoque, multipublicação, vistoria digital
- **M6 - Processes**: Workflows, tarefas, colaboração

### Módulos Back-Office
- **M7 - Owner**: Portal e relatórios para proprietários
- **M8 - Admin**: Contratos, propostas, comissões
- **M9 - Financial**: Contas, DRE, boletos, conciliação

### Módulos de Análise
- **M10 - Mobile**: API específica para apps móveis
- **M11 - BI**: Dashboards, relatórios, dados de mercado

## Comunicação Entre Módulos

### Padrão de Eventos

```typescript
// M1 (CRM) emite evento quando lead muda de etapa
@Injectable()
export class LeadService {
  constructor(private eventEmitter: EventEmitter2) {}

  async moveStage(leadId: string, newStageId: string) {
    // ... lógica de movimentação

    this.eventEmitter.emit('lead.stage.changed', {
      leadId,
      oldStageId,
      newStageId,
      timestamp: new Date()
    });
  }
}

// M6 (Processes) escuta e reage
@Injectable()
export class ProcessAutomationService {
  @OnEvent('lead.stage.changed')
  async handleStageChange(payload) {
    // Busca template de processo com trigger = stage_change
    // Inicia nova instância de processo automaticamente
  }
}

// M2 (Marketing) também escuta
@Injectable()
export class JourneyExecutionService {
  @OnEvent('lead.stage.changed')
  async handleStageChange(payload) {
    // Busca jornadas de automação
    // Envia email, adiciona tag, etc
  }
}
```

### Padrão de LGPD "Master Switch"

```typescript
// M2 (Marketing) SEMPRE consulta M13 antes de enviar
@Injectable()
export class EmailCampaignService {
  constructor(
    private lgpdService: LgpdPermissionService
  ) {}

  async sendCampaign(campaignId: string) {
    const recipients = await this.getRecipients(campaignId);

    // FILTRO OBRIGATÓRIO
    const allowedRecipients = await Promise.all(
      recipients.map(async (lead) => {
        const hasPermission = await this.lgpdService.checkPermission(
          lead.id,
          'lead',
          'email_marketing'
        );
        return hasPermission ? lead : null;
      })
    ).then(results => results.filter(Boolean));

    // Envia apenas para quem tem permissão
    return this.sendToRecipients(allowedRecipients);
  }
}
```

## Segurança e Autenticação

### JWT Auth Flow

```
1. POST /api/auth/login
   ├─ Valida credenciais (bcrypt)
   ├─ Gera Access Token (exp: 1h)
   ├─ Gera Refresh Token (exp: 7d)
   └─ Retorna ambos

2. Requests subsequentes
   └─ Header: Authorization: Bearer <access_token>
       └─ Guard valida: expiração, assinatura, company_id

3. Token expirado?
   └─ POST /api/auth/refresh
       └─ Usa refresh_token para gerar novo access_token
```

### Permissões Granulares

```typescript
// Decorador customizado para checar permissões
@RequirePermissions('leads.view', 'leads.edit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Put('/leads/:id')
async updateLead(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
  // Só executa se usuário tiver ambas permissões
}
```

### Multi-Tenancy

Todas as queries são automaticamente filtradas por `company_id`:

```typescript
@Injectable()
export class CompanyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const companyId = request.user.companyId;

    // Injeta company_id em TODAS as queries
    request.companyId = companyId;

    return next.handle();
  }
}
```

## Integrações Externas

### WhatsApp Business API (M1.2 - Omnichannel)
```
┌──────────────┐      ┌────────────────┐      ┌──────────┐
│WhatsApp Cloud│─────▶│  Webhook       │─────▶│ M1 CRM   │
│   API        │◀─────│  /webhooks/wa  │◀─────│Conversation│
└──────────────┘      └────────────────┘      └──────────┘
```

### Portais Imobiliários (M5.2 - Multipublicação)
```
┌──────────────┐      ┌────────────────┐      ┌──────────┐
│  ZAP API     │◀─────│  Bull Queue    │◀─────│ M5       │
│  Imóvelweb   │      │  Job: publish  │      │Properties│
└──────────────┘      └────────────────┘      └──────────┘
```

### Gateway de Pagamento (M9.3 - Boletos)
```
┌──────────────┐      ┌────────────────┐      ┌──────────┐
│  iugu API    │◀─────│  M9 Financial  │─────▶│ Webhook  │
│  Asaas API   │      │  generateBoleto│◀─────│  /payment│
└──────────────┘      └────────────────┘      └──────────┘
```

### OpenAI API (M4 - IA)
```
┌──────────────┐      ┌────────────────┐
│  OpenAI API  │◀─────│  M4 AI Service │
│  GPT-4       │      │  - Scoring     │
│              │      │  - Chatbot     │
│              │      │  - Descriptions│
└──────────────┘      └────────────────┘
```

## Performance e Escalabilidade

### Caching Strategy (Redis)

```typescript
// Cache de imóveis publicados (hot data)
@Injectable()
export class PropertyService {
  @Cacheable('properties:published', { ttl: 300 }) // 5 min
  async getPublishedProperties(filters) {
    return this.repository.find(filters);
  }

  // Invalida cache ao publicar
  @CacheEvict('properties:published')
  async publishProperty(propertyId: string) {
    // ...
  }
}
```

### Queue Processing (Bull)

```typescript
// Processamento assíncrono de tarefas pesadas
@Processor('email-campaign')
export class EmailCampaignProcessor {
  @Process('send-batch')
  async sendBatch(job: Job<{ recipients: string[], templateId: string }>) {
    // Envia emails em lote
    // Atualiza métricas
    // Não bloqueia a API
  }
}

// Trigger da queue
await this.emailQueue.add('send-batch', {
  recipients: [...],
  templateId: '...'
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
});
```

### Database Optimization

**Índices Críticos:**
- `idx_leads_company` + `idx_leads_pipeline_stage`: Queries de funil
- `idx_properties_location`: Busca geográfica
- `idx_financial_entries_due_date`: Relatórios financeiros
- `idx_consent_logs_person`: Verificação LGPD

**Particionamento Futuro:**
- `financial_entries` por ano
- `activities` por trimestre
- `messages` por mês

## Deployment e DevOps

### Containerização (Docker)

```
docker-compose.yml
├── backend (NestJS)
├── frontend (Next.js)
├── postgres
├── redis
└── nginx (reverse proxy)
```

### CI/CD Pipeline (GitHub Actions)

```
1. Push to branch
   ├─ Run linting
   ├─ Run tests (unit + e2e)
   ├─ Build Docker images
   └─ Push to registry

2. Deploy to staging (auto)
   └─ Run migrations
   └─ Restart services

3. Deploy to production (manual approval)
   └─ Blue-Green deployment
   └─ Run smoke tests
   └─ Switch traffic
```

### Ambientes

- **Development**: Docker Compose local
- **Staging**: AWS ECS (1 task)
- **Production**: AWS ECS (auto-scaling)
  - Load Balancer (ALB)
  - RDS PostgreSQL (Multi-AZ)
  - ElastiCache Redis (cluster)
  - S3 + CloudFront (assets)

## Monitoramento

### Logs
- Centralização: CloudWatch Logs
- Estruturado: JSON format
- Níveis: error, warn, info, debug

### Métricas
- Application: Prometheus + Grafana
- Infrastructure: AWS CloudWatch
- Uptime: StatusPage

### Alertas
- Error rate > 5%: PagerDuty
- Response time > 2s: Slack
- Database connections > 80%: Email

## Considerações de Conformidade LGPD

### Auditoria Completa
- Todos os acessos a dados pessoais são logados
- Logs incluem: quem, quando, o que, por que
- Retenção de logs: 5 anos (configurável)

### Portabilidade de Dados
- API: `GET /api/lgpd/data-export/:personId`
- Formato: JSON estruturado
- Inclui: todos os dados de todas as tabelas relacionadas

### Direito ao Esquecimento
- API: `POST /api/lgpd/anonymize/:personId`
- Ação: Substitui dados pessoais por hash irreversível
- Mantém: Dados de transação para conformidade fiscal

## Roadmap de Evolução

### Fase 1 (Atual): Monólito Modular
- Deployment único
- Comunicação via eventos
- Ideal para: 0-50 empresas, <10k leads/dia

### Fase 2: Serviços Compartilhados
- Extração de M4 (IA) para serviço dedicado
- Extração de M9.3 (Boletos) para serviço dedicado
- Ideal para: 50-200 empresas

### Fase 3: Microserviços Completo
- Cada módulo = serviço independente
- Service mesh (Istio)
- Event bus (Kafka)
- Ideal para: 200+ empresas, >100k leads/dia

---

**Versão**: 2.0
**Última atualização**: Novembro 2025
**Autor**: Equipe CRMob360
