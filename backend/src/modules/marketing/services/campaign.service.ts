import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Campaign } from '../entities/campaign.entity';
import { CampaignLog } from '../entities/campaign-log.entity';
import { CampaignTemplate } from '../entities/campaign-template.entity';

/**
 * Campaign Service - Module 2.1
 *
 * Gestão de Campanhas Multi-Canal:
 * - Email, WhatsApp, SMS
 * - Agendamento e envio
 * - Tracking e métricas
 * - LGPD Master Switch integration
 */
@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignLog)
    private readonly logRepository: Repository<CampaignLog>,
    @InjectRepository(CampaignTemplate)
    private readonly templateRepository: Repository<CampaignTemplate>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createCampaign(companyId: string, createdById: string, data: any): Promise<Campaign> {
    const campaign = this.campaignRepository.create({
      company_id: companyId,
      created_by_id: createdById,
      status: 'draft',
      ...data,
    });

    return this.campaignRepository.save(campaign);
  }

  async sendCampaign(companyId: string, campaignId: string): Promise<{ success: boolean; queued: number }> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, company_id: companyId },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status === 'sent') throw new Error('Campaign already sent');

    // Get recipients based on filters/segment
    const recipients = await this.getRecipients(companyId, campaign);

    campaign.total_recipients = recipients.length;
    campaign.status = 'sending';
    await this.campaignRepository.save(campaign);

    // Queue messages
    for (const recipient of recipients) {
      // Check LGPD Master Switch before queuing
      if (campaign.lgpd_compliant) {
        const hasPermission = await this.checkLGPDPermission(recipient.id, recipient.type, campaign.channel);
        if (!hasPermission) continue;
      }

      const log = this.logRepository.create({
        company_id: companyId,
        campaign_id: campaignId,
        recipient_id: recipient.id,
        recipient_type: recipient.type,
        recipient_contact: recipient.contact,
        status: 'queued',
      });

      await this.logRepository.save(log);

      // Emit event to queue worker
      this.eventEmitter.emit('campaign.message.queued', {
        companyId,
        campaignId,
        logId: log.id,
        channel: campaign.channel,
        recipient: recipient.contact,
        content: this.replaceVariables(campaign.content, recipient.data),
      });
    }

    campaign.status = 'sent';
    campaign.sent_at = new Date();
    await this.campaignRepository.save(campaign);

    return { success: true, queued: recipients.length };
  }

  async trackOpen(logId: string): Promise<void> {
    const log = await this.logRepository.findOne({ where: { id: logId } });
    if (!log) return;

    log.opened_at = log.opened_at || new Date();
    log.open_count += 1;
    await this.logRepository.save(log);

    // Update campaign metrics
    await this.campaignRepository.increment(
      { id: log.campaign_id },
      'opened_count',
      1,
    );
  }

  async trackClick(logId: string, url: string): Promise<void> {
    const log = await this.logRepository.findOne({ where: { id: logId } });
    if (!log) return;

    log.clicked_at = log.clicked_at || new Date();
    log.click_count += 1;
    log.clicked_links = [...(log.clicked_links || []), url];
    await this.logRepository.save(log);

    await this.campaignRepository.increment(
      { id: log.campaign_id },
      'clicked_count',
      1,
    );
  }

  async getMetrics(companyId: string, campaignId: string): Promise<any> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, company_id: companyId },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');

    const open_rate = campaign.sent_count > 0
      ? (campaign.opened_count / campaign.sent_count) * 100
      : 0;

    const click_rate = campaign.opened_count > 0
      ? (campaign.clicked_count / campaign.opened_count) * 100
      : 0;

    return {
      ...campaign,
      open_rate: Math.round(open_rate * 100) / 100,
      click_rate: Math.round(click_rate * 100) / 100,
    };
  }

  async findAll(companyId: string, filters?: any): Promise<Campaign[]> {
    const where: any = { company_id: companyId };
    if (filters?.status) where.status = filters.status;
    if (filters?.channel) where.channel = filters.channel;

    return this.campaignRepository.find({ where, order: { created_at: 'DESC' } });
  }

  private async getRecipients(companyId: string, campaign: Campaign): Promise<any[]> {
    // TODO: Query leads/clients based on campaign.filters or campaign.segment_id
    // For now, return stub
    return [];
  }

  private async checkLGPDPermission(personId: string, personType: string, channel: string): Promise<boolean> {
    // TODO: Call LGPD service to check Master Switch
    return true; // Stub
  }

  private replaceVariables(content: string, data: Record<string, any>): string {
    let result = content;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }
}
