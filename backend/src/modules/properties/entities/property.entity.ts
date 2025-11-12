import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Owner } from './owner.entity';
import { PropertyHistory } from './property-history.entity';
import { PropertyFeedback } from './property-feedback.entity';

/**
 * Property Entity - Módulo 5
 *
 * Representa um imóvel no estoque da imobiliária
 */
@Entity('properties')
@Index(['companyId'])
@Index(['ownerId'])
@Index(['propertyType', 'transactionType'])
@Index(['addressCity', 'addressNeighborhood'])
@Index(['status', 'isPublished'])
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  @Index()
  companyId: string;

  @Column({ type: 'uuid', name: 'owner_id', nullable: true })
  @Index()
  ownerId: string;

  @ManyToOne(() => Owner, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @Column({ type: 'uuid', name: 'capturer_user_id', nullable: true })
  capturerUserId: string; // Corretor captador

  // Dados básicos
  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, name: 'property_type' })
  propertyType: string; // apartment, house, commercial, land

  @Column({ type: 'varchar', length: 20, name: 'transaction_type' })
  transactionType: 'sale' | 'rent' | 'both';

  // Localização
  @Column({ type: 'varchar', length: 255, name: 'address_street' })
  addressStreet: string;

  @Column({ type: 'varchar', length: 20, name: 'address_number', nullable: true })
  addressNumber: string;

  @Column({ type: 'varchar', length: 100, name: 'address_complement', nullable: true })
  addressComplement: string;

  @Column({ type: 'varchar', length: 100, name: 'address_neighborhood' })
  @Index()
  addressNeighborhood: string;

  @Column({ type: 'varchar', length: 100, name: 'address_city' })
  @Index()
  addressCity: string;

  @Column({ type: 'varchar', length: 2, name: 'address_state' })
  addressState: string;

  @Column({ type: 'varchar', length: 10, name: 'address_zipcode', nullable: true })
  addressZipcode: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  // Características
  @Column({ type: 'integer', default: 0 })
  bedrooms: number;

  @Column({ type: 'integer', default: 0 })
  bathrooms: number;

  @Column({ type: 'integer', default: 0 })
  suites: number;

  @Column({ type: 'integer', name: 'parking_spaces', default: 0 })
  parkingSpaces: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'area_built', nullable: true })
  areaBuilt: number; // m²

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'area_total', nullable: true })
  areaTotal: number; // m²

  @Column({ type: 'jsonb', default: [] })
  features: string[]; // piscina, churrasqueira, etc

  // Valores
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'sale_price', nullable: true })
  @Index()
  salePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'rent_price', nullable: true })
  @Index()
  rentPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'condo_fee', nullable: true })
  condoFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'iptu_annual', nullable: true })
  iptuAnnual: number;

  // Status e publicação
  @Column({ type: 'varchar', length: 50, default: 'available' })
  @Index()
  status: 'available' | 'reserved' | 'rented' | 'sold' | 'maintenance';

  @Column({ type: 'boolean', name: 'is_published', default: false })
  @Index()
  isPublished: boolean;

  @Column({ type: 'timestamptz', name: 'published_at', nullable: true })
  publishedAt: Date;

  // Multipublicação (Módulo 5.2)
  @Column({ type: 'boolean', name: 'publish_on_own_site', default: true })
  publishOnOwnSite: boolean;

  @Column({ type: 'boolean', name: 'publish_on_zap', default: false })
  publishOnZap: boolean;

  @Column({ type: 'boolean', name: 'publish_on_imovelweb', default: false })
  publishOnImovelweb: boolean;

  @Column({ type: 'jsonb', name: 'external_ids', default: {} })
  externalIds: {
    zap?: string;
    imovelweb?: string;
    [key: string]: string;
  };

  // Mídia
  @Column({ type: 'jsonb', default: [] })
  images: Array<{
    url: string;
    order: number;
    caption?: string;
  }>;

  @Column({ type: 'jsonb', default: [] })
  videos: string[];

  @Column({ type: 'text', name: 'virtual_tour_url', nullable: true })
  virtualTourUrl: string;

  // Documentação (Módulo 5.3)
  @Column({ type: 'jsonb', default: [] })
  documents: Array<{
    type: string;
    url: string;
    name: string;
    expiresAt?: Date;
  }>;

  // IA (Módulo 4.2 e 4.3)
  @Column({ type: 'text', name: 'ai_generated_description', nullable: true })
  aiGeneratedDescription: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'ai_suggested_price_min', nullable: true })
  aiSuggestedPriceMin: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'ai_suggested_price_max', nullable: true })
  aiSuggestedPriceMax: number;

  // Métricas
  @Column({ type: 'integer', name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ type: 'integer', name: 'favorite_count', default: 0 })
  favoriteCount: number;

  @Column({ type: 'integer', name: 'visit_count', default: 0 })
  visitCount: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => PropertyHistory, (history) => history.property)
  history: PropertyHistory[];

  @OneToMany(() => PropertyFeedback, (feedback) => feedback.property)
  feedbacks: PropertyFeedback[];
}
