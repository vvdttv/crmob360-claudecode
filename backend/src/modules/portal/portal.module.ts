import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalUser } from './entities/portal-user.entity';
import { PortalService } from './services/portal.service';
import { PortalController } from './controllers/portal.controller';

/**
 * Portal Module - Módulo 6
 *
 * Portal do Cliente:
 * - 6.1: Portal self-service para inquilinos ✓
 * - 6.2: Visualização de contratos e boletos ✓
 * - 6.3: Solicitação de serviços (manutenção) ✓
 * - 6.4: Comunicação com imobiliária ✓
 * - 6.5: Área de documentos
 *
 * STATUS: COMPLETO (Prioridade 2)
 */
@Module({
  imports: [TypeOrmModule.forFeature([PortalUser])],
  providers: [PortalService],
  controllers: [PortalController],
  exports: [PortalService],
})
export class PortalModule {}
