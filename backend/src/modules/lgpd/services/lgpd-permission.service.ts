import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsentLog } from '../entities/consent-log.entity';
import { ConsentTemplate } from '../entities/consent-template.entity';
import { createHash } from 'crypto';

export type PermissionType =
  | 'email_marketing'
  | 'whatsapp_marketing'
  | 'ai_profiling'
  | 'terms_accepted';

/**
 * LGPD Permission Service - "Master Switch"
 *
 * Este serviço é o controlador centralizado de permissões LGPD.
 * TODOS os módulos que processam dados pessoais DEVEM consultar este serviço
 * antes de executar ações como envio de email, WhatsApp, ou perfilamento por IA.
 *
 * Conforme especificado na seção "Arquitetura de Conformidade (O Master Switch)" do documento.
 */
@Injectable()
export class LgpdPermissionService {
  private readonly logger = new Logger(LgpdPermissionService.name);

  constructor(
    @InjectRepository(ConsentLog)
    private consentLogRepository: Repository<ConsentLog>,

    @InjectRepository(ConsentTemplate)
    private consentTemplateRepository: Repository<ConsentTemplate>,
  ) {}

  /**
   * Verifica se uma pessoa (lead ou usuário) possui permissão para uma ação específica
   *
   * @param personId - UUID da pessoa (lead ou user)
   * @param personType - Tipo da entidade ('lead' ou 'user')
   * @param permissionType - Tipo de permissão a verificar
   * @returns true se possui permissão, false caso contrário
   */
  async checkPermission(
    personId: string,
    personType: 'lead' | 'user',
    permissionType: PermissionType,
  ): Promise<boolean> {
    try {
      // Busca o consent log mais recente da pessoa
      const latestConsent = await this.consentLogRepository.findOne({
        where: { personId, personType },
        order: { consentTimestamp: 'DESC' },
      });

      if (!latestConsent) {
        this.logger.warn(
          `Nenhum consentimento encontrado para ${personType}:${personId}. Acesso negado por padrão.`,
        );
        return false;
      }

      // Mapeia o tipo de permissão para o campo da entidade
      const permissionField = this.mapPermissionToField(permissionType);
      const hasPermission = latestConsent[permissionField] === true;

      // Log de auditoria
      this.logger.log(
        `Verificação LGPD: ${personType}:${personId} - ${permissionType} = ${hasPermission}`,
      );

      return hasPermission;
    } catch (error) {
      this.logger.error(
        `Erro ao verificar permissão LGPD: ${error.message}`,
        error.stack,
      );
      // Em caso de erro, nega acesso por segurança
      return false;
    }
  }

  /**
   * Cria um novo registro de consentimento (opt-in)
   *
   * @param data - Dados do consentimento
   * @returns ConsentLog criado
   */
  async createConsent(data: {
    personId: string;
    personType: 'lead' | 'user';
    templateId?: string;
    ipAddress?: string;
    userAgent?: string;
    channel: string;
    permissions: {
      termsAccepted: boolean;
      emailMarketing: boolean;
      whatsappMarketing: boolean;
      aiProfiling: boolean;
    };
  }): Promise<ConsentLog> {
    // Busca o template se fornecido
    let contentHash = '';
    if (data.templateId) {
      const template = await this.consentTemplateRepository.findOne({
        where: { id: data.templateId },
      });
      if (template) {
        contentHash = template.contentHash;
      }
    } else {
      // Gera hash do consentimento implícito
      contentHash = this.generateHash('implicit_consent');
    }

    const consentLog = this.consentLogRepository.create({
      personId: data.personId,
      personType: data.personType,
      consentTemplateId: data.templateId,
      consentTextHash: contentHash,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      channel: data.channel,
      permissionTermsAccepted: data.permissions.termsAccepted,
      permissionEmailMarketing: data.permissions.emailMarketing,
      permissionWhatsappMarketing: data.permissions.whatsappMarketing,
      permissionAiProfiling: data.permissions.aiProfiling,
    });

    const saved = await this.consentLogRepository.save(consentLog);

    this.logger.log(
      `Novo consentimento registrado: ${data.personType}:${data.personId} via ${data.channel}`,
    );

    return saved;
  }

