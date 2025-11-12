import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Owner } from '../entities/owner.entity';
import * as bcrypt from 'bcrypt';

/**
 * Owner Service - Módulo 7
 *
 * Gerencia proprietários de imóveis
 */
@Injectable()
export class OwnerService {
  private readonly logger = new Logger(OwnerService.name);

  constructor(
    @InjectRepository(Owner)
    private ownerRepository: Repository<Owner>,
  ) {}

  /**
   * Criar proprietário
   */
  async create(companyId: string, data: Partial<Owner>): Promise<Owner> {
    const owner = this.ownerRepository.create({
      ...data,
      companyId,
    });

    const saved = await this.ownerRepository.save(owner);

    this.logger.log(`Novo proprietário criado: ${saved.id} - ${saved.fullName}`);

    return saved;
  }

  /**
   * Buscar por ID
   */
  async findOne(id: string, companyId: string): Promise<Owner> {
    const owner = await this.ownerRepository.findOne({
      where: { id, companyId },
      relations: ['properties'],
    });

    if (!owner) {
      throw new NotFoundException(`Proprietário ${id} não encontrado`);
    }

    return owner;
  }

  /**
   * Listar proprietários
   */
  async findAll(
    companyId: string,
    filters: {
      search?: string;
      ownerType?: 'individual' | 'corporate';
      skip?: number;
      take?: number;
    },
  ): Promise<{ owners: Owner[]; total: number }> {
    const query = this.ownerRepository
      .createQueryBuilder('owner')
      .where('owner.company_id = :companyId', { companyId });

    if (filters.ownerType) {
      query.andWhere('owner.owner_type = :ownerType', {
        ownerType: filters.ownerType,
      });
    }

    if (filters.search) {
      query.andWhere(
        '(owner.full_name ILIKE :search OR owner.email ILIKE :search OR owner.document ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    query.orderBy('owner.full_name', 'ASC');

    const total = await query.getCount();

    if (filters.skip) {
      query.skip(filters.skip);
    }

    if (filters.take) {
      query.take(filters.take);
    }

    const owners = await query.getMany();

    return { owners, total };
  }

  /**
   * Atualizar proprietário
   */
  async update(
    id: string,
    companyId: string,
    data: Partial<Owner>,
  ): Promise<Owner> {
    const owner = await this.findOne(id, companyId);

    Object.assign(owner, data);

    return this.ownerRepository.save(owner);
  }

  /**
   * Habilitar acesso ao portal do proprietário (Módulo 7.1)
   */
  async enablePortalAccess(
    id: string,
    companyId: string,
    password: string,
  ): Promise<Owner> {
    const owner = await this.findOne(id, companyId);

    const passwordHash = await bcrypt.hash(password, 10);

    owner.portalAccessEnabled = true;
    owner.portalPasswordHash = passwordHash;

    const updated = await this.ownerRepository.save(owner);

    this.logger.log(`Portal habilitado para proprietário ${id}`);

    return updated;
  }

  /**
   * Desabilitar acesso ao portal
   */
  async disablePortalAccess(id: string, companyId: string): Promise<Owner> {
    const owner = await this.findOne(id, companyId);

    owner.portalAccessEnabled = false;
    owner.portalPasswordHash = null;

    return this.ownerRepository.save(owner);
  }

  /**
   * Validar credenciais do portal (usado no login)
   */
  async validatePortalCredentials(
    email: string,
    password: string,
  ): Promise<Owner | null> {
    const owner = await this.ownerRepository.findOne({
      where: { email, portalAccessEnabled: true },
    });

    if (!owner || !owner.portalPasswordHash) {
      return null;
    }

    const isValid = await bcrypt.compare(password, owner.portalPasswordHash);

    return isValid ? owner : null;
  }

  /**
   * Remover proprietário
   */
  async remove(id: string, companyId: string): Promise<void> {
    const owner = await this.findOne(id, companyId);
    await this.ownerRepository.remove(owner);
  }
}
