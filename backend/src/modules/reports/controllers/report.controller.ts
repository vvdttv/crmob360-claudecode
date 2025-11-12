import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportService } from '../services/report.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard metrics' })
  async getDashboard(@Query('company_id') companyId: string) {
    return this.reportService.generateDashboard(companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create custom report' })
  async createReport(@Body('company_id') companyId: string, @Body('created_by_id') createdById: string, @Body() data: any) {
    return this.reportService.createReport(companyId, createdById, data);
  }

  @Get(':id/generate')
  @ApiOperation({ summary: 'Generate report' })
  async generateReport(@Query('company_id') companyId: string, @Param('id') id: string) {
    return this.reportService.generateReport(companyId, id);
  }

  @Get()
  @ApiOperation({ summary: 'List reports' })
  async listReports(@Query('company_id') companyId: string) {
    return this.reportService.findAll(companyId);
  }
}
