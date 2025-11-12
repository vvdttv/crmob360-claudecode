import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Cost Center Entity - Module 9.4
 *
 * Centros de Custo para análise gerencial
 * - Por filial, departamento, projeto, imóvel
 * - Usados no DRE para análise detalhada
 */
@Entity('cost_centers')
@Index(['company_id', 'code'])
export class CostCenter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  company_id: string;

  @Column({ type: 'varchar', length: 50 })
  code: string; // e.g., "CC-001"

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: ['branch', 'department', 'project', 'property'],
    nullable: true,
  })
  type: 'branch' | 'department' | 'project' | 'property' | null;

  @Column({ type: 'uuid', nullable: true })
  reference_id: string; // ID da filial, projeto, ou property

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
