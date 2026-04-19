import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import {
  Users,
  CreditCard,
  DollarSign
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const statCards = stats
    ? [
        {
          title: 'Total de Usuários',
          value: stats.total_users,
          icon: Users,
          color: 'blue',
          description: 'Usuários cadastrados'
        },
        {
          title: 'Total de Empréstimos',
          value: stats.total_loans,
          icon: CreditCard,
          color: 'amber',
          description: 'Empréstimos no sistema'
        },
        {
          title: 'Valor Movimentado',
          value: formatCurrency(stats.total_amount),
          icon: DollarSign,
          color: 'emerald',
          description: 'Total com juros'
        }
      ]
    : [];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'border-blue-500/20 bg-blue-500/10 text-blue-500',
      emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500',
      amber: 'border-amber-500/20 bg-amber-500/10 text-amber-500'
    };

    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-neutral-950 overflow-x-hidden">
      <Sidebar />

      <main
        className="
          min-w-0
          px-4 pt-20 pb-6
          sm:px-6 sm:pt-24 sm:pb-8
          lg:ml-64 lg:w-[calc(100%-16rem)] lg:px-8 lg:pt-8
        "
        data-testid="admin-dashboard"
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="animate-fade-in">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-50 sm:text-3xl lg:text-4xl">
                Painel Administrativo
              </h1>
              <p className="mt-2 text-sm text-neutral-400 sm:text-base">
                Visão geral do sistema
              </p>
            </div>

            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center sm:min-h-[320px]">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-500 sm:h-12 sm:w-12" />
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 2xl:grid-cols-3">
                  {statCards.map((card, index) => {
                    const Icon = card.icon;

                    return (
                      <div
                        key={card.title}
                        className={`min-w-0 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5 lg:p-6 card-hover animate-fade-in-delay-${Math.min(index, 3)}`}
                        data-testid={`admin-stat-card-${card.title
                          .toLowerCase()
                          .replace(/\s/g, '-')}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 sm:text-xs">
                              {card.title}
                            </p>

                            <p className="mt-2 break-words font-mono text-xl font-bold leading-tight text-neutral-50 sm:text-2xl lg:text-3xl">
                              {card.value}
                            </p>

                            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                              {card.description}
                            </p>
                          </div>

                          <div
                            className={`shrink-0 rounded-xl border p-2.5 sm:p-3 ${getColorClasses(card.color)}`}
                          >
                            <Icon className="h-5 w-5" strokeWidth={1.5} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Info Box */}
                <div className="animate-fade-in rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6 lg:p-7">
                  <h2 className="mb-3 font-heading text-lg font-semibold text-neutral-50 sm:mb-4 sm:text-xl">
                    Informações do Sistema
                  </h2>

                  <p className="max-w-5xl text-sm leading-relaxed text-neutral-400 sm:text-base">
                    Como administrador, você pode gerenciar os usuários do sistema,
                    visualizar estatísticas gerais e bloquear ou excluir usuários
                    quando necessário. O painel de empréstimos e dados financeiros
                    individuais são acessíveis apenas pelos próprios usuários.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;