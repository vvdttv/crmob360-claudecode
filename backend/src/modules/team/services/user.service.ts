import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';

/**
 * User Service - Module 4.1
 *
 * Gestão de Usuários:
 * - CRUD completo
 * - Convite de usuários (invitation flow)
 * - Gestão de senhas
 * - Status e permissões
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create User
   * Cria um novo usuário (com convite ou direto)
   */
  async createUser(
    companyId: string,
    data: {
      name: string;
      email: string;
      phone?: string;
      role_id?: string;
      manager_id?: string;
      password?: string;
      send_invitation?: boolean;
    },
  ): Promise<User> {
    // Check if email already exists
    const exists = await this.userRepository.findOne({
      where: { company_id: companyId, email: data.email },
    });
    if (exists) {
      throw new ConflictException('Email already exists');
    }

    // Validate role
    if (data.role_id) {
      const role = await this.roleRepository.findOne({
        where: { id: data.role_id },
      });
      if (!role) {
        throw new NotFoundException('Role not found');
      }
    }

    // Create user
    const user = this.userRepository.create({
      company_id: companyId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role_id: data.role_id,
      manager_id: data.manager_id,
      status: data.password ? 'active' : 'invited',
    });

    // Set password or generate invitation token
    if (data.password) {
      user.password_hash = await bcrypt.hash(data.password, 10);
    } else {
      user.invitation_token = crypto.randomBytes(32).toString('hex');
      user.invitation_sent_at = new Date();
    }

    const savedUser = await this.userRepository.save(user);

    // Emit event
    if (data.send_invitation && !data.password) {
      this.eventEmitter.emit('user.invited', {
        companyId,
        userId: savedUser.id,
        email: savedUser.email,
        invitationToken: savedUser.invitation_token,
      });
    }

    this.eventEmitter.emit('user.created', {
      companyId,
      userId: savedUser.id,
    });

    return savedUser;
  }

  /**
   * Accept Invitation
   * Usuário aceita convite e define senha
   */
  async acceptInvitation(
    token: string,
    password: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { invitation_token: token, status: 'invited' },
    });

    if (!user) {
      throw new NotFoundException('Invalid invitation token');
    }

    // Check if token is expired (7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (user.invitation_sent_at < sevenDaysAgo) {
      throw new Error('Invitation token expired');
    }

    // Set password and activate
    user.password_hash = await bcrypt.hash(password, 10);
    user.status = 'active';
    user.invitation_token = null;

    return this.userRepository.save(user);
  }

  /**
   * Update User
   */
  async updateUser(
    companyId: string,
    userId: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      role_id: string;
      manager_id: string;
      avatar_url: string;
      preferences: any;
      notes: string;
    }>,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, company_id: companyId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  /**
   * Change Password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Set new password
    user.password_hash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return { success: true };
  }

  /**
   * Deactivate User
   */
  async deactivateUser(companyId: string, userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, company_id: companyId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = 'inactive';
    return this.userRepository.save(user);
  }

  /**
   * Reactivate User
   */
  async reactivateUser(companyId: string, userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, company_id: companyId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = 'active';
    return this.userRepository.save(user);
  }

  /**
   * Find all users
   */
  async findAll(
    companyId: string,
    filters?: {
      status?: string;
      role_id?: string;
      team_id?: string;
    },
  ): Promise<User[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.manager', 'manager')
      .leftJoinAndSelect('user.teams', 'teams')
      .where('user.company_id = :companyId', { companyId });

    if (filters?.status) {
      query.andWhere('user.status = :status', { status: filters.status });
    }

    if (filters?.role_id) {
      query.andWhere('user.role_id = :roleId', { roleId: filters.role_id });
    }

    if (filters?.team_id) {
      query.andWhere('teams.id = :teamId', { teamId: filters.team_id });
    }

    return query.getMany();
  }

  /**
   * Find user by ID
   */
  async findOne(companyId: string, userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, company_id: companyId },
      relations: ['role', 'manager', 'teams'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Find by email (for authentication)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role', 'role.permissions'],
    });
  }

  /**
   * Update last login
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      last_login_at: new Date(),
    });
  }

  /**
   * Get user hierarchy (subordinates)
   */
  async getHierarchy(companyId: string, userId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { company_id: companyId, manager_id: userId },
      relations: ['role'],
    });
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(
    companyId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    leads_created: number;
    deals_closed: number;
    revenue: number;
    tasks_completed: number;
    goal_progress: number;
  }> {
    // TODO: Integrate with other modules to get real metrics
    // This is a stub that should query CRM, Financial, Tasks modules
    return {
      leads_created: 0,
      deals_closed: 0,
      revenue: 0,
      tasks_completed: 0,
      goal_progress: 0,
    };
  }
}
