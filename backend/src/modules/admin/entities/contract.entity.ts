import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Contract Entity - Módulo 8
 *
 * Representa contratos de locação e venda
 */
@Entity('contracts')
@Index(['companyId'])
@Index(['propertyId'])
@Index(['leadId'])
@Index(['status'])
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  @Index()
  companyId: string;

  @Column({ type: 'uuid', name: 'property_id', nullable: true })
  @Index()
  propertyId: string; // Imóvel do contrato

  @Column({ type: 'uuid', name: 'lead_id', nullable: true })
  @Index()
  leadId: string; // Cliente/inquilino

  @Column({ type: 'uuid', name: 'owner_id', nullable: true })
  ownerId: string; // Proprietário

  @Column({ type: 'varchar', length: 20, name: 'contract_type' })
  contractType: 'sale' | 'rent';

  @Column({ type: 'varchar', length: 100, name: 'contract_number', unique: true, nullable: true })
  contractNumber: string;

  // Valores
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'contract_value' })
  contractValue: number; // Valor total (venda) ou mensal (locação)

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'monthly_value', nullable: true })
  monthlyValue: number; // Para locação

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'administration_fee_percentage', nullable: true })
  administrationFeePercentage: number; // Taxa de administração %

  // Datas
  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date', nullable: true })
  endDate: Date;

  @Column({ type: 'date', name: 'signature_date', nullable: true })
  signatureDate: Date;

  // Reajuste de aluguel (Módulo 8.1)
  @Column({ type: 'varchar', length: 20, name: 'readjustment_index', nullable: true })
  readjustmentIndex: 'IGP-M' | 'IPCA' | 'INPC' | null;

  @Column({ type: 'date', name: 'last_readjustment_date', nullable: true })
  lastReadjustmentDate: Date;

  @Column({ type: 'date', name: 'next_readjustment_date', nullable: true })
  nextReadjustmentDate: Date;

  // Status
  @Column({ type: 'varchar', length: 50, default: 'draft' })
  @Index()
  status: 'draft' | 'active' | 'terminated' | 'cancelled';

  // Documentos
  @Column({ type: 'text', name: 'contract_document_url', nullable: true })
  contractDocumentUrl: string;

  @Column({ type: 'text', name: 'signed_document_url', nullable: true })
  signedDocumentUrl: string;

  // Garantias (locação)
  @Column({ type: 'varchar', length: 50, name: 'guarantee_type', nullable: true })
  guaranteeType: 'fiador' | 'seguro_fianca' | 'deposito' | 'titulo_capitalizacao' | null;

  @Column({ type: 'jsonb', name: 'guarantee_data', default: {} })
  guaranteeData: {
    fiadorNome?: string;
    fiadorCpf?: string;
    apoliceNumero?: string;
    depositoValor?: number;
    [key: string]: any;
  };

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
