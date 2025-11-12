import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Property } from './property.entity';

/**
 * PropertyFeedback Entity - Módulo 5.5
 *
 * Armazena feedbacks de visitas aos imóveis
 */
@Entity('property_feedbacks')
export class PropertyFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'property_id' })
  propertyId: string;

  @ManyToOne(() => Property, (property) => property.feedbacks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ type: 'uuid', name: 'lead_id', nullable: true })
  leadId: string; // Referência ao Lead (Módulo 1)

  @Column({ type: 'uuid', name: 'activity_id', nullable: true })
  activityId: string; // Referência à Activity (visita)

  @Column({ type: 'integer', nullable: true })
  rating: number; // 0-10

  @Column({ type: 'text', name: 'positive_points', nullable: true })
  positivePoints: string;

  @Column({ type: 'text', name: 'negative_points', nullable: true })
  negativePoints: string;

  @Column({ type: 'boolean', name: 'would_rent_or_buy', nullable: true })
  wouldRentOrBuy: boolean;

  @Column({ type: 'jsonb', name: 'feedback_data', default: {} })
  feedbackData: any; // Respostas customizadas de formulário

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
