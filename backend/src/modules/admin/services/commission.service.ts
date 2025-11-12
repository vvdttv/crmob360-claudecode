import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Commission } from '../entities/commission.entity';
import { CommissionRule } from '../entities/commission-rule.entity';
import { Contract } from '../entities/contract.entity';

/**
 * Commission Service - Módulo 8.4
 *
 * Motor de Regras de Comissão automático
 */
@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(
    @InjectRepository(Commission)
    private commissionRepository: Repository<Commission>,

    @InjectRepository(CommissionRule)
    private ruleRepository: Repository<CommissionRule>,

    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,

    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Calcular e criar comissões automaticamente (Módulo 8.4)
   *
   * Chamado quando um contrato é ativado ou uma proposta é aceita
   */
  async calculateAndCreate(
    companyId: string,
    data: {
      contractId?: string;
      proposalId?: string;
      transactionType: 'sale' | 'rent';
      transactionValue: number;
      sellerUserId?: string;
      capturerUserId?: string;
      managerUserId?: string;
      propertyTags?: string[];
    },
  ): Promise<Commission[]> {
    // 1. Busca regra aplicável
    const rule = await this.findApplicableRule(companyId, {
      transactionType: data.transactionType,
      transactionValue: data.transactionValue,
      propertyTags: data.propertyTags || [],
    });

    if (!rule) {
      this.logger.warn(
        `Nenhuma regra de comissão encontrada para ${data.transactionType} - R$ ${data.transactionValue}`,
      );
      return [];
    }

    this.logger.log(`Aplicando regra: ${rule.ruleName}`);

    // 2. Calcula comissões para cada split da regra
    const commissions: Commission[] = [];
    const userMapping = {
      seller: data.sellerUserId,
      capturer: data.capturerUserId,
      manager: data.managerUserId,
      company: null, // Comissão da imobiliária não tem usuário
    };

    for (const split of rule.distributionConfig.splits) {
      // Aplica condições dinâmicas se existirem
      let percentage = split.percentage;
      if (split.condition) {
        const conditionMet = this.evaluateCondition(
          split.condition.if,
          data.transactionValue,
        );
        if (conditionMet) {
          percentage = split.condition.then_percentage;
        }
      }

      const commissionValue = (data.transactionValue * percentage) / 100;
      const recipientUserId = userMapping[split.role] || null;

      // Cria comissão
      const commission = this.commissionRepository.create({
        companyId,
        contractId: data.contractId,
        proposalId: data.proposalId,
        transactionType: data.transactionType,
        transactionValue: data.transactionValue,
        recipientUserId,
        roleInTransaction: split.role as any,
        percentage,
        commissionValue: parseFloat(commissionValue.toFixed(2)),
        status: 'pending',
        dueDate: this.calculateDueDate(new Date(), 5), // D+5 padrão
      });

      const saved = await this.commissionRepository.save(commission);
      commissions.push(saved);

      this.logger.log(
        `Comissão calculada: ${split.role} - ${percentage}% - R$ ${commissionValue.toFixed(2)}`,
      );

      // Emite evento para criar lançamento financeiro (Módulo 9)
      this.eventEmitter.emit('commission.calculated', {
        commissionId: saved.id,
        companyId,
        recipientUserId,
        commissionValue: saved.commissionValue,
        dueDate: saved.dueDate,
        timestamp: new Date(),
      });
    }

    return commissions;
  }

  /**
   * Buscar comissões
   */
  async findAll(
    companyId: string,
    filters: {
      contractId?: string;
      recipientUserId?: string;
      status?: string;
      skip?: number;
      take?: number;
    },
  ): Promise<{ commissions: Commission[]; total: number }> {
    const query = this.commissionRepository
      .createQueryBuilder('commission')
      .where('commission.company_id = :companyId', { companyId });

    if (filters.contractId) {
      query.andWhere('commission.contract_id = :contractId', {
        contractId: filters.contractId,
      });
    }

    if (filters.recipientUserId) {
      query.andWhere('commission.recipient_user_id = :userId', {
        userId: filters.recipientUserId,
      });
    }

    if (filters.status) {
      query.andWhere('commission.status = :status', {
        status: filters.status,
      });
    }

    query.orderBy('commission.created_at', 'DESC');

    const total = await query.getCount();

    if (filters.skip) {
      query.skip(filters.skip);
    }

    if (filters.take) {
      query.take(filters.take);
    }

    const commissions = await query.getMany();

    return { commissions, total };
  }

  /**
   * Marcar comissão como paga
   */
  async markAsPaid(id: string, companyId: string): Promise<Commission> {
    const commission = await this.commissionRepository.findOne({
      where: { id, companyId },
    });

    if (!commission) {
      throw new Error('Comissão não encontrada');
    }

    commission.status = 'paid';
    commission.paidAt = new Date();

    return this.commissionRepository.save(commission);
  }

  // ========== Gestão de Regras ==========

  /**
   * Criar regra de comissão
   */
  async createRule(
    companyId: string,
    data: Partial<CommissionRule>,
  ): Promise<CommissionRule> {
    const rule = this.ruleRepository.create({
      ...data,
      companyId,
    });

    const saved = await this.ruleRepository.save(rule);

    this.logger.log(`Nova regra de comissão criada: ${saved.ruleName}`);

    return saved;
  }

  /**
   * Listar regras
   */
  async findAllRules(companyId: string): Promise<CommissionRule[]> {
    return this.ruleRepository.find({
      where: { companyId, isActive: true },
      order: { priority: 'DESC' }, // Maior prioridade primeiro
    });
  }

  /**
   * Atualizar regra
   */
  async updateRule(
    id: string,
    companyId: string,
    data: Partial<CommissionRule>,
  ): Promise<CommissionRule> {
    const rule = await this.ruleRepository.findOne({
      where: { id, companyId },
    });

    if (!rule) {
      throw new Error('Regra não encontrada');
    }

    Object.assign(rule, data);

    return this.ruleRepository.save(rule);
  }

  // ========== Métodos auxiliares ==========

  /**
   * Busca a regra de maior prioridade aplicável
   */
  private async findApplicableRule(
    companyId: string,
    criteria: {
      transactionType: 'sale' | 'rent';
      transactionValue: number;
      propertyTags: string[];
    },
  ): Promise<CommissionRule | null> {
    const rules = await this.findAllRules(companyId);

    for (const rule of rules) {
      // Verifica tipo de transação
      if (
        rule.transactionType &&
        rule.transactionType !== criteria.transactionType
      ) {
        continue;
      }

      // Verifica faixa de valor
      if (rule.minValue && criteria.transactionValue < rule.minValue) {
        continue;
      }

      if (rule.maxValue && criteria.transactionValue > rule.maxValue) {
        continue;
      }

      // Verifica tags
      if (rule.propertyTags && rule.propertyTags.length > 0) {
        const hasTag = rule.propertyTags.some((tag) =>
          criteria.propertyTags.includes(tag),
        );
        if (!hasTag) {
          continue;
        }
      }

      // Regra aplicável encontrada!
      return rule;
    }

    // Fallback: busca regra padrão (sem condições)
    return rules.find(
      (r) =>
        !r.transactionType &&
        !r.minValue &&
        !r.maxValue &&
        r.propertyTags.length === 0,
    );
  }

  /**
   * Avalia condições dinâmicas (ex: "value > 1000000")
   */
  private evaluateCondition(condition: string, value: number): boolean {
    try {
      // Substitui "value" pelo valor real e avalia a expressão
      const expression = condition.replace(/value/g, value.toString());
      return eval(expression); // NOTA: Em produção, usar biblioteca segura
    } catch (error) {
      this.logger.error(`Erro ao avaliar condição: ${condition}`, error);
      return false;
    }
  }

  /**
   * Calcula data de vencimento
   */
  private calculateDueDate(baseDate: Date, daysToAdd: number): Date {
    const dueDate = new Date(baseDate);
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    return dueDate;
  }
}
