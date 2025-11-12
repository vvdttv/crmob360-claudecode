import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FinancialEntry } from '../entities/financial-entry.entity';

/**
 * Boleto Service - Module 9.3
 *
 * Geração de Boletos via Gateway:
 * - Integração Juno, Asaas, PagSeguro, Iugu
 * - Geração de boleto para receivables
 * - Webhook para atualização de status
 * - Envio por email/whatsapp
 *
 * NOTE: Este é um stub de integração.
 * A implementação real depende do gateway escolhido.
 */
@Injectable()
export class BoletoService {
  constructor(
    @InjectRepository(FinancialEntry)
    private readonly entryRepository: Repository<FinancialEntry>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Generate Boleto
   * Gera boleto para um lançamento a receber
   *
   * @returns Boleto data (URL, barcode, ID)
   */
  async generateBoleto(
    companyId: string,
    entryId: string,
    payerData: {
      name: string;
      document: string; // CPF/CNPJ
      email: string;
      phone?: string;
      address?: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zipcode: string;
      };
    },
  ): Promise<{
    boleto_url: string;
    boleto_barcode: string;
    boleto_id: string;
    due_date: Date;
    amount: number;
  }> {
    const entry = await this.entryRepository.findOne({
      where: { id: entryId, company_id: companyId },
    });

    if (!entry) {
      throw new Error('Financial entry not found');
    }

    if (entry.type !== 'receivable') {
      throw new Error('Can only generate boleto for receivable entries');
    }

    if (entry.boleto_id) {
      throw new Error('Boleto already generated for this entry');
    }

    // TODO: Integrate with payment gateway
    // Example: Juno API, Asaas API, etc.
    const boletoData = await this.callPaymentGateway(entry, payerData);

    // Update entry with boleto data
    entry.boleto_url = boletoData.boleto_url;
    entry.boleto_barcode = boletoData.boleto_barcode;
    entry.boleto_id = boletoData.boleto_id;
    entry.metadata = {
      ...entry.metadata,
      boleto_payer: payerData,
      boleto_generated_at: new Date(),
    };

    await this.entryRepository.save(entry);

    // Emit event
    this.eventEmitter.emit('boleto.generated', {
      companyId,
      entryId,
      boletoId: boletoData.boleto_id,
      payer: payerData,
    });

    return {
      boleto_url: boletoData.boleto_url,
      boleto_barcode: boletoData.boleto_barcode,
      boleto_id: boletoData.boleto_id,
      due_date: entry.due_date,
      amount: Number(entry.amount),
    };
  }

  /**
   * Process Webhook
   * Processa webhook do gateway de pagamento
   * Chamado quando boleto é pago
   */
  async processWebhook(
    payload: any,
  ): Promise<{ success: boolean; entry_id?: string }> {
    // TODO: Validate webhook signature
    // TODO: Parse payload based on gateway format

    // Example: Extract data from webhook
    const { boleto_id, status, paid_at, paid_amount } = this.parseWebhook(
      payload,
    );

    if (status !== 'paid') {
      return { success: true }; // Just acknowledge
    }

    // Find entry by boleto_id
    const entry = await this.entryRepository.findOne({
      where: { boleto_id },
    });

    if (!entry) {
      console.error(`Entry not found for boleto_id: ${boleto_id}`);
      return { success: false };
    }

    // Update entry status
    entry.status = 'paid';
    entry.paid_at = new Date(paid_at);
    entry.paid_amount = paid_amount;
    entry.payment_method = 'boleto';

    await this.entryRepository.save(entry);

    // Emit event
    this.eventEmitter.emit('boleto.paid', {
      companyId: entry.company_id,
      entryId: entry.id,
      boletoId: boleto_id,
      paidAt: paid_at,
      amount: paid_amount,
    });

    return { success: true, entry_id: entry.id };
  }

  /**
   * Cancel Boleto
   * Cancela boleto no gateway
   */
  async cancelBoleto(
    companyId: string,
    entryId: string,
  ): Promise<{ success: boolean }> {
    const entry = await this.entryRepository.findOne({
      where: { id: entryId, company_id: companyId },
    });

    if (!entry || !entry.boleto_id) {
      throw new Error('Boleto not found');
    }

    // TODO: Call payment gateway to cancel boleto
    await this.cancelBoletoInGateway(entry.boleto_id);

    // Update entry
    entry.status = 'canceled';
    entry.metadata = {
      ...entry.metadata,
      boleto_canceled_at: new Date(),
    };

    await this.entryRepository.save(entry);

    return { success: true };
  }

  /**
   * Get Boleto Details
   * Busca detalhes do boleto no gateway
   */
  async getBoletoDetails(
    companyId: string,
    entryId: string,
  ): Promise<any> {
    const entry = await this.entryRepository.findOne({
      where: { id: entryId, company_id: companyId },
    });

    if (!entry || !entry.boleto_id) {
      throw new Error('Boleto not found');
    }

    // TODO: Call payment gateway to get boleto details
    return {
      boleto_id: entry.boleto_id,
      boleto_url: entry.boleto_url,
      boleto_barcode: entry.boleto_barcode,
      status: entry.status,
      due_date: entry.due_date,
      amount: entry.amount,
      paid_at: entry.paid_at,
      paid_amount: entry.paid_amount,
    };
  }

  // ========== INTEGRATION STUBS ==========
  // Implementação real depende do gateway escolhido

  private async callPaymentGateway(
    entry: FinancialEntry,
    payerData: any,
  ): Promise<{ boleto_url: string; boleto_barcode: string; boleto_id: string }> {
    // TODO: Implement real integration
    // Example for Juno:
    // const response = await axios.post('https://api.juno.com.br/charges', { ... })

    // Mock response
    const mockBoletoId = `BOLETO-${Date.now()}`;
    return {
      boleto_url: `https://boleto-mock.com/${mockBoletoId}`,
      boleto_barcode: '23793381286000001234567890123456789012',
      boleto_id: mockBoletoId,
    };
  }

  private parseWebhook(payload: any): {
    boleto_id: string;
    status: string;
    paid_at: string;
    paid_amount: number;
  } {
    // TODO: Parse based on gateway format
    // Different gateways have different webhook formats
    return {
      boleto_id: payload.boleto_id || payload.charge_id,
      status: payload.status,
      paid_at: payload.paid_at || payload.payment_date,
      paid_amount: payload.paid_amount || payload.amount,
    };
  }

  private async cancelBoletoInGateway(boletoId: string): Promise<void> {
    // TODO: Implement real cancellation
    // Example: await axios.delete(`https://api.juno.com.br/charges/${boletoId}`)
    console.log(`Canceling boleto ${boletoId} in gateway...`);
  }
}
