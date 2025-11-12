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

/**
 * Team Entity - Module 4.2
 *
 * Equipes/Times de trabalho
 * - Organização por região, produto, função
 * - Cada equipe tem um líder
 * - Metas de equipe
 */
@Entity('teams')
@Index(['company_id', 'name'])
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  company_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Team Leader
  @Column({ type: 'uuid', nullable: true })
  leader_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'leader_id' })
  leader: User;

  @Column({
    type: 'enum',
    enum: ['sales', 'support', 'operations', 'management', 'custom'],
    default: 'custom',
  })
  type: 'sales' | 'support' | 'operations' | 'management' | 'custom';

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string; // e.g., "São Paulo - Zona Sul"

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    color?: string;
    icon?: string;
    goals?: Array<{
      metric: string;
      target: number;
      period: string;
    }>;
  };

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
