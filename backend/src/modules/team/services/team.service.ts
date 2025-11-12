import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Team } from '../entities/team.entity';
import { User } from '../entities/user.entity';

/**
 * Team Service - Module 4.2
 *
 * Gestão de Equipes:
 * - CRUD de equipes
 * - Adição/remoção de membros
 * - Gestão de líderes
 * - Métricas de equipe
 */
@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create Team
   */
  async createTeam(
    companyId: string,
    data: {
      name: string;
      description?: string;
      leader_id?: string;
      type?: string;
      region?: string;
      metadata?: any;
    },
  ): Promise<Team> {
    // Validate leader
    if (data.leader_id) {
      const leader = await this.userRepository.findOne({
        where: { id: data.leader_id, company_id: companyId },
      });
      if (!leader) {
        throw new NotFoundException('Leader not found');
      }
    }

    const team = this.teamRepository.create({
      company_id: companyId,
      ...data,
    });

    const savedTeam = await this.teamRepository.save(team);

    this.eventEmitter.emit('team.created', {
      companyId,
      teamId: savedTeam.id,
    });

    return savedTeam;
  }

  /**
   * Update Team
   */
  async updateTeam(
    companyId: string,
    teamId: string,
    data: Partial<{
      name: string;
      description: string;
      leader_id: string;
      type: string;
      region: string;
      metadata: any;
      active: boolean;
    }>,
  ): Promise<Team> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId, company_id: companyId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    Object.assign(team, data);
    return this.teamRepository.save(team);
  }

  /**
   * Add Member to Team
   */
  async addMember(
    companyId: string,
    teamId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId, company_id: companyId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, company_id: companyId },
      relations: ['teams'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already in team
    if (user.teams.some((t) => t.id === teamId)) {
      return { success: true }; // Already in team
    }

    user.teams.push(team);
    await this.userRepository.save(user);

    this.eventEmitter.emit('team.member.added', {
      companyId,
      teamId,
      userId,
    });

    return { success: true };
  }

  /**
   * Remove Member from Team
   */
  async removeMember(
    companyId: string,
    teamId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const user = await this.userRepository.findOne({
      where: { id: userId, company_id: companyId },
      relations: ['teams'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.teams = user.teams.filter((t) => t.id !== teamId);
    await this.userRepository.save(user);

    this.eventEmitter.emit('team.member.removed', {
      companyId,
      teamId,
      userId,
    });

    return { success: true };
  }

  /**
   * Get Team Members
   */
  async getMembers(companyId: string, teamId: string): Promise<User[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.teams', 'teams')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.company_id = :companyId', { companyId })
      .andWhere('teams.id = :teamId', { teamId })
      .getMany();

    return users;
  }

  /**
   * Find all teams
   */
  async findAll(
    companyId: string,
    filters?: {
      type?: string;
      active?: boolean;
    },
  ): Promise<Team[]> {
    const where: any = { company_id: companyId };

    if (filters?.type) where.type = filters.type;
    if (filters?.active !== undefined) where.active = filters.active;

    return this.teamRepository.find({
      where,
      relations: ['leader'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Find team by ID
   */
  async findOne(companyId: string, teamId: string): Promise<Team> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId, company_id: companyId },
      relations: ['leader'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  /**
   * Delete team
   */
  async deleteTeam(companyId: string, teamId: string): Promise<void> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId, company_id: companyId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    await this.teamRepository.remove(team);

    this.eventEmitter.emit('team.deleted', {
      companyId,
      teamId,
    });
  }

  /**
   * Get Team Performance
   * Agregação de métricas de todos os membros
   */
  async getTeamPerformance(
    companyId: string,
    teamId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    total_members: number;
    total_leads: number;
    total_deals: number;
    total_revenue: number;
    total_tasks_completed: number;
    top_performers: Array<{
      user_id: string;
      user_name: string;
      deals_closed: number;
      revenue: number;
    }>;
  }> {
    const members = await this.getMembers(companyId, teamId);

    // TODO: Integrate with CRM, Financial, Tasks modules for real metrics
    return {
      total_members: members.length,
      total_leads: 0,
      total_deals: 0,
      total_revenue: 0,
      total_tasks_completed: 0,
      top_performers: [],
    };
  }
}
