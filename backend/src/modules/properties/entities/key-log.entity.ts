import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PropertyKey } from './property-key.entity';

/**
 * KeyLog Entity - Módulo 5.3
 *
 * Registra histórico de retirada/devolução de chaves
 */
@Entity('key_logs')
export class KeyLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'property_key_id' })
  propertyKeyId: string;

  @ManyToOne(() => PropertyKey, (key) => key.logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_key_id' })
  propertyKey: PropertyKey;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string; // Corretor que retirou/devolveu

  @Column({ type: 'varchar', length: 20 })
  action: 'withdraw' | 'return';

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
