import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BankTransaction } from '../entities/bank-transaction.entity';
import { FinancialEntry } from '../entities/financial-entry.entity';

/**
 * Bank Reconciliation Service - Module 9.2
 *
 * Conciliação Bancária Automática:
 * - Import OFX/API (Pluggy, Open Banking)
 * - Automatic matching com financial_entries
 * - Match por valor, data, descrição
 * - Sugestões de conciliação
 */
@Injectable()
export class BankReconciliationService {
  constructor(
    @InjectRepository(BankTransaction)
    private readonly transactionRepository: Repository<BankTransaction>,
    @InjectRepository(FinancialEntry)
    private readonly entryRepository: Repository<FinancialEntry>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Import Bank Transactions
   * Importa transações de arquivo OFX ou API bancária
   */
  async importTransactions(
    companyId: string,
    bankAccountId: string,
    transactions: Array<{
      transaction_date: Date;
      description: string;
      type: 'credit' | 'debit';
      amount: number;
      balance?: number;
      document_number?: string;
      bank_reference?: string;
    }>,
    source: 'ofx' | 'api' | 'manual',
  ): Promise<BankTransaction[]> {
    const importBatchId = `IMPORT-${Date.now()}`;

    const created = [];
    for (const txData of transactions) {
      // Check if transaction already exists (avoid duplicates)
      if (txData.bank_reference) {
        const exists = await this.transactionRepository.findOne({
          where: {
            company_id: companyId,
            bank_account_id: bankAccountId,
            bank_reference: txData.bank_reference,
          },
        });
        if (exists) continue;
      }

      const transaction = this.transactionRepository.create({
        company_id: companyId,
        bank_account_id: bankAccountId,
        ...txData,
        import_source: source,
        import_batch_id: importBatchId,
        status: 'pending',
      });

      const saved = await this.transactionRepository.save(transaction);
      created.push(saved);
    }

    // Emit event for automatic reconciliation
    if (created.length > 0) {
      this.eventEmitter.emit('bank.transactions.imported', {
        companyId,
        bankAccountId,
        count: created.length,
        importBatchId,
      });

      // Try automatic reconciliation
      await this.autoReconcile(companyId, created.map((t) => t.id));
    }

    return created;
  }

  /**
   * Auto Reconcile
   * Tenta conciliar automaticamente baseado em:
   * - Valor exato + data próxima (±3 dias)
   * - Similarity de descrição
   */
  async autoReconcile(
    companyId: string,
    transactionIds: string[],
  ): Promise<{ reconciled: number; suggestions: number }> {
    let reconciled = 0;
    let suggestions = 0;

    for (const txId of transactionIds) {
      const transaction = await this.transactionRepository.findOne({
        where: { id: txId, company_id: companyId },
      });

      if (!transaction || transaction.status !== 'pending') continue;

      // Match criteria
      const dateRangeStart = new Date(transaction.transaction_date);
      dateRangeStart.setDate(dateRangeStart.getDate() - 3);
      const dateRangeEnd = new Date(transaction.transaction_date);
      dateRangeEnd.setDate(dateRangeEnd.getDate() + 3);

      const entryType =
        transaction.type === 'credit' ? 'receivable' : 'payable';

      // Find matching entries
      const matchingEntries = await this.entryRepository.find({
        where: {
          company_id: companyId,
          type: entryType,
          amount: transaction.amount,
          due_date: Between(dateRangeStart, dateRangeEnd),
          status: 'pending',
          bank_transaction_id: IsNull(),
        },
      });

      // If exact match (1 entry), auto reconcile
      if (matchingEntries.length === 1) {
        await this.reconcile(companyId, txId, matchingEntries[0].id, null);
        reconciled++;
      } else if (matchingEntries.length > 1) {
        // Multiple matches - store as suggestions (could be in metadata)
        transaction.metadata = {
          ...transaction.metadata,
          suggested_entries: matchingEntries.map((e) => e.id),
        };
        await this.transactionRepository.save(transaction);
        suggestions++;
      }
    }

    return { reconciled, suggestions };
  }

  /**
   * Manual Reconcile
   * Conciliação manual pelo usuário
   */
  async reconcile(
    companyId: string,
    transactionId: string,
    entryId: string,
    userId: string | null,
  ): Promise<{ transaction: BankTransaction; entry: FinancialEntry }> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, company_id: companyId },
    });

    if (!transaction) {
      throw new NotFoundException('Bank transaction not found');
    }

    const entry = await this.entryRepository.findOne({
      where: { id: entryId, company_id: companyId },
    });

    if (!entry) {
      throw new NotFoundException('Financial entry not found');
    }

    // Validate type matches
    if (
      (transaction.type === 'credit' && entry.type !== 'receivable') ||
      (transaction.type === 'debit' && entry.type !== 'payable')
    ) {
      throw new Error('Transaction type does not match entry type');
    }

    // Update transaction
    transaction.status = 'reconciled';
    transaction.financial_entry_id = entryId;
    transaction.reconciled_at = new Date();
    transaction.reconciled_by = userId;

    // Update entry
    entry.status = 'paid';
    entry.paid_at = transaction.transaction_date;
    entry.paid_amount = Number(transaction.amount);
    entry.bank_transaction_id = transactionId;
    entry.reconciled_at = new Date();
    entry.reconciled_by = userId;

    await this.transactionRepository.save(transaction);
    await this.entryRepository.save(entry);

    // Emit event
    this.eventEmitter.emit('bank.reconciliation.completed', {
      companyId,
      transactionId,
      entryId,
    });

    return { transaction, entry };
  }

  /**
   * Get Pending Reconciliation
   * Lista transações bancárias aguardando conciliação
   */
  async getPendingReconciliation(
    companyId: string,
    bankAccountId?: string,
  ): Promise<BankTransaction[]> {
    const where: any = {
      company_id: companyId,
      status: 'pending',
    };

    if (bankAccountId) {
      where.bank_account_id = bankAccountId;
    }

    return this.transactionRepository.find({
      where,
      order: { transaction_date: 'DESC' },
    });
  }

  /**
   * Get Suggestions
   * Busca sugestões de conciliação para uma transação
   */
  async getSuggestions(
    companyId: string,
    transactionId: string,
  ): Promise<FinancialEntry[]> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, company_id: companyId },
    });

    if (!transaction) {
      throw new NotFoundException('Bank transaction not found');
    }

    const dateRangeStart = new Date(transaction.transaction_date);
    dateRangeStart.setDate(dateRangeStart.getDate() - 7);
    const dateRangeEnd = new Date(transaction.transaction_date);
    dateRangeEnd.setDate(dateRangeEnd.getDate() + 7);

    const entryType = transaction.type === 'credit' ? 'receivable' : 'payable';

    return this.entryRepository.find({
      where: {
        company_id: companyId,
        type: entryType,
        status: 'pending',
        due_date: Between(dateRangeStart, dateRangeEnd),
        bank_transaction_id: IsNull(),
      },
      relations: ['account'],
      order: { due_date: 'ASC' },
      take: 10,
    });
  }

  /**
   * Ignore Transaction
   * Marca transação como ignorada (ex: transferência interna)
   */
  async ignoreTransaction(
    companyId: string,
    transactionId: string,
  ): Promise<BankTransaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, company_id: companyId },
    });

    if (!transaction) {
      throw new NotFoundException('Bank transaction not found');
    }

    transaction.status = 'ignored';
    return this.transactionRepository.save(transaction);
  }
}
