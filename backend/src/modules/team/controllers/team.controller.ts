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
import { TeamService } from '../services/team.service';

/**
 * Team Controller - Module 4.2
 *
 * REST API para Gestão de Equipes:
 * - CRUD de equipes
 * - Gestão de membros
 * - Métricas de equipe
 */
@ApiTags('Teams')
@Controller('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  @ApiOperation({ summary: 'Create new team' })
  @ApiResponse({ status: 201, description: 'Team created successfully' })
  async createTeam(
    @Body('company_id') companyId: string,
    @Body() data: any,
  ) {
    return this.teamService.createTeam(companyId, data);
  }

  @Get()
  @ApiOperation({ summary: 'List all teams' })
  async listTeams(
    @Query('company_id') companyId: string,
    @Query('type') type?: string,
    @Query('active') active?: string,
  ) {
    const filters: any = {};
    if (type) filters.type = type;
    if (active !== undefined) filters.active = active === 'true';

    return this.teamService.findAll(companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  async getTeam(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.teamService.findOne(companyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update team' })
  async updateTeam(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.teamService.updateTeam(companyId, id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete team' })
  async deleteTeam(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    await this.teamService.deleteTeam(companyId, id);
    return { success: true };
  }

  // ========== MEMBERS ==========

  @Get(':id/members')
  @ApiOperation({ summary: 'Get team members' })
  async getMembers(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.teamService.getMembers(companyId, id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to team' })
  async addMember(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
    @Body('user_id') userId: string,
  ) {
    return this.teamService.addMember(companyId, id, userId);
  }

  @Delete(':id/members/:user_id')
  @ApiOperation({ summary: 'Remove member from team' })
  async removeMember(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
    @Param('user_id') userId: string,
  ) {
    return this.teamService.removeMember(companyId, id, userId);
  }

  // ========== PERFORMANCE ==========

  @Get(':id/performance')
  @ApiOperation({ summary: 'Get team performance metrics' })
  async getPerformance(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.teamService.getTeamPerformance(
      companyId,
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
