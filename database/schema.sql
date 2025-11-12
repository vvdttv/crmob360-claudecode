-- =====================================================
-- Plataforma de Gestão Imobiliária 360
-- Schema de Banco de Dados v2.0
-- PostgreSQL 16+
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca de texto
CREATE EXTENSION IF NOT EXISTS "unaccent"; -- Para remover acentos em busca

-- =====================================================
-- MÓDULO 12: PLATAFORMA E CONFIGURAÇÕES (Base)
-- =====================================================

-- Tabela de Empresas (Multi-tenancy)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    trading_name VARCHAR(255),
    document VARCHAR(20) UNIQUE NOT NULL, -- CNPJ
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(255),
    logo_url TEXT,
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zipcode VARCHAR(10),
    plan VARCHAR(50) DEFAULT 'basic', -- basic, pro, enterprise
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}', -- Configurações customizadas
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Usuários/Corretores
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'corretor', -- admin, gerente, corretor, estagiario, financeiro
    permissions JSONB DEFAULT '[]', -- Array de permissões granulares
    team_id UUID, -- FK para teams (criada abaixo)
    creci VARCHAR(50), -- Registro profissional
    commission_percentage DECIMAL(5,2) DEFAULT 0, -- % padrão de comissão
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Times/Equipes
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FK de team_id em users (criada após teams existir)
ALTER TABLE users ADD CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- Tabela de Campos Customizáveis (Módulo 12.3)
CREATE TABLE custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- lead, property, contract
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- text, number, date, select, checkbox
    field_options JSONB, -- Para select/dropdown
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Valores de Campos Customizáveis
CREATE TABLE custom_field_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL, -- ID do lead, property, etc
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MÓDULO 13: LGPD - CONFORMIDADE E GOVERNANÇA
-- =====================================================

-- Tabela de Templates de Termos de Consentimento
CREATE TABLE consent_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL, -- SHA256
    template_type VARCHAR(50) NOT NULL, -- site_form, contract, newsletter
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela CHAVE: Log de Consentimento LGPD (Módulo 13.5)
CREATE TABLE consent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID NOT NULL, -- FK para leads OU users (polimórfico)
    person_type VARCHAR(50) NOT NULL, -- 'lead' ou 'user'
    consent_template_id UUID REFERENCES consent_templates(id),
    consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consent_text_hash VARCHAR(64) NOT NULL, -- SHA256 do texto exibido
    ip_address INET,
    user_agent TEXT,
    channel VARCHAR(100), -- 'site_form', 'app_vistoria', 'manual_import'
    -- Permissões granulares
    permission_terms_accepted BOOLEAN DEFAULT false,
    permission_email_marketing BOOLEAN DEFAULT false,
    permission_whatsapp_marketing BOOLEAN DEFAULT false,
    permission_ai_profiling BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance em LGPD
CREATE INDEX idx_consent_logs_person ON consent_logs(person_id, person_type);
CREATE INDEX idx_consent_logs_timestamp ON consent_logs(consent_timestamp);

-- =====================================================
-- MÓDULO 1: CRM - VENDAS E ATENDIMENTO
-- =====================================================

-- Tabela de Funis (Pipelines)
CREATE TABLE pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'sales', -- sales, rental, captacao
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Etapas do Funil
CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    automation_triggers JSONB DEFAULT '[]', -- Gatilhos de automação
    required_fields JSONB DEFAULT '[]', -- Campos obrigatórios para avançar
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Leads/Clientes (Core do CRM)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    pipeline_id UUID REFERENCES pipelines(id),
    stage_id UUID REFERENCES pipeline_stages(id),
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Dados pessoais
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    document VARCHAR(20), -- CPF
    birth_date DATE,

    -- Endereço
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zipcode VARCHAR(10),

    -- Perfil de busca (para matching - Módulo 1.4)
    search_profile JSONB DEFAULT '{}',

    -- Metadados
    source VARCHAR(100), -- facebook, google, zap, site, indicacao
    source_detail TEXT,
    tags TEXT[], -- Array de tags
    lead_score INTEGER DEFAULT 0, -- Pontuação IA (Módulo 4.1)
    temperature VARCHAR(20) DEFAULT 'cold', -- hot, warm, cold

    -- Controle
    is_active BOOLEAN DEFAULT true,
    last_contact_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices importantes para CRM
