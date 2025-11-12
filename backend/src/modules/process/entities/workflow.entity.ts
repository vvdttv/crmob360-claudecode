import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('workflows')
@Index(['company_id', 'status'])
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  company_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['active', 'paused', 'draft'], default: 'draft' })
  status: 'active' | 'paused' | 'draft';

  @Column({ type: 'enum', enum: ['lead_created', 'lead_status_changed', 'contract_signed', 'payment_received', 'manual'] })
  trigger: string;

  @Column({ type: 'jsonb' })
  actions: Array<{
    order: number;
    type: 'send_email' | 'create_task' | 'update_field' | 'webhook' | 'wait';
    config: Record<string, any>;
    delay_hours?: number;
  }>;

  @Column({ type: 'int', default: 0 })
  execution_count: number;

  @Column({ type: 'uuid' })
  created_by_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
