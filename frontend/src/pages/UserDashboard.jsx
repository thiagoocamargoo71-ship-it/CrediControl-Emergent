import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import AppShell from '../components/AppShell';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';

const UserDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);

  const statCards = stats
    ? [
        {
          title: 'Total Emprestado',
          value: formatCurrency(stats.total_loaned),
          icon: DollarSign,
          color: 'blue',
          description: 'Valor principal emprestado',
        },
        {
          title: 'Total a Receber',
          value: formatCurrency(stats.total_pending),
          icon: Clock,
          color: 'amber',
          description: 'Incluindo juros',
        },
        {
          title: 'Total Recebido',
          value: formatCurrency(stats.total_received),
          icon: TrendingUp,
          color: 'emerald',
          description: 'Pagamentos recebidos',
        },
        {
          title: 'Clientes',
          value: stats.customers_count,
          icon: Users,
          color: 'blue',
          description: 'Clientes cadastrados',
        },
        {
          title: 'Empréstimos',
          value: stats.loans_count,
          icon: CreditCard,
          color: 'blue',
          description: 'Total de empréstimos',
        },
        {
          title: 'Parcelas Atrasadas',
          value: stats.overdue_count,
          icon: AlertTriangle,
          color: 'rose',
          description: 'Requer atenção',
        },
      ]
    : [];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <AppShell
        title="Dashboard"
        subtitle="Visão geral dos seus empréstimos"
      >
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle="Visão geral dos seus empréstimos"
    >
      <div data-testid="user-dashboard">
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-xl shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-700 animate-fade-in-delay-${Math.min(
                  index,
                  3
                )}`}
                data-testid={`stat-card-${card.title.toLowerCase().replace(/\s/g, '-')}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      {card.title}
                    </p>
                    <p className="mt-2 break-words text-2xl font-bold text-neutral-50">
                      {card.value}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">{card.description}</p>
                  </div>

                  <div className={`rounded-xl border p-3 ${getColorClasses(card.color)}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {stats && (
          <div className="mt-8 rounded-3xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
            <h2 className="font-heading mb-5 text-xl font-semibold text-neutral-50">
              Resumo Financeiro
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="text-sm text-neutral-500">Capital Investido</p>
                <p className="mt-2 text-lg font-semibold text-neutral-50">
                  {formatCurrency(stats.total_loaned)}
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="text-sm text-neutral-500">Total com Juros</p>
                <p className="mt-2 text-lg font-semibold text-neutral-50">
                  {formatCurrency(stats.total_with_interest)}
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="text-sm text-neutral-500">Lucro Esperado</p>
                <p className="mt-2 text-lg font-semibold text-emerald-500">
                  {formatCurrency(stats.total_with_interest - stats.total_loaned)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default UserDashboard;