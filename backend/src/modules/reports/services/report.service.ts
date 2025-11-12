import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../entities/report.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async generateDashboard(companyId: string): Promise<any> {
    // TODO: Query metrics from all modules
    return {
      total_leads: 0,
      total_properties: 0,
      total_contracts: 0,
      total_revenue: 0,
      conversion_rate: 0,
      avg_ticket: 0,
    };
  }

  async createReport(companyId: string, createdById: string, data: any): Promise<Report> {
    const report = this.reportRepository.create({
      company_id: companyId,
      created_by_id: createdById,
      ...data,
    });
    return this.reportRepository.save(report);
  }

  async generateReport(companyId: string, reportId: string): Promise<any> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId, company_id: companyId },
    });

    if (!report) throw new Error('Report not found');

    // TODO: Execute report query based on config
    const data = {};

    report.cached_data = data;
    report.last_generated_at = new Date();
    await this.reportRepository.save(report);

    return data;
  }

  async findAll(companyId: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: { company_id: companyId },
      order: { created_at: 'DESC' },
    });
  }
}
