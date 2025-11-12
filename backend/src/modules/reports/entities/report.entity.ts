import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('reports')
@Index(['company_id', 'type'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  company_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: ['dashboard', 'sales', 'financial', 'marketing', 'properties', 'custom'] })
  type: string;

  @Column({ type: 'jsonb' })
  config: {
    metrics: string[];
    filters: Record<string, any>;
    groupBy?: string;
    dateRange?: { start: string; end: string };
  };

  @Column({ type: 'jsonb', nullable: true })
  cached_data: any;

  @Column({ type: 'timestamp', nullable: true })
  last_generated_at: Date;

  @Column({ type: 'uuid' })
  created_by_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
