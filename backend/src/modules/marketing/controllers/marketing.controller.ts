import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CampaignService } from '../services/campaign.service';
import { SegmentService } from '../services/segment.service';
import { AutomationFlowService } from '../services/automation-flow.service';

@ApiTags('Marketing')
@Controller('marketing')
export class MarketingController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly segmentService: SegmentService,
    private readonly automationFlowService: AutomationFlowService,
  ) {}

  // Campaigns
  @Post('campaigns')
  @ApiOperation({ summary: 'Create campaign' })
  async createCampaign(@Body('company_id') companyId: string, @Body('created_by_id') createdById: string, @Body() data: any) {
    return this.campaignService.createCampaign(companyId, createdById, data);
  }

  @Post('campaigns/:id/send')
  @ApiOperation({ summary: 'Send campaign' })
  async sendCampaign(@Query('company_id') companyId: string, @Param('id') id: string) {
    return this.campaignService.sendCampaign(companyId, id);
  }

  @Get('campaigns/:id/metrics')
  @ApiOperation({ summary: 'Get campaign metrics' })
  async getCampaignMetrics(@Query('company_id') companyId: string, @Param('id') id: string) {
    return this.campaignService.getMetrics(companyId, id);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'List campaigns' })
  async listCampaigns(@Query('company_id') companyId: string, @Query('status') status?: string) {
    return this.campaignService.findAll(companyId, { status });
  }

  // Segments
  @Post('segments')
  @ApiOperation({ summary: 'Create segment' })
  async createSegment(@Body('company_id') companyId: string, @Body('created_by_id') createdById: string, @Body() data: any) {
    return this.segmentService.createSegment(companyId, createdById, data);
  }

  @Get('segments/:id/members')
  @ApiOperation({ summary: 'Get segment members' })
  async getSegmentMembers(@Query('company_id') companyId: string, @Param('id') id: string) {
    return this.segmentService.getMembers(companyId, id);
  }

  @Get('segments')
  @ApiOperation({ summary: 'List segments' })
  async listSegments(@Query('company_id') companyId: string) {
    return this.segmentService.findAll(companyId);
  }

  // Automation Flows
  @Post('flows')
  @ApiOperation({ summary: 'Create automation flow' })
  async createFlow(@Body('company_id') companyId: string, @Body('created_by_id') createdById: string, @Body() data: any) {
    return this.automationFlowService.createFlow(companyId, createdById, data);
  }

  @Patch('flows/:id/activate')
  @ApiOperation({ summary: 'Activate automation flow' })
  async activateFlow(@Query('company_id') companyId: string, @Param('id') id: string) {
    return this.automationFlowService.activateFlow(companyId, id);
  }

  @Get('flows')
  @ApiOperation({ summary: 'List automation flows' })
  async listFlows(@Query('company_id') companyId: string) {
    return this.automationFlowService.findAll(companyId);
  }
}
