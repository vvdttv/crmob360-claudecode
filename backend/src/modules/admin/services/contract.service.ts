import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Contract } from '../entities/contract.entity';

/**
 * Contract Service - Módulo 8
 *
 * Gerencia contratos de locação e venda
 */
@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,

    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Criar contrato (Módulo 8.1)
   */
  async create(companyId: string, data: Partial<Contract>): Promise<Contract> {
    // Gera número do contrato se não fornecido
    if (!data.contractNumber) {
      data.contractNumber = await this.generateContractNumber(companyId);
    }

    const contract = this.contractRepository.create({
      ...data,
      companyId,
    });

    const saved = await this.contractRepository.save(contract);

    this.logger.log(`Novo contrato criado: ${saved.id} - ${saved.contractNumber}`);

    // Emite evento
    this.eventEmitter.emit('contract.created', {
      contractId: saved.id,
      companyId,
      contractType: saved.contractType,
      propertyId: saved.propertyId,
      leadId: saved.leadId,
      timestamp: new Date(),
    });

    return saved;
  }

  /**
   * Buscar contrato por ID
   */
  async findOne(id: string, companyId: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id, companyId },
    });

    if (!contract) {
      throw new NotFoundException(`Contrato ${id} não encontrado`);
    }

    return contract;
  }

  /**
   * Listar contratos com filtros
   */
  async findAll(
    companyId: string,
    filters: {
      contractType?: 'sale' | 'rent';
      status?: string;
      propertyId?: string;
      leadId?: string;
      ownerId?: string;
      skip?: number;
      take?: number;
    },
  ): Promise<{ contracts: Contract[]; total: number }> {
    const query = this.contractRepository
      .createQueryBuilder('contract')
      .where('contract.company_id = :companyId', { companyId });

    if (filters.contractType) {
      query.andWhere('contract.contract_type = :contractType', {
        contractType: filters.contractType,
      });
    }

    if (filters.status) {
      query.andWhere('contract.status = :status', { status: filters.status });
    }

    if (filters.propertyId) {
      query.andWhere('contract.property_id = :propertyId', {
        propertyId: filters.propertyId,
      });
    }

    if (filters.leadId) {
      query.andWhere('contract.lead_id = :leadId', { leadId: filters.leadId });
    }

    if (filters.ownerId) {
      query.andWhere('contract.owner_id = :ownerId', {
        ownerId: filters.ownerId,
      });
    }

    query.orderBy('contract.created_at', 'DESC');

    const total = await query.getCount();

    if (filters.skip) {
      query.skip(filters.skip);
    }

    if (filters.take) {
      query.take(filters.take);
    }

    const contracts = await query.getMany();

    return { contracts, total };
  }

  /**
   * Atualizar contrato
   */
  async update(
    id: string,
    companyId: string,
    data: Partial<Contract>,
  ): Promise<Contract> {
    const contract = await this.findOne(id, companyId);

    Object.assign(contract, data);

    return this.contractRepository.save(contract);
  }

  /**
   * Ativar contrato (após assinatura)
   */
  async activate(id: string, companyId: string): Promise<Contract> {
    const contract = await this.findOne(id, companyId);

    contract.status = 'active';
    contract.signatureDate = new Date();

    // Calcula próxima data de reajuste (para locação)
    if (contract.contractType === 'rent' && contract.startDate) {
      contract.nextReadjustmentDate = this.calculateNextReadjustment(
        contract.startDate,
      );
    }

    const updated = await this.contractRepository.save(contract);

    this.logger.log(`Contrato ${id} ativado`);

    // Emite evento (para iniciar processos - Módulo 6)
    this.eventEmitter.emit('contract.activated', {
      contractId: id,
      companyId,
      contractType: contract.contractType,
      propertyId: contract.propertyId,
      leadId: contract.leadId,
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * Aplicar reajuste de aluguel (Módulo 8.1)
   */
  async applyReadjustment(
    id: string,
    companyId: string,
    indexValue: number, // % do índice (IGP-M, IPCA)
  ): Promise<Contract> {
    const contract = await this.findOne(id, companyId);

    if (contract.contractType !== 'rent') {
      throw new Error('Reajuste apenas para contratos de locação');
    }

    const oldValue = contract.monthlyValue;
    const newValue = oldValue * (1 + indexValue / 100);

    contract.monthlyValue = parseFloat(newValue.toFixed(2));
    contract.lastReadjustmentDate = new Date();
    contract.nextReadjustmentDate = this.calculateNextReadjustment(new Date());

    const updated = await this.contractRepository.save(contract);

    this.logger.log(
      `Reajuste aplicado ao contrato ${id}: R$ ${oldValue} → R$ ${contract.monthlyValue}`,
    );

    // Emite evento
    this.eventEmitter.emit('contract.readjusted', {
      contractId: id,
      companyId,
      oldValue,
      newValue: contract.monthlyValue,
      indexValue,
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * Calcular rescisão (Módulo 9.6)
   */
  async calculateTermination(
    id: string,
    companyId: string,
    terminationDate: Date,
  ): Promise<{
    proportionalRent: number;
    penalty: number;
    total: number;
  }> {
    const contract = await this.findOne(id, companyId);

    if (contract.contractType !== 'rent') {
      throw new Error('Rescisão calculada apenas para locações');
    }

    // Aluguel proporcional
    const daysInMonth = 30;
    const daysUsed = terminationDate.getDate();
    const proportionalRent = (contract.monthlyValue / daysInMonth) * daysUsed;

    // Multa (3 meses se rescindir antes do fim)
    let penalty = 0;
    if (contract.endDate && terminationDate < contract.endDate) {
      penalty = contract.monthlyValue * 3;
    }

    const total = proportionalRent + penalty;

    return {
      proportionalRent: parseFloat(proportionalRent.toFixed(2)),
      penalty: parseFloat(penalty.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };
  }

  /**
   * Terminar contrato
   */
  async terminate(id: string, companyId: string): Promise<Contract> {
    const contract = await this.findOne(id, companyId);

    contract.status = 'terminated';

    const updated = await this.contractRepository.save(contract);

    // Emite evento
    this.eventEmitter.emit('contract.terminated', {
      contractId: id,
      companyId,
      propertyId: contract.propertyId,
      timestamp: new Date(),
    });

    return updated;
  }

  // ========== Métodos auxiliares ==========

  private async generateContractNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.contractRepository.count({
      where: { companyId },
    });
    const sequential = (count + 1).toString().padStart(4, '0');

    return `CONT-${year}-${sequential}`;
  }

  private calculateNextReadjustment(startDate: Date): Date {
    const next = new Date(startDate);
    next.setFullYear(next.getFullYear() + 1);
    return next;
  }
}
