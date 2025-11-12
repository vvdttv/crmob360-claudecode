import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Campaign Template Entity - Module 2.1
 *
 * Templates reutilizáveis de campanhas
 * - Suporte a variáveis ({{name}}, {{property}}, etc.)
 * - Templates por canal (email, WhatsApp, SMS)
 * - Versionamento
 */
@Entity('campaign_templates')
@Index(['company_id', 'channel'])
@Index(['company_id', 'category'])
export class CampaignTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  company_id: string; // null = template global do sistema

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
    enum: [
      'welcome',
      'nurturing',
      'promotional',
      'transactional',
      'followup',
      'custom',
    ],
    default: 'custom',
  })
  category:
    | 'welcome'
    | 'nurturing'
    | 'promotional'
    | 'transactional'
    | 'followup'
    | 'custom';

  @Column({ type: 'varchar', length: 500, nullable: true })
  subject: string; // Para email

  @Column({ type: 'text' })
  content: string;

  // HTML content (para email)
  @Column({ type: 'text', nullable: true })
  html_content: string;

  // Variáveis disponíveis
  @Column({ type: 'simple-array', nullable: true })
  available_variables: string[]; // ['name', 'property_title', 'property_price', etc.]

  @Column({ type: 'varchar', length: 255, nullable: true })
  thumbnail_url: string;

  @Column({ type: 'boolean', default: true })
  is_system: boolean; // true = não pode ser deletado

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'int', default: 0 })
  usage_count: number; // Quantas vezes foi usado

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