CREATE INDEX idx_leads_company ON leads(company_id);
CREATE INDEX idx_leads_pipeline_stage ON leads(pipeline_id, stage_id);
CREATE INDEX idx_leads_assigned ON leads(assigned_user_id);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_score ON leads(lead_score DESC);

-- Tabela de Atividades (Timeline) - Módulo 1.6
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    activity_type VARCHAR(50) NOT NULL, -- call, email, visit, whatsapp, meeting, task
    title VARCHAR(255),
    description TEXT,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, cancelled

    -- Para visitas
    property_id UUID, -- FK para properties
    location_address TEXT,
    duration_minutes INTEGER,

    -- Arquivos anexos
    attachments JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_lead ON activities(lead_id);
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_scheduled ON activities(scheduled_at);

-- Tabela de Conversas (Omnichannel) - Módulo 1.2
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    channel VARCHAR(50) NOT NULL, -- whatsapp_official, whatsapp_business, instagram, email
    external_id VARCHAR(255), -- ID da conversa no canal externo
    status VARCHAR(50) DEFAULT 'open', -- open, waiting, closed
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent

    first_message_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensagens da Conversa
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- lead, user, bot
    sender_id UUID, -- ID do lead ou user

    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- text, image, audio, video, document
    media_url TEXT,

    is_internal_note BOOLEAN DEFAULT false, -- Nota interna não visível ao cliente
    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- Tabela de Regras de Roteamento - Módulo 1.2
CREATE TABLE routing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    priority INTEGER DEFAULT 0,

    -- Condições (JSON com regras)
    conditions JSONB NOT NULL,

    -- Ação (atribuição)
    action_type VARCHAR(50) NOT NULL, -- assign_user, assign_team, round_robin
    target_user_id UUID REFERENCES users(id),
    target_team_id UUID REFERENCES teams(id),

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MÓDULO 5: GESTÃO DE IMÓVEIS (ESTOQUE)
-- =====================================================

-- Tabela de Proprietários
CREATE TABLE owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Dados pessoais
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    document VARCHAR(20), -- CPF ou CNPJ
    owner_type VARCHAR(20) DEFAULT 'individual', -- individual, corporate

    -- Endereço
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zipcode VARCHAR(10),

    -- Dados bancários (repasse)
    bank_name VARCHAR(100),
    bank_branch VARCHAR(20),
    bank_account VARCHAR(50),
    bank_account_type VARCHAR(20), -- checking, savings

    -- Portal do proprietário
    portal_access_enabled BOOLEAN DEFAULT false,
    portal_password_hash VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Imóveis
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES owners(id) ON DELETE SET NULL,
    capturer_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Corretor captador

    -- Dados básicos
    title VARCHAR(500) NOT NULL,
    description TEXT,
    property_type VARCHAR(50) NOT NULL, -- apartment, house, commercial, land, etc
    transaction_type VARCHAR(20) NOT NULL, -- sale, rent, both

    -- Localização
    address_street VARCHAR(255) NOT NULL,
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100) NOT NULL,
    address_city VARCHAR(100) NOT NULL,
    address_state VARCHAR(2) NOT NULL,
    address_zipcode VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Características
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    suites INTEGER DEFAULT 0,
    parking_spaces INTEGER DEFAULT 0,
    area_built DECIMAL(10, 2), -- m²
    area_total DECIMAL(10, 2), -- m²

    features JSONB DEFAULT '[]', -- Array de features: piscina, churrasqueira, etc

    -- Valores
    sale_price DECIMAL(12, 2),
    rent_price DECIMAL(10, 2),
    condo_fee DECIMAL(10, 2),
    iptu_annual DECIMAL(10, 2),

    -- Status e publicação
    status VARCHAR(50) DEFAULT 'available', -- available, reserved, rented, sold, maintenance
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,

    -- Multipublicação (Módulo 5.2)
    publish_on_own_site BOOLEAN DEFAULT true,
    publish_on_zap BOOLEAN DEFAULT false,
    publish_on_imovelweb BOOLEAN DEFAULT false,
    external_ids JSONB DEFAULT '{}', -- IDs nos portais externos

    -- Mídia
    images JSONB DEFAULT '[]', -- Array de URLs
    videos JSONB DEFAULT '[]',
    virtual_tour_url TEXT,

    -- Documentação (Módulo 5.3)
    documents JSONB DEFAULT '[]',

    -- IA (Módulo 4.2 e 4.3)
    ai_generated_description TEXT,
    ai_suggested_price_min DECIMAL(12, 2),
    ai_suggested_price_max DECIMAL(12, 2),

    -- Métricas
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    visit_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_properties_company ON properties(company_id);
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_type ON properties(property_type, transaction_type);
CREATE INDEX idx_properties_location ON properties(address_city, address_neighborhood);
CREATE INDEX idx_properties_status ON properties(status, is_published);
CREATE INDEX idx_properties_price_sale ON properties(sale_price) WHERE sale_price IS NOT NULL;
CREATE INDEX idx_properties_price_rent ON properties(rent_price) WHERE rent_price IS NOT NULL;

