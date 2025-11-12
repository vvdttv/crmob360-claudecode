# 🏢 Plataforma de Gestão Imobiliária 360

## Visão Geral

Sistema operacional unificado para o mercado imobiliário que integra Front-Office (CRM, Marketing, Site), Back-Office (Financeiro, Contratos, DRE), Inteligência (IA, BI) e Conformidade (LGPD) em um único ecossistema.

## 📋 Módulos Implementados

### Parte 1: Front-Office (Vendas e Marketing)
- **Módulo 1**: Vendas e Atendimento ao Cliente (CRM)
  - Funil de Vendas (Pipeline)
  - Gestão Unificada de Atendimento (Omnichannel)
  - Integração e Captura de Leads
  - Matching Automático Cliente x Imóvel
  - Gestão e Roteirização de Visitas
  - Sistema de Atividades e Agendas
  - Portal do Cliente

- **Módulo 2**: Marketing e Relacionamento
  - Automação de Marketing (Jornadas)
  - Email Marketing e Newsletter
  - Segmentação Dinâmica

- **Módulo 3**: Construtor de Sites e Portais
  - Gestor de Templates
  - Editor Visual (Drag-and-Drop)
  - Gestão de Domínio
  - Otimização SEO
  - Sincronização de Estoque

### Parte 2: Inteligência e Processos
- **Módulo 4**: Inteligência Artificial
  - Lead Scoring Preditivo
  - Geração de Descrições de Anúncios
  - Precificação Inteligente (AVM)
  - Análise de Conversas (PLN)
  - Chatbot 24/7 com Agendamento Automático

- **Módulo 5**: Gestão de Imóveis (Estoque)
  - Gestão de Estoque
  - Multipublicação em Portais
  - Gestão de Chaves e Documentação
  - Histórico Completo do Imóvel
  - Feedback de Visita
  - Vistoria Digital (Offline-First)

- **Módulo 6**: Gestão de Processos e Colaboração
  - Templates de Processo
  - Gatilhos de Automação
  - Gestão de Tarefas (Kanban)
  - Colaboração Interna

### Parte 3: Back-Office (Gestão e Finanças)
- **Módulo 7**: Gestão do Proprietário
  - Portal do Proprietário
  - Relatórios de Desempenho

- **Módulo 8**: Gestão e Administração
  - Carteira de Inquilinos
  - Propostas e Assinatura Eletrônica
  - Gestão de Comissões (Motor de Regras)

- **Módulo 9**: Financeiro e Contábil
  - Contas a Pagar e Receber
  - Conciliação Bancária
  - Geração de Boletos
  - DRE (Demonstrativo de Resultado)
  - Gestão de Inadimplência
  - Cálculo de Rescisão
  - Integração ERP (Conta Azul/Omie)

### Parte 4: Infraestrutura
- **Módulo 10**: Aplicativo Móvel (Corretor)
  - CRM de Bolso
  - Estoque Offline
  - Agenda Sincronizada
  - Check-in de Visita
  - Scanner de Documentos
  - Acesso à Vistoria

- **Módulo 11**: Dashboards e Relatórios (BI)
  - Painel de Desempenho
  - Relatórios Personalizáveis
  - Integração de Dados de Mercado (Fipe-ZAP)

- **Módulo 12**: Configurações e Plataforma
  - Painel de Configuração de Equipe
  - Perfis de Acesso
  - Campos Personalizáveis

- **Módulo 13**: Conformidade e Governança (LGPD)
  - Gestão de Consentimento (Opt-in)
  - Logs de Consentimento (Auditáveis)
  - Portal de Privacidade
  - Anonimização de Dados
  - Master Switch de Permissões

## 🏗️ Arquitetura Técnica

### Stack Backend
- **Runtime**: Node.js 20+
- **Framework**: NestJS 10
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **ORM**: TypeORM
- **Queue**: Bull
- **API**: REST + GraphQL
- **Auth**: JWT + Refresh Tokens
- **Validation**: class-validator

### Stack Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **UI**: TailwindCSS + shadcn/ui
- **State**: Zustand + React Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

### Infraestrutura
- **Containerização**: Docker + Docker Compose
- **Orquestração**: Kubernetes (produção)
- **CI/CD**: GitHub Actions
- **Cloud**: AWS (recomendado)
- **CDN**: CloudFront
- **Storage**: S3

