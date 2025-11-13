'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Plus, Users, UserCheck, UserX, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role?: {
    id: string;
    name: string;
    slug: string;
  };
  status: 'active' | 'inactive' | 'invited';
  last_login_at?: Date;
  created_at: Date;
}

export default function TeamPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users', statusFilter],
    queryFn: async () => {
      const params: any = { company_id: 'test-company-id' };
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await api.get('/users', { params });
      return response.data;
    },
  });

  const stats = [
    {
      name: 'Total de Usuários',
      value: users?.length || 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      name: 'Usuários Ativos',
      value: users?.filter(u => u.status === 'active').length || 0,
      icon: UserCheck,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      name: 'Inativos',
      value: users?.filter(u => u.status === 'inactive').length || 0,
      icon: UserX,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      name: 'Convites Pendentes',
      value: users?.filter(u => u.status === 'invited').length || 0,
      icon: Shield,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
  ];

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    invited: 'bg-yellow-100 text-yellow-800',
  };

  const statusLabels: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    invited: 'Convite Pendente',
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Equipe</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Convidar Usuário
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
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="invited">Convite Pendente</option>
          </select>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : users && users.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li
                  key={user.id}
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0">
                        {user.avatar_url ? (
                          <img
                            className="h-12 w-12 rounded-full"
                            src={user.avatar_url}
                            alt={user.name}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-lg font-medium text-gray-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {user.name}
                          </p>
                          <div className="ml-2 flex items-center gap-2">
                            {user.role && (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                                {user.role.name}
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[user.status]}`}>
                              {statusLabels[user.status]}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <p>{user.email}</p>
                          {user.phone && (
                            <p className="ml-6">{user.phone}</p>
                          )}
                        </div>
                        {user.last_login_at && (
                          <p className="mt-1 text-xs text-gray-500">
                            Último acesso: {formatDateTime(user.last_login_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Nenhum usuário encontrado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