-- Histórico do Imóvel (Módulo 5.4)
CREATE TABLE property_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    event_type VARCHAR(50) NOT NULL, -- price_change, visit, proposal, status_change, maintenance
    event_description TEXT,
    old_value JSONB,
    new_value JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_property_history ON property_history(property_id, created_at DESC);

-- Gestão de Chaves (Módulo 5.3)
CREATE TABLE property_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    key_identifier VARCHAR(100) NOT NULL,
    location VARCHAR(255), -- Localização física
    status VARCHAR(50) DEFAULT 'available', -- available, in_use, lost

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log de Retirada de Chaves
CREATE TABLE key_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_key_id UUID NOT NULL REFERENCES property_keys(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),

    action VARCHAR(20) NOT NULL, -- withdraw, return
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback de Visita (Módulo 5.5)
CREATE TABLE property_feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL, -- Visita relacionada

    rating INTEGER CHECK (rating >= 0 AND rating <= 10),
    positive_points TEXT,
    negative_points TEXT,
    would_rent_or_buy BOOLEAN,
    feedback_data JSONB DEFAULT '{}', -- Respostas customizadas

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MÓDULO 5.6: VISTORIA DIGITAL
-- =====================================================

-- Templates de Vistoria
CREATE TABLE inspection_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_structure JSONB NOT NULL, -- Hierarquia: Ambientes > Itens > Estados
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vistorias (Laudos)
CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    contract_id UUID, -- FK para contracts (criada abaixo)
    template_id UUID REFERENCES inspection_templates(id),
    inspector_user_id UUID REFERENCES users(id),

    inspection_type VARCHAR(20) NOT NULL, -- entry, exit
    inspection_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, completed, signed

    inspection_data JSONB NOT NULL, -- Dados coletados (offline-first)
    pdf_url TEXT, -- PDF gerado

    -- Assinaturas
    tenant_signature_url TEXT,
    tenant_signed_at TIMESTAMPTZ,
    owner_signature_url TEXT,
    owner_signed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MÓDULO 8: ADMINISTRAÇÃO E COMISSÕES
-- =====================================================

-- Contratos (Locação e Venda)
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL, -- Cliente/Inquilino
    owner_id UUID REFERENCES owners(id) ON DELETE SET NULL,

    contract_type VARCHAR(20) NOT NULL, -- sale, rent
    contract_number VARCHAR(100) UNIQUE,

    -- Valores
    contract_value DECIMAL(12, 2) NOT NULL,
    monthly_value DECIMAL(10, 2), -- Para locação
    administration_fee_percentage DECIMAL(5, 2), -- Taxa de administração

    -- Datas
    start_date DATE NOT NULL,
    end_date DATE,
    signature_date DATE,

    -- Ajuste de aluguel (Módulo 8.1)
    readjustment_index VARCHAR(20), -- IGP-M, IPCA
    last_readjustment_date DATE,
    next_readjustment_date DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, terminated, cancelled

    -- Documentos
    contract_document_url TEXT,
    signed_document_url TEXT,

    -- Garantias (locação)
    guarantee_type VARCHAR(50), -- fiador, seguro_fianca, deposito
    guarantee_data JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inspections ADD CONSTRAINT fk_inspection_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL;

-- Propostas (Módulo 8.2)
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Corretor

    proposal_type VARCHAR(20) NOT NULL, -- sale, rent
    proposed_value DECIMAL(12, 2) NOT NULL,
    conditions TEXT,

    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, countered

    -- Assinatura eletrônica
    signature_link TEXT,
    signed_at TIMESTAMPTZ,

    valid_until DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regras de Comissão (Módulo 8.4 - Motor de Regras)
