import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { KeyLog } from './key-log.entity';

/**
 * PropertyKey Entity - Módulo 5.3
 *
 * Gerencia chaves físicas dos imóveis
 */
@Entity('property_keys')
export class PropertyKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'property_id' })
  propertyId: string;

  @Column({ type: 'varchar', length: 100, name: 'key_identifier' })
  keyIdentifier: string; // Ex: "Chave 001", "Apartamento 305"

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string; // Localização física na imobiliária

  @Column({ type: 'varchar', length: 50, default: 'available' })
  status: 'available' | 'in_use' | 'lost';

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => KeyLog, (log) => log.propertyKey)
  logs: KeyLog[];
}
