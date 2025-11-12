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
import { User } from './user.entity';
import { Team } from './team.entity';

/**
 * Goal Entity - Module 4.4
 *
 * Metas individuais e de equipe
 * - Métricas: vendas, leads, contratos, receita
 * - Período: mensal, trimestral, anual
 * - Acompanhamento de progresso
 */
@Entity('goals')
@Index(['company_id', 'period_start', 'period_end'])
@Index(['company_id', 'user_id'])
@Index(['company_id', 'team_id'])
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  company_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Tipo de meta
  @Column({
    type: 'enum',
    enum: ['individual', 'team', 'company'],
  })
  type: 'individual' | 'team' | 'company';

  // Métrica
  @Column({
    type: 'enum',
    enum: [
      'revenue',
      'contracts',
      'leads',
      'properties_sold',
      'properties_rented',
      'commissions',
      'custom',
    ],
  })
  metric:
    | 'revenue'
    | 'contracts'
    | 'leads'
    | 'properties_sold'
    | 'properties_rented'
    | 'commissions'
    | 'custom';

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  target_value: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  current_value: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string; // e.g., "BRL", "units", "contracts"

  // Período
  @Column({ type: 'date' })
  period_start: Date;

  @Column({ type: 'date' })
  period_end: Date;

  @Column({
    type: 'enum',
    enum: ['monthly', 'quarterly', 'yearly', 'custom'],
  })
  period_type: 'monthly' | 'quarterly' | 'yearly' | 'custom';

  // Assignee
  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  team_id: string;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  // Status
  @Column({
    type: 'enum',
    enum: ['active', 'completed', 'failed', 'canceled'],
    default: 'active',
  })
  status: 'active' | 'completed' | 'failed' | 'canceled';

  // Progress tracking
  @Column({ type: 'int', default: 0 })
  progress_percentage: number; // 0-100

  @Column({ type: 'timestamp', nullable: true })
  last_updated_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  history: Array<{
    date: string;
    value: number;
    percentage: number;
  }>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
