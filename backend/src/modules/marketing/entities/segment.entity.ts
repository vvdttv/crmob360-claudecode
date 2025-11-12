import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Segment Entity - Module 2.2
 *
 * Segmentação de Leads/Clientes
 * - Filtros dinâmicos
 * - Atualização automática
 * - Contagem de membros
 */
@Entity('segments')
@Index(['company_id', 'type'])
export class Segment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  company_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['leads', 'clients', 'both'],
    default: 'leads',
  })
  type: 'leads' | 'clients' | 'both';

  // Filtros de segmentação
  @Column({ type: 'jsonb' })
  filters: {
    // Lead/Client filters
    status?: string[];
    tags?: string[];
    source?: string[];
    created_after?: string;
    created_before?: string;
    last_interaction_after?: string;

    // Property interest filters
    property_type?: string[];
    min_budget?: number;
    max_budget?: number;
    bedrooms?: number[];
    city?: string[];
    neighborhood?: string[];

    // Behavior filters
    opened_email_campaigns?: string[]; // IDs de campanhas que abriram
    clicked_email_campaigns?: string[];
    visited_properties?: string[];

    // Custom fields
    custom?: Record<string, any>;
  };

  @Column({
    type: 'enum',
    enum: ['static', 'dynamic'],
    default: 'dynamic',
  })
  update_mode: 'static' | 'dynamic'; // static = lista fixa, dynamic = atualiza automaticamente

  @Column({ type: 'int', default: 0 })
  member_count: number; // Calculado automaticamente

  @Column({ type: 'timestamp', nullable: true })
  last_calculated_at: Date;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'uuid' })
  created_by_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
