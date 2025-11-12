import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Automation Flow Entry Entity - Module 2.3
 *
 * Acompanhamento de cada pessoa em um fluxo de automação
 * - Status atual
 * - Próximo step
 * - Histórico de execução
 */
@Entity('automation_flow_entries')
@Index(['company_id', 'flow_id'])
@Index(['company_id', 'person_id'])
@Index(['company_id', 'status'])
export class AutomationFlowEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  company_id: string;

  @Column({ type: 'uuid' })
  flow_id: string;

  // Person in flow
  @Column({ type: 'uuid' })
  person_id: string;

  @Column({
    type: 'enum',
    enum: ['lead', 'client'],
  })
  person_type: 'lead' | 'client';

  @Column({
    type: 'enum',
    enum: ['active', 'completed', 'exited', 'failed'],
    default: 'active',
  })
  status: 'active' | 'completed' | 'exited' | 'failed';

  // Current step
  @Column({ type: 'varchar', length: 100 })
  current_step_id: string;

  @Column({ type: 'int', default: 0 })
  current_step_order: number;

  @Column({ type: 'timestamp', nullable: true })
  next_execution_at: Date; // Quando executar próximo step

  // History
  @Column({ type: 'jsonb', default: [] })
  execution_history: Array<{
    step_id: string;
    step_order: number;
    executed_at: string;
    action: string;
    success: boolean;
    error?: string;
    metadata?: Record<string, any>;
  }>;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  exited_at: Date;

  @Column({ type: 'text', nullable: true })
  exit_reason: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
