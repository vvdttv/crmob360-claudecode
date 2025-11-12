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

/**
 * Campaign Entity - Module 2.1
 *
 * Campanhas de Marketing Multi-Canal:
 * - Email, WhatsApp, SMS
 * - Segmentação de público
 * - Agendamento e automação
 * - Métricas de performance
 * - LGPD compliance (Master Switch check)
 */
@Entity('campaigns')
@Index(['company_id', 'status'])
@Index(['company_id', 'channel'])
@Index(['company_id', 'scheduled_at'])
export class Campaign {
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
    enum: ['email', 'whatsapp', 'sms'],
  })
  channel: 'email' | 'whatsapp' | 'sms';

  @Column({
    type: 'enum',
    enum: ['draft', 'scheduled', 'sending', 'sent', 'canceled'],
    default: 'draft',
  })
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'canceled';

  // Template
  @Column({ type: 'uuid', nullable: true })
  template_id: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  subject: string; // Para email

  @Column({ type: 'text' })
  content: string; // Corpo da mensagem (suporta variáveis: {{name}}, {{property}}, etc.)

  // Segmentation
  @Column({ type: 'uuid', nullable: true })
  segment_id: string; // ID do segment (público-alvo)

  @Column({ type: 'jsonb', nullable: true })
  filters: {
    lead_status?: string[];
    tags?: string[];
    property_type?: string[];
    min_budget?: number;
    max_budget?: number;
    city?: string[];
    created_after?: string;
  };

  // Scheduling
  @Column({ type: 'timestamp', nullable: true })
  scheduled_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date;

  // Metrics
  @Column({ type: 'int', default: 0 })
  total_recipients: number;

  @Column({ type: 'int', default: 0 })
  sent_count: number;

  @Column({ type: 'int', default: 0 })
  delivered_count: number;

  @Column({ type: 'int', default: 0 })
  opened_count: number; // Email only

  @Column({ type: 'int', default: 0 })
  clicked_count: number; // Email only

  @Column({ type: 'int', default: 0 })
  failed_count: number;

  @Column({ type: 'int', default: 0 })
  unsubscribed_count: number;

  // UTM Parameters (para tracking)
  @Column({ type: 'jsonb', nullable: true })
  utm_params: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };

  // LGPD
  @Column({ type: 'boolean', default: true })
  lgpd_compliant: boolean; // Se deve verificar Master Switch antes de enviar

  @Column({ type: 'boolean', default: true })
  include_unsubscribe_link: boolean;

  // Created by
  @Column({ type: 'uuid' })
  created_by_id: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
