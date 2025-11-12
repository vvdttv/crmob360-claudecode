import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PortalUser } from '../entities/portal-user.entity';

@Injectable()
export class PortalService {
  constructor(
    @InjectRepository(PortalUser)
    private readonly portalUserRepository: Repository<PortalUser>,
  ) {}

  async createPortalUser(companyId: string, data: any): Promise<PortalUser> {
    const user = this.portalUserRepository.create({
      company_id: companyId,
      ...data,
      status: 'invited',
      invitation_token: crypto.randomBytes(32).toString('hex'),
    });

    return this.portalUserRepository.save(user);
  }

  async acceptInvitation(token: string, password: string): Promise<PortalUser> {
    const user = await this.portalUserRepository.findOne({
      where: { invitation_token: token, status: 'invited' },
    });

    if (!user) throw new Error('Invalid invitation token');

    user.password_hash = await bcrypt.hash(password, 10);
    user.status = 'active';
    user.invitation_token = null;

    return this.portalUserRepository.save(user);
  }

  async getContracts(companyId: string, personId: string): Promise<any[]> {
    // TODO: Query contracts from Admin module
    return [];
  }

  async getBoletos(companyId: string, personId: string): Promise<any[]> {
    // TODO: Query financial entries from Financial module
    return [];
  }

  async createServiceRequest(companyId: string, personId: string, data: any): Promise<any> {
    // TODO: Create task in Tasks module
    return {};
  }
}
