import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PortalService } from '../services/portal.service';

@ApiTags('Portal')
@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Post('users')
  @ApiOperation({ summary: 'Create portal user' })
  async createUser(@Body('company_id') companyId: string, @Body() data: any) {
    return this.portalService.createPortalUser(companyId, data);
  }

  @Post('accept-invitation')
  @ApiOperation({ summary: 'Accept invitation' })
  async acceptInvitation(@Body('token') token: string, @Body('password') password: string) {
    return this.portalService.acceptInvitation(token, password);
  }

  @Get('contracts')
  @ApiOperation({ summary: 'Get user contracts' })
  async getContracts(@Query('company_id') companyId: string, @Query('person_id') personId: string) {
    return this.portalService.getContracts(companyId, personId);
  }

  @Get('boletos')
  @ApiOperation({ summary: 'Get user boletos' })
  async getBoletos(@Query('company_id') companyId: string, @Query('person_id') personId: string) {
    return this.portalService.getBoletos(companyId, personId);
  }

  @Post('service-requests')
  @ApiOperation({ summary: 'Create service request' })
  async createServiceRequest(@Body('company_id') companyId: string, @Body('person_id') personId: string, @Body() data: any) {
    return this.portalService.createServiceRequest(companyId, personId, data);
  }
}
