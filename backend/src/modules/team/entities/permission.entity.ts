import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Permission Entity - Module 4.1
 *
 * Permissões granulares do sistema
 * - CRUD operations por módulo
 * - Formato: module.action (e.g., "leads.create", "properties.delete")
 * - System permissions (não editáveis)
 */
@Entity('permissions')
@Index(['slug'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // e.g., "Create Lead"

  @Column({ type: 'varchar', length: 100 })
  slug: string; // e.g., "leads.create"

  @Column({ type: 'varchar', length: 50 })
  module: string; // e.g., "leads", "properties", "financial"

  @Column({
    type: 'enum',
    enum: ['create', 'read', 'update', 'delete', 'manage'],
  })
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  is_system: boolean; // true = não pode ser deletado

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
