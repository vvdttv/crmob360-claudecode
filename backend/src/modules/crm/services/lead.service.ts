import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Lead } from '../entities/lead.entity';
import { Pipeline } from '../entities/pipeline.entity';
import { PipelineStage } from '../entities/pipeline-stage.entity';
import { LgpdPermissionService } from '../../lgpd/services/lgpd-permission.service';

/**
 * Lead Service - Módulo 1 (CRM)
 *
 * Serviço principal para gerenciamento de leads
 * Demonstra integração com LGPD e emissão de eventos
 */
@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);

  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,

    @InjectRepository(Pipeline)
    private pipelineRepository: Repository<Pipeline>,

    @InjectRepository(PipelineStage)
    private stageRepository: Repository<PipelineStage>,

    private lgpdService: LgpdPermissionService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Criar novo lead com registro de consentimento LGPD
   *
   * Implementa Módulo 1.3 (Captura de Leads) + Módulo 13.1 (LGPD)
   */
  async createLead(
    companyId: string,
    data: {
      fullName: string;
      email?: string;
      phone?: string;
      source: string;
      sourceDetail?: string;
      pipelineId?: string;
      assignedUserId?: string;
      searchProfile?: any;
      // LGPD obrigatório
      consent: {
        ipAddress?: string;
        userAgent?: string;
        channel: string;
        permissions: {
          termsAccepted: boolean;
          emailMarketing: boolean;
          whatsappMarketing: boolean;
          aiProfiling: boolean;
        };
      };
    },
  ): Promise<Lead> {
    // 1. Cria o lead
    const lead = this.leadRepository.create({
      companyId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      source: data.source,
      sourceDetail: data.sourceDetail,
      pipelineId: data.pipelineId,
      assignedUserId: data.assignedUserId,
      searchProfile: data.searchProfile || {},
      lastContactAt: new Date(),
    });

    // Se pipeline especificado, coloca na primeira etapa
    if (data.pipelineId) {
      const firstStage = await this.stageRepository.findOne({
        where: { pipelineId: data.pipelineId },
        order: { displayOrder: 'ASC' },
      });
      if (firstStage) {
        lead.stageId = firstStage.id;
      }
    }

    const savedLead = await this.leadRepository.save(lead);

    // 2. Registra consentimento LGPD (OBRIGATÓRIO)
    await this.lgpdService.createConsent({
      personId: savedLead.id,
      personType: 'lead',
      ipAddress: data.consent.ipAddress,
      userAgent: data.consent.userAgent,
      channel: data.consent.channel,
      permissions: data.consent.permissions,
    });

    this.logger.log(`Novo lead criado: ${savedLead.id} - ${savedLead.fullName}`);

    // 3. Emite evento para outros módulos reagirem
    this.eventEmitter.emit('lead.created', {
      leadId: savedLead.id,
      companyId,
      source: data.source,
      timestamp: new Date(),
    });

    return savedLead;
  }

  /**
   * Buscar lead por ID
   */
  async findOne(id: string, companyId: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id, companyId },
      relations: ['pipeline', 'stage', 'activities'],
    });

    if (!lead) {
      throw new NotFoundException(`Lead ${id} não encontrado`);
    }

    return lead;
  }

  /**
   * Listar leads com filtros
   *
   * Módulo 1.1 - Visualização do funil
   */
  async findAll(
    companyId: string,
    filters: {
      pipelineId?: string;
      stageId?: string;
      assignedUserId?: string;
      source?: string;
      search?: string;
      minScore?: number;
      skip?: number;
      take?: number;
    },
  ): Promise<{ leads: Lead[]; total: number }> {
    const query = this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.company_id = :companyId', { companyId })
      .andWhere('lead.is_active = true');

    if (filters.pipelineId) {
      query.andWhere('lead.pipeline_id = :pipelineId', {
        pipelineId: filters.pipelineId,
      });
    }

    if (filters.stageId) {
      query.andWhere('lead.stage_id = :stageId', { stageId: filters.stageId });
    }

    if (filters.assignedUserId) {
      query.andWhere('lead.assigned_user_id = :userId', {
        userId: filters.assignedUserId,
      });
    }

    if (filters.source) {
      query.andWhere('lead.source = :source', { source: filters.source });
    }

    if (filters.minScore) {
      query.andWhere('lead.lead_score >= :minScore', {
        minScore: filters.minScore,
      });
    }

    if (filters.search) {
      query.andWhere(
        '(lead.full_name ILIKE :search OR lead.email ILIKE :search OR lead.phone ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    query.orderBy('lead.created_at', 'DESC');

    const total = await query.getCount();

    if (filters.skip) {
      query.skip(filters.skip);
    }

    if (filters.take) {
      query.take(filters.take);
    }

    const leads = await query.getMany();

    return { leads, total };
  }

  /**
   * Mover lead para nova etapa do funil
   *
   * Módulo 1.1 - Drag and Drop + Gatilhos de Automação
   */
  async moveStage(
    leadId: string,
    companyId: string,
    newStageId: string,
  ): Promise<Lead> {
    const lead = await this.findOne(leadId, companyId);
    const oldStageId = lead.stageId;

    // Atualiza etapa
    lead.stageId = newStageId;
    const updated = await this.leadRepository.save(lead);

    this.logger.log(
      `Lead ${leadId} movido: stage ${oldStageId} → ${newStageId}`,
    );

    // Emite evento para automações (Módulo 2, 6)
    this.eventEmitter.emit('lead.stage.changed', {
      leadId,
      companyId,
      oldStageId,
      newStageId,
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * Atualizar perfil de busca do lead
   *
   * Usado para Matching Automático (Módulo 1.4)
   */
  async updateSearchProfile(
    leadId: string,
    companyId: string,
    searchProfile: any,
  ): Promise<Lead> {
    const lead = await this.findOne(leadId, companyId);
    lead.searchProfile = { ...lead.searchProfile, ...searchProfile };
    return this.leadRepository.save(lead);
  }

  /**
   * Atualizar score do lead (chamado pela IA - Módulo 4)
   */
  async updateLeadScore(
    leadId: string,
    score: number,
    temperature: 'hot' | 'warm' | 'cold',
  ): Promise<void> {
    await this.leadRepository.update(leadId, {
      leadScore: score,
      temperature,
    });

    this.logger.log(`Lead ${leadId} score atualizado: ${score} (${temperature})`);
  }

  /**
   * Buscar leads para matching com imóvel
   *
   * Módulo 1.4 - Matching Automático
   */
  async findMatchingLeads(
    companyId: string,
    propertyProfile: {
      propertyType: string;
      transactionType: string;
      price: number;
      bedrooms: number;
      neighborhood: string;
    },
  ): Promise<Lead[]> {
    // Query complexa para matching
    const leads = await this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.company_id = :companyId', { companyId })
      .andWhere('lead.is_active = true')
      .andWhere("lead.search_profile->>'propertyType' = :propertyType", {
        propertyType: propertyProfile.propertyType,
      })
      .andWhere("lead.search_profile->>'transactionType' = :transactionType", {
        transactionType: propertyProfile.transactionType,
      })
      .andWhere(
        "CAST(lead.search_profile->>'minPrice' AS DECIMAL) <= :price",
        { price: propertyProfile.price },
      )
      .andWhere(
        "CAST(lead.search_profile->>'maxPrice' AS DECIMAL) >= :price",
        { price: propertyProfile.price },
      )
      .getMany();

    this.logger.log(
      `Matching: ${leads.length} leads encontrados para imóvel ${propertyProfile.propertyType} em ${propertyProfile.neighborhood}`,
    );

    return leads;
  }

  /**
   * Soft delete (manter dados para histórico)
   */
  async softDelete(leadId: string, companyId: string): Promise<void> {
    await this.leadRepository.update(
      { id: leadId, companyId },
      { isActive: false },
    );
  }

  /**
   * Buscar leads por IDs (usado pelo LGPD filter)
   */
  async findByIds(leadIds: string[], companyId: string): Promise<Lead[]> {
    return this.leadRepository.find({
      where: {
        id: In(leadIds),
        companyId,
      },
    });
  }
}

// Import necessário
import { In } from 'typeorm';
