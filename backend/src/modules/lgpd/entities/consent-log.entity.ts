import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConsentTemplate } from './consent-template.entity';

@Entity('consent_logs')
@Index(['personId', 'personType'])
@Index(['consentTimestamp'])
export class ConsentLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'person_id' })
  @Index()
  personId: string;

  @Column({ type: 'varchar', length: 50, name: 'person_type' })
  personType: 'lead' | 'user';

  @Column({ type: 'uuid', name: 'consent_template_id', nullable: true })
  consentTemplateId: string;

  @ManyToOne(() => ConsentTemplate, { nullable: true })
  @JoinColumn({ name: 'consent_template_id' })
  consentTemplate: ConsentTemplate;

  @Column({ type: 'timestamptz', name: 'consent_timestamp', default: () => 'CURRENT_TIMESTAMP' })
  consentTimestamp: Date;

  @Column({ type: 'varchar', length: 64, name: 'consent_text_hash' })
  consentTextHash: string;

  @Column({ type: 'inet', name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  channel: string;

  // Permissões granulares (conforme especificação Módulo 13.5)
  @Column({ type: 'boolean', name: 'permission_terms_accepted', default: false })
  permissionTermsAccepted: boolean;

  @Column({ type: 'boolean', name: 'permission_email_marketing', default: false })
  permissionEmailMarketing: boolean;

  @Column({ type: 'boolean', name: 'permission_whatsapp_marketing', default: false })
  permissionWhatsappMarketing: boolean;

  @Column({ type: 'boolean', name: 'permission_ai_profiling', default: false })
  permissionAiProfiling: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
