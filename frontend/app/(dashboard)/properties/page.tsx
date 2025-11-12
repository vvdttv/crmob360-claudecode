'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Plus, Search, Filter, MapPin, Bed, Bath, Car } from 'lucide-react';
import type { Property } from '@/types';

export default function PropertiesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['properties', search, statusFilter],
    queryFn: async () => {
      const params: any = { company_id: 'test-company-id' };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await api.get('/properties', { params });
      return response.data;
    },
  });

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    rented: 'bg-blue-100 text-blue-800',
    sold: 'bg-purple-100 text-purple-800',
    unavailable: 'bg-gray-100 text-gray-800',
  };

  const statusLabels: Record<string, string> = {
    available: 'Disponível',
    rented: 'Alugado',
    sold: 'Vendido',
    unavailable: 'Indisponível',
  };

  const typeLabels: Record<string, string> = {
    house: 'Casa',
    apartment: 'Apartamento',
    commercial: 'Comercial',
    land: 'Terreno',
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Imóveis</h1>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Imóvel
        </button>
      </div>

      <div className="mt-6 flex gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar imóveis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
          >
            <option value="all">Todos os status</option>
            <option value="available">Disponível</option>
            <option value="rented">Alugado</option>
            <option value="sold">Vendido</option>
            <option value="unavailable">Indisponível</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-gray-500">Carregando...</div>
        ) : properties && properties.length > 0 ? (
          properties.map((property) => (
            <div
              key={property.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="aspect-video bg-gray-200">
                {property.photos && property.photos.length > 0 ? (
                  <img
                    src={property.photos[0].url}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Sem foto
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {property.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.address.neighborhood}, {property.address.city}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[property.status]}`}>
                    {statusLabels[property.status]}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    {property.characteristics.bedrooms > 0 && (
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-1" />
                        {property.characteristics.bedrooms}
                      </div>
                    )}
                    {property.characteristics.bathrooms > 0 && (
                      <div className="flex items-center">
                        <Bath className="h-4 w-4 mr-1" />
                        {property.characteristics.bathrooms}
                      </div>
                    )}
                    {property.characteristics.parking_spaces > 0 && (
                      <div className="flex items-center">
                        <Car className="h-4 w-4 mr-1" />
                        {property.characteristics.parking_spaces}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {property.characteristics.area_m2}m²
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 uppercase">
                      {typeLabels[property.type]}
                    </span>
                    <div className="text-right">
                      {property.purpose === 'sale' && property.pricing.sale_price && (
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(property.pricing.sale_price)}
                        </div>
                      )}
                      {property.purpose === 'rent' && property.pricing.rent_price && (
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(property.pricing.rent_price)}/mês
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-8 text-center text-gray-500">
            Nenhum imóvel encontrado
          </div>
        )}
      </div>
    </div>
  );
}
