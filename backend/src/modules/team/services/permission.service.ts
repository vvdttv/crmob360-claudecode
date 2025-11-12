import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';

/**
 * Permission Service - Module 4.1
 *
 * RBAC (Role-Based Access Control):
 * - Gestão de permissões granulares
 * - Roles com múltiplas permissões
 * - Check de permissões para usuários
 * - Seed de permissões do sistema
 */
@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Seed System Permissions
   * Cria permissões padrão do sistema (executar na inicialização)
   */
  async seedPermissions(): Promise<Permission[]> {
    const modules = [
      'leads',
      'clients',
      'properties',
      'owners',
      'contracts',
      'financial',
      'marketing',
      'processes',
      'tasks',
      'reports',
      'users',
      'lgpd',
    ];

    const actions: Array<'create' | 'read' | 'update' | 'delete' | 'manage'> = [
      'create',
      'read',
      'update',
      'delete',
      'manage',
    ];

    const permissions: Permission[] = [];

    for (const module of modules) {
      for (const action of actions) {
        const slug = `${module}.${action}`;

        // Check if exists
        let permission = await this.permissionRepository.findOne({
          where: { slug },
        });

        if (!permission) {
          permission = this.permissionRepository.create({
            name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${module}`,
            slug,
            module,
            action,
            is_system: true,
          });
          permissions.push(await this.permissionRepository.save(permission));
        }
      }
    }

    return permissions;
  }

  /**
   * Create Role
   */
  async createRole(
    companyId: string | null,
    data: {
      name: string;
      slug: string;
      description?: string;
      level?: number;
      permission_ids?: string[];
    },
  ): Promise<Role> {
    const role = this.roleRepository.create({
      company_id: companyId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      level: data.level || 2,
      is_system: companyId === null,
    });

    const savedRole = await this.roleRepository.save(role);

    // Attach permissions
    if (data.permission_ids && data.permission_ids.length > 0) {
      await this.attachPermissions(savedRole.id, data.permission_ids);
    }

    return this.roleRepository.findOne({
      where: { id: savedRole.id },
      relations: ['permissions'],
    });
  }

  /**
   * Update Role
   */
  async updateRole(
    roleId: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string;
      level: number;
    }>,
  ): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.is_system) {
      throw new Error('Cannot update system role');
    }

    Object.assign(role, data);
    return this.roleRepository.save(role);
  }

  /**
   * Attach Permissions to Role
   */
  async attachPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });

    role.permissions = permissions;
    return this.roleRepository.save(role);
  }

  /**
   * Detach Permission from Role
   */
  async detachPermission(
    roleId: string,
    permissionId: string,
  ): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    role.permissions = role.permissions.filter((p) => p.id !== permissionId);
    return this.roleRepository.save(role);
  }

  /**
   * Check if user has permission
   * CRITICAL: Use this method before any operation
   */
  async checkPermission(
    userId: string,
    permissionSlug: string,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions'],
    });

    if (!user || !user.role) {
      return false;
    }

    // Check if role has permission
    const hasPermission = user.role.permissions.some(
      (p) => p.slug === permissionSlug,
    );

    // Check for "manage" permission (wildcard)
    const module = permissionSlug.split('.')[0];
    const hasManagePermission = user.role.permissions.some(
      (p) => p.slug === `${module}.manage`,
    );

    return hasPermission || hasManagePermission;
  }

  /**
   * Get all permissions
   */
  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { module: 'ASC', action: 'ASC' },
    });
  }

  /**
   * Get all roles
   */
  async findAllRoles(companyId?: string): Promise<Role[]> {
    const where: any = {};
    if (companyId) {
      where.company_id = companyId;
    }

    return this.roleRepository.find({
      where,
      relations: ['permissions'],
      order: { level: 'ASC' },
    });
  }

  /**
   * Get role by ID
   */
  async findRole(roleId: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: string): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.is_system) {
      throw new Error('Cannot delete system role');
    }

    // Check if any users have this role
    const usersWithRole = await this.userRepository.count({
      where: { role_id: roleId },
    });

    if (usersWithRole > 0) {
      throw new Error('Cannot delete role that is assigned to users');
    }

    await this.roleRepository.remove(role);
  }
}
