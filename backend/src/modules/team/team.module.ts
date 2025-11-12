import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Team } from './entities/team.entity';
import { Task } from './entities/task.entity';
import { Goal } from './entities/goal.entity';

// Services
import { UserService } from './services/user.service';
import { PermissionService } from './services/permission.service';
import { TeamService } from './services/team.service';
import { TaskService } from './services/task.service';
import { GoalService } from './services/goal.service';

// Controllers
import { UserController } from './controllers/user.controller';
import { TeamController } from './controllers/team.controller';
import { TaskController } from './controllers/task.controller';

/**
 * Team Module - Módulo 4
 *
 * Gestão de Equipe e Usuários:
 * - 4.1: Gestão de Usuários com RBAC ✓
 * - 4.2: Gestão de Equipes e Hierarquia ✓
 * - 4.3: Task Management (Kanban) ✓
 * - 4.4: Metas e Performance ✓
 * - 4.5: Relatórios de Produtividade (via Reports Module)
 *
 * STATUS: COMPLETO (Prioridade 2)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission, Team, Task, Goal]),
  ],
  providers: [
    UserService,
    PermissionService,
    TeamService,
    TaskService,
    GoalService,
  ],
  controllers: [UserController, TeamController, TaskController],
  exports: [
    UserService,
    PermissionService,
    TeamService,
    TaskService,
    GoalService,
  ],
})
export class TeamModule {}
