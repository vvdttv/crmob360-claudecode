'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, FileText, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Contract {
  id: string;
  contract_number: string;
  type: 'sale' | 'rent';
  status: 'draft' | 'active' | 'terminated';
  property_id: string;
  tenant_id?: string;
  buyer_id?: string;
  start_date: Date;
  end_date?: Date;
  monthly_rent?: number;
  sale_price?: number;
  created_at: Date;
}

export default function AdminPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: contracts, isLoading } = useQuery<Contract[]>({
    queryKey: ['contracts', statusFilter],
    queryFn: async () => {
      const params: any = { company_id: 'test-company-id' };
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await api.get('/admin/contracts', { params });
      return response.data;
    },
  });

  const stats = [
    {
      name: 'Contratos Ativos',
      value: contracts?.filter(c => c.status === 'active').length || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      name: 'Em Elaboração',
      value: contracts?.filter(c => c.status === 'draft').length || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      name: 'Finalizados',
      value: contracts?.filter(c => c.status === 'terminated').length || 0,
      icon: FileText,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
    },
    {
      name: 'Receita Mensal',
      value: formatCurrency(
        contracts
          ?.filter(c => c.status === 'active' && c.monthly_rent)
          .reduce((sum, c) => sum + (c.monthly_rent || 0), 0) || 0
      ),
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
  ];

  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    terminated: 'bg-gray-100 text-gray-800',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    active: 'Ativo',
    terminated: 'Finalizado',
  };

  const typeLabels: Record<string, string> = {
    sale: 'Venda',
    rent: 'Locação',
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Contratos</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="bg-white overflow-hidden shadow rounded-lg p-5"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {item.name}
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {item.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex gap-2 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
          >
            <option value="all">Todos os status</option>
            <option value="draft">Rascunho</option>
            <option value="active">Ativo</option>
            <option value="terminated">Finalizado</option>
          </select>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : contracts && contracts.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {contracts.map((contract) => (
                <li
                  key={contract.id}
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-primary">
                          Contrato #{contract.contract_number}
                        </p>
                        <div className="ml-2 flex items-center gap-2">
                          <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                            {typeLabels[contract.type]}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[contract.status]}`}>
                            {statusLabels[contract.status]}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex gap-6">
                          <p className="text-sm text-gray-500">
                            Início: {formatDate(contract.start_date)}
                          </p>
                          {contract.end_date && (
                            <p className="text-sm text-gray-500">
                              Término: {formatDate(contract.end_date)}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 sm:mt-0">
                          {contract.monthly_rent && (
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(contract.monthly_rent)}/mês
                            </p>
                          )}
                          {contract.sale_price && (
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(contract.sale_price)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Nenhum contrato encontrado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
