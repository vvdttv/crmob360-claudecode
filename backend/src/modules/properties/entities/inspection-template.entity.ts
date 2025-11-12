import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * InspectionTemplate Entity - Módulo 5.6
 *
 * Templates de vistoria configuráveis (ex: Apartamento 2 Quartos, Casa com Piscina)
 */
@Entity('inspection_templates')
@Index(['companyId'])
export class InspectionTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  @Index()
  companyId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Estrutura hierárquica do template
   * Exemplo:
   * {
   *   "ambientes": [
   *     {
   *       "nome": "Cozinha",
   *       "itens": [
   *         {
   *           "nome": "Piso",
   *           "estados": ["Novo", "Bom", "Usado", "Com defeito"]
   *         },
   *         {
   *           "nome": "Pia",
   *           "estados": ["Novo", "Bom", "Usado", "Com defeito"],
   *           "gatilho_automacao": {
   *             "estado": "Com defeito",
   *             "acao": "criar_tarefa_manutencao"
   *           }
   *         }
   *       ]
   *     }
   *   ]
   * }
   */
  @Column({ type: 'jsonb', name: 'template_structure' })
  templateStructure: {
    ambientes: Array<{
      nome: string;
      itens: Array<{
        nome: string;
        estados: string[];
        gatilho_automacao?: {
          estado: string;
          acao: string;
        };
      }>;
    }>;
  };

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
