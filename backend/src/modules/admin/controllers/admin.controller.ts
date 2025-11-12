import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContractService } from '../services/contract.service';
import { ProposalService } from '../services/proposal.service';
import { CommissionService } from '../services/commission.service';
import { CurrentUser, CurrentUserData } from '../../../common/decorators/current-user.decorator';

/**
 * Admin Controller - Módulo 8
 *
 * Endpoints para contratos, propostas e comissões
 */
@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(
    private readonly contractService: ContractService,
    private readonly proposalService: ProposalService,
    private readonly commissionService: CommissionService,
  ) {}

  // ========== Contratos (Módulo 8.1) ==========

  @Post('contracts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria contrato' })
  async createContract(@CurrentUser() user: CurrentUserData, @Body() body: any) {
    return this.contractService.create(user.companyId, body);
  }

  @Get('contracts')
  @ApiOperation({ summary: 'Lista contratos' })
  async findAllContracts(
    @CurrentUser() user: CurrentUserData,
    @Query('contractType') contractType?: 'sale' | 'rent',
    @Query('status') status?: string,
    @Query('propertyId') propertyId?: string,
    @Query('leadId') leadId?: string,
    @Query('ownerId') ownerId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const skip = (page - 1) * limit;
    return this.contractService.findAll(user.companyId, {
      contractType,
      status,
      propertyId,
      leadId,
      ownerId,
      skip,
      take: limit,
    });
  }

  @Get('contracts/:id')
  @ApiOperation({ summary: 'Busca contrato por ID' })
  async findOneContract(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.contractService.findOne(id, user.companyId);
  }

  @Put('contracts/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualiza contrato' })
  async updateContract(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.contractService.update(id, user.companyId, body);
  }

  @Post('contracts/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ativa contrato (após assinatura)' })
  async activateContract(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.contractService.activate(id, user.companyId);
  }

  @Post('contracts/:id/apply-readjustment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aplica reajuste de aluguel' })
  async applyReadjustment(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { indexValue: number },
  ) {
    return this.contractService.applyReadjustment(
      id,
      user.companyId,
      body.indexValue,
    );
  }

  @Post('contracts/:id/calculate-termination')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calcula rescisão de contrato' })
  async calculateTermination(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { terminationDate: Date },
  ) {
    return this.contractService.calculateTermination(
      id,
      user.companyId,
      body.terminationDate,
    );
  }

  @Post('contracts/:id/terminate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Termina contrato' })
  async terminateContract(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.contractService.terminate(id, user.companyId);
  }

  // ========== Propostas (Módulo 8.2) ==========

  @Post('proposals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria proposta' })
  async createProposal(@CurrentUser() user: CurrentUserData, @Body() body: any) {
    return this.proposalService.create(user.companyId, body);
  }

  @Get('proposals')
  @ApiOperation({ summary: 'Lista propostas' })
  async findAllProposals(
    @CurrentUser() user: CurrentUserData,
    @Query('propertyId') propertyId?: string,
    @Query('leadId') leadId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('proposalType') proposalType?: 'sale' | 'rent',
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const skip = (page - 1) * limit;
    return this.proposalService.findAll(user.companyId, {
      propertyId,
      leadId,
      userId,
      status,
      proposalType,
      skip,
      take: limit,
    });
  }

  @Get('proposals/:id')
  @ApiOperation({ summary: 'Busca proposta por ID' })
  async findOneProposal(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.proposalService.findOne(id, user.companyId);
  }

  @Post('proposals/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceita proposta' })
  async acceptProposal(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.proposalService.accept(id, user.companyId);
  }

  @Post('proposals/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rejeita proposta' })
  async rejectProposal(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.proposalService.reject(id, user.companyId);
  }

  @Post('proposals/:id/counter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Contraproposta' })
  async counterProposal(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { newValue: number },
  ) {
    return this.proposalService.counter(id, user.companyId, body.newValue);
  }

  @Post('proposals/:id/send-for-signature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envia para assinatura eletrônica' })
  async sendForSignature(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.proposalService.sendForSignature(id, user.companyId);
  }

  // ========== Comissões (Módulo 8.4) ==========

  @Get('commissions')
  @ApiOperation({ summary: 'Lista comissões' })
  async findAllCommissions(
    @CurrentUser() user: CurrentUserData,
    @Query('contractId') contractId?: string,
    @Query('recipientUserId') recipientUserId?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const skip = (page - 1) * limit;
    return this.commissionService.findAll(user.companyId, {
      contractId,
      recipientUserId,
      status,
      skip,
      take: limit,
    });
  }

  @Post('commissions/:id/mark-paid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marca comissão como paga' })
  async markCommissionPaid(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.commissionService.markAsPaid(id, user.companyId);
  }

  @Post('commission-rules')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria regra de comissão' })
  async createCommissionRule(
    @CurrentUser() user: CurrentUserData,
    @Body() body: any,
  ) {
    return this.commissionService.createRule(user.companyId, body);
  }

  @Get('commission-rules')
  @ApiOperation({ summary: 'Lista regras de comissão' })
  async findAllCommissionRules(@CurrentUser() user: CurrentUserData) {
    return this.commissionService.findAllRules(user.companyId);
  }

  @Put('commission-rules/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualiza regra de comissão' })
  async updateCommissionRule(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.commissionService.updateRule(id, user.companyId, body);
  }
}
