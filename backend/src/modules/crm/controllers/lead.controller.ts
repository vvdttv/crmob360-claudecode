import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { LeadService } from '../services/lead.service';
import { CurrentUser, CurrentUserData } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';

/**
 * Lead Controller - Módulo 1 (CRM)
 *
 * Endpoints para gerenciamento de leads e funil de vendas
 */
@ApiTags('CRM')
@Controller('crm/leads')
@ApiBearerAuth('JWT-auth')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  /**
   * Criar novo lead (Módulo 1.3 - Captura de Leads)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cria novo lead',
    description:
      'Cria um novo lead com registro de consentimento LGPD obrigatório',
  })
  @ApiResponse({ status: 201, description: 'Lead criado com sucesso' })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body()
    body: {
      fullName: string;
      email?: string;
      phone?: string;
      source: string;
      sourceDetail?: string;
      pipelineId?: string;
      assignedUserId?: string;
      searchProfile?: any;
      consent: {
        ipAddress?: string;
        userAgent?: string;
        channel: string;
        permissions: {
          termsAccepted: boolean;
          emailMarketing: boolean;
          whatsappMarketing: boolean;
          aiProfiling: boolean;
        };
      };
    },
  ) {
    return this.leadService.createLead(user.companyId, body);
  }

  /**
   * Listar leads com filtros (Módulo 1.1 - Funil)
   */
  @Get()
  @RequirePermissions('leads.view')
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: 'Lista leads com filtros' })
  @ApiQuery({ name: 'pipelineId', required: false })
  @ApiQuery({ name: 'stageId', required: false })
  @ApiQuery({ name: 'assignedUserId', required: false })
  @ApiQuery({ name: 'source', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'minScore', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('pipelineId') pipelineId?: string,
    @Query('stageId') stageId?: string,
    @Query('assignedUserId') assignedUserId?: string,
    @Query('source') source?: string,
    @Query('search') search?: string,
    @Query('minScore') minScore?: number,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const skip = (page - 1) * limit;

    return this.leadService.findAll(user.companyId, {
      pipelineId,
      stageId,
      assignedUserId,
      source,
      search,
      minScore,
      skip,
      take: limit,
    });
  }

  /**
   * Buscar lead por ID
   */
  @Get(':id')
  @RequirePermissions('leads.view')
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: 'Busca lead por ID' })
  async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.leadService.findOne(id, user.companyId);
  }

  /**
   * Mover lead entre etapas (Módulo 1.1 - Drag and Drop)
   */
  @Put(':id/move-stage')
  @RequirePermissions('leads.edit')
  @UseGuards(PermissionsGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Move lead para outra etapa do funil',
    description: 'Implementa drag-and-drop e dispara gatilhos de automação',
  })
  async moveStage(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { stageId: string },
  ) {
    return this.leadService.moveStage(id, user.companyId, body.stageId);
  }

  /**
   * Atualizar perfil de busca (Módulo 1.4 - Matching)
   */
  @Put(':id/search-profile')
  @RequirePermissions('leads.edit')
  @UseGuards(PermissionsGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualiza perfil de busca do lead',
    description: 'Usado para matching automático com imóveis',
  })
  async updateSearchProfile(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() searchProfile: any,
  ) {
    return this.leadService.updateSearchProfile(id, user.companyId, searchProfile);
  }

  /**
   * Buscar leads que dão match com imóvel (Módulo 1.4)
   */
  @Post('matching')
  @RequirePermissions('leads.view', 'properties.view')
  @UseGuards(PermissionsGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Busca leads que dão match com perfil de imóvel',
    description: 'Retorna leads cujo perfil de busca combina com o imóvel',
  })
  async findMatching(
    @CurrentUser() user: CurrentUserData,
    @Body()
    propertyProfile: {
      propertyType: string;
      transactionType: string;
      price: number;
      bedrooms: number;
      neighborhood: string;
    },
  ) {
    return this.leadService.findMatchingLeads(user.companyId, propertyProfile);
  }

  /**
   * Soft delete
   */
  @Delete(':id')
  @RequirePermissions('leads.delete')
  @UseGuards(PermissionsGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove lead (soft delete)' })
  async remove(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    await this.leadService.softDelete(id, user.companyId);
  }
}
