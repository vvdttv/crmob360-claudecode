import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Pipeline } from './pipeline.entity';

/**
 * Pipeline Stage Entity - Módulo 1.1 (Etapas do Funil)
 *
 * Representa uma etapa dentro de um funil
 */
@Entity('pipeline_stages')
export class PipelineStage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'pipeline_id' })
  pipelineId: string;

  @ManyToOne(() => Pipeline, (pipeline) => pipeline.stages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pipeline_id' })
  pipeline: Pipeline;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'integer', name: 'display_order' })
  displayOrder: number;

  @Column({ type: 'varchar', length: 7, default: '#3B82F6' })
  color: string;

  // Gatilhos de automação (Módulo 1.1 - spec)
  @Column({ type: 'jsonb', name: 'automation_triggers', default: [] })
  automationTriggers: Array<{
    action: string;
    condition: string;
  }>;

  // Campos obrigatórios para avançar para esta etapa
  @Column({ type: 'jsonb', name: 'required_fields', default: [] })
  requiredFields: string[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
