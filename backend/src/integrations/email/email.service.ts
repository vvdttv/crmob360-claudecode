import { Injectable, Logger } from '@nestjs/common';

/**
 * Email Service - SendGrid Integration
 *
 * Sends emails via SendGrid API
 * To use in production, install @sendgrid/mail and set SENDGRID_API_KEY env var
 *
 * npm install @sendgrid/mail
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail = process.env.FROM_EMAIL || 'noreply@crmob360.com';
  private readonly fromName = process.env.FROM_NAME || 'CRMob360';

  async sendEmail(options: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    attachments?: Array<{
      content: string;
      filename: string;
      type?: string;
    }>;
  }): Promise<{ success: boolean; messageId?: string }> {
    try {
      // TODO: Implement SendGrid integration
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      //
      // const msg = {
      //   to: options.to,
      //   from: { email: this.fromEmail, name: this.fromName },
      //   subject: options.subject,
      //   html: options.html,
      //   text: options.text || this.htmlToText(options.html),
      //   attachments: options.attachments,
      // };
      //
      // const response = await sgMail.send(msg);
      // return { success: true, messageId: response[0].headers['x-message-id'] };

      // Mock implementation for development
      this.logger.log(`[MOCK] Sending email to ${options.to}`);
      this.logger.log(`[MOCK] Subject: ${options.subject}`);
      this.logger.log(`[MOCK] HTML length: ${options.html.length}`);

      return {
        success: true,
        messageId: `mock-${Date.now()}`,
      };
    } catch (error) {
      this.logger.error('Error sending email', error);
      throw error;
    }
  }

  async sendTemplate(options: {
    to: string | string[];
    templateId: string;
    dynamicData: Record<string, any>;
  }): Promise<{ success: boolean; messageId?: string }> {
    try {
      // TODO: Implement SendGrid template sending
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      //
      // const msg = {
      //   to: options.to,
      //   from: { email: this.fromEmail, name: this.fromName },
      //   templateId: options.templateId,
      //   dynamicTemplateData: options.dynamicData,
      // };
      //
      // const response = await sgMail.send(msg);
      // return { success: true, messageId: response[0].headers['x-message-id'] };

      // Mock implementation
      this.logger.log(`[MOCK] Sending template ${options.templateId} to ${options.to}`);
      this.logger.log(`[MOCK] Dynamic data:`, options.dynamicData);

      return {
        success: true,
        messageId: `mock-template-${Date.now()}`,
      };
    } catch (error) {
      this.logger.error('Error sending template email', error);
      throw error;
    }
  }

  async sendCampaign(options: {
    recipients: string[];
    subject: string;
    html: string;
    trackOpens?: boolean;
    trackClicks?: boolean;
  }): Promise<{ success: boolean; queued: number }> {
    try {
      // TODO: Implement batch sending with rate limiting
      const promises = options.recipients.map(async (to) => {
        return this.sendEmail({
          to,
          subject: options.subject,
          html: options.html,
        });
      });

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;

      this.logger.log(`[MOCK] Campaign sent to ${successful}/${options.recipients.length} recipients`);

      return {
        success: true,
        queued: successful,
      };
    } catch (error) {
      this.logger.error('Error sending campaign', error);
      throw error;
    }
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }
}