CREATE TABLE commission_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    rule_name VARCHAR(255) NOT NULL,
    priority INTEGER DEFAULT 0, -- Para exceções

    -- Condições
    transaction_type VARCHAR(20), -- sale, rent
    min_value DECIMAL(12, 2),
    max_value DECIMAL(12, 2),
    property_tags TEXT[], -- Tags do imóvel

    -- Distribuição de comissão (JSON)
    distribution_config JSONB NOT NULL,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comissões Calculadas
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,

    transaction_type VARCHAR(20) NOT NULL,
    transaction_value DECIMAL(12, 2) NOT NULL,

    -- Divisão (pode ter múltiplos registros para splits)
    recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    role_in_transaction VARCHAR(50), -- seller, capturer, manager
    percentage DECIMAL(5, 2) NOT NULL,
    commission_value DECIMAL(12, 2) NOT NULL,

    -- Integração com financeiro (Módulo 9)
    financial_entry_id UUID, -- FK para financial_entries

    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, paid
    due_date DATE,
    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MÓDULO 9: FINANCEIRO E CONTÁBIL
-- =====================================================

-- Plano de Contas
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- revenue, expense, asset, liability
    parent_id UUID REFERENCES chart_of_accounts(id), -- Para hierarquia

    -- Mapeamento DRE (Módulo 9.4)
    dre_line VARCHAR(100), -- 'receita_operacional_bruta', 'despesas_vendas', etc

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Centros de Custo (Módulo 9.4)
CREATE TABLE cost_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES cost_centers(id),

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lançamentos Financeiros
CREATE TABLE financial_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    entry_type VARCHAR(20) NOT NULL, -- receivable, payable
    category VARCHAR(50) NOT NULL, -- commission, rent, fee, salary, etc

    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,

    -- Classificação contábil
    chart_account_id UUID REFERENCES chart_of_accounts(id),
    cost_center_id UUID REFERENCES cost_centers(id),

    -- Datas
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue, cancelled

    -- Relacionamentos
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES owners(id) ON DELETE SET NULL,

    -- Recorrência (para aluguéis)
    is_recurring BOOLEAN DEFAULT false,
    recurrence_parent_id UUID REFERENCES financial_entries(id),

    -- Juros e multa
    late_fee DECIMAL(10, 2) DEFAULT 0,
    interest_rate DECIMAL(5, 2) DEFAULT 0,

    -- Boleto (Módulo 9.3)
    payment_method VARCHAR(50), -- boleto, pix, credit_card, transfer
    barcode TEXT,
    external_payment_id VARCHAR(255), -- ID no gateway

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_financial_entries_company ON financial_entries(company_id);
CREATE INDEX idx_financial_entries_type_status ON financial_entries(entry_type, status);
CREATE INDEX idx_financial_entries_due_date ON financial_entries(due_date);
CREATE INDEX idx_financial_entries_contract ON financial_entries(contract_id);

-- Conciliação Bancária (Módulo 9.2)
CREATE TABLE bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    bank_name VARCHAR(100),
    account_number VARCHAR(50),

    transaction_date DATE NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    transaction_type VARCHAR(20), -- credit, debit

    -- Conciliação
    is_reconciled BOOLEAN DEFAULT false,
    financial_entry_id UUID REFERENCES financial_entries(id),
    reconciled_at TIMESTAMPTZ,
    reconciled_by_user_id UUID REFERENCES users(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MÓDULO 2: MARKETING E RELACIONAMENTO
-- =====================================================

-- Templates de Email
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    plain_text_content TEXT,

    template_tags JSONB DEFAULT '[]', -- Tags disponíveis: {{nome}}, {{imovel}}, etc

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Segmentos Dinâmicos (Módulo 2.2)
CREATE TABLE segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    filter_rules JSONB NOT NULL, -- Regras de filtro (salvas, não estáticas)

    estimated_count INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMPTZ,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campanhas de Email
CREATE TABLE email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES email_templates(id),
    segment_id UUID REFERENCES segments(id),

    subject VARCHAR(500),
    from_email VARCHAR(255),
    from_name VARCHAR(255),

    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sending, sent, cancelled

    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,

    -- Métricas
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jornadas de Automação (Módulo 2.1)
CREATE TABLE automation_journeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Estrutura da jornada (JSON com nodes e edges)
    journey_structure JSONB NOT NULL,

    trigger_type VARCHAR(50) NOT NULL, -- stage_change, tag_added, inactivity, etc
    trigger_config JSONB,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Execuções de Jornada (por lead)
CREATE TABLE journey_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journey_id UUID NOT NULL REFERENCES automation_journeys(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

    current_step_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active', -- active, completed, exited

    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    execution_log JSONB DEFAULT '[]'
);

-- =====================================================
-- MÓDULO 3: SITE BUILDER
-- =====================================================

-- Sites (um por empresa, multi-site futuro)
CREATE TABLE websites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    domain VARCHAR(255) UNIQUE, -- minhaimobiliaria.com.br
    subdomain VARCHAR(100), -- minhaimobiliaria.crmob360.com.br

    template_name VARCHAR(100) NOT NULL,

    -- Customização
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    logo_url TEXT,
    favicon_url TEXT,

    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,

    -- Estrutura da homepage (drag-and-drop)
    homepage_structure JSONB DEFAULT '[]',

    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Páginas customizadas do site
CREATE TABLE website_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,

    slug VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,

    meta_title VARCHAR(255),
    meta_description TEXT,

    is_published BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(website_id, slug)
);

