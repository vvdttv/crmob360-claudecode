import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { PipelineStage } from './pipeline-stage.entity';

/**
 * Pipeline Entity - Módulo 1.1 (Funil de Vendas)
 *
 * Representa um funil de vendas configurável
 */
@Entity('pipelines')
export class Pipeline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  @Index()
  companyId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'sales' })
  type: 'sales' | 'rental' | 'captacao';

  @Column({ type: 'integer', name: 'display_order', default: 0 })
  displayOrder: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PipelineStage, (stage) => stage.pipeline)
  stages: PipelineStage[];
}
