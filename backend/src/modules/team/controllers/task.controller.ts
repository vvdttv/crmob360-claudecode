import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TaskService } from '../services/task.service';
import { GoalService } from '../services/goal.service';

/**
 * Task Controller - Module 4.3 & 4.4
 *
 * REST API para:
 * - Gestão de Tarefas (Kanban)
 * - Gestão de Metas
 */
@ApiTags('Tasks & Goals')
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly goalService: GoalService,
  ) {}

  // ========== TASKS ==========

  @Post()
  @ApiOperation({ summary: 'Create new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async createTask(
    @Body('company_id') companyId: string,
    @Body('created_by_id') createdById: string,
    @Body() data: any,
  ) {
    return this.taskService.createTask(companyId, createdById, data);
  }

  @Get()
  @ApiOperation({ summary: 'List all tasks with filters' })
  async listTasks(
    @Query('company_id') companyId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assigned_to_id') assignedToId?: string,
    @Query('team_id') teamId?: string,
    @Query('related_type') relatedType?: string,
    @Query('related_id') relatedId?: string,
    @Query('due_date_start') dueDateStart?: string,
    @Query('due_date_end') dueDateEnd?: string,
    @Query('tags') tags?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (assignedToId) filters.assigned_to_id = assignedToId;
    if (teamId) filters.team_id = teamId;
    if (relatedType) filters.related_type = relatedType;
    if (relatedId) filters.related_id = relatedId;
    if (dueDateStart) filters.due_date_start = new Date(dueDateStart);
    if (dueDateEnd) filters.due_date_end = new Date(dueDateEnd);
    if (tags) filters.tags = tags.split(',');

    return this.taskService.findAll(companyId, filters);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue tasks' })
  async getOverdueTasks(@Query('company_id') companyId: string) {
    return this.taskService.getOverdueTasks(companyId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get task statistics' })
  async getStatistics(
    @Query('company_id') companyId: string,
    @Query('user_id') userId?: string,
    @Query('team_id') teamId?: string,
  ) {
    return this.taskService.getStatistics(companyId, userId, teamId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  async getTask(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.taskService.findOne(companyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  async updateTask(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.taskService.updateTask(companyId, id, data);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete task' })
  async completeTask(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.taskService.completeTask(companyId, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel task' })
  async cancelTask(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.taskService.cancelTask(companyId, id);
  }

  @Patch(':id/checklist/:item_id')
  @ApiOperation({ summary: 'Update checklist item' })
  async updateChecklistItem(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
    @Param('item_id') itemId: string,
    @Body('completed') completed: boolean,
  ) {
    return this.taskService.updateChecklistItem(
      companyId,
      id,
      itemId,
      completed,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  async deleteTask(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    await this.taskService.deleteTask(companyId, id);
    return { success: true };
  }

  // ========== GOALS ==========

  @Post('goals')
  @ApiOperation({ summary: 'Create new goal' })
  @ApiResponse({ status: 201, description: 'Goal created successfully' })
  async createGoal(
    @Body('company_id') companyId: string,
    @Body() data: any,
  ) {
    return this.goalService.createGoal(companyId, data);
  }

  @Get('goals/list')
  @ApiOperation({ summary: 'List all goals' })
  async listGoals(
    @Query('company_id') companyId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('user_id') userId?: string,
    @Query('team_id') teamId?: string,
    @Query('period_type') periodType?: string,
  ) {
    const filters: any = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (userId) filters.user_id = userId;
    if (teamId) filters.team_id = teamId;
    if (periodType) filters.period_type = periodType;

    return this.goalService.findAll(companyId, filters);
  }

  @Get('goals/achievement-rate')
  @ApiOperation({ summary: 'Get achievement rate' })
  async getAchievementRate(
    @Query('company_id') companyId: string,
    @Query('user_id') userId?: string,
    @Query('team_id') teamId?: string,
  ) {
    return this.goalService.getAchievementRate(companyId, userId, teamId);
  }

  @Get('goals/:id')
  @ApiOperation({ summary: 'Get goal by ID' })
  async getGoal(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.goalService.findOne(companyId, id);
  }

  @Patch('goals/:id/progress')
  @ApiOperation({ summary: 'Update goal progress' })
  async updateProgress(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
    @Body('current_value') currentValue: number,
  ) {
    return this.goalService.updateProgress(companyId, id, currentValue);
  }

  @Patch('goals/:id/complete')
  @ApiOperation({ summary: 'Complete goal' })
  async completeGoal(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.goalService.completeGoal(companyId, id);
  }

  @Patch('goals/:id/fail')
  @ApiOperation({ summary: 'Mark goal as failed' })
  async markGoalAsFailed(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.goalService.markAsFailed(companyId, id);
  }

  @Delete('goals/:id')
  @ApiOperation({ summary: 'Delete goal' })
  async deleteGoal(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    await this.goalService.deleteGoal(companyId, id);
    return { success: true };
  }
}