-- =====================================================
-- MÓDULO 4: INTELIGÊNCIA ARTIFICIAL
-- =====================================================

-- Histórico de Análises de IA
CREATE TABLE ai_analysis_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    analysis_type VARCHAR(50) NOT NULL, -- lead_scoring, description_generation, pricing, conversation_analysis

    entity_id UUID NOT NULL, -- lead_id, property_id, conversation_id
    entity_type VARCHAR(50) NOT NULL,

    input_data JSONB,
    output_data JSONB,

    model_used VARCHAR(100),
    tokens_used INTEGER,
    processing_time_ms INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações do Chatbot (Módulo 4.5)
CREATE TABLE chatbot_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    bot_name VARCHAR(100) DEFAULT 'Assistente Virtual',
    tone_of_voice VARCHAR(50) DEFAULT 'professional', -- professional, casual, luxury

    business_hours_start TIME,
    business_hours_end TIME,
    working_days INTEGER[], -- 0-6 (domingo a sábado)

    -- Treinamento
    accepted_guarantees TEXT[],
    essential_questions JSONB DEFAULT '[]',

    min_scheduling_notice_hours INTEGER DEFAULT 4,
    max_visits_per_slot INTEGER DEFAULT 1,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id)
);

-- =====================================================
-- MÓDULO 6: GESTÃO DE PROCESSOS
-- =====================================================

-- Templates de Processo
CREATE TABLE process_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    trigger_type VARCHAR(50), -- manual, stage_change, contract_signed, etc
    trigger_config JSONB,

    -- Estrutura das tarefas (JSON)
    tasks_structure JSONB NOT NULL,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instâncias de Processo
CREATE TABLE process_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    template_id UUID REFERENCES process_templates(id),

    title VARCHAR(255) NOT NULL,

    -- Entidade relacionada
    related_entity_type VARCHAR(50), -- lead, contract, property
    related_entity_id UUID,

    status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled

    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tarefas do Processo
CREATE TABLE process_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_instance_id UUID NOT NULL REFERENCES process_instances(id) ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    assigned_user_id UUID REFERENCES users(id),
    assigned_team_id UUID REFERENCES teams(id),

    task_type VARCHAR(50) DEFAULT 'manual', -- manual, automated

    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled

    completed_at TIMESTAMPTZ,
    completed_by_user_id UUID REFERENCES users(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários em Tarefas (Módulo 6.4)
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES process_tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    comment TEXT NOT NULL,
    mentions JSONB DEFAULT '[]', -- Array de user_ids mencionados

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MÓDULO 11: BI E DASHBOARDS
-- =====================================================

-- Relatórios Salvos (Módulo 11.2)
CREATE TABLE saved_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- sales_funnel, broker_performance, property_inventory

    filters JSONB DEFAULT '{}',
    columns JSONB DEFAULT '[]',

    is_public BOOLEAN DEFAULT false, -- Compartilhar com time

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache de Dados de Mercado (Módulo 11.5)
CREATE TABLE market_data_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    data_source VARCHAR(50) NOT NULL, -- fipezap, etc
    city VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100),

    property_type VARCHAR(50),

    avg_price_per_sqm DECIMAL(10, 2),
    avg_sale_price DECIMAL(12, 2),
    avg_rent_price DECIMAL(10, 2),

    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,

    raw_data JSONB,

    fetched_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(data_source, city, neighborhood, property_type, period_month, period_year)
);

