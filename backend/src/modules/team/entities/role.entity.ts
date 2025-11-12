import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Permission } from './permission.entity';

/**
 * Role Entity - Module 4.1
 *
 * Papéis/Cargos com permissões associadas
 * - Admin, Manager, Broker, Assistant, etc.
 * - Hierarquia de permissões
 * - Customizável por empresa
 */
@Entity('roles')
@Index(['company_id', 'name'])
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  company_id: string; // null = system role (global)

  @Column({ type: 'varchar', length: 100 })
  name: string; // e.g., "Admin", "Corretor", "Gerente"

  @Column({ type: 'varchar', length: 100, nullable: true })
  slug: string; // e.g., "admin", "broker", "manager"

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id' },
    inverseJoinColumn: { name: 'permission_id' },
  })
  permissions: Permission[];

  @Column({ type: 'int', default: 0 })
  level: number; // Hierarquia: 0=admin, 1=manager, 2=user

  @Column({ type: 'boolean', default: true })
  is_system: boolean; // true = não pode ser deletado

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
