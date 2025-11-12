'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import type { FinancialEntry } from '@/types';

export default function FinancialPage() {
  const { data: entries, isLoading } = useQuery<FinancialEntry[]>({
    queryKey: ['financial-entries'],
    queryFn: async () => {
      const response = await api.get('/financial/entries', {
        params: { company_id: 'test-company-id' },
      });
      return response.data;
    },
  });

  const statusIcons = {
    pending: Clock,
    paid: CheckCircle,
    overdue: TrendingDown,
    canceled: TrendingDown,
  };

  const statusColors = {
    pending: 'text-yellow-600',
    paid: 'text-green-600',
    overdue: 'text-red-600',
    canceled: 'text-gray-600',
  };

  const statusLabels = {
    pending: 'Pendente',
    paid: 'Pago',
    overdue: 'Vencido',
    canceled: 'Cancelado',
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Financeiro</h1>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  A Receber
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatCurrency(0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  A Pagar
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatCurrency(0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Vencidos
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatCurrency(0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Saldo
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatCurrency(0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Lançamentos Recentes
          </h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : entries && entries.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {entries.slice(0, 10).map((entry) => {
              const StatusIcon = statusIcons[entry.status];
              return (
                <li key={entry.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {entry.description}
                        </p>
                        <div className="ml-2 flex items-center">
                          <StatusIcon className={`h-5 w-5 ${statusColors[entry.status]}`} />
                          <span className={`ml-1 text-sm ${statusColors[entry.status]}`}>
                            {statusLabels[entry.status]}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="text-sm text-gray-500">
                            {entry.account.name}
                          </p>
                          {entry.cost_center && (
                            <p className="mt-2 text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              {entry.cost_center.name}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>Vencimento: {formatDate(entry.due_date)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className={`text-lg font-semibold ${
                        entry.type === 'receivable' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.type === 'receivable' ? '+' : '-'}
                        {formatCurrency(entry.amount)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-8 text-center text-gray-500">
            Nenhum lançamento encontrado
          </div>
        )}
      </div>
    </div>
  );
}
