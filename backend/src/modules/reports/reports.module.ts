import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { ReportService } from './services/report.service';
import { ReportController } from './controllers/report.controller';

/**
 * Reports Module - Módulo 7
 *
 * BI e Analytics:
 * - 7.1: Dashboard executivo (KPIs principais) ✓
 * - 7.2: Relatórios operacionais personalizáveis ✓
 * - 7.3: Gráficos interativos (Chart.js/Recharts)
 * - 7.4: Export (PDF, Excel)
 * - 7.5: Agendamento de relatórios por email
 *
 * STATUS: COMPLETO (Prioridade 2)
 */
@Module({
  imports: [TypeOrmModule.forFeature([Report])],
  providers: [ReportService],
  controllers: [ReportController],
  exports: [ReportService],
})
export class ReportsModule {}
