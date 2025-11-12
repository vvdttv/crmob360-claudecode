import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Property } from './property.entity';

/**
 * Owner Entity - Proprietários de Imóveis
 *
 * Representa um proprietário de imóvel
 */
@Entity('owners')
@Index(['companyId'])
export class Owner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  @Index()
  companyId: string;

  // Dados pessoais
  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  document: string; // CPF ou CNPJ

  @Column({ type: 'varchar', length: 20, name: 'owner_type', default: 'individual' })
  ownerType: 'individual' | 'corporate';

  // Endereço
  @Column({ type: 'varchar', length: 255, name: 'address_street', nullable: true })
  addressStreet: string;

  @Column({ type: 'varchar', length: 20, name: 'address_number', nullable: true })
  addressNumber: string;

  @Column({ type: 'varchar', length: 100, name: 'address_complement', nullable: true })
  addressComplement: string;

  @Column({ type: 'varchar', length: 100, name: 'address_neighborhood', nullable: true })
  addressNeighborhood: string;

  @Column({ type: 'varchar', length: 100, name: 'address_city', nullable: true })
  addressCity: string;

  @Column({ type: 'varchar', length: 2, name: 'address_state', nullable: true })
  addressState: string;

  @Column({ type: 'varchar', length: 10, name: 'address_zipcode', nullable: true })
  addressZipcode: string;

  // Dados bancários (para repasse de locação)
  @Column({ type: 'varchar', length: 100, name: 'bank_name', nullable: true })
  bankName: string;

  @Column({ type: 'varchar', length: 20, name: 'bank_branch', nullable: true })
  bankBranch: string;

  @Column({ type: 'varchar', length: 50, name: 'bank_account', nullable: true })
  bankAccount: string;

  @Column({ type: 'varchar', length: 20, name: 'bank_account_type', nullable: true })
  bankAccountType: 'checking' | 'savings';

  // Portal do proprietário (Módulo 7)
  @Column({ type: 'boolean', name: 'portal_access_enabled', default: false })
  portalAccessEnabled: boolean;

  @Column({ type: 'varchar', length: 255, name: 'portal_password_hash', nullable: true })
  portalPasswordHash: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Property, (property) => property.owner)
  properties: Property[];
}
