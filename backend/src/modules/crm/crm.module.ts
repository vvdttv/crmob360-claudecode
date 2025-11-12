import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { Pipeline } from './entities/pipeline.entity';
import { PipelineStage } from './pipeline-stage.entity';
import { Activity } from './entities/activity.entity';
import { LeadService } from './services/lead.service';
import { PipelineService } from './services/pipeline.service';
import { ActivityService } from './services/activity.service';
import { LeadController } from './controllers/lead.controller';
import { PipelineController } from './controllers/pipeline.controller';
import { ActivityController } from './controllers/activity.controller';
import { LgpdModule } from '../lgpd/lgpd.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, Pipeline, PipelineStage, Activity]),
    LgpdModule, // Importa para usar LgpdPermissionService
  ],
  providers: [LeadService, PipelineService, ActivityService],
  controllers: [LeadController, PipelineController, ActivityController],
  exports: [LeadService, PipelineService, ActivityService],
})
export class CrmModule {}