-- =====================================================
-- ÍNDICES ADICIONAIS E OTIMIZAÇÕES
-- =====================================================

-- Full-text search em leads
CREATE INDEX idx_leads_fulltext ON leads USING gin(to_tsvector('portuguese', full_name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')));

-- Full-text search em imóveis
CREATE INDEX idx_properties_fulltext ON properties USING gin(to_tsvector('portuguese', title || ' ' || COALESCE(description, '') || ' ' || address_neighborhood || ' ' || address_city));

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View de Leads com última atividade
CREATE VIEW vw_leads_with_last_activity AS
SELECT
    l.*,
    la.last_activity_date,
    la.last_activity_type
FROM leads l
LEFT JOIN LATERAL (
    SELECT
        created_at as last_activity_date,
        activity_type as last_activity_type
    FROM activities
    WHERE lead_id = l.id
    ORDER BY created_at DESC
    LIMIT 1
) la ON true;

-- View de Imóveis com métricas
CREATE VIEW vw_properties_with_metrics AS
SELECT
    p.*,
    o.full_name as owner_name,
    COUNT(DISTINCT pf.id) as feedback_count,
    AVG(pf.rating) as avg_rating,
    COUNT(DISTINCT a.id) FILTER (WHERE a.activity_type = 'visit') as visit_count_from_activities
FROM properties p
LEFT JOIN owners o ON p.owner_id = o.id
LEFT JOIN property_feedbacks pf ON p.id = pf.property_id
LEFT JOIN activities a ON p.id = a.property_id
GROUP BY p.id, o.full_name;

-- View de DRE (simplificada)
CREATE VIEW vw_dre_summary AS
SELECT
    company_id,
    DATE_TRUNC('month', issue_date) as period_month,
    entry_type,
    chart_account_id,
    ca.dre_line,
    ca.name as account_name,
    SUM(amount) as total_amount
FROM financial_entries fe
INNER JOIN chart_of_accounts ca ON fe.chart_account_id = ca.id
WHERE fe.status = 'paid'
GROUP BY company_id, DATE_TRUNC('month', issue_date), entry_type, chart_account_id, ca.dre_line, ca.name;

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas com updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER trigger_update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t);
    END LOOP;
END;
$$ language 'plpgsql';

-- =====================================================
-- DADOS INICIAIS (SEED BÁSICO)
-- =====================================================

-- Inserir empresa demo
INSERT INTO companies (id, name, trading_name, document, email, plan)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Imobiliária Demo Ltda',
    'Demo Imóveis',
    '12345678000199',
    'contato@demoimoveis.com.br',
    'enterprise'
);

-- Inserir usuário admin demo
INSERT INTO users (id, company_id, email, password_hash, full_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'admin@demoimoveis.com.br',
    '$2b$10$example.hash.value', -- bcrypt hash de 'admin123'
    'Administrador Demo',
    'admin',
    true
);

-- Inserir pipeline padrão
INSERT INTO pipelines (id, company_id, name, type, display_order)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Funil de Vendas',
    'sales',
    0
);

-- Inserir etapas padrão do pipeline
INSERT INTO pipeline_stages (pipeline_id, name, display_order, color) VALUES
('00000000-0000-0000-0000-000000000003', 'Novo Lead', 0, '#3B82F6'),
('00000000-0000-0000-0000-000000000003', 'Contato Inicial', 1, '#8B5CF6'),
('00000000-0000-0000-0000-000000000003', 'Visita Agendada', 2, '#F59E0B'),
('00000000-0000-0000-0000-000000000003', 'Em Negociação', 3, '#10B981'),
('00000000-0000-0000-0000-000000000003', 'Proposta Enviada', 4, '#06B6D4'),
('00000000-0000-0000-0000-000000000003', 'Fechado', 5, '#22C55E'),
('00000000-0000-0000-0000-000000000003', 'Perdido', 6, '#EF4444');

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================

COMMENT ON DATABASE crmob360_db IS 'Plataforma de Gestão Imobiliária 360 - v2.0';
