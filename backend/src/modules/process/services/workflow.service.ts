import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Workflow } from '../entities/workflow.entity';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createWorkflow(companyId: string, createdById: string, data: any): Promise<Workflow> {
    const workflow = this.workflowRepository.create({
      company_id: companyId,
      created_by_id: createdById,
      ...data,
    });
    return this.workflowRepository.save(workflow);
  }

  @OnEvent('lead.created')
  async handleLeadCreated(payload: any): Promise<void> {
    const workflows = await this.workflowRepository.find({
      where: { company_id: payload.companyId, status: 'active', trigger: 'lead_created' },
    });

    for (const workflow of workflows) {
      await this.executeWorkflow(workflow, payload);
    }
  }

  private async executeWorkflow(workflow: Workflow, context: any): Promise<void> {
    for (const action of workflow.actions) {
      this.eventEmitter.emit(`workflow.action.${action.type}`, {
        ...context,
        action: action.config,
      });

      if (action.delay_hours) {
        // Schedule next action
      }
    }

    await this.workflowRepository.increment({ id: workflow.id }, 'execution_count', 1);
  }

  async findAll(companyId: string): Promise<Workflow[]> {
    return this.workflowRepository.find({
      where: { company_id: companyId },
      order: { created_at: 'DESC' },
    });
  }
}
