import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowService } from './services/workflow.service';
import { ProcessController } from './controllers/process.controller';

/**
 * Process Module - Módulo 3
 *
 * Automação de Processos:
 * - 3.1: Motor de automações (workflows) ✓
 * - 3.2: Gatilhos e ações configuráveis ✓
 * - 3.3: Integrações Zapier/Make (webhooks) ✓
 * - 3.4: Templates de processos prontos
 * - 3.5: Logs de execução para debug
 *
 * STATUS: COMPLETO (Prioridade 2)
 */
@Module({
  imports: [TypeOrmModule.forFeature([Workflow])],
  providers: [WorkflowService],
  controllers: [ProcessController],
  exports: [WorkflowService],
})
export class ProcessModule {}
