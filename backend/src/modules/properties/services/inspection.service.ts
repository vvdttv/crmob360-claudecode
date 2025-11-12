import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Inspection } from '../entities/inspection.entity';
import { InspectionTemplate } from '../entities/inspection-template.entity';

/**
 * Inspection Service - Módulo 5.6
 *
 * Gerencia vistorias digitais (offline-first)
 */
@Injectable()
export class InspectionService {
  private readonly logger = new Logger(InspectionService.name);

  constructor(
    @InjectRepository(Inspection)
    private inspectionRepository: Repository<Inspection>,

    @InjectRepository(InspectionTemplate)
    private templateRepository: Repository<InspectionTemplate>,

    private eventEmitter: EventEmitter2,
  ) {}

  // ========== Templates ==========

  /**
   * Criar template de vistoria
   */
  async createTemplate(
    companyId: string,
    data: {
      name: string;
      description?: string;
      templateStructure: any;
    },
  ): Promise<InspectionTemplate> {
    const template = this.templateRepository.create({
      ...data,
      companyId,
    });

    const saved = await this.templateRepository.save(template);

    this.logger.log(`Template de vistoria criado: ${saved.id} - ${saved.name}`);

    return saved;
  }

  /**
   * Listar templates
   */
  async findAllTemplates(companyId: string): Promise<InspectionTemplate[]> {
    return this.templateRepository.find({
      where: { companyId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Buscar template por ID
   */
  async findOneTemplate(
    id: string,
    companyId: string,
  ): Promise<InspectionTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, companyId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${id} não encontrado`);
    }

    return template;
  }

  // ========== Vistorias ==========

  /**
   * Criar nova vistoria (Módulo 5.6)
   */
  async create(
    companyId: string,
    data: {
      propertyId: string;
      contractId?: string;
      templateId?: string;
      inspectorUserId?: string;
      inspectionType: 'entry' | 'exit';
      inspectionDate: Date;
      inspectionData: any;
    },
  ): Promise<Inspection> {
    const inspection = this.inspectionRepository.create({
      ...data,
      companyId,
    });

    const saved = await this.inspectionRepository.save(inspection);

    this.logger.log(
      `Nova vistoria criada: ${saved.id} - Tipo: ${saved.inspectionType}`,
    );

    // Emite evento para processos automáticos (Módulo 6)
    this.eventEmitter.emit('inspection.created', {
      inspectionId: saved.id,
      propertyId: saved.propertyId,
      contractId: saved.contractId,
      inspectionType: saved.inspectionType,
      companyId,
      timestamp: new Date(),
    });

    return saved;
  }

  /**
   * Buscar vistoria por ID
   */
  async findOne(id: string, companyId: string): Promise<Inspection> {
    const inspection = await this.inspectionRepository.findOne({
      where: { id, companyId },
      relations: ['property', 'template'],
    });

    if (!inspection) {
      throw new NotFoundException(`Vistoria ${id} não encontrada`);
    }

    return inspection;
  }

  /**
   * Listar vistorias de um imóvel
   */
  async findByProperty(
    propertyId: string,
    companyId: string,
  ): Promise<Inspection[]> {
    return this.inspectionRepository.find({
      where: { propertyId, companyId },
      order: { inspectionDate: 'DESC' },
      relations: ['template'],
    });
  }

  /**
   * Listar vistorias de um contrato
   */
  async findByContract(
    contractId: string,
    companyId: string,
  ): Promise<Inspection[]> {
    return this.inspectionRepository.find({
      where: { contractId, companyId },
      order: { inspectionDate: 'DESC' },
    });
  }

  /**
   * Atualizar vistoria (suporta sincronização offline)
   */
  async update(
    id: string,
    companyId: string,
    data: Partial<Inspection>,
  ): Promise<Inspection> {
    const inspection = await this.findOne(id, companyId);

    Object.assign(inspection, data);

    return this.inspectionRepository.save(inspection);
  }

  /**
   * Finalizar vistoria e gerar PDF
   */
  async complete(id: string, companyId: string): Promise<Inspection> {
    const inspection = await this.findOne(id, companyId);

    inspection.status = 'completed';

    // TODO: Integração com gerador de PDF
    // inspection.pdfUrl = await this.generatePDF(inspection);

    const updated = await this.inspectionRepository.save(inspection);

    this.logger.log(`Vistoria ${id} finalizada`);

    // Emite evento (ex: para enviar para assinatura - Módulo 8.2)
    this.eventEmitter.emit('inspection.completed', {
      inspectionId: id,
      propertyId: inspection.propertyId,
      contractId: inspection.contractId,
      companyId,
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * Registrar assinatura do inquilino
   */
  async signByTenant(
    id: string,
    companyId: string,
    signatureUrl: string,
  ): Promise<Inspection> {
    const inspection = await this.findOne(id, companyId);

    inspection.tenantSignatureUrl = signatureUrl;
    inspection.tenantSignedAt = new Date();

    // Se ambos assinaram, muda status
    if (inspection.ownerSignatureUrl) {
      inspection.status = 'signed';
    }

    return this.inspectionRepository.save(inspection);
  }

  /**
   * Registrar assinatura do proprietário
   */
  async signByOwner(
    id: string,
    companyId: string,
    signatureUrl: string,
  ): Promise<Inspection> {
    const inspection = await this.findOne(id, companyId);

    inspection.ownerSignatureUrl = signatureUrl;
    inspection.ownerSignedAt = new Date();

    // Se ambos assinaram, muda status
    if (inspection.tenantSignatureUrl) {
      inspection.status = 'signed';
    }

    return this.inspectionRepository.save(inspection);
  }

  /**
   * Comparar vistoria de entrada com saída
   */
  async compareEntryExit(
    contractId: string,
    companyId: string,
  ): Promise<{
    entry: Inspection;
    exit: Inspection;
    differences: any[];
  }> {
    const inspections = await this.findByContract(contractId, companyId);

    const entry = inspections.find((i) => i.inspectionType === 'entry');
    const exit = inspections.find((i) => i.inspectionType === 'exit');

    if (!entry || !exit) {
      throw new NotFoundException(
        'Vistoria de entrada ou saída não encontrada',
      );
    }

    // Compara ambientes e itens
    const differences = this.detectDifferences(
      entry.inspectionData,
      exit.inspectionData,
    );

    return { entry, exit, differences };
  }

  /**
   * Processar gatilhos de automação do template
   */
  async processAutomationTriggers(
    inspectionId: string,
    companyId: string,
  ): Promise<void> {
    const inspection = await this.findOne(inspectionId, companyId);

    if (!inspection.template) {
      return;
    }

    const triggers = this.extractTriggersFromData(
      inspection.template.templateStructure,
      inspection.inspectionData,
    );

    // Emite evento para cada gatilho (ex: criar tarefa de manutenção)
    for (const trigger of triggers) {
      this.eventEmitter.emit('inspection.trigger', {
        inspectionId,
        propertyId: inspection.propertyId,
        companyId,
        triggerType: trigger.acao,
        triggerData: trigger.data,
        timestamp: new Date(),
      });
    }

    this.logger.log(
      `${triggers.length} gatilhos de automação processados para vistoria ${inspectionId}`,
    );
  }

  // ========== Métodos auxiliares ==========

  private detectDifferences(entryData: any, exitData: any): any[] {
    const differences = [];

    // Compara cada ambiente
    if (entryData.ambientes && exitData.ambientes) {
      for (const entryAmbiente of entryData.ambientes) {
        const exitAmbiente = exitData.ambientes.find(
          (a) => a.nome === entryAmbiente.nome,
        );

        if (!exitAmbiente) continue;

        // Compara cada item do ambiente
        for (const entryItem of entryAmbiente.itens || []) {
          const exitItem = (exitAmbiente.itens || []).find(
            (i) => i.nome === entryItem.nome,
          );

          if (!exitItem) continue;

          // Se estado mudou, registra diferença
          if (entryItem.estado_selecionado !== exitItem.estado_selecionado) {
            differences.push({
              ambiente: entryAmbiente.nome,
              item: entryItem.nome,
              estadoEntrada: entryItem.estado_selecionado,
              estadoSaida: exitItem.estado_selecionado,
              fotosEntrada: entryItem.fotos || [],
              fotosSaida: exitItem.fotos || [],
            });
          }
        }
      }
    }

    return differences;
  }

  private extractTriggersFromData(templateStructure: any, inspectionData: any): any[] {
    const triggers = [];

    if (!templateStructure.ambientes || !inspectionData.ambientes) {
      return triggers;
    }

    // Percorre estrutura do template
    for (const templateAmbiente of templateStructure.ambientes) {
      const dataAmbiente = inspectionData.ambientes.find(
        (a) => a.nome === templateAmbiente.nome,
      );

      if (!dataAmbiente) continue;

      for (const templateItem of templateAmbiente.itens || []) {
        if (!templateItem.gatilho_automacao) continue;

        const dataItem = (dataAmbiente.itens || []).find(
          (i) => i.nome === templateItem.nome,
        );

        if (!dataItem) continue;

        // Verifica se estado selecionado ativa o gatilho
        if (
          dataItem.estado_selecionado === templateItem.gatilho_automacao.estado
        ) {
          triggers.push({
            acao: templateItem.gatilho_automacao.acao,
            data: {
              ambiente: templateAmbiente.nome,
              item: templateItem.nome,
              estado: dataItem.estado_selecionado,
              fotos: dataItem.fotos,
              observacoes: dataItem.observacoes,
            },
          });
        }
      }
    }

    return triggers;
  }
}
