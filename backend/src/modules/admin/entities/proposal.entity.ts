import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Proposal Entity - Módulo 8.2
 *
 * Propostas de locação ou compra
 */
@Entity('proposals')
@Index(['companyId'])
@Index(['propertyId'])
@Index(['leadId'])
@Index(['status'])
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  @Index()
  companyId: string;

  @Column({ type: 'uuid', name: 'property_id', nullable: true })
  @Index()
  propertyId: string;

  @Column({ type: 'uuid', name: 'lead_id', nullable: true })
  @Index()
  leadId: string; // Cliente/comprador/inquilino

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string; // Corretor responsável

  @Column({ type: 'varchar', length: 20, name: 'proposal_type' })
  proposalType: 'sale' | 'rent';

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'proposed_value' })
  proposedValue: number;

  @Column({ type: 'text', nullable: true })
  conditions: string; // Condições da proposta

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  @Index()
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';

  // Assinatura eletrônica (Módulo 8.2)
  @Column({ type: 'text', name: 'signature_link', nullable: true })
  signatureLink: string; // Link para DocuSign, Clicksign, etc

  @Column({ type: 'timestamptz', name: 'signed_at', nullable: true })
  signedAt: Date;

  @Column({ type: 'date', name: 'valid_until', nullable: true })
  validUntil: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
