'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Plus, Mail, MessageCircle, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Campaign {
  id: string;
  name: string;
  channel: 'email' | 'whatsapp' | 'sms';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'canceled';
  total_recipients: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  scheduled_at?: Date;
  sent_at?: Date;
  created_at: Date;
}

export default function MarketingPage() {
  const [channelFilter, setChannelFilter] = useState<string>('all');

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns', channelFilter],
    queryFn: async () => {
      const params: any = { company_id: 'test-company-id' };
      if (channelFilter !== 'all') params.channel = channelFilter;

      const response = await api.get('/marketing/campaigns', { params });
      return response.data;
    },
  });

  const stats = [
    {
      name: 'Total de Campanhas',
      value: campaigns?.length || 0,
      icon: Mail,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      name: 'Emails Enviados',
      value: campaigns
        ?.filter(c => c.channel === 'email')
        .reduce((sum, c) => sum + c.sent_count, 0) || 0,
      icon: Mail,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      name: 'Taxa de Abertura',
      value: campaigns && campaigns.length > 0
        ? `${Math.round(
            (campaigns.reduce((sum, c) => sum + c.opened_count, 0) /
              campaigns.reduce((sum, c) => sum + c.sent_count, 0)) *
              100
          )}%`
        : '0%',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      name: 'Segmentos Ativos',
      value: 0,
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  const channelIcons = {
    email: Mail,
    whatsapp: MessageCircle,
    sms: MessageCircle,
  };

  const channelColors = {
    email: 'text-blue-600',
    whatsapp: 'text-green-600',
    sms: 'text-purple-600',
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    sending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-green-100 text-green-800',
    canceled: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    scheduled: 'Agendada',
    sending: 'Enviando',
    sent: 'Enviada',
    canceled: 'Cancelada',
  };

  const channelLabels = {
    email: 'Email',
    whatsapp: 'WhatsApp',
    sms: 'SMS',
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Marketing</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
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
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
          >
            <option value="all">Todos os canais</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : campaigns && campaigns.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {campaigns.map((campaign) => {
                const ChannelIcon = channelIcons[campaign.channel];
                const openRate = campaign.sent_count > 0
                  ? Math.round((campaign.opened_count / campaign.sent_count) * 100)
                  : 0;
                const clickRate = campaign.opened_count > 0
                  ? Math.round((campaign.clicked_count / campaign.opened_count) * 100)
                  : 0;

                return (
                  <li
                    key={campaign.id}
                    className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ChannelIcon className={`h-5 w-5 ${channelColors[campaign.channel]}`} />
                            <p className="text-sm font-medium text-gray-900">
                              {campaign.name}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[campaign.status]}`}>
                            {statusLabels[campaign.status]}
                          </span>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex gap-6">
                            <p className="text-sm text-gray-500">
                              {channelLabels[campaign.channel]}
                            </p>
                            <p className="text-sm text-gray-500">
                              {campaign.total_recipients} destinatários
                            </p>
                            {campaign.status === 'sent' && (
                              <>
                                <p className="text-sm text-gray-500">
                                  {openRate}% abertura
                                </p>
                                <p className="text-sm text-gray-500">
                                  {clickRate}% cliques
                                </p>
                              </>
                            )}
                          </div>
                          <div className="mt-2 sm:mt-0">
                            <p className="text-sm text-gray-500">
                              {campaign.sent_at
                                ? `Enviada em ${formatDateTime(campaign.sent_at)}`
                                : campaign.scheduled_at
                                ? `Agendada para ${formatDateTime(campaign.scheduled_at)}`
                                : `Criada em ${formatDateTime(campaign.created_at)}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Nenhuma campanha encontrada
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
