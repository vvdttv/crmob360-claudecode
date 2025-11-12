import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AutomationFlow } from '../entities/automation-flow.entity';
import { AutomationFlowEntry } from '../entities/automation-flow-entry.entity';

/**
 * Automation Flow Service - Module 2.3
 *
 * Fluxos de Nutrição Automáticos:
 * - Drip campaigns
 * - Triggers baseados em eventos
 * - Sequências com delays
 * - Condições e branching
 */
@Injectable()
export class AutomationFlowService {
  constructor(
    @InjectRepository(AutomationFlow)
    private readonly flowRepository: Repository<AutomationFlow>,
    @InjectRepository(AutomationFlowEntry)
    private readonly entryRepository: Repository<AutomationFlowEntry>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createFlow(companyId: string, createdById: string, data: any): Promise<AutomationFlow> {
    const flow = this.flowRepository.create({
      company_id: companyId,
      created_by_id: createdById,
      status: 'draft',
      ...data,
    });

    return this.flowRepository.save(flow);
  }

  async activateFlow(companyId: string, flowId: string): Promise<AutomationFlow> {
    const flow = await this.flowRepository.findOne({
      where: { id: flowId, company_id: companyId },
    });

    if (!flow) throw new NotFoundException('Flow not found');

    flow.status = 'active';
    return this.flowRepository.save(flow);
  }

  @OnEvent('lead.created')
  async handleLeadCreated(payload: { companyId: string; leadId: string }): Promise<void> {
    const flows = await this.flowRepository.find({
      where: {
        company_id: payload.companyId,
        status: 'active',
        trigger_type: 'lead_created',
      },
    });

    for (const flow of flows) {
      await this.addPersonToFlow(payload.companyId, flow.id, payload.leadId, 'lead');
    }
  }

  async addPersonToFlow(
    companyId: string,
    flowId: string,
    personId: string,
    personType: 'lead' | 'client',
  ): Promise<AutomationFlowEntry> {
    const flow = await this.flowRepository.findOne({
      where: { id: flowId, company_id: companyId },
    });

    if (!flow) throw new NotFoundException('Flow not found');

    // Check if already in flow
    const existing = await this.entryRepository.findOne({
      where: { flow_id: flowId, person_id: personId, status: 'active' },
    });
    if (existing) return existing;

    const firstStep = flow.steps[0];
    const nextExecutionAt = new Date();
    nextExecutionAt.setHours(nextExecutionAt.getHours() + (firstStep.delay_hours || 0));

    const entry = this.entryRepository.create({
      company_id: companyId,
      flow_id: flowId,
      person_id: personId,
      person_type: personType,
      current_step_id: firstStep.id,
      current_step_order: firstStep.order,
      next_execution_at: nextExecutionAt,
      execution_history: [],
    });

    await this.flowRepository.increment({ id: flowId }, 'total_entries', 1);
    await this.flowRepository.increment({ id: flowId }, 'active_entries', 1);

    return this.entryRepository.save(entry);
  }

  async executeSteps(): Promise<number> {
    const now = new Date();
    const entries = await this.entryRepository.find({
      where: {
        status: 'active',
        next_execution_at: LessThanOrEqual(now),
      },
      take: 100,
    });

    let executed = 0;

    for (const entry of entries) {
      try {
        await this.executeStep(entry);
        executed++;
      } catch (error) {
        entry.status = 'failed';
        await this.entryRepository.save(entry);
      }
    }

    return executed;
  }

  private async executeStep(entry: AutomationFlowEntry): Promise<void> {
    const flow = await this.flowRepository.findOne({
      where: { id: entry.flow_id },
    });

    if (!flow) return;

    const currentStep = flow.steps.find((s) => s.id === entry.current_step_id);
    if (!currentStep) return;

    // Execute action based on step type
    let success = true;
    let error: string | undefined;

    try {
      switch (currentStep.type) {
        case 'send_email':
          this.eventEmitter.emit('automation.send.email', {
            personId: entry.person_id,
            templateId: currentStep.template_id,
            content: currentStep.content,
          });
          break;
        case 'add_tag':
          this.eventEmitter.emit('automation.add.tag', {
            personId: entry.person_id,
            personType: entry.person_type,
            tag: currentStep.tag,
          });
          break;
        case 'create_task':
          this.eventEmitter.emit('automation.create.task', {
            companyId: entry.company_id,
            title: currentStep.task_title,
            assignedToId: currentStep.assigned_to_id,
            relatedId: entry.person_id,
          });
          break;
      }
    } catch (err) {
      success = false;
      error = err.message;
    }

    // Add to history
    entry.execution_history.push({
      step_id: currentStep.id,
      step_order: currentStep.order,
      executed_at: new Date().toISOString(),
      action: currentStep.type,
      success,
      error,
    });

    // Move to next step or complete
    const nextStep = flow.steps.find((s) => s.order === currentStep.order + 1);

    if (nextStep) {
      entry.current_step_id = nextStep.id;
      entry.current_step_order = nextStep.order;
      const nextExecution = new Date();
      nextExecution.setHours(nextExecution.getHours() + (nextStep.delay_hours || 0));
      entry.next_execution_at = nextExecution;
    } else {
      entry.status = 'completed';
      entry.completed_at = new Date();
      await this.flowRepository.decrement({ id: flow.id }, 'active_entries', 1);
      await this.flowRepository.increment({ id: flow.id }, 'completed_entries', 1);
    }

    await this.entryRepository.save(entry);
  }

  async findAll(companyId: string): Promise<AutomationFlow[]> {
    return this.flowRepository.find({
      where: { company_id: companyId },
      order: { created_at: 'DESC' },
    });
  }
}
