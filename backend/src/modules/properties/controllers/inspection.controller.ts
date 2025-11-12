import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InspectionService } from '../services/inspection.service';
import { CurrentUser, CurrentUserData } from '../../../common/decorators/current-user.decorator';

/**
 * Inspection Controller - Módulo 5.6
 *
 * Endpoints para vistorias digitais
 */
@ApiTags('Properties')
@Controller('inspections')
@ApiBearerAuth('JWT-auth')
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  // ========== Templates ==========

  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria template de vistoria' })
  async createTemplate(@CurrentUser() user: CurrentUserData, @Body() body: any) {
    return this.inspectionService.createTemplate(user.companyId, body);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Lista templates de vistoria' })
  async findAllTemplates(@CurrentUser() user: CurrentUserData) {
    return this.inspectionService.findAllTemplates(user.companyId);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Busca template por ID' })
  async findOneTemplate(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.inspectionService.findOneTemplate(id, user.companyId);
  }

  // ========== Vistorias ==========

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria nova vistoria' })
  async create(@CurrentUser() user: CurrentUserData, @Body() body: any) {
    return this.inspectionService.create(user.companyId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca vistoria por ID' })
  async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.inspectionService.findOne(id, user.companyId);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Lista vistorias de um imóvel' })
  async findByProperty(
    @CurrentUser() user: CurrentUserData,
    @Param('propertyId') propertyId: string,
  ) {
    return this.inspectionService.findByProperty(propertyId, user.companyId);
  }

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'Lista vistorias de um contrato' })
  async findByContract(
    @CurrentUser() user: CurrentUserData,
    @Param('contractId') contractId: string,
  ) {
    return this.inspectionService.findByContract(contractId, user.companyId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualiza vistoria (suporta offline sync)' })
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.inspectionService.update(id, user.companyId, body);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finaliza vistoria e gera PDF' })
  async complete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.inspectionService.complete(id, user.companyId);
  }

  @Post(':id/sign/tenant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registra assinatura do inquilino' })
  async signByTenant(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { signatureUrl: string },
  ) {
    return this.inspectionService.signByTenant(
      id,
      user.companyId,
      body.signatureUrl,
    );
  }

  @Post(':id/sign/owner')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registra assinatura do proprietário' })
  async signByOwner(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { signatureUrl: string },
  ) {
    return this.inspectionService.signByOwner(
      id,
      user.companyId,
      body.signatureUrl,
    );
  }

  @Get('compare/:contractId')
  @ApiOperation({ summary: 'Compara vistoria de entrada com saída' })
  async compareEntryExit(
    @CurrentUser() user: CurrentUserData,
    @Param('contractId') contractId: string,
  ) {
    return this.inspectionService.compareEntryExit(contractId, user.companyId);
  }

  @Post(':id/process-triggers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Processa gatilhos de automação da vistoria' })
  async processTriggers(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    await this.inspectionService.processAutomationTriggers(id, user.companyId);
    return { message: 'Gatilhos processados com sucesso' };
  }
}
