import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FinancialService } from '../services/financial.service';
import { BankReconciliationService } from '../services/bank-reconciliation.service';
import { BoletoService } from '../services/boleto.service';

/**
 * Financial Controller - Module 9
 *
 * REST API para Gestão Financeira:
 * - Contas a Pagar e Receber (9.1)
 * - Conciliação Bancária (9.2)
 * - Geração de Boletos (9.3)
 * - DRE e Relatórios (9.4)
 * - Inadimplência (9.5)
 */
@ApiTags('Financial')
@Controller('financial')
// @UseGuards(JwtAuthGuard) // TODO: Uncomment when auth is ready
export class FinancialController {
  constructor(
    private readonly financialService: FinancialService,
    private readonly reconciliationService: BankReconciliationService,
    private readonly boletoService: BoletoService,
  ) {}

  // ========== FINANCIAL ENTRIES (9.1) ==========

  @Post('entries')
  @ApiOperation({ summary: 'Create financial entry (receivable or payable)' })
  @ApiResponse({ status: 201, description: 'Entry created successfully' })
  async createEntry(
    @Body('company_id') companyId: string,
    @Body() data: any,
  ) {
    return this.financialService.createEntry(companyId, data);
  }

  @Get('entries')
  @ApiOperation({ summary: 'List financial entries with filters' })
  async listEntries(
    @Query('company_id') companyId: string,
    @Query('type') type?: 'receivable' | 'payable',
    @Query('status') status?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('person_id') personId?: string,
    @Query('account_id') accountId?: string,
    @Query('cost_center_id') costCenterId?: string,
  ) {
    const filters: any = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (startDate) filters.start_date = new Date(startDate);
    if (endDate) filters.end_date = new Date(endDate);
    if (personId) filters.person_id = personId;
    if (accountId) filters.account_id = accountId;
    if (costCenterId) filters.cost_center_id = costCenterId;

    return this.financialService.findAll(companyId, filters);
  }

  @Get('entries/:id')
  @ApiOperation({ summary: 'Get financial entry by ID' })
  async getEntry(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.financialService.findOne(companyId, id);
  }

  @Patch('entries/:id/pay')
  @ApiOperation({ summary: 'Register payment for an entry' })
  async registerPayment(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.financialService.registerPayment(companyId, id, data);
  }

  @Patch('entries/:id/cancel')
  @ApiOperation({ summary: 'Cancel financial entry' })
  async cancelEntry(
    @Query('company_id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.financialService.cancelEntry(companyId, id);
  }

  // ========== REPORTS & DRE (9.4) ==========

  @Get('reports/dre')
  @ApiOperation({ summary: 'Calculate DRE (Income Statement)' })
  @ApiResponse({
    status: 200,
    description: 'DRE calculated successfully',
  })
  async calculateDRE(
    @Query('company_id') companyId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('cost_center_id') costCenterId?: string,
  ) {
    return this.financialService.calculateDRE(
      companyId,
      new Date(startDate),
      new Date(endDate),
      costCenterId,
    );
  }

  @Get('reports/cash-flow')
  @ApiOperation({ summary: 'Get cash flow (projected and realized)' })
  async getCashFlow(
    @Query('company_id') companyId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.financialService.getCashFlow(
      companyId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('reports/overdue')
  @ApiOperation({ summary: 'Get overdue report (Module 9.5)' })
  async getOverdueReport(@Query('company_id') companyId: string) {
    return this.financialService.getOverdueReport(companyId);
  }

  @Post('entries/mark-overdue')
  @ApiOperation({ summary: 'Mark overdue entries (run daily via cron)' })
  async markOverdueEntries(@Body('company_id') companyId: string) {
    const count = await this.financialService.markOverdueEntries(companyId);
    return { success: true, marked_overdue: count };
  }

  // ========== BANK RECONCILIATION (9.2) ==========

  @Post('bank/import')
  @ApiOperation({ summary: 'Import bank transactions (OFX/API)' })
  async importBankTransactions(
    @Body('company_id') companyId: string,
    @Body('bank_account_id') bankAccountId: string,
    @Body('transactions') transactions: any[],
    @Body('source') source: 'ofx' | 'api' | 'manual',
  ) {
    return this.reconciliationService.importTransactions(
      companyId,
      bankAccountId,
      transactions,
      source,
    );
  }

  @Get('bank/pending')
  @ApiOperation({ summary: 'Get pending reconciliation transactions' })
  async getPendingReconciliation(
    @Query('company_id') companyId: string,
    @Query('bank_account_id') bankAccountId?: string,
  ) {
    return this.reconciliationService.getPendingReconciliation(
      companyId,
      bankAccountId,
    );
  }

  @Get('bank/transactions/:id/suggestions')
  @ApiOperation({ summary: 'Get reconciliation suggestions for a transaction' })
  async getReconciliationSuggestions(
    @Query('company_id') companyId: string,
    @Param('id') transactionId: string,
  ) {
    return this.reconciliationService.getSuggestions(companyId, transactionId);
  }

  @Post('bank/reconcile')
  @ApiOperation({ summary: 'Reconcile bank transaction with financial entry' })
  async reconcileTransaction(
    @Body('company_id') companyId: string,
    @Body('transaction_id') transactionId: string,
    @Body('entry_id') entryId: string,
    @Body('user_id') userId: string,
  ) {
    return this.reconciliationService.reconcile(
      companyId,
      transactionId,
      entryId,
      userId,
    );
  }

  @Patch('bank/transactions/:id/ignore')
  @ApiOperation({ summary: 'Ignore bank transaction' })
  async ignoreTransaction(
    @Query('company_id') companyId: string,
    @Param('id') transactionId: string,
  ) {
    return this.reconciliationService.ignoreTransaction(
      companyId,
      transactionId,
    );
  }

  // ========== BOLETO GENERATION (9.3) ==========

  @Post('boleto/generate')
  @ApiOperation({ summary: 'Generate boleto for a receivable entry' })
  @ApiResponse({ status: 201, description: 'Boleto generated successfully' })
  async generateBoleto(
    @Body('company_id') companyId: string,
    @Body('entry_id') entryId: string,
    @Body('payer_data') payerData: any,
  ) {
    return this.boletoService.generateBoleto(companyId, entryId, payerData);
  }

  @Post('boleto/webhook')
  @ApiOperation({ summary: 'Process boleto webhook from payment gateway' })
  async processBoletoWebhook(@Body() payload: any) {
    return this.boletoService.processWebhook(payload);
  }

  @Get('boleto/:entry_id')
  @ApiOperation({ summary: 'Get boleto details' })
  async getBoletoDetails(
    @Query('company_id') companyId: string,
    @Param('entry_id') entryId: string,
  ) {
    return this.boletoService.getBoletoDetails(companyId, entryId);
  }

  @Patch('boleto/:entry_id/cancel')
  @ApiOperation({ summary: 'Cancel boleto' })
  async cancelBoleto(
    @Query('company_id') companyId: string,
    @Param('entry_id') entryId: string,
  ) {
    return this.boletoService.cancelBoleto(companyId, entryId);
  }
}
