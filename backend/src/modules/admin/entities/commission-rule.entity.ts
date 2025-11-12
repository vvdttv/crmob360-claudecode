import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * CommissionRule Entity - Módulo 8.4
 *
 * Motor de Regras de Comissão configurável
 */
@Entity('commission_rules')
@Index(['companyId'])
@Index(['priority'])
export class CommissionRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  @Index()
  companyId: string;

  @Column({ type: 'varchar', length: 255, name: 'rule_name' })
  ruleName: string;

  @Column({ type: 'integer', default: 0 })
  @Index()
  priority: number; // Maior prioridade = aplicada primeiro (para exceções)

  // Condições de aplicação
  @Column({ type: 'varchar', length: 20, name: 'transaction_type', nullable: true })
  transactionType: 'sale' | 'rent' | null; // null = aplica para ambos

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'min_value', nullable: true })
  minValue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'max_value', nullable: true })
  maxValue: number;

  @Column({ type: 'text', array: true, name: 'property_tags', default: '{}' })
  propertyTags: string[]; // Tags do imóvel que ativam a regra

  /**
   * Configuração de distribuição de comissão
   *
   * Exemplo:
   * {
   *   "splits": [
   *     { "role": "seller", "percentage": 40 },
   *     { "role": "capturer", "percentage": 15 },
   *     { "role": "manager", "percentage": 5 },
   *     { "role": "company", "percentage": 40 }
   *   ]
   * }
   *
   * Ou regra dinâmica:
   * {
   *   "splits": [
   *     {
   *       "role": "seller",
   *       "percentage": 50,
   *       "condition": {
   *         "if": "value > 1000000",
   *         "then_percentage": 55
   *       }
   *     }
   *   ]
   * }
   */
  @Column({ type: 'jsonb', name: 'distribution_config' })
  distributionConfig: {
    splits: Array<{
      role: 'seller' | 'capturer' | 'manager' | 'company' | string;
      percentage: number;
      condition?: {
        if: string;
        then_percentage: number;
      };
    }>;
  };

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
