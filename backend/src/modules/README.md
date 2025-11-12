# Módulos do Backend - Plataforma de Gestão Imobiliária 360

## Status de Implementação

### ✅ Módulos Implementados (Completos)

#### Módulo 13: LGPD - Conformidade e Governança
- **Localização**: `./lgpd/`
- **Status**: ✅ Implementado
- **Entidades**: `ConsentLog`, `ConsentTemplate`
- **Serviços**: `LgpdPermissionService` (Master Switch)
- **Features**:
  - Registro de consentimento com hash SHA256
  - Verificação de permissões granulares
  - Portal de privacidade
  - Logs auditáveis

#### Módulo 1: CRM - Vendas e Atendimento
- **Localização**: `./crm/`
- **Status**: ✅ Implementado
- **Entidades**: `Lead`, `Pipeline`, `PipelineStage`, `Activity`
- **Serviços**: `LeadService`, `PipelineService`, `ActivityService`
- **Features**:
  - Funil de vendas (drag-and-drop)
  - Captura de leads com LGPD integrado
  - Matching automático lead x imóvel
  - Timeline de atividades
  - Emissão de eventos para automações

### 🚧 Módulos Pendentes (Estrutura Criada)

#### Módulo 5: Gestão de Imóveis (Properties)
- **Localização**: `./properties/`
- **Status**: 🚧 Estrutura criada
- **Entidades planejadas**:
  - `Property`: Catálogo de imóveis
  - `Owner`: Proprietários
  - `PropertyKey`: Gestão de chaves
  - `PropertyFeedback`: Feedback de visitas
  - `Inspection`: Vistoria digital
  - `InspectionTemplate`: Templates de vistoria
- **Features planejadas**:
  - 5.1: Gestão de estoque
  - 5.2: Multipublicação em portais (Zap, Imóvelweb)
  - 5.3: Gestão de chaves e documentos
  - 5.4: Histórico completo
  - 5.5: Feedback de visita
  - 5.6: Vistoria digital offline-first

#### Módulo 2: Marketing e Relacionamento
- **Localização**: `./marketing/`
- **Status**: 🚧 Estrutura criada
- **Entidades planejadas**:
  - `EmailTemplate`: Templates de email
  - `EmailCampaign`: Campanhas de email
  - `Segment`: Segmentos dinâmicos
  - `AutomationJourney`: Jornadas de automação
  - `JourneyExecution`: Execuções de jornada por lead
- **Features planejadas**:
  - 2.1: Automação de marketing (jornadas com drag-and-drop)
  - 2.2: Email marketing e newsletter
  - Segmentação dinâmica
  - Integração com LGPD para filtrar destinatários

#### Módulo 3: Site Builder
- **Localização**: `./site-builder/`
- **Status**: 🚧 Estrutura criada
- **Entidades planejadas**:
  - `Website`: Configuração do site
  - `WebsitePage`: Páginas customizadas
- **Features planejadas**:
  - 3.1: Gestor de templates
  - 3.2: Editor visual (drag-and-drop)
  - 3.3: Gestão de domínio
  - 3.4: Otimização SEO
  - 3.5: Sincronização automática com estoque (Módulo 5)

#### Módulo 4: Inteligência Artificial
- **Localização**: `./ai/`
- **Status**: 🚧 Estrutura criada
- **Entidades planejadas**:
  - `AiAnalysisLog`: Histórico de análises de IA
  - `ChatbotConfig`: Configurações do chatbot
- **Features planejadas**:
  - 4.1: Lead scoring preditivo
  - 4.2: Geração de descrições de anúncios
  - 4.3: Precificação inteligente (AVM)
  - 4.4: Análise de conversas (PLN)
  - 4.5: Chatbot 24/7 com agendamento automático

#### Módulo 6: Gestão de Processos
- **Localização**: `./processes/`
- **Status**: 🚧 Estrutura criada
- **Entidades planejadas**:
  - `ProcessTemplate`: Templates de processo
  - `ProcessInstance`: Instâncias de processo
  - `ProcessTask`: Tarefas do processo
  - `TaskComment`: Comentários e @menções
- **Features planejadas**:
  - 6.1: Templates de processo
  - 6.2: Gatilhos de automação
  - 6.3: Gestão de tarefas (Kanban)
  - 6.4: Colaboração interna

#### Módulo 7: Gestão do Proprietário
- **Localização**: `./owner/`
- **Status**: 🚧 Estrutura criada
- **Features planejadas**:
  - 7.1: Portal do proprietário
  - Relatórios de desempenho do imóvel
  - Extrato de repasses (locação)

