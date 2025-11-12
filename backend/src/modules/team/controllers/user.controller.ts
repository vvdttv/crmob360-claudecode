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
import { UserService } from '../services/user.service';
import { PermissionService } from '../services/permission.service';

/**
 * User Controller - Module 4.1
 *
 * REST API para Gestão de Usuários:
 * - CRUD de usuários
 * - Convite e ativação
 * - Gestão de senhas
 * - Permissões e roles
 */
@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly permissionService: PermissionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new user or send invitation' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(
    @Body('company_id') companyId: string,
    @Body() data: any,
  ) {
    return this.userService.createUser(companyId, data);
  }

  @Post('accept-invitation')
  @ApiOperation({ summary: 'Accept invitation and set password' })
  async acceptInvitation(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.userService.acceptInvitation(token, password);
  }

  @Get()
  @ApiOperation({ summary: 'List all users' })
  async listUsers(
    @Query('company_id') companyId: string,
    @Query('status') status?: string,
    @Query('role_id') roleId?: string,
    @Query('team_id') teamId?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (roleId) filters.role_id = roleId;
    if (teamId) filters.team_id = teamId;

    return this.userService.findAll(companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.userService.findOne(companyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  async updateUser(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.userService.updateUser(companyId, id, data);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(
    @Param('id') id: string,
    @Body('current_password') currentPassword: string,
    @Body('new_password') newPassword: string,
  ) {
    return this.userService.changePassword(id, currentPassword, newPassword);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate user' })
  async deactivateUser(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.userService.deactivateUser(companyId, id);
  }

  @Patch(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate user' })
  async reactivateUser(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.userService.reactivateUser(companyId, id);
  }

  @Get(':id/hierarchy')
  @ApiOperation({ summary: 'Get user hierarchy (subordinates)' })
  async getHierarchy(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.userService.getHierarchy(companyId, id);
  }

  @Get(':id/performance')
  @ApiOperation({ summary: 'Get user performance metrics' })
  async getPerformance(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.userService.getPerformanceMetrics(
      companyId,
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  // ========== ROLES & PERMISSIONS ==========

  @Get('roles/list')
  @ApiOperation({ summary: 'List all roles' })
  async listRoles(@Query('company_id') companyId?: string) {
    return this.permissionService.findAllRoles(companyId);
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create new role' })
  async createRole(
    @Body('company_id') companyId: string,
    @Body() data: any,
  ) {
    return this.permissionService.createRole(companyId, data);
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get role by ID' })
  async getRole(@Param('id') id: string) {
    return this.permissionService.findRole(id);
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: 'Update role' })
  async updateRole(@Param('id') id: string, @Body() data: any) {
    return this.permissionService.updateRole(id, data);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Delete role' })
  async deleteRole(@Param('id') id: string) {
    await this.permissionService.deleteRole(id);
    return { success: true };
  }

  @Post('roles/:id/permissions')
  @ApiOperation({ summary: 'Attach permissions to role' })
  async attachPermissions(
    @Param('id') id: string,
    @Body('permission_ids') permissionIds: string[],
  ) {
    return this.permissionService.attachPermissions(id, permissionIds);
  }

  @Delete('roles/:id/permissions/:permission_id')
  @ApiOperation({ summary: 'Detach permission from role' })
  async detachPermission(
    @Param('id') id: string,
    @Param('permission_id') permissionId: string,
  ) {
    return this.permissionService.detachPermission(id, permissionId);
  }

  @Get('permissions/list')
  @ApiOperation({ summary: 'List all permissions' })
  async listPermissions() {
    return this.permissionService.findAllPermissions();
  }

  @Post('permissions/check')
  @ApiOperation({ summary: 'Check if user has permission' })
  async checkPermission(
    @Body('user_id') userId: string,
    @Body('permission_slug') permissionSlug: string,
  ) {
    const hasPermission = await this.permissionService.checkPermission(
      userId,
      permissionSlug,
    );
    return { has_permission: hasPermission };
  }
}
