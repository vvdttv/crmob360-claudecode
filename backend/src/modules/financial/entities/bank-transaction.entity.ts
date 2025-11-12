import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Bank Transaction Entity - Module 9.2
 *
 * Transações bancárias importadas via OFX/API
 * - Usadas para conciliação automática
 * - Matching com financial_entries
 */
@Entity('bank_transactions')
@Index(['company_id', 'bank_account_id', 'transaction_date'])
@Index(['company_id', 'status'])
export class BankTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  company_id: string;

  @Column({ type: 'uuid' })
  bank_account_id: string; // Referência à conta bancária (pode ser outra entidade)

  @Column({ type: 'date' })
  transaction_date: Date;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({
    type: 'enum',
    enum: ['credit', 'debit'],
  })
  type: 'credit' | 'debit';

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  balance: number; // Saldo após a transação

  @Column({ type: 'varchar', length: 255, nullable: true })
  document_number: string; // Número do documento/cheque

  @Column({
    type: 'enum',
    enum: ['pending', 'reconciled', 'ignored'],
    default: 'pending',
  })
  status: 'pending' | 'reconciled' | 'ignored';

  // Conciliação
  @Column({ type: 'uuid', nullable: true })
  financial_entry_id: string; // Lançamento conciliado

  @Column({ type: 'timestamp', nullable: true })
  reconciled_at: Date;

  @Column({ type: 'uuid', nullable: true })
  reconciled_by: string; // user_id

  // Importação
  @Column({ type: 'varchar', length: 100, nullable: true })
  import_batch_id: string; // ID do lote de importação

  @Column({
    type: 'enum',
    enum: ['ofx', 'api', 'manual'],
    default: 'manual',
  })
  import_source: 'ofx' | 'api' | 'manual';

  @Column({ type: 'varchar', length: 255, nullable: true })
  bank_reference: string; // ID único do banco

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