  /**
   * Busca todos os consents de uma pessoa (para portal de privacidade)
   *
   * @param personId
   * @param personType
   * @returns Lista de consent logs
   */
  async getPersonConsents(
    personId: string,
    personType: 'lead' | 'user',
  ): Promise<ConsentLog[]> {
    return this.consentLogRepository.find({
      where: { personId, personType },
      order: { consentTimestamp: 'DESC' },
      relations: ['consentTemplate'],
    });
  }

  /**
   * Atualiza permissões (novo opt-in/opt-out)
   *
   * @param personId
   * @param personType
   * @param permissions
   */
  async updatePermissions(
    personId: string,
    personType: 'lead' | 'user',
    permissions: Partial<{
      emailMarketing: boolean;
      whatsappMarketing: boolean;
      aiProfiling: boolean;
    }>,
  ): Promise<ConsentLog> {
    // Busca o consent atual
    const currentConsent = await this.consentLogRepository.findOne({
      where: { personId, personType },
      order: { consentTimestamp: 'DESC' },
    });

    // Cria novo consent log (não atualiza o anterior - auditoria imutável)
    const newConsent = this.consentLogRepository.create({
      personId,
      personType,
      consentTextHash: this.generateHash('permission_update'),
      channel: 'portal_privacidade',
      permissionTermsAccepted: currentConsent?.permissionTermsAccepted || true,
      permissionEmailMarketing:
        permissions.emailMarketing !== undefined
          ? permissions.emailMarketing
          : currentConsent?.permissionEmailMarketing,
      permissionWhatsappMarketing:
        permissions.whatsappMarketing !== undefined
          ? permissions.whatsappMarketing
          : currentConsent?.permissionWhatsappMarketing,
      permissionAiProfiling:
        permissions.aiProfiling !== undefined
          ? permissions.aiProfiling
          : currentConsent?.permissionAiProfiling,
    });

    const saved = await this.consentLogRepository.save(newConsent);

    this.logger.log(
      `Permissões atualizadas: ${personType}:${personId}`,
    );

    return saved;
  }

  /**
   * Filtra uma lista de IDs removendo aqueles sem permissão
   *
   * Usado por Módulo 2 (Marketing) para filtrar destinatários de campanhas
   *
   * @param personIds - Array de IDs
   * @param personType
   * @param permissionType
   * @returns Array filtrado com IDs que possuem permissão
   */
  async filterByPermission(
    personIds: string[],
    personType: 'lead' | 'user',
    permissionType: PermissionType,
  ): Promise<string[]> {
    const permissionField = this.mapPermissionToField(permissionType);

    // Query otimizada: busca apenas os IDs com permissão
    const allowedConsents = await this.consentLogRepository
      .createQueryBuilder('cl')
      .select('DISTINCT ON (cl.person_id) cl.person_id', 'personId')
      .where('cl.person_id IN (:...ids)', { ids: personIds })
      .andWhere('cl.person_type = :type', { type: personType })
      .andWhere(`cl.${this.camelToSnake(permissionField)} = true`)
      .orderBy('cl.person_id')
      .addOrderBy('cl.consent_timestamp', 'DESC')
      .getRawMany();

    const allowedIds = allowedConsents.map((c) => c.personId);

    this.logger.log(
      `Filtro LGPD: ${allowedIds.length}/${personIds.length} ${personType}s com permissão ${permissionType}`,
    );

    return allowedIds;
  }

  /**
   * Cria um template de consentimento
   */
  async createConsentTemplate(data: {
    companyId: string;
    name: string;
    version: string;
    title: string;
    content: string;
    templateType: 'site_form' | 'contract' | 'newsletter' | 'app';
  }): Promise<ConsentTemplate> {
    const contentHash = this.generateHash(data.content);

    const template = this.consentTemplateRepository.create({
      ...data,
      contentHash,
    });

    return this.consentTemplateRepository.save(template);
  }

  /**
   * Busca template ativo por tipo e empresa
   */
  async getActiveTemplate(
    companyId: string,
    templateType: string,
  ): Promise<ConsentTemplate | null> {
    return this.consentTemplateRepository.findOne({
      where: { companyId, templateType, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  // ========== Métodos auxiliares ==========

  private mapPermissionToField(permissionType: PermissionType): string {
    const map = {
      email_marketing: 'permissionEmailMarketing',
      whatsapp_marketing: 'permissionWhatsappMarketing',
      ai_profiling: 'permissionAiProfiling',
      terms_accepted: 'permissionTermsAccepted',
    };
    return map[permissionType];
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  private generateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}
