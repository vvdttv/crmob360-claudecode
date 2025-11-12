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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OwnerService } from '../services/owner.service';
import { CurrentUser, CurrentUserData } from '../../../common/decorators/current-user.decorator';

/**
 * Owner Controller - Módulo 7
 *
 * Endpoints para gerenciamento de proprietários
 */
@ApiTags('Properties')
@Controller('owners')
@ApiBearerAuth('JWT-auth')
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria proprietário' })
  async create(@CurrentUser() user: CurrentUserData, @Body() body: any) {
    return this.ownerService.create(user.companyId, body);
  }

  @Get()
  @ApiOperation({ summary: 'Lista proprietários' })
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('search') search?: string,
    @Query('ownerType') ownerType?: 'individual' | 'corporate',
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const skip = (page - 1) * limit;
    return this.ownerService.findAll(user.companyId, {
      search,
      ownerType,
      skip,
      take: limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca proprietário por ID' })
  async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.ownerService.findOne(id, user.companyId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualiza proprietário' })
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.ownerService.update(id, user.companyId, body);
  }

  @Post(':id/enable-portal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Habilita acesso ao portal do proprietário' })
  async enablePortal(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    return this.ownerService.enablePortalAccess(
      id,
      user.companyId,
      body.password,
    );
  }

  @Post(':id/disable-portal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desabilita acesso ao portal' })
  async disablePortal(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.ownerService.disablePortalAccess(id, user.companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove proprietário' })
  async remove(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    await this.ownerService.remove(id, user.companyId);
  }
}
