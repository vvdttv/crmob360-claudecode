import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PropertyService } from '../services/property.service';
import { CurrentUser, CurrentUserData } from '../../../common/decorators/current-user.decorator';

/**
 * Property Controller - Módulo 5
 *
 * Endpoints para gerenciamento de imóveis
 */
@ApiTags('Properties')
@Controller('properties')
@ApiBearerAuth('JWT-auth')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  /**
   * Criar imóvel (Módulo 5.1)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria novo imóvel' })
  async create(@CurrentUser() user: CurrentUserData, @Body() body: any) {
    return this.propertyService.create(user.companyId, body, user.id);
  }

  /**
   * Listar imóveis com filtros avançados
   */
  @Get()
  @ApiOperation({ summary: 'Lista imóveis com filtros' })
  @ApiQuery({ name: 'propertyType', required: false })
  @ApiQuery({ name: 'transactionType', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'neighborhood', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'bedrooms', required: false, type: Number })
  @ApiQuery({ name: 'ownerId', required: false })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('propertyType') propertyType?: string,
    @Query('transactionType') transactionType?: 'sale' | 'rent' | 'both',
    @Query('status') status?: string,
    @Query('city') city?: string,
    @Query('neighborhood') neighborhood?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('bedrooms') bedrooms?: number,
    @Query('ownerId') ownerId?: string,
    @Query('isPublished') isPublished?: boolean,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const skip = (page - 1) * limit;

    return this.propertyService.findAll(user.companyId, {
      propertyType,
      transactionType,
      status,
      city,
      neighborhood,
      minPrice,
      maxPrice,
      bedrooms,
      ownerId,
      isPublished,
      search,
      skip,
      take: limit,
    });
  }

  /**
   * Buscar imóvel por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Busca imóvel por ID' })
  async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.propertyService.findOne(id, user.companyId);
  }

  /**
   * Atualizar imóvel
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualiza imóvel' })
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.propertyService.update(id, user.companyId, body, user.id);
  }

  /**
   * Publicar/despublicar imóvel (Módulo 5.2)
   */
  @Put(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publica ou despublica imóvel' })
  async togglePublish(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { publish: boolean },
  ) {
    return this.propertyService.togglePublish(
      id,
      user.companyId,
      body.publish,
      user.id,
    );
  }

  /**
   * Alterar status (Módulo 5.4)
   */
  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Altera status do imóvel' })
  async changeStatus(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { status: 'available' | 'reserved' | 'rented' | 'sold' | 'maintenance' },
  ) {
    return this.propertyService.changeStatus(
      id,
      user.companyId,
      body.status,
      user.id,
    );
  }

  /**
   * Buscar histórico (Módulo 5.4)
   */
  @Get(':id/history')
  @ApiOperation({ summary: 'Busca histórico do imóvel' })
  async getHistory(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.propertyService.getHistory(id, user.companyId);
  }

  /**
   * Registrar feedback de visita (Módulo 5.5)
   */
  @Post(':id/feedback')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra feedback de visita' })
  async createFeedback(
    @CurrentUser() user: CurrentUserData,
    @Param('id') propertyId: string,
    @Body()
    body: {
      leadId?: string;
      activityId?: string;
      rating?: number;
      positivePoints?: string;
      negativePoints?: string;
      wouldRentOrBuy?: boolean;
      feedbackData?: any;
    },
  ) {
    return this.propertyService.createFeedback({
      propertyId,
      ...body,
    });
  }

  /**
   * Buscar feedbacks (Módulo 5.5)
   */
  @Get(':id/feedbacks')
  @ApiOperation({ summary: 'Lista feedbacks do imóvel' })
  async getFeedbacks(
    @CurrentUser() user: CurrentUserData,
    @Param('id') propertyId: string,
  ) {
    return this.propertyService.getFeedbacks(propertyId, user.companyId);
  }

  /**
   * Remover imóvel
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove imóvel' })
  async remove(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    await this.propertyService.remove(id, user.companyId, user.id);
  }
}
