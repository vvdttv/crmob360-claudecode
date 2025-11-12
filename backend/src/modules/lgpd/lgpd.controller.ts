import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LgpdPermissionService } from './services/lgpd-permission.service';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

/**
 * LGPD Controller - Módulo 13
 *
 * Endpoints para gestão de consentimento, privacidade e conformidade LGPD
 */
@ApiTags('LGPD')
@Controller('lgpd')
export class LgpdController {
  constructor(private readonly lgpdService: LgpdPermissionService) {}

  /**
   * Módulo 13.1: Registrar Consentimento (Opt-in)
   *
   * Chamado quando um lead aceita termos no formulário do site, app, etc
   */
  @Post('consent')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra consentimento (opt-in)' })
  async createConsent(
    @Body() body: {
      personId: string;
      personType: 'lead' | 'user';
      templateId?: string;
      ipAddress?: string;
      userAgent?: string;
      channel: string;
      permissions: {
        termsAccepted: boolean;
        emailMarketing: boolean;
        whatsappMarketing: boolean;
        aiProfiling: boolean;
      };
    },
  ) {
    return this.lgpdService.createConsent(body);
  }

  /**
   * Módulo 13.2: Buscar histórico de consentimentos (Logs Auditáveis)
   *
   * Usado para auditoria e Portal de Privacidade
   */
  @Get('consent/:personType/:personId')
  @ApiOperation({ summary: 'Busca histórico de consentimentos de uma pessoa' })
  async getConsents(
    @Param('personType') personType: 'lead' | 'user',
    @Param('personId') personId: string,
  ) {
    return this.lgpdService.getPersonConsents(personId, personType);
  }

  /**
   * Módulo 13.3: Portal de Privacidade - Atualizar Permissões
   *
   * Permite que o titular atualize suas preferências de privacidade
   */
  @Put('consent/:personType/:personId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualiza permissões de privacidade' })
  async updatePermissions(
    @Param('personType') personType: 'lead' | 'user',
    @Param('personId') personId: string,
    @Body()
    permissions: {
      emailMarketing?: boolean;
      whatsappMarketing?: boolean;
      aiProfiling?: boolean;
    },
  ) {
    return this.lgpdService.updatePermissions(personId, personType, permissions);
  }

  /**
   * Verificar permissão específica (usado internamente por outros módulos)
   */
  @Get('check-permission')
  @ApiOperation({ summary: 'Verifica se uma pessoa tem permissão específica' })
  async checkPermission(
    @Query('personId') personId: string,
    @Query('personType') personType: 'lead' | 'user',
    @Query('permissionType') permissionType: 'email_marketing' | 'whatsapp_marketing' | 'ai_profiling',
  ) {
    const hasPermission = await this.lgpdService.checkPermission(
      personId,
      personType,
      permissionType,
    );

    return {
      personId,
      personType,
      permissionType,
      hasPermission,
    };
  }

  /**
   * Módulo 13.3: Exportar dados (Portabilidade)
   *
   * TODO: Implementar lógica completa de exportação de todos os dados relacionados
   */
  @Get('data-export/:personType/:personId')
  @ApiOperation({ summary: 'Exporta todos os dados de uma pessoa (portabilidade)' })
  async exportData(
    @Param('personType') personType: 'lead' | 'user',
    @Param('personId') personId: string,
  ) {
    // Implementação futura: buscar dados de todas as tabelas relacionadas
    return {
      message: 'Exportação de dados em desenvolvimento',
      personId,
      personType,
    };
  }

  /**
   * Módulo 13.4: Anonimizar dados (Direito ao Esquecimento)
   *
   * TODO: Implementar lógica de anonimização
   */
  @Post('anonymize/:personType/:personId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Anonimiza dados de uma pessoa (esquecimento)' })
  async anonymizeData(
    @Param('personType') personType: 'lead' | 'user',
    @Param('personId') personId: string,
  ) {
    // Implementação futura: substituir dados pessoais por hash
    return {
      message: 'Anonimização de dados em desenvolvimento',
      personId,
      personType,
    };
  }

  /**
   * Criar template de consentimento (Admin)
   */
  @Post('template')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria template de consentimento' })
  async createTemplate(
    @Body()
    body: {
      companyId: string;
      name: string;
      version: string;
      title: string;
      content: string;
      templateType: 'site_form' | 'contract' | 'newsletter' | 'app';
    },
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.lgpdService.createConsentTemplate({
      ...body,
      companyId: user.companyId,
    });
  }

  /**
   * Buscar template ativo
   */
  @Get('template/:templateType')
  @ApiOperation({ summary: 'Busca template de consentimento ativo' })
  async getActiveTemplate(
    @Param('templateType') templateType: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.lgpdService.getActiveTemplate(user.companyId, templateType);
  }
}
