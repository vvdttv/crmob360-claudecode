import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FinancialEntry } from '../entities/financial-entry.entity';
import { ChartOfAccounts } from '../entities/chart-of-accounts.entity';
import { CostCenter } from '../entities/cost-center.entity';

/**
 * Financial Service - Module 9
 *
 * Gestão Financeira Completa:
 * - Contas a Pagar e Receber (9.1)
 * - Cálculo de DRE (9.4)
 * - Controle de Inadimplência (9.5)
 * - Integração com Comissões (Module 8)
 */
@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(FinancialEntry)
    private readonly entryRepository: Repository<FinancialEntry>,
    @InjectRepository(ChartOfAccounts)
    private readonly accountRepository: Repository<ChartOfAccounts>,
    @InjectRepository(CostCenter)
    private readonly costCenterRepository: Repository<CostCenter>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create Financial Entry
   * Origem: manual, commission, rent, contract
   */
  async createEntry(
    companyId: string,
    data: {
      type: 'receivable' | 'payable';
      description: string;
      amount: number;
      due_date: Date;
      account_id: string;
      cost_center_id?: string;
      person_id?: string;
      person_type?: string;
      origin_type: string;
      origin_id?: string;
      installment_number?: number;
      total_installments?: number;
      payment_method?: string;
      notes?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<FinancialEntry> {
    // Validate account exists and accepts entries
    const account = await this.accountRepository.findOne({
      where: { id: data.account_id, company_id: companyId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    if (!account.accept_entries) {
      throw new Error('This account does not accept direct entries');
    }

    // Create entry
    const entry = this.entryRepository.create({
      company_id: companyId,
      ...data,
      status: 'pending',
    });

    const savedEntry = await this.entryRepository.save(entry);

    // Emit event
    this.eventEmitter.emit('financial.entry.created', {
      companyId,
      entry: savedEntry,
    });

    return savedEntry;
  }

  /**
   * Create Financial Entry from Commission (Module 8 integration)
   * Chamado quando uma comissão é calculada
   */
  async createFromCommission(
    companyId: string,
    commissionId: string,
    data: {
      user_id: string;
      amount: number;
      contract_id: string;
      due_date: Date;
    },
  ): Promise<FinancialEntry> {
    // Find commission expense account
    const commissionAccount = await this.accountRepository.findOne({
      where: {
        company_id: companyId,
        type: 'expense',
        name: 'Comissões',
      },
    });

    if (!commissionAccount) {
      throw new NotFoundException(
        'Commission expense account not found. Please configure Chart of Accounts.',
      );
    }

    return this.createEntry(companyId, {
      type: 'payable',
      description: `Comissão - Contrato ${data.contract_id}`,
      amount: data.amount,
      due_date: data.due_date,
      account_id: commissionAccount.id,
      person_id: data.user_id,
      person_type: 'user',
      origin_type: 'commission',
      origin_id: commissionId,
    });
  }

  /**
   * Register Payment
   * Marca lançamento como pago
   */
  async registerPayment(
    companyId: string,
    entryId: string,
    data: {
      paid_at: Date;
      paid_amount: number;
      payment_method: string;
      discount?: number;
      interest?: number;
      fine?: number;
      notes?: string;
    },
  ): Promise<FinancialEntry> {
    const entry = await this.entryRepository.findOne({
      where: { id: entryId, company_id: companyId },
    });

    if (!entry) {
      throw new NotFoundException('Financial entry not found');
    }

    // Update entry
    entry.status = 'paid';
    entry.paid_at = data.paid_at;
    entry.paid_amount = data.paid_amount;
    entry.payment_method = data.payment_method as any;
    entry.discount = data.discount || 0;
    entry.interest = data.interest || 0;
    entry.fine = data.fine || 0;
    if (data.notes) {
      entry.notes = data.notes;
    }

    const savedEntry = await this.entryRepository.save(entry);

    // Emit event
    this.eventEmitter.emit('financial.entry.paid', {
      companyId,
      entry: savedEntry,
    });

    return savedEntry;
  }

  /**
   * Mark Overdue Entries
   * Atualiza status de lançamentos vencidos (executar diariamente via cron)
   */
  async markOverdueEntries(companyId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.entryRepository.update(
      {
        company_id: companyId,
        status: 'pending',
        due_date: Between(new Date('2000-01-01'), today),
      },
      {
        status: 'overdue',
      },
    );

    // Emit event for each overdue entry
    if (result.affected > 0) {
      this.eventEmitter.emit('financial.entries.overdue', {
        companyId,
        count: result.affected,
      });
    }

    return result.affected;
  }

  /**
   * Get Overdue Report (Module 9.5)
   * Relatório de inadimplência
   */
  async getOverdueReport(companyId: string): Promise<{
    total_overdue: number;
    total_amount: number;
    entries: FinancialEntry[];
  }> {
    const entries = await this.entryRepository.find({
      where: {
        company_id: companyId,
        status: 'overdue',
        type: 'receivable',
      },
      order: { due_date: 'ASC' },
      relations: ['account', 'cost_center'],
    });

    const total_amount = entries.reduce(
      (sum, entry) => sum + Number(entry.amount),
      0,
    );

    return {
      total_overdue: entries.length,
      total_amount,
      entries,
    };
  }

  /**
   * Calculate DRE (Module 9.4)
   * Demonstrativo de Resultado do Exercício
   * Formato simplificado: Receitas - Despesas = Resultado
   */
  async calculateDRE(
    companyId: string,
    startDate: Date,
    endDate: Date,
    costCenterId?: string,
  ): Promise<{
    period: { start: Date; end: Date };
    cost_center?: string;
    revenue: {
      total: number;
      accounts: Array<{ account: string; amount: number }>;
    };
    expenses: {
      total: number;
      accounts: Array<{ account: string; amount: number }>;
    };
    net_income: number;
  }> {
    // Build query
    const whereClause: any = {
      company_id: companyId,
      status: 'paid',
      paid_at: Between(startDate, endDate),
    };

    if (costCenterId) {
      whereClause.cost_center_id = costCenterId;
    }

    // Get all paid entries in period
    const entries = await this.entryRepository.find({
      where: whereClause,
      relations: ['account'],
    });

    // Separate revenue and expenses
    const revenues = entries.filter((e) => e.type === 'receivable');
    const expenses = entries.filter((e) => e.type === 'payable');

    // Group by account
    const revenueByAccount = this.groupByAccount(revenues);
    const expensesByAccount = this.groupByAccount(expenses);

    // Calculate totals
    const totalRevenue = revenues.reduce(
      (sum, e) => sum + Number(e.paid_amount || e.amount),
      0,
    );
    const totalExpenses = expenses.reduce(
      (sum, e) => sum + Number(e.paid_amount || e.amount),
      0,
    );

    return {
      period: { start: startDate, end: endDate },
      cost_center: costCenterId,
      revenue: {
        total: totalRevenue,
        accounts: revenueByAccount,
      },
      expenses: {
        total: totalExpenses,
        accounts: expensesByAccount,
      },
      net_income: totalRevenue - totalExpenses,
    };
  }

  private groupByAccount(
    entries: FinancialEntry[],
  ): Array<{ account: string; amount: number }> {
    const grouped = entries.reduce((acc, entry) => {
      const accountName = entry.account?.name || 'Sem Conta';
      if (!acc[accountName]) {
        acc[accountName] = 0;
      }
      acc[accountName] += Number(entry.paid_amount || entry.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([account, amount]) => ({ account, amount }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Get Cash Flow
   * Fluxo de caixa projetado (pendentes) + realizado (pagos)
   */
  async getCashFlow(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    period: { start: Date; end: Date };
    projected: { revenue: number; expenses: number; balance: number };
    realized: { revenue: number; expenses: number; balance: number };
  }> {
    // Projected (pending entries)
    const pendingEntries = await this.entryRepository.find({
      where: {
        company_id: companyId,
        status: In(['pending', 'overdue']),
        due_date: Between(startDate, endDate),
      },
    });

    const projectedRevenue = pendingEntries
      .filter((e) => e.type === 'receivable')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const projectedExpenses = pendingEntries
      .filter((e) => e.type === 'payable')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Realized (paid entries)
    const paidEntries = await this.entryRepository.find({
      where: {
        company_id: companyId,
        status: 'paid',
        paid_at: Between(startDate, endDate),
      },
    });

    const realizedRevenue = paidEntries
      .filter((e) => e.type === 'receivable')
      .reduce((sum, e) => sum + Number(e.paid_amount || e.amount), 0);

    const realizedExpenses = paidEntries
      .filter((e) => e.type === 'payable')
      .reduce((sum, e) => sum + Number(e.paid_amount || e.amount), 0);

    return {
      period: { start: startDate, end: endDate },
      projected: {
        revenue: projectedRevenue,
        expenses: projectedExpenses,
        balance: projectedRevenue - projectedExpenses,
      },
      realized: {
        revenue: realizedRevenue,
        expenses: realizedExpenses,
        balance: realizedRevenue - realizedExpenses,
      },
    };
  }

  /**
   * Find all entries
   */
  async findAll(
    companyId: string,
    filters?: {
      type?: 'receivable' | 'payable';
      status?: string;
      start_date?: Date;
      end_date?: Date;
      person_id?: string;
      account_id?: string;
      cost_center_id?: string;
    },
  ): Promise<FinancialEntry[]> {
    const where: any = { company_id: companyId };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.person_id) where.person_id = filters.person_id;
    if (filters?.account_id) where.account_id = filters.account_id;
    if (filters?.cost_center_id) where.cost_center_id = filters.cost_center_id;

    if (filters?.start_date && filters?.end_date) {
      where.due_date = Between(filters.start_date, filters.end_date);
    }

    return this.entryRepository.find({
      where,
      relations: ['account', 'cost_center'],
      order: { due_date: 'DESC' },
    });
  }

  /**
   * Find entry by ID
   */
  async findOne(companyId: string, id: string): Promise<FinancialEntry> {
    const entry = await this.entryRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['account', 'cost_center'],
    });

    if (!entry) {
      throw new NotFoundException('Financial entry not found');
    }

    return entry;
  }

  /**
   * Cancel entry
   */
  async cancelEntry(companyId: string, id: string): Promise<FinancialEntry> {
    const entry = await this.findOne(companyId, id);

    if (entry.status === 'paid') {
      throw new Error('Cannot cancel a paid entry');
    }

    entry.status = 'canceled';
    return this.entryRepository.save(entry);
  }
}
