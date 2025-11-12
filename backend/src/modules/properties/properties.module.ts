import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Property } from './entities/property.entity';
import { Owner } from './entities/owner.entity';
import { PropertyHistory } from './entities/property-history.entity';
import { PropertyFeedback } from './entities/property-feedback.entity';
import { PropertyKey } from './entities/property-key.entity';
import { KeyLog } from './entities/key-log.entity';
import { InspectionTemplate } from './entities/inspection-template.entity';
import { Inspection } from './entities/inspection.entity';

// Services
import { PropertyService } from './services/property.service';
import { OwnerService } from './services/owner.service';
import { InspectionService } from './services/inspection.service';

// Controllers
import { PropertyController } from './controllers/property.controller';
import { OwnerController } from './controllers/owner.controller';
import { InspectionController } from './controllers/inspection.controller';

/**
 * Properties Module - Módulo 5
 *
 * Gestão completa de imóveis:
 * - 5.1: Gestão de Estoque
 * - 5.2: Multipublicação em Portais
 * - 5.3: Gestão de Chaves e Documentação
 * - 5.4: Histórico Completo do Imóvel
 * - 5.5: Feedback de Visita
 * - 5.6: Vistoria Digital (Offline-First)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Property,
      Owner,
      PropertyHistory,
      PropertyFeedback,
      PropertyKey,
      KeyLog,
      InspectionTemplate,
      Inspection,
    ]),
  ],
  providers: [PropertyService, OwnerService, InspectionService],
  controllers: [PropertyController, OwnerController, InspectionController],
  exports: [PropertyService, OwnerService, InspectionService],
})
export class PropertiesModule {}