#### Módulo 8: Administração e Comissões
- **Localização**: `./admin/`
- **Status**: 🚧 Estrutura criada
- **Entidades planejadas**:
  - `Contract`: Contratos de locação/venda
  - `Proposal`: Propostas
  - `CommissionRule`: Regras de comissão
  - `Commission`: Comissões calculadas
- **Features planejadas**:
  - 8.1: Gestão da carteira de inquilinos
  - 8.2: Propostas e assinatura eletrônica
  - 8.4: Gestão de comissões (motor de regras)

#### Módulo 9: Financeiro e Contábil
- **Localização**: `./financial/`
- **Status**: 🚧 Estrutura criada
- **Entidades planejadas**:
  - `ChartOfAccounts`: Plano de contas
  - `CostCenter`: Centros de custo
  - `FinancialEntry`: Lançamentos (contas a pagar/receber)
  - `BankTransaction`: Transações bancárias
- **Features planejadas**:
  - 9.1: Contas a pagar e receber
  - 9.2: Conciliação bancária automática
  - 9.3: Geração de boletos (gateway)
  - 9.4: DRE (Demonstrativo de Resultado)
  - 9.5: Gestão de inadimplência
  - 9.6: Cálculo de rescisão automático
  - 9.7: Integração ERP (Conta Azul/Omie)

#### Módulo 10: Mobile
- **Localização**: `./mobile/`
- **Status**: 🚧 Estrutura criada
- **Features planejadas**:
  - 10.1: API específica para mobile
  - 10.2: Sincronização offline
  - 10.3: Scanner de documentos
  - 10.4: Check-in de visita

#### Módulo 11: BI e Dashboards
- **Localização**: `./bi/`
- **Status**: 🚧 Estrutura criada
- **Entidades planejadas**:
  - `SavedReport`: Relatórios salvos
  - `MarketDataCache`: Cache de dados de mercado
- **Features planejadas**:
  - 11.1: Painel de desempenho
  - 11.2: Relatórios personalizáveis
  - 11.5: Integração de dados de mercado (Fipe-ZAP)

#### Módulo 12: Plataforma e Configurações
- **Localização**: `./platform/`
- **Status**: 🚧 Estrutura criada
- **Entidades planejadas**:
  - `Company`: Empresas (multi-tenancy)
  - `User`: Usuários/corretores
  - `Team`: Times/equipes
  - `CustomField`: Campos customizáveis
- **Features planejadas**:
  - 12.1: Configuração de equipe e permissões
  - 12.2: Configurações do usuário
  - 12.3: Campos de dados personalizáveis
  - Autenticação JWT
  - Multi-tenancy

## 🏗️ Arquitetura de Comunicação Entre Módulos

### Eventos (Event-Driven)

Os módulos se comunicam via eventos emitidos pelo `EventEmitter2`:

```typescript
// Exemplo: CRM emite evento
this.eventEmitter.emit('lead.stage.changed', {
  leadId,
  companyId,
  oldStageId,
  newStageId,
  timestamp: new Date(),
});

// Processes escuta e reage
@OnEvent('lead.stage.changed')
async handleStageChange(payload) {
  // Inicia processo automático
}
```

### Master Switch LGPD

Todos os módulos que processam dados pessoais **DEVEM** consultar o `LgpdPermissionService`:

```typescript
// Marketing consulta antes de enviar email
const hasPermission = await this.lgpdService.checkPermission(
  leadId,
  'lead',
  'email_marketing',
);

if (hasPermission) {
  await this.sendEmail(lead);
}
```

## 📋 Roadmap de Implementação

### Prioridade Alta (Próximos)
1. **Módulo 5 (Properties)**: Core do produto imobiliário
2. **Módulo 8 (Admin)**: Contratos e comissões
3. **Módulo 9 (Financial)**: Gestão financeira

### Prioridade Média
4. **Módulo 2 (Marketing)**: Automações
5. **Módulo 6 (Processes)**: Workflows
6. **Módulo 4 (AI)**: Inteligência

### Prioridade Baixa
7. **Módulo 3 (Site Builder)**: Site próprio
8. **Módulo 11 (BI)**: Relatórios avançados
9. **Módulo 10 (Mobile)**: APIs mobile específicas

## 🧪 Testes

Cada módulo deve ter:
- **Unit tests**: `*.service.spec.ts`
- **Integration tests**: `*.controller.spec.ts`
- **E2E tests**: `test/e2e/*.e2e-spec.ts`

## 📚 Documentação

Para cada módulo implementado, criar:
- `README.md` no diretório do módulo
- Swagger/OpenAPI docs nos controllers
- Diagramas de fluxo (quando aplicável)

---

**Status**: Sistema em desenvolvimento ativo
**Última atualização**: Novembro 2025
