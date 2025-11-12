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

/**
 * Chart of Accounts Entity - Module 9.1
 *
 * Plano de Contas Gerencial customizável
 * - Estrutura hierárquica (parent_id)
 * - Classificação: Receita, Despesa, Ativo, Passivo
 * - Aceita lançamentos diretos (accept_entries)
 */
@Entity('chart_of_accounts')
@Index(['company_id', 'code'])
@Index(['company_id', 'type'])
export class ChartOfAccounts {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  company_id: string;

  @Column({ type: 'varchar', length: 50 })
  code: string; // e.g., "1.1.01" (hierarchical code)

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: ['revenue', 'expense', 'asset', 'liability', 'equity'],
  })
  type: 'revenue' | 'expense' | 'asset' | 'liability' | 'equity';

  @Column({ type: 'uuid', nullable: true })
  parent_id: string | null;

  @ManyToOne(() => ChartOfAccounts, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: ChartOfAccounts;

  @Column({ type: 'boolean', default: true })
  accept_entries: boolean; // true = analítica (aceita lançamentos), false = sintética

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
