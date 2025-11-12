import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Role } from './role.entity';
import { Team } from './team.entity';

/**
 * User Entity - Module 4.1
 *
 * Usuários do sistema com RBAC (Role-Based Access Control)
 * - Roles e Permissions hierárquicos
 * - Multi-tenancy (company_id)
 * - Status ativo/inativo
 */
@Entity('users')
@Index(['company_id', 'email'], { unique: true })
@Index(['company_id', 'status'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  company_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar_url: string;

  // Role (cargo/papel)
  @Column({ type: 'uuid', nullable: true })
  role_id: string;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  // Teams (equipes)
  @ManyToMany(() => Team)
  @JoinTable({
    name: 'user_teams',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'team_id' },
  })
  teams: Team[];

  // Manager (gestor direto)
  @Column({ type: 'uuid', nullable: true })
  manager_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'invited'],
    default: 'invited',
  })
  status: 'active' | 'inactive' | 'invited';

  @Column({ type: 'varchar', length: 255, nullable: true })
  invitation_token: string;

  @Column({ type: 'timestamp', nullable: true })
  invitation_sent_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date;

  // Preferences
  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      whatsapp?: boolean;
    };
  };

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
