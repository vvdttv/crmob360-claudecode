import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Proposal } from '../entities/proposal.entity';

/**
 * Proposal Service - Módulo 8.2
 *
 * Gerencia propostas e integra com assinatura eletrônica
 */
@Injectable()
export class ProposalService {
  private readonly logger = new Logger(ProposalService.name);

  constructor(
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,

    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Criar proposta (Módulo 8.2)
   */
  async create(companyId: string, data: Partial<Proposal>): Promise<Proposal> {
    // Calcula data de validade (15 dias padrão)
    if (!data.validUntil) {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 15);
      data.validUntil = validUntil;
    }

    const proposal = this.proposalRepository.create({
      ...data,
      companyId,
    });

    const saved = await this.proposalRepository.save(proposal);

    this.logger.log(
      `Nova proposta criada: ${saved.id} - R$ ${saved.proposedValue}`,
    );

    // Emite evento
    this.eventEmitter.emit('proposal.created', {
      proposalId: saved.id,
      companyId,
      propertyId: saved.propertyId,
      leadId: saved.leadId,
      proposedValue: saved.proposedValue,
      timestamp: new Date(),
    });

    return saved;
  }

  /**
   * Buscar proposta por ID
   */
  async findOne(id: string, companyId: string): Promise<Proposal> {
    const proposal = await this.proposalRepository.findOne({
      where: { id, companyId },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposta ${id} não encontrada`);
    }

    return proposal;
  }

  /**
   * Listar propostas com filtros
   */
  async findAll(
    companyId: string,
    filters: {
      propertyId?: string;
      leadId?: string;
      userId?: string;
      status?: string;
      proposalType?: 'sale' | 'rent';
      skip?: number;
      take?: number;
    },
  ): Promise<{ proposals: Proposal[]; total: number }> {
    const query = this.proposalRepository
      .createQueryBuilder('proposal')
      .where('proposal.company_id = :companyId', { companyId });

    if (filters.propertyId) {
      query.andWhere('proposal.property_id = :propertyId', {
        propertyId: filters.propertyId,
      });
    }

    if (filters.leadId) {
      query.andWhere('proposal.lead_id = :leadId', {
        leadId: filters.leadId,
      });
    }

    if (filters.userId) {
      query.andWhere('proposal.user_id = :userId', {
        userId: filters.userId,
      });
    }

    if (filters.status) {
      query.andWhere('proposal.status = :status', {
        status: filters.status,
      });
    }

    if (filters.proposalType) {
      query.andWhere('proposal.proposal_type = :proposalType', {
        proposalType: filters.proposalType,
      });
    }

    query.orderBy('proposal.created_at', 'DESC');

    const total = await query.getCount();

    if (filters.skip) {
      query.skip(filters.skip);
    }

    if (filters.take) {
      query.take(filters.take);
    }

    const proposals = await query.getMany();

    return { proposals, total };
  }

  /**
   * Aceitar proposta
   */
  async accept(id: string, companyId: string): Promise<Proposal> {
    const proposal = await this.findOne(id, companyId);

    proposal.status = 'accepted';
    proposal.signedAt = new Date();

    const updated = await this.proposalRepository.save(proposal);

    this.logger.log(`Proposta ${id} aceita`);

    // Emite evento (para criar contrato - Módulo 8.1)
    this.eventEmitter.emit('proposal.accepted', {
      proposalId: id,
      companyId,
      propertyId: proposal.propertyId,
      leadId: proposal.leadId,
      proposedValue: proposal.proposedValue,
      proposalType: proposal.proposalType,
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * Rejeitar proposta
   */
  async reject(id: string, companyId: string): Promise<Proposal> {
    const proposal = await this.findOne(id, companyId);

    proposal.status = 'rejected';

    return this.proposalRepository.save(proposal);
  }

  /**
   * Contraproposta
   */
  async counter(
    id: string,
    companyId: string,
    newValue: number,
  ): Promise<Proposal> {
    const proposal = await this.findOne(id, companyId);

    proposal.status = 'countered';
    proposal.proposedValue = newValue;

    return this.proposalRepository.save(proposal);
  }

  /**
   * Enviar para assinatura eletrônica (Módulo 8.2)
   *
   * TODO: Integrar com DocuSign, Clicksign, etc
   */
  async sendForSignature(
    id: string,
    companyId: string,
  ): Promise<{ signatureLink: string }> {
    const proposal = await this.findOne(id, companyId);

    // Integração com plataforma de assinatura
    // const signatureLink = await this.docusignService.createEnvelope(proposal);

    const signatureLink = `https://assinatura-exemplo.com/proposals/${proposal.id}`;

    proposal.signatureLink = signatureLink;
    await this.proposalRepository.save(proposal);

    this.logger.log(`Proposta ${id} enviada para assinatura`);

    return { signatureLink };
  }

  /**
   * Webhook: proposta assinada (chamado pela plataforma de assinatura)
   */
  async handleSigned(proposalId: string): Promise<void> {
    const proposal = await this.proposalRepository.findOne({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposta ${proposalId} não encontrada`);
    }

    proposal.status = 'accepted';
    proposal.signedAt = new Date();

    await this.proposalRepository.save(proposal);

    // Emite evento para processar aceite
    this.eventEmitter.emit('proposal.accepted', {
      proposalId: proposal.id,
      companyId: proposal.companyId,
      propertyId: proposal.propertyId,
      leadId: proposal.leadId,
      proposedValue: proposal.proposedValue,
      proposalType: proposal.proposalType,
      timestamp: new Date(),
    });
  }

  /**
   * Verificar propostas expiradas (cron job)
   */
  async expireOldProposals(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.proposalRepository
      .createQueryBuilder()
      .update(Proposal)
      .set({ status: 'expired' })
      .where('status = :status', { status: 'pending' })
      .andWhere('valid_until < :today', { today })
      .execute();

    const count = result.affected || 0;

    if (count > 0) {
      this.logger.log(`${count} propostas expiradas automaticamente`);
    }

    return count;
  }
}
