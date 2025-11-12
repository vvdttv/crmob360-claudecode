import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Property } from './property.entity';

/**
 * PropertyHistory Entity - Módulo 5.4
 *
 * Registra todo o histórico de eventos do imóvel
 */
@Entity('property_history')
@Index(['propertyId', 'createdAt'])
export class PropertyHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'property_id' })
  @Index()
  propertyId: string;

  @ManyToOne(() => Property, (property) => property.history, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 50, name: 'event_type' })
  eventType: 'price_change' | 'visit' | 'proposal' | 'status_change' | 'maintenance' | 'publication' | 'other';

  @Column({ type: 'text', name: 'event_description', nullable: true })
  eventDescription: string;

  @Column({ type: 'jsonb', name: 'old_value', nullable: true })
  oldValue: any;

  @Column({ type: 'jsonb', name: 'new_value', nullable: true })
  newValue: any;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  @Index()
  createdAt: Date;
}
