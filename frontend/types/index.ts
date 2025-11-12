// Common types
export interface User {
  id: string;
  company_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: Role;
  status: 'active' | 'inactive' | 'invited';
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  slug: string;
  module: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

// CRM types
export interface Lead {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'negotiating' | 'converted' | 'lost';
  source: string;
  tags: string[];
  assigned_to_id?: string;
  assigned_to?: User;
  property_interest?: PropertyInterest;
  last_interaction_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PropertyInterest {
  type: 'sale' | 'rent';
  property_type: 'house' | 'apartment' | 'commercial' | 'land';
  bedrooms?: number;
  min_price?: number;
  max_price?: number;
  city?: string;
  neighborhood?: string;
}

export interface Client {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  cpf_cnpj: string;
  type: 'buyer' | 'tenant' | 'both';
  created_at: Date;
}

// Property types
export interface Property {
  id: string;
  company_id: string;
  title: string;
  type: 'house' | 'apartment' | 'commercial' | 'land';
  purpose: 'sale' | 'rent' | 'both';
  status: 'available' | 'rented' | 'sold' | 'unavailable';
  address: Address;
  characteristics: PropertyCharacteristics;
  pricing: PropertyPricing;
  photos: PropertyPhoto[];
  published: boolean;
  owner_id: string;
  owner?: Owner;
  created_at: Date;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  latitude?: number;
  longitude?: number;
}

export interface PropertyCharacteristics {
  bedrooms: number;
  bathrooms: number;
  parking_spaces: number;
  area_m2: number;
  furnished?: boolean;
  amenities?: string[];
}

export interface PropertyPricing {
  sale_price?: number;
  rent_price?: number;
  condo_fee?: number;
  iptu?: number;
}

export interface PropertyPhoto {
  id: string;
  url: string;
  order: number;
  is_cover: boolean;
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf_cnpj: string;
}

// Financial types
export interface FinancialEntry {
  id: string;
  company_id: string;
  type: 'receivable' | 'payable';
  description: string;
  amount: number;
  due_date: Date;
  paid_at?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'canceled';
  payment_method?: string;
  person_id?: string;
  person_type?: string;
  account: ChartOfAccounts;
  cost_center?: CostCenter;
}

export interface ChartOfAccounts {
  id: string;
  code: string;
  name: string;
  type: 'revenue' | 'expense' | 'asset' | 'liability' | 'equity';
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  type?: string;
}

// Dashboard types
export interface DashboardMetrics {
  total_leads: number;
  total_properties: number;
  total_contracts: number;
  total_revenue: number;
  conversion_rate: number;
  avg_ticket: number;
}
