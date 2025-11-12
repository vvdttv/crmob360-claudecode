import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Segment } from '../entities/segment.entity';

/**
 * Segment Service - Module 2.2
 *
 * Segmentação Dinâmica:
 * - Criar segmentos com filtros complexos
 * - Atualização automática de membros
 * - Contagem e listagem de membros
 */
@Injectable()
export class SegmentService {
  constructor(
    @InjectRepository(Segment)
    private readonly segmentRepository: Repository<Segment>,
  ) {}

  async createSegment(companyId: string, createdById: string, data: any): Promise<Segment> {
    const segment = this.segmentRepository.create({
      company_id: companyId,
      created_by_id: createdById,
      ...data,
    });

    const savedSegment = await this.segmentRepository.save(segment);

    // Calculate initial member count
    if (segment.update_mode === 'dynamic') {
      await this.updateMemberCount(companyId, savedSegment.id);
    }

    return savedSegment;
  }

  async updateMemberCount(companyId: string, segmentId: string): Promise<number> {
    const segment = await this.segmentRepository.findOne({
      where: { id: segmentId, company_id: companyId },
    });

    if (!segment) throw new NotFoundException('Segment not found');

    // TODO: Query leads/clients based on segment.filters
    const count = await this.countMembers(companyId, segment.filters, segment.type);

    segment.member_count = count;
    segment.last_calculated_at = new Date();
    await this.segmentRepository.save(segment);

    return count;
  }

  async getMembers(companyId: string, segmentId: string, limit = 100): Promise<any[]> {
    const segment = await this.segmentRepository.findOne({
      where: { id: segmentId, company_id: companyId },
    });

    if (!segment) throw new NotFoundException('Segment not found');

    // TODO: Query leads/clients based on segment.filters
    return [];
  }

  async findAll(companyId: string): Promise<Segment[]> {
    return this.segmentRepository.find({
      where: { company_id: companyId },
      order: { name: 'ASC' },
    });
  }

  private async countMembers(companyId: string, filters: any, type: string): Promise<number> {
    // TODO: Build dynamic query based on filters
    // Query CRM module for leads/clients
    return 0;
  }
}
