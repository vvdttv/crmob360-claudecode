import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { FinancialEntry } from './entities/financial-entry.entity';
import { ChartOfAccounts } from './entities/chart-of-accounts.entity';
import { CostCenter } from './entities/cost-center.entity';
import { BankTransaction } from './entities/bank-transaction.entity';

// Services
import { FinancialService } from './services/financial.service';
import { BankReconciliationService } from './services/bank-reconciliation.service';
import { BoletoService } from './services/boleto.service';

// Controllers
import { FinancialController } from './controllers/financial.controller';

/**
 * Financial Module - Módulo 9
 *
 * Gestão Financeira Completa:
 * - 9.1: Contas a Pagar e Receber ✓
 * - 9.2: Conciliação Bancária Automática ✓
 * - 9.3: Geração de Boletos (Gateway) ✓
 * - 9.4: DRE (Demonstrativo de Resultado) ✓
 * - 9.5: Gestão de Inadimplência ✓
 * - 9.6: Cálculo de Rescisão Automático (via Admin Module)
 * - 9.7: Integração ERP (Conta Azul/Omie) - TODO
 *
 * STATUS: COMPLETO (Prioridade 1)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinancialEntry,
      ChartOfAccounts,
      CostCenter,
      BankTransaction,
    ]),
  ],
  providers: [FinancialService, BankReconciliationService, BoletoService],
  controllers: [FinancialController],
  exports: [FinancialService, BankReconciliationService, BoletoService],
})
export class FinancialModule {}
