import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Commission Entity - Módulo 8.4
 *
 * Comissões calculadas automaticamente
 */
@Entity('commissions')
@Index(['companyId'])
@Index(['contractId'])
@Index(['recipientUserId'])
@Index(['status'])
export class Commission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  @Index()
  companyId: string;

  @Column({ type: 'uuid', name: 'contract_id', nullable: true })
  @Index()
  contractId: string;

  @Column({ type: 'uuid', name: 'proposal_id', nullable: true })
  proposalId: string;

  @Column({ type: 'varchar', length: 20, name: 'transaction_type' })
  transactionType: 'sale' | 'rent';

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'transaction_value' })
  transactionValue: number;

  // Divisão de comissão
  @Column({ type: 'uuid', name: 'recipient_user_id', nullable: true })
  @Index()
  recipientUserId: string; // Corretor que recebe

  @Column({ type: 'varchar', length: 50, name: 'role_in_transaction' })
  roleInTransaction: 'seller' | 'capturer' | 'manager' | 'company';

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage: number; // % da comissão

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'commission_value' })
  commissionValue: number; // Valor calculado

  // Integração com financeiro (Módulo 9)
  @Column({ type: 'uuid', name: 'financial_entry_id', nullable: true })
  financialEntryId: string; // FK para financial_entries

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  @Index()
  status: 'pending' | 'approved' | 'paid' | 'cancelled';

  @Column({ type: 'date', name: 'due_date', nullable: true })
  dueDate: Date;

  @Column({ type: 'timestamptz', name: 'paid_at', nullable: true })
  paidAt: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
