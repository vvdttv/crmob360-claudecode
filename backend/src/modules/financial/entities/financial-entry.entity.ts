import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ChartOfAccounts } from './chart-of-accounts.entity';
import { CostCenter } from './cost-center.entity';

/**
 * Financial Entry Entity - Module 9.1
 *
 * Lançamentos Financeiros (Contas a Pagar e Receber)
 * - Origem: manual, comissão, aluguel, boleto
 * - Status: pending, paid, overdue, canceled
 * - Parcelamento (installment_number)
 * - Conciliação bancária (reconciled_at)
 */
@Entity('financial_entries')
@Index(['company_id', 'status'])
@Index(['company_id', 'type', 'due_date'])
@Index(['company_id', 'origin_type', 'origin_id'])
export class FinancialEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  company_id: string;

  @Column({
    type: 'enum',
    enum: ['receivable', 'payable'],
  })
  type: 'receivable' | 'payable';

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  due_date: Date;

  @Column({ type: 'date', nullable: true })
  paid_at: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'overdue', 'canceled'],
    default: 'pending',
  })
  status: 'pending' | 'paid' | 'overdue' | 'canceled';

  // Origem do lançamento
  @Column({
    type: 'enum',
    enum: ['manual', 'commission', 'rent', 'boleto', 'contract', 'service'],
  })
  origin_type: 'manual' | 'commission' | 'rent' | 'boleto' | 'contract' | 'service';

  @Column({ type: 'uuid', nullable: true })
  origin_id: string; // ID da comissão, contrato, etc.

  // Relacionamento com Plano de Contas
  @Column({ type: 'uuid' })
  account_id: string;

  @ManyToOne(() => ChartOfAccounts)
  @JoinColumn({ name: 'account_id' })
  account: ChartOfAccounts;

  // Relacionamento com Centro de Custo
  @Column({ type: 'uuid', nullable: true })
  cost_center_id: string;

  @ManyToOne(() => CostCenter, { nullable: true })
  @JoinColumn({ name: 'cost_center_id' })
  cost_center: CostCenter;

  // Pessoa relacionada (cliente, fornecedor, inquilino)
  @Column({ type: 'uuid', nullable: true })
  person_id: string;

  @Column({
    type: 'enum',
    enum: ['client', 'lead', 'owner', 'tenant', 'supplier'],
    nullable: true,
  })
  person_type: 'client' | 'lead' | 'owner' | 'tenant' | 'supplier' | null;

  // Parcelamento
  @Column({ type: 'int', nullable: true })
  installment_number: number; // e.g., 1 de 12

  @Column({ type: 'int', nullable: true })
  total_installments: number;

  @Column({ type: 'uuid', nullable: true })
  parent_entry_id: string; // Para vincular parcelas

  // Pagamento
  @Column({
    type: 'enum',
    enum: ['money', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'boleto', 'check'],
    nullable: true,
  })
  payment_method: 'money' | 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'boleto' | 'check' | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  paid_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  interest: number; // Juros de atraso

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  fine: number; // Multa

  // Conciliação Bancária (Module 9.2)
  @Column({ type: 'uuid', nullable: true })
  bank_transaction_id: string;

  @Column({ type: 'timestamp', nullable: true })
  reconciled_at: Date;

  @Column({ type: 'uuid', nullable: true })
  reconciled_by: string; // user_id

  // Boleto (Module 9.3)
  @Column({ type: 'varchar', length: 255, nullable: true })
  boleto_url: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  boleto_barcode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  boleto_id: string; // ID no gateway

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
