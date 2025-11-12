import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Pipeline } from './pipeline.entity';
import { PipelineStage } from './pipeline-stage.entity';
import { Activity } from './activity.entity';

/**
 * Lead Entity - Módulo 1 (CRM)
 *
 * Representa um cliente/prospect no sistema.
 * Core do funil de vendas.
 */
@Entity('leads')
@Index(['companyId'])
@Index(['pipelineId', 'stageId'])
@Index(['assignedUserId'])
@Index(['source'])
@Index(['leadScore'])
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  @Index()
  companyId: string;

  @Column({ type: 'uuid', name: 'pipeline_id', nullable: true })
  pipelineId: string;

  @ManyToOne(() => Pipeline, { nullable: true })
  @JoinColumn({ name: 'pipeline_id' })
  pipeline: Pipeline;

  @Column({ type: 'uuid', name: 'stage_id', nullable: true })
  stageId: string;

  @ManyToOne(() => PipelineStage, { nullable: true })
  @JoinColumn({ name: 'stage_id' })
  stage: PipelineStage;

  @Column({ type: 'uuid', name: 'assigned_user_id', nullable: true })
  @Index()
  assignedUserId: string;

  // Dados pessoais
  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  document: string; // CPF

  @Column({ type: 'date', name: 'birth_date', nullable: true })
  birthDate: Date;

  // Endereço
  @Column({ type: 'varchar', length: 255, name: 'address_street', nullable: true })
  addressStreet: string;

  @Column({ type: 'varchar', length: 20, name: 'address_number', nullable: true })
  addressNumber: string;

  @Column({ type: 'varchar', length: 100, name: 'address_complement', nullable: true })
  addressComplement: string;

  @Column({ type: 'varchar', length: 100, name: 'address_neighborhood', nullable: true })
  addressNeighborhood: string;

  @Column({ type: 'varchar', length: 100, name: 'address_city', nullable: true })
  addressCity: string;

  @Column({ type: 'varchar', length: 2, name: 'address_state', nullable: true })
  addressState: string;

  @Column({ type: 'varchar', length: 10, name: 'address_zipcode', nullable: true })
  addressZipcode: string;

  // Perfil de busca (para matching - Módulo 1.4)
  @Column({ type: 'jsonb', name: 'search_profile', default: {} })
  searchProfile: {
    propertyType?: string; // apartment, house, etc
    transactionType?: string; // sale, rent
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    neighborhoods?: string[];
    features?: string[];
  };

  // Metadados
  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  source: string; // facebook, google, zap, site, indicacao

  @Column({ type: 'text', name: 'source_detail', nullable: true })
  sourceDetail: string;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'integer', name: 'lead_score', default: 0 })
  @Index()
  leadScore: number; // Pontuação IA (Módulo 4.1)

  @Column({ type: 'varchar', length: 20, default: 'cold' })
  temperature: 'hot' | 'warm' | 'cold';

  // Controle
  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', name: 'last_contact_at', nullable: true })
  lastContactAt: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Activity, (activity) => activity.lead)
  activities: Activity[];
}
