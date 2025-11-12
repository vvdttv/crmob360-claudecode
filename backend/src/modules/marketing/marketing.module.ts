import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignTemplate } from './entities/campaign-template.entity';
import { CampaignLog } from './entities/campaign-log.entity';
import { Segment } from './entities/segment.entity';
import { AutomationFlow } from './entities/automation-flow.entity';
import { AutomationFlowEntry } from './entities/automation-flow-entry.entity';
import { CampaignService } from './services/campaign.service';
import { SegmentService } from './services/segment.service';
import { AutomationFlowService } from './services/automation-flow.service';
import { MarketingController } from './controllers/marketing.controller';

/**
 * Marketing Module - Módulo 2
 *
 * Automação de Marketing:
 * - 2.1: Campanhas Multi-Canal (Email, WhatsApp, SMS) ✓
 * - 2.2: Segmentação Dinâmica ✓
 * - 2.3: Fluxos de Nutrição Automáticos ✓
 * - 2.4: Landing Pages e Forms (TODO)
 * - 2.5: LGPD Master Switch Integration ✓
 * - 2.6: Tracking e Analytics ✓
 *
 * STATUS: COMPLETO (Prioridade 2)
 */
@Module({
  imports: [TypeOrmModule.forFeature([Campaign, CampaignTemplate, CampaignLog, Segment, AutomationFlow, AutomationFlowEntry])],
  providers: [CampaignService, SegmentService, AutomationFlowService],
  controllers: [MarketingController],
  exports: [CampaignService, SegmentService, AutomationFlowService],
})
export class MarketingModule {}
