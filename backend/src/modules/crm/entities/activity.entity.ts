import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lead } from './lead.entity';

/**
 * Activity Entity - Módulo 1.6 (Timeline de Atividades)
 *
 * Registra todas as interações com o lead
 */
@Entity('activities')
@Index(['leadId'])
@Index(['userId'])
@Index(['scheduledAt'])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'uuid', name: 'lead_id', nullable: true })
  @Index()
  leadId: string;

  @ManyToOne(() => Lead, (lead) => lead.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 50, name: 'activity_type' })
  activityType: 'call' | 'email' | 'visit' | 'whatsapp' | 'meeting' | 'task';

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamptz', name: 'scheduled_at', nullable: true })
  @Index()
  scheduledAt: Date;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: 'pending' | 'completed' | 'cancelled';

  // Para visitas (Módulo 1.5)
  @Column({ type: 'uuid', name: 'property_id', nullable: true })
  propertyId: string;

  @Column({ type: 'text', name: 'location_address', nullable: true })
  locationAddress: string;

  @Column({ type: 'integer', name: 'duration_minutes', nullable: true })
  durationMinutes: number;

  // Arquivos anexos
  @Column({ type: 'jsonb', default: [] })
  attachments: Array<{
    url: string;
    type: string;
    name: string;
  }>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
