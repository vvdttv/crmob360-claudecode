'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Users, Building, FileText, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import type { DashboardMetrics } from '@/types';

export default function DashboardPage() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const response = await api.get('/reports/dashboard', {
        params: { company_id: 'test-company-id' },
      });
      return response.data;
    },
  });

  const stats = [
    {
      name: 'Total de Leads',
      value: metrics?.total_leads || 0,
      icon: Users,
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Imóveis Ativos',
      value: metrics?.total_properties || 0,
      icon: Building,
      change: '+5%',
      changeType: 'positive',
    },
    {
      name: 'Contratos',
      value: metrics?.total_contracts || 0,
      icon: FileText,
      change: '-2%',
      changeType: 'negative',
    },
    {
      name: 'Receita Mensal',
      value: formatCurrency(metrics?.total_revenue || 0),
      icon: DollarSign,
      change: '+18%',
      changeType: 'positive',
    },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {item.value}
                      </div>
                      <div
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          item.changeType === 'positive'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {item.changeType === 'positive' ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {item.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900">Conversão de Leads</h3>
            <div className="mt-4">
              <div className="text-3xl font-bold text-gray-900">
                {metrics?.conversion_rate || 0}%
              </div>
              <p className="text-sm text-gray-500 mt-1">Taxa de conversão média</p>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900">Ticket Médio</h3>
            <div className="mt-4">
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(metrics?.avg_ticket || 0)}
              </div>
              <p className="text-sm text-gray-500 mt-1">Valor médio por contrato</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
