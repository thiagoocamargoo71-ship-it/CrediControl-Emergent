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

  const statCards = stats ? [
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
  ] : [];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <Sidebar />
      
      <main className="ml-64 p-8" data-testid="admin-dashboard">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-3xl font-bold text-neutral-50 tracking-tight">
            Painel Administrativo
          </h1>
          <p className="text-neutral-400 mt-1">
            Visão geral do sistema
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className={`bg-neutral-900 border border-neutral-800 rounded-xl p-6 card-hover animate-fade-in-delay-${Math.min(index, 3)}`}
                    data-testid={`admin-stat-card-${card.title.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                          {card.title}
                        </p>
                        <p className="text-2xl font-mono font-bold text-neutral-50 mt-2">
                          {card.value}
                        </p>
                        <p className="text-sm text-neutral-500 mt-1">
                          {card.description}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg border ${getColorClasses(card.color)}`}>
                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-xl p-6 animate-fade-in">
              <h2 className="font-heading text-xl font-semibold text-neutral-50 mb-4">
                Informações do Sistema
              </h2>
              <p className="text-neutral-400">
                Como administrador, você pode gerenciar os usuários do sistema, visualizar estatísticas gerais 
                e bloquear ou excluir usuários quando necessário. O painel de empréstimos e dados financeiros 
                individuais são acessíveis apenas pelos próprios usuários.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
