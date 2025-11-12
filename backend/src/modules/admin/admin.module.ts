import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Contract } from './entities/contract.entity';
import { Proposal } from './entities/proposal.entity';
import { CommissionRule } from './entities/commission-rule.entity';
import { Commission } from './entities/commission.entity';

// Services
import { ContractService } from './services/contract.service';
import { ProposalService } from './services/proposal.service';
import { CommissionService } from './services/commission.service';

// Controllers
import { AdminController } from './controllers/admin.controller';

/**
 * Admin Module - Módulo 8
 *
 * Gestão e Administração:
 * - 8.1: Gestão da Carteira de Inquilinos
 * - 8.2: Propostas e Assinatura Eletrônica
 * - 8.4: Gestão de Comissões (Motor de Regras)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, Proposal, CommissionRule, Commission]),
  ],
  providers: [ContractService, ProposalService, CommissionService],
  controllers: [AdminController],
  exports: [ContractService, ProposalService, CommissionService],
})
export class AdminModule {}
