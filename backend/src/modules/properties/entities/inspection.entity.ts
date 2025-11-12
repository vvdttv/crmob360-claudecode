import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Property } from './property.entity';
import { InspectionTemplate } from './inspection-template.entity';

/**
 * Inspection Entity - Módulo 5.6
 *
 * Representa uma vistoria (laudo) de entrada ou saída
 */
@Entity('inspections')
@Index(['companyId'])
@Index(['propertyId'])
export class Inspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  @Index()
  companyId: string;

  @Column({ type: 'uuid', name: 'property_id' })
  @Index()
  propertyId: string;

  @ManyToOne(() => Property, { nullable: true })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ type: 'uuid', name: 'contract_id', nullable: true })
  contractId: string; // Vinculado ao contrato (Módulo 8)

  @Column({ type: 'uuid', name: 'template_id', nullable: true })
  templateId: string;

  @ManyToOne(() => InspectionTemplate, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: InspectionTemplate;

  @Column({ type: 'uuid', name: 'inspector_user_id', nullable: true })
  inspectorUserId: string; // Vistoriador

  @Column({ type: 'varchar', length: 20, name: 'inspection_type' })
  inspectionType: 'entry' | 'exit';

  @Column({ type: 'date', name: 'inspection_date' })
  inspectionDate: Date;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: 'draft' | 'completed' | 'signed';

  /**
   * Dados coletados na vistoria (suporta offline)
   * Estrutura similar ao template, mas com valores preenchidos
   * {
   *   "ambientes": [
   *     {
   *       "nome": "Cozinha",
   *       "itens": [
   *         {
   *           "nome": "Piso",
   *           "estado_selecionado": "Bom",
   *           "fotos": ["url1", "url2"],
   *           "observacoes": "Pequeno arranhão no canto"
   *         }
   *       ]
   *     }
   *   ]
   * }
   */
  @Column({ type: 'jsonb', name: 'inspection_data' })
  inspectionData: {
    ambientes: Array<{
      nome: string;
      itens: Array<{
        nome: string;
        estado_selecionado: string;
        fotos?: string[];
        observacoes?: string;
      }>;
    }>;
  };

  @Column({ type: 'text', name: 'pdf_url', nullable: true })
  pdfUrl: string; // PDF gerado automaticamente

  // Assinaturas digitais
  @Column({ type: 'text', name: 'tenant_signature_url', nullable: true })
  tenantSignatureUrl: string;

  @Column({ type: 'timestamptz', name: 'tenant_signed_at', nullable: true })
  tenantSignedAt: Date;

  @Column({ type: 'text', name: 'owner_signature_url', nullable: true })
  ownerSignatureUrl: string;

  @Column({ type: 'timestamptz', name: 'owner_signed_at', nullable: true })
  ownerSignedAt: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
