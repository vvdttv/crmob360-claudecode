import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Goal } from '../entities/goal.entity';

/**
 * Goal Service - Module 4.4
 *
 * Gestão de Metas:
 * - Metas individuais e de equipe
 * - Tracking de progresso
 * - Cálculo automático de achievement
 * - Histórico de performance
 */
@Injectable()
export class GoalService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create Goal
   */
  async createGoal(
    companyId: string,
    data: {
      name: string;
      description?: string;
      type: 'individual' | 'team' | 'company';
      metric: string;
      target_value: number;
      unit?: string;
      period_start: Date;
      period_end: Date;
      period_type: string;
      user_id?: string;
      team_id?: string;
    },
  ): Promise<Goal> {
    // Validate type matches assignee
    if (data.type === 'individual' && !data.user_id) {
      throw new Error('Individual goal must have a user_id');
    }
    if (data.type === 'team' && !data.team_id) {
      throw new Error('Team goal must have a team_id');
    }

    const goal = this.goalRepository.create({
      company_id: companyId,
      ...data,
      status: 'active',
      current_value: 0,
      progress_percentage: 0,
    });

    const savedGoal = await this.goalRepository.save(goal);

    this.eventEmitter.emit('goal.created', {
      companyId,
      goalId: savedGoal.id,
      type: savedGoal.type,
      userId: savedGoal.user_id,
      teamId: savedGoal.team_id,
    });

    return savedGoal;
  }

  /**
   * Update Goal Progress
   * Atualiza o valor atual e recalcula percentual
   */
  async updateProgress(
    companyId: string,
    goalId: string,
    currentValue: number,
  ): Promise<Goal> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, company_id: companyId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    const oldValue = goal.current_value;
    goal.current_value = currentValue;
    goal.progress_percentage = Math.min(
      Math.round((currentValue / Number(goal.target_value)) * 100),
      100,
    );
    goal.last_updated_at = new Date();

    // Add to history
    if (!goal.history) {
      goal.history = [];
    }
    goal.history.push({
      date: new Date().toISOString(),
      value: currentValue,
      percentage: goal.progress_percentage,
    });

    // Auto-complete if target reached
    if (goal.progress_percentage >= 100 && goal.status === 'active') {
      goal.status = 'completed';
    }

    const savedGoal = await this.goalRepository.save(goal);

    // Emit event
    this.eventEmitter.emit('goal.progress.updated', {
      companyId,
      goalId: savedGoal.id,
      oldValue,
      newValue: currentValue,
      progress: goal.progress_percentage,
    });

    return savedGoal;
  }

  /**
   * Complete Goal
   */
  async completeGoal(companyId: string, goalId: string): Promise<Goal> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, company_id: companyId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    goal.status = 'completed';
    return this.goalRepository.save(goal);
  }

  /**
   * Mark Goal as Failed
   */
  async markAsFailed(companyId: string, goalId: string): Promise<Goal> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, company_id: companyId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    goal.status = 'failed';
    return this.goalRepository.save(goal);
  }

  /**
   * Auto-update goals based on metrics
   * Deve ser executado periodicamente (cron job)
   */
  async autoUpdateGoals(companyId: string): Promise<number> {
    const activeGoals = await this.goalRepository.find({
      where: {
        company_id: companyId,
        status: 'active',
      },
    });

    let updated = 0;

    for (const goal of activeGoals) {
      // TODO: Query real metrics from CRM, Financial, etc.
      // For now, this is a stub
      const currentValue = await this.fetchMetricValue(
        companyId,
        goal.metric,
        goal.user_id,
        goal.team_id,
        goal.period_start,
        goal.period_end,
      );

      if (currentValue !== goal.current_value) {
        await this.updateProgress(companyId, goal.id, currentValue);
        updated++;
      }

      // Check if period ended
      if (new Date() > goal.period_end && goal.status === 'active') {
        if (goal.progress_percentage >= 100) {
          await this.completeGoal(companyId, goal.id);
        } else {
          await this.markAsFailed(companyId, goal.id);
        }
      }
    }

    return updated;
  }

  /**
   * Find all goals
   */
  async findAll(
    companyId: string,
    filters?: {
      type?: string;
      status?: string;
      user_id?: string;
      team_id?: string;
      period_type?: string;
    },
  ): Promise<Goal[]> {
    const where: any = { company_id: companyId };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.user_id) where.user_id = filters.user_id;
    if (filters?.team_id) where.team_id = filters.team_id;
    if (filters?.period_type) where.period_type = filters.period_type;

    return this.goalRepository.find({
      where,
      relations: ['user', 'team'],
      order: { period_end: 'DESC' },
    });
  }

  /**
   * Find goal by ID
   */
  async findOne(companyId: string, goalId: string): Promise<Goal> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, company_id: companyId },
      relations: ['user', 'team'],
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  /**
   * Delete goal
   */
  async deleteGoal(companyId: string, goalId: string): Promise<void> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, company_id: companyId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    await this.goalRepository.remove(goal);
  }

  /**
   * Get achievement rate
   */
  async getAchievementRate(
    companyId: string,
    userId?: string,
    teamId?: string,
  ): Promise<{
    total_goals: number;
    completed: number;
    failed: number;
    active: number;
    achievement_rate: number;
  }> {
    const query = this.goalRepository
      .createQueryBuilder('goal')
      .where('goal.company_id = :companyId', { companyId });

    if (userId) {
      query.andWhere('goal.user_id = :userId', { userId });
    }

    if (teamId) {
      query.andWhere('goal.team_id = :teamId', { teamId });
    }

    const goals = await query.getMany();

    const total_goals = goals.length;
    const completed = goals.filter((g) => g.status === 'completed').length;
    const failed = goals.filter((g) => g.status === 'failed').length;
    const active = goals.filter((g) => g.status === 'active').length;

    const achievement_rate =
      total_goals > 0 ? (completed / (completed + failed)) * 100 : 0;

    return {
      total_goals,
      completed,
      failed,
      active,
      achievement_rate: Math.round(achievement_rate),
    };
  }

  // ========== PRIVATE METHODS ==========

  private async fetchMetricValue(
    companyId: string,
    metric: string,
    userId: string,
    teamId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    // TODO: Integrate with other modules
    // - revenue: query Financial module
    // - contracts: query Admin module
    // - leads: query CRM module
    // - properties_sold/rented: query Properties module
    // - commissions: query Admin/Financial modules

    return 0; // Stub
  }
}
