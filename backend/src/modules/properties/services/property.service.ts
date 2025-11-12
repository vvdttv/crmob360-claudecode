import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Property } from '../entities/property.entity';
import { PropertyHistory } from '../entities/property-history.entity';
import { PropertyFeedback } from '../entities/property-feedback.entity';

/**
 * Property Service - Módulo 5
 *
 * Serviço principal para gerenciamento de imóveis
 */
@Injectable()
export class PropertyService {
  private readonly logger = new Logger(PropertyService.name);

  constructor(
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,

    @InjectRepository(PropertyHistory)
    private historyRepository: Repository<PropertyHistory>,

    @InjectRepository(PropertyFeedback)
    private feedbackRepository: Repository<PropertyFeedback>,

    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Criar novo imóvel (Módulo 5.1)
   */
  async create(
    companyId: string,
    data: Partial<Property>,
    userId?: string,
  ): Promise<Property> {
    const property = this.propertyRepository.create({
      ...data,
      companyId,
    });

    const saved = await this.propertyRepository.save(property);

    // Registra histórico
    await this.createHistory({
      propertyId: saved.id,
      userId,
      eventType: 'other',
      eventDescription: 'Imóvel cadastrado',
      newValue: { title: saved.title, status: saved.status },
    });

    this.logger.log(`Novo imóvel criado: ${saved.id} - ${saved.title}`);

    // Emite evento para outros módulos
    this.eventEmitter.emit('property.created', {
      propertyId: saved.id,
      companyId,
      transactionType: saved.transactionType,
      timestamp: new Date(),
    });

    return saved;
  }

  /**
   * Buscar imóvel por ID com relações
   */
  async findOne(id: string, companyId: string): Promise<Property> {
    const property = await this.propertyRepository.findOne({
      where: { id, companyId },
      relations: ['owner', 'history', 'feedbacks'],
    });

    if (!property) {
      throw new NotFoundException(`Imóvel ${id} não encontrado`);
    }

    return property;
  }

  /**
   * Listar imóveis com filtros avançados (Módulo 5.1)
   */
  async findAll(
    companyId: string,
    filters: {
      propertyType?: string;
      transactionType?: 'sale' | 'rent' | 'both';
      status?: string;
      city?: string;
      neighborhood?: string;
      minPrice?: number;
      maxPrice?: number;
      bedrooms?: number;
      ownerId?: string;
      isPublished?: boolean;
      search?: string;
      skip?: number;
      take?: number;
    },
  ): Promise<{ properties: Property[]; total: number }> {
    const query = this.propertyRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.owner', 'owner')
      .where('property.company_id = :companyId', { companyId });

    if (filters.propertyType) {
      query.andWhere('property.property_type = :propertyType', {
        propertyType: filters.propertyType,
      });
    }

    if (filters.transactionType) {
      query.andWhere(
        '(property.transaction_type = :transactionType OR property.transaction_type = :both)',
        { transactionType: filters.transactionType, both: 'both' },
      );
    }

    if (filters.status) {
      query.andWhere('property.status = :status', { status: filters.status });
    }

    if (filters.city) {
      query.andWhere('property.address_city ILIKE :city', {
        city: `%${filters.city}%`,
      });
    }

    if (filters.neighborhood) {
      query.andWhere('property.address_neighborhood ILIKE :neighborhood', {
        neighborhood: `%${filters.neighborhood}%`,
      });
    }

    if (filters.minPrice) {
      if (filters.transactionType === 'rent') {
        query.andWhere('property.rent_price >= :minPrice', {
          minPrice: filters.minPrice,
        });
      } else {
        query.andWhere('property.sale_price >= :minPrice', {
          minPrice: filters.minPrice,
        });
      }
    }

    if (filters.maxPrice) {
      if (filters.transactionType === 'rent') {
        query.andWhere('property.rent_price <= :maxPrice', {
          maxPrice: filters.maxPrice,
        });
      } else {
        query.andWhere('property.sale_price <= :maxPrice', {
          maxPrice: filters.maxPrice,
        });
      }
    }

    if (filters.bedrooms) {
      query.andWhere('property.bedrooms >= :bedrooms', {
        bedrooms: filters.bedrooms,
      });
    }

    if (filters.ownerId) {
      query.andWhere('property.owner_id = :ownerId', {
        ownerId: filters.ownerId,
      });
    }

    if (filters.isPublished !== undefined) {
      query.andWhere('property.is_published = :isPublished', {
        isPublished: filters.isPublished,
      });
    }

    if (filters.search) {
      query.andWhere(
        '(property.title ILIKE :search OR property.description ILIKE :search OR property.address_neighborhood ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    query.orderBy('property.created_at', 'DESC');

    const total = await query.getCount();

    if (filters.skip) {
      query.skip(filters.skip);
    }

    if (filters.take) {
      query.take(filters.take);
    }

    const properties = await query.getMany();

    return { properties, total };
  }

  /**
   * Atualizar imóvel
   */
  async update(
    id: string,
    companyId: string,
    data: Partial<Property>,
    userId?: string,
  ): Promise<Property> {
    const property = await this.findOne(id, companyId);

    // Detecta mudanças importantes para histórico
    const changes = this.detectChanges(property, data);

    Object.assign(property, data);
    const updated = await this.propertyRepository.save(property);

    // Registra histórico para cada mudança
    for (const change of changes) {
      await this.createHistory({
        propertyId: id,
        userId,
        ...change,
      });
    }

    this.logger.log(`Imóvel ${id} atualizado`);

    return updated;
  }

  /**
   * Publicar/despublicar imóvel (Módulo 5.2)
   */
  async togglePublish(
    id: string,
    companyId: string,
    publish: boolean,
    userId?: string,
  ): Promise<Property> {
    const property = await this.findOne(id, companyId);

    property.isPublished = publish;
    property.publishedAt = publish ? new Date() : null;

    const updated = await this.propertyRepository.save(property);

    await this.createHistory({
      propertyId: id,
      userId,
      eventType: 'publication',
      eventDescription: publish ? 'Imóvel publicado' : 'Imóvel despublicado',
      newValue: { isPublished: publish },
    });

    // Emite evento para multipublicação em portais
    if (publish) {
      this.eventEmitter.emit('property.published', {
        propertyId: id,
        companyId,
        publishOnZap: property.publishOnZap,
        publishOnImovelweb: property.publishOnImovelweb,
        timestamp: new Date(),
      });
    }

    return updated;
  }

  /**
   * Alterar status do imóvel (Módulo 5.4)
   */
  async changeStatus(
    id: string,
    companyId: string,
    newStatus: 'available' | 'reserved' | 'rented' | 'sold' | 'maintenance',
    userId?: string,
  ): Promise<Property> {
    const property = await this.findOne(id, companyId);
    const oldStatus = property.status;

    property.status = newStatus;
    const updated = await this.propertyRepository.save(property);

    await this.createHistory({
      propertyId: id,
      userId,
      eventType: 'status_change',
      eventDescription: `Status alterado de ${oldStatus} para ${newStatus}`,
      oldValue: { status: oldStatus },
      newValue: { status: newStatus },
    });

    // Emite evento (ex: para despublicar automaticamente se vendido/alugado)
    this.eventEmitter.emit('property.status.changed', {
      propertyId: id,
      companyId,
      oldStatus,
      newStatus,
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * Registrar feedback de visita (Módulo 5.5)
   */
  async createFeedback(data: {
    propertyId: string;
    leadId?: string;
    activityId?: string;
    rating?: number;
    positivePoints?: string;
    negativePoints?: string;
    wouldRentOrBuy?: boolean;
    feedbackData?: any;
  }): Promise<PropertyFeedback> {
    const feedback = this.feedbackRepository.create(data);
    const saved = await this.feedbackRepository.save(feedback);

    // Registra no histórico
    await this.createHistory({
      propertyId: data.propertyId,
      eventType: 'visit',
      eventDescription: `Feedback de visita: ${data.rating}/10`,
      newValue: { rating: data.rating, wouldRentOrBuy: data.wouldRentOrBuy },
    });

    this.logger.log(`Feedback registrado para imóvel ${data.propertyId}`);

    return saved;
  }

  /**
   * Buscar feedbacks de um imóvel
   */
  async getFeedbacks(propertyId: string, companyId: string): Promise<PropertyFeedback[]> {
    // Verifica se imóvel pertence à empresa
    await this.findOne(propertyId, companyId);

    return this.feedbackRepository.find({
      where: { propertyId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Buscar histórico do imóvel (Módulo 5.4)
   */
  async getHistory(propertyId: string, companyId: string): Promise<PropertyHistory[]> {
    // Verifica se imóvel pertence à empresa
    await this.findOne(propertyId, companyId);

    return this.historyRepository.find({
      where: { propertyId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Buscar imóveis por IDs (usado para matching)
   */
  async findByIds(propertyIds: string[], companyId: string): Promise<Property[]> {
    return this.propertyRepository.find({
      where: {
        id: In(propertyIds),
        companyId,
      },
    });
  }

  /**
   * Incrementar contador de visualização
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.propertyRepository.increment({ id }, 'viewCount', 1);
  }

  /**
   * Soft delete
   */
  async remove(id: string, companyId: string, userId?: string): Promise<void> {
    const property = await this.findOne(id, companyId);

    await this.createHistory({
      propertyId: id,
      userId,
      eventType: 'other',
      eventDescription: 'Imóvel removido',
      oldValue: { status: property.status },
    });

    await this.propertyRepository.remove(property);
  }

  // ========== Métodos auxiliares ==========

  private async createHistory(data: {
    propertyId: string;
    userId?: string;
    eventType: string;
    eventDescription?: string;
    oldValue?: any;
    newValue?: any;
  }): Promise<PropertyHistory> {
    const history = this.historyRepository.create(data);
    return this.historyRepository.save(history);
  }

  private detectChanges(
    oldProperty: Property,
    newData: Partial<Property>,
  ): Array<{
    eventType: string;
    eventDescription: string;
    oldValue: any;
    newValue: any;
  }> {
    const changes = [];

    // Mudança de preço
    if (newData.salePrice && newData.salePrice !== oldProperty.salePrice) {
      changes.push({
        eventType: 'price_change',
        eventDescription: 'Preço de venda alterado',
        oldValue: { salePrice: oldProperty.salePrice },
        newValue: { salePrice: newData.salePrice },
      });
    }

    if (newData.rentPrice && newData.rentPrice !== oldProperty.rentPrice) {
      changes.push({
        eventType: 'price_change',
        eventDescription: 'Preço de locação alterado',
        oldValue: { rentPrice: oldProperty.rentPrice },
        newValue: { rentPrice: newData.rentPrice },
      });
    }

    return changes;
  }
}
