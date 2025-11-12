import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Task } from '../entities/task.entity';

/**
 * Task Service - Module 4.3
 *
 * Gestão de Tarefas (Kanban):
 * - CRUD de tarefas
 * - Status tracking (todo, doing, done)
 * - Atribuição e priorização
 * - Checklist e tags
 * - Métricas de produtividade
 */
@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create Task
   */
  async createTask(
    companyId: string,
    createdById: string,
    data: {
      title: string;
      description?: string;
      priority?: string;
      assigned_to_id?: string;
      team_id?: string;
      due_date?: Date;
      related_type?: string;
      related_id?: string;
      tags?: string[];
      checklist?: Array<{ id: string; text: string; completed: boolean }>;
    },
  ): Promise<Task> {
    const task = this.taskRepository.create({
      company_id: companyId,
      created_by_id: createdById,
      status: 'todo',
      ...data,
    });

    const savedTask = await this.taskRepository.save(task);

    this.eventEmitter.emit('task.created', {
      companyId,
      taskId: savedTask.id,
      assignedToId: savedTask.assigned_to_id,
    });

    return savedTask;
  }

  /**
   * Update Task
   */
  async updateTask(
    companyId: string,
    taskId: string,
    data: Partial<{
      title: string;
      description: string;
      status: string;
      priority: string;
      assigned_to_id: string;
      team_id: string;
      due_date: Date;
      tags: string[];
      checklist: Array<{ id: string; text: string; completed: boolean }>;
      notes: string;
    }>,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, company_id: companyId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const oldStatus = task.status;
    Object.assign(task, data);

    // Auto-complete when status = done
    if (data.status === 'done' && oldStatus !== 'done') {
      task.completed_at = new Date();
    }

    const savedTask = await this.taskRepository.save(task);

    // Emit events
    if (oldStatus !== data.status) {
      this.eventEmitter.emit('task.status.changed', {
        companyId,
        taskId: savedTask.id,
        oldStatus,
        newStatus: data.status,
      });
    }

    return savedTask;
  }

  /**
   * Complete Task
   */
  async completeTask(companyId: string, taskId: string): Promise<Task> {
    return this.updateTask(companyId, taskId, {
      status: 'done' as any,
    });
  }

  /**
   * Cancel Task
   */
  async cancelTask(companyId: string, taskId: string): Promise<Task> {
    return this.updateTask(companyId, taskId, {
      status: 'canceled' as any,
    });
  }

  /**
   * Update Checklist Item
   */
  async updateChecklistItem(
    companyId: string,
    taskId: string,
    itemId: string,
    completed: boolean,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, company_id: companyId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.checklist) {
      throw new Error('Task has no checklist');
    }

    const item = task.checklist.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }

    item.completed = completed;

    return this.taskRepository.save(task);
  }

  /**
   * Find all tasks
   */
  async findAll(
    companyId: string,
    filters?: {
      status?: string;
      priority?: string;
      assigned_to_id?: string;
      team_id?: string;
      related_type?: string;
      related_id?: string;
      due_date_start?: Date;
      due_date_end?: Date;
      tags?: string[];
    },
  ): Promise<Task[]> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assigned_to', 'assigned_to')
      .leftJoinAndSelect('task.team', 'team')
      .leftJoinAndSelect('task.created_by', 'created_by')
      .where('task.company_id = :companyId', { companyId });

    if (filters?.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters?.priority) {
      query.andWhere('task.priority = :priority', {
        priority: filters.priority,
      });
    }

    if (filters?.assigned_to_id) {
      query.andWhere('task.assigned_to_id = :assignedToId', {
        assignedToId: filters.assigned_to_id,
      });
    }

    if (filters?.team_id) {
      query.andWhere('task.team_id = :teamId', { teamId: filters.team_id });
    }

    if (filters?.related_type) {
      query.andWhere('task.related_type = :relatedType', {
        relatedType: filters.related_type,
      });
    }

    if (filters?.related_id) {
      query.andWhere('task.related_id = :relatedId', {
        relatedId: filters.related_id,
      });
    }

    if (filters?.due_date_start && filters?.due_date_end) {
      query.andWhere('task.due_date BETWEEN :start AND :end', {
        start: filters.due_date_start,
        end: filters.due_date_end,
      });
    }

    if (filters?.tags && filters.tags.length > 0) {
      query.andWhere('task.tags && :tags', { tags: filters.tags });
    }

    return query.orderBy('task.due_date', 'ASC').addOrderBy('task.priority', 'DESC').getMany();
  }

  /**
   * Find task by ID
   */
  async findOne(companyId: string, taskId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, company_id: companyId },
      relations: ['assigned_to', 'team', 'created_by'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  /**
   * Delete task
   */
  async deleteTask(companyId: string, taskId: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, company_id: companyId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.taskRepository.remove(task);
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(companyId: string): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.taskRepository.find({
      where: {
        company_id: companyId,
        status: 'todo' as any,
      },
      relations: ['assigned_to'],
      order: { due_date: 'ASC' },
    });
  }

  /**
   * Get task statistics
   */
  async getStatistics(
    companyId: string,
    userId?: string,
    teamId?: string,
  ): Promise<{
    total: number;
    todo: number;
    in_progress: number;
    done: number;
    overdue: number;
    completion_rate: number;
  }> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .where('task.company_id = :companyId', { companyId });

    if (userId) {
      query.andWhere('task.assigned_to_id = :userId', { userId });
    }

    if (teamId) {
      query.andWhere('task.team_id = :teamId', { teamId });
    }

    const tasks = await query.getMany();

    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const in_progress = tasks.filter((t) => t.status === 'in_progress').length;
    const done = tasks.filter((t) => t.status === 'done').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = tasks.filter(
      (t) => t.status === 'todo' && t.due_date && t.due_date < today,
    ).length;

    const completion_rate = total > 0 ? (done / total) * 100 : 0;

    return {
      total,
      todo,
      in_progress,
      done,
      overdue,
      completion_rate: Math.round(completion_rate),
    };
  }
}
