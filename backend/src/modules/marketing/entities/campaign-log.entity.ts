import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Campaign Log Entity - Module 2.1
 *
 * Log de envios de campanhas
 * - Tracking individual por destinatário
 * - Status de entrega e interações
 * - Métricas (open, click, unsubscribe)
 */
@Entity('campaign_logs')
@Index(['company_id', 'campaign_id'])
@Index(['company_id', 'recipient_id'])
@Index(['company_id', 'status'])
export class CampaignLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  company_id: string;

  @Column({ type: 'uuid' })
  campaign_id: string;

  // Recipient
  @Column({ type: 'uuid' })
  recipient_id: string; // ID do Lead ou Cliente

  @Column({
    type: 'enum',
    enum: ['lead', 'client'],
  })
  recipient_type: 'lead' | 'client';

  @Column({ type: 'varchar', length: 255 })
  recipient_contact: string; // Email, phone

  // Status
  @Column({
    type: 'enum',
    enum: ['queued', 'sent', 'delivered', 'failed', 'bounced', 'spam'],
    default: 'queued',
  })
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'spam';

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date;

  // Interactions (Email)
  @Column({ type: 'timestamp', nullable: true })
  opened_at: Date;

  @Column({ type: 'int', default: 0 })
  open_count: number;

  @Column({ type: 'timestamp', nullable: true })
  clicked_at: Date;

  @Column({ type: 'int', default: 0 })
  click_count: number;

  @Column({ type: 'simple-array', nullable: true })
  clicked_links: string[]; // URLs clicadas

  // Unsubscribe
  @Column({ type: 'timestamp', nullable: true })
  unsubscribed_at: Date;

  // Error handling
  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  error_code: string;

  // Provider reference (ID do provedor de email/WhatsApp/SMS)
  @Column({ type: 'varchar', length: 255, nullable: true })
  provider_message_id: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
