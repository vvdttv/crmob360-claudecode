import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Automation Flow Entity - Module 2.3
 *
 * Fluxos de Nutrição Automáticos (Drip Campaigns)
 * - Sequências de mensagens
 * - Triggers baseados em eventos
 * - Delays e condições
 * - A/B Testing
 */
@Entity('automation_flows')
@Index(['company_id', 'status'])
@Index(['company_id', 'trigger_type'])
export class AutomationFlow {
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
    enum: ['active', 'paused', 'draft'],
    default: 'draft',
  })
  status: 'active' | 'paused' | 'draft';

  // Trigger (quando iniciar o fluxo)
  @Column({
    type: 'enum',
    enum: [
      'lead_created',
      'lead_status_changed',
      'property_viewed',
      'email_opened',
      'email_clicked',
      'form_submitted',
      'tag_added',
      'manual',
    ],
  })
  trigger_type:
    | 'lead_created'
    | 'lead_status_changed'
    | 'property_viewed'
    | 'email_opened'
    | 'email_clicked'
    | 'form_submitted'
    | 'tag_added'
    | 'manual';

  @Column({ type: 'jsonb', nullable: true })
  trigger_config: {
    status?: string; // Para lead_status_changed
    tag?: string; // Para tag_added
    campaign_id?: string; // Para email_opened/clicked
    form_id?: string; // Para form_submitted
  };

  // Steps (sequência de ações)
  @Column({ type: 'jsonb' })
  steps: Array<{
    id: string;
    order: number;
    type: 'send_email' | 'send_whatsapp' | 'send_sms' | 'add_tag' | 'change_status' | 'create_task' | 'wait';
    delay_hours?: number; // Aguardar X horas antes de executar

    // Send message config
    template_id?: string;
    subject?: string;
    content?: string;

    // Tag/Status config
    tag?: string;
    status?: string;

    // Task config
    task_title?: string;
    task_description?: string;
    assigned_to_id?: string;

    // Conditions
    conditions?: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    }>;
  }>;

  // Entry criteria (quem entra no fluxo)
  @Column({ type: 'uuid', nullable: true })
  segment_id: string;

  @Column({ type: 'jsonb', nullable: true })
  entry_filters: {
    tags?: string[];
    status?: string[];
    source?: string[];
  };

  // Exit criteria (quando sair do fluxo)
  @Column({ type: 'jsonb', nullable: true })
  exit_criteria: {
    status_changed_to?: string[];
    tag_added?: string[];
    property_rented?: boolean;
    property_purchased?: boolean;
  };

  // Statistics
  @Column({ type: 'int', default: 0 })
  total_entries: number; // Quantas pessoas entraram

  @Column({ type: 'int', default: 0 })
  active_entries: number; // Quantas estão ativas agora

  @Column({ type: 'int', default: 0 })
  completed_entries: number; // Quantas completaram o fluxo

  @Column({ type: 'int', default: 0 })
  exited_entries: number; // Quantas saíram antes de completar

  @Column({ type: 'uuid' })
  created_by_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
