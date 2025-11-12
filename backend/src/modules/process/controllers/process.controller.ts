import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkflowService } from '../services/workflow.service';

@ApiTags('Process Automation')
@Controller('processes')
export class ProcessController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('workflows')
  @ApiOperation({ summary: 'Create workflow' })
  async createWorkflow(@Body('company_id') companyId: string, @Body('created_by_id') createdById: string, @Body() data: any) {
    return this.workflowService.createWorkflow(companyId, createdById, data);
  }

  @Get('workflows')
  @ApiOperation({ summary: 'List workflows' })
  async listWorkflows(@Query('company_id') companyId: string) {
    return this.workflowService.findAll(companyId);
  }
}