## 📁 Estrutura do Projeto

```
crmob360-claudecode/
├── backend/                    # Aplicação NestJS
│   ├── src/
│   │   ├── modules/           # Módulos de negócio
│   │   │   ├── crm/          # Módulo 1
│   │   │   ├── marketing/    # Módulo 2
│   │   │   ├── site-builder/ # Módulo 3
│   │   │   ├── ai/           # Módulo 4
│   │   │   ├── properties/   # Módulo 5
│   │   │   ├── processes/    # Módulo 6
│   │   │   ├── owner/        # Módulo 7
│   │   │   ├── admin/        # Módulo 8
│   │   │   ├── financial/    # Módulo 9
│   │   │   ├── mobile/       # Módulo 10
│   │   │   ├── bi/           # Módulo 11
│   │   │   ├── platform/     # Módulo 12
│   │   │   └── lgpd/         # Módulo 13
│   │   ├── common/           # Shared utilities
│   │   ├── database/         # Database configs
│   │   └── main.ts
│   ├── test/
│   └── package.json
├── frontend/                   # Aplicação Next.js
│   ├── app/                   # App Router
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── (portal-cliente)/
│   │   └── (portal-proprietario)/
│   ├── components/            # Componentes reutilizáveis
│   ├── lib/                   # Utilities
│   └── package.json
├── mobile/                     # React Native (Módulo 10)
│   ├── src/
│   └── package.json
├── database/                   # Schemas e migrations
│   ├── migrations/
│   └── schema.sql
├── docs/                       # Documentação
│   ├── architecture.md
│   ├── api/
│   └── deployment.md
├── docker/                     # Docker configs
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
├── .github/
│   └── workflows/             # CI/CD
└── README.md
```

## 🚀 Quick Start

### Pré-requisitos
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker (opcional)

### Instalação

1. **Clone o repositório**
```bash
git clone <repo-url>
cd crmob360-claudecode
```

2. **Configure as variáveis de ambiente**
```bash
# Backend
cp backend/.env.example backend/.env
# Frontend
cp frontend/.env.example frontend/.env
```

3. **Inicie com Docker Compose**
```bash
docker-compose up -d
```

OU

4. **Instalação manual**
```bash
# Backend
cd backend
npm install
npm run migration:run
npm run start:dev

# Frontend (nova janela)
cd frontend
npm install
npm run dev
```

### Acesso
- **Dashboard**: http://localhost:3000
- **API**: http://localhost:4000
- **API Docs**: http://localhost:4000/api/docs
- **GraphQL Playground**: http://localhost:4000/graphql

## 🔐 Segurança e LGPD

O sistema implementa conformidade LGPD nativa com:
- Gestão de consentimento granular
- Logs auditáveis (SHA256 hash)
- Portal de privacidade para titulares
- Anonimização de dados
- "Master Switch" de permissões em todos os módulos

## 📊 Principais Fluxos de Dados

### Fluxo de Captura de Lead
```
Site (M3) → LGPD (M13) → Chatbot IA (M4) → CRM (M1) → Matching (M5) → Processo (M6)
```

### Fluxo de Fechamento de Negócio
```
CRM (M1) → Proposta (M8.2) → Processo (M6) → Comissão (M8.4) → Financeiro (M9) → DRE (M9.4)
```

### Fluxo de Locação
```
Proposta (M8) → Vistoria (M5.6) → Contrato (M8.1) → Boleto (M9.3) → Portal Proprietário (M7)
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:cov
```

## 📚 Documentação

- [Arquitetura Detalhada](./docs/architecture.md)
- [Schema do Banco de Dados](./docs/database-schema.md)
- [API Reference](./docs/api/)
- [Deployment Guide](./docs/deployment.md)
- [LGPD Compliance](./docs/lgpd-compliance.md)

## 🤝 Contribuindo

Este é um projeto proprietário. Para contribuir, entre em contato com a equipe.

## 📄 Licença

Proprietário - Todos os direitos reservados

## 📞 Suporte

Para suporte técnico, abra uma issue ou entre em contato com o time de desenvolvimento.

---

**Versão**: 2.0
**Última atualização**: Novembro 2025
**Status**: ✅ Sistema Completo Operacional
