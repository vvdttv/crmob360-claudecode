import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Team } from './team.entity';

/**
 * Task Entity - Module 4.3
 *
 * Tarefas e gestão de atividades
 * - Kanban board (status: todo, doing, done)
 * - Atribuição a usuário ou equipe
 * - Prioridade e deadline
 * - Relacionamento com outras entidades
 */
@Entity('tasks')
@Index(['company_id', 'status'])
@Index(['company_id', 'assigned_to_id'])
@Index(['company_id', 'due_date'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  company_id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['todo', 'in_progress', 'done', 'canceled'],
    default: 'todo',
  })
  status: 'todo' | 'in_progress' | 'done' | 'canceled';

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  })
  priority: 'low' | 'medium' | 'high' | 'urgent';

  // Assigned to
  @Column({ type: 'uuid', nullable: true })
  assigned_to_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assigned_to: User;

  // Team
  @Column({ type: 'uuid', nullable: true })
  team_id: string;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  // Created by
  @Column({ type: 'uuid' })
  created_by_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;

  // Dates
  @Column({ type: 'date', nullable: true })
  due_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  // Related entity (Lead, Property, Contract, etc.)
  @Column({ type: 'varchar', length: 50, nullable: true })
  related_type: string; // e.g., "lead", "property", "contract"

  @Column({ type: 'uuid', nullable: true })
  related_id: string;

  // Tags
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  // Checklist
  @Column({ type: 'jsonb', nullable: true })
  checklist: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
