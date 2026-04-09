import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useNotifications } from '../context/NotificationContext';
import {
  BellRing,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowRight,
  Receipt,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const Notifications = () => {
  const navigate = useNavigate();
  const { setCount } = useNotifications();

  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchData = useCallback(async (isBackgroundRefresh = false) => {
    try {
      if (isBackgroundRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await axios.get(`${API}/installments`);
      setInstallments(res.data || []);
    } catch {
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value || 0));

  const today = useMemo(() => {
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    return current;
  }, []);

  const notifications = useMemo(() => {
    return installments
      .filter((installment) => installment.status !== 'paid')
      .map((installment) => {
        const due = new Date(`${installment.due_date}T00:00:00`);
        due.setHours(0, 0, 0, 0);

        const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

        let type = 'normal';
        let label = '';
        let priority = 99;
        let title = '';

        if (diff === 0) {
          type = 'today';
          label = 'Vence hoje';
          priority = 1;
          title = 'Parcela com vencimento hoje';
        } else if (diff > 0 && diff <= 7) {
          type = 'upcoming';
          label = diff === 1 ? 'Vence em 1 dia' : `Vence em ${diff} dias`;
          priority = 2;
          title = 'Parcela próxima do vencimento';
        } else if (diff < 0 && diff >= -14) {
          type = 'overdue';
          label =
            Math.abs(diff) === 1
              ? 'Atrasada há 1 dia'
              : `Atrasada há ${Math.abs(diff)} dias`;
          priority = 0;
          title = 'Parcela vencida';
        }

        if (type === 'normal') return null;

        return {
          ...installment,
          type,
          label,
          title,
          priority,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return new Date(a.due_date) - new Date(b.due_date);
      });
  }, [installments, today]);

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter((notification) => notification.type === filter);
  }, [notifications, filter]);

  const summary = useMemo(
    () => ({
      total: notifications.length,
      overdue: notifications.filter((n) => n.type === 'overdue').length,
      today: notifications.filter((n) => n.type === 'today').length,
      upcoming: notifications.filter((n) => n.type === 'upcoming').length,
    }),
    [notifications]
  );

  useEffect(() => {
    setCount(summary.total);
  }, [summary.total, setCount]);

  const handlePay = async (id) => {
    setPayingId(id);

    try {
      await axios.post(`${API}/installments/${id}/pay`);
      toast.success('Pagamento registrado com sucesso');
      fetchData(true);
    } catch {
      toast.error('Erro ao registrar pagamento');
    } finally {
      setPayingId(null);
    }
  };

  const getBadgeStyles = (type) => {
    switch (type) {
      case 'overdue':
        return 'border-rose-500/20 bg-rose-500/10 text-rose-300';
      case 'today':
        return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
      case 'upcoming':
        return 'border-sky-500/20 bg-sky-500/10 text-sky-300';
      default:
        return 'border-neutral-700 bg-neutral-800 text-neutral-300';
    }
  };

  const getIconStyles = (type) => {
    switch (type) {
      case 'overdue':
        return {
          wrap: 'border-rose-500/20 bg-rose-500/10',
          icon: 'text-rose-300',
          Icon: AlertTriangle,
        };
      case 'today':
        return {
          wrap: 'border-amber-500/20 bg-amber-500/10',
          icon: 'text-amber-300',
          Icon: Clock,
        };
      case 'upcoming':
        return {
          wrap: 'border-sky-500/20 bg-sky-500/10',
          icon: 'text-sky-300',
          Icon: Calendar,
        };
      default:
        return {
          wrap: 'border-neutral-700 bg-neutral-800',
          icon: 'text-neutral-300',
          Icon: BellRing,
        };
    }
  };

  const filterButtons = [
    { value: 'all', label: 'Todas' },
    { value: 'overdue', label: 'Vencidas' },
    { value: 'today', label: 'Hoje' },
    { value: 'upcoming', label: 'Próximas' },
  ];

  if (loading) {
    return (
      <AppShell
        title="Notificações financeiras"
        headerVariant="premium"
        headerIcon={BellRing}
        headerBadge="Monitor financeiro"
      >
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="h-28 rounded-3xl border border-neutral-800 bg-neutral-900" />
            <div className="h-28 rounded-3xl border border-neutral-800 bg-neutral-900" />
            <div className="h-28 rounded-3xl border border-neutral-800 bg-neutral-900" />
          </div>
          <div className="h-16 rounded-3xl border border-neutral-800 bg-neutral-900" />
          <div className="h-40 rounded-3xl border border-neutral-800 bg-neutral-900" />
          <div className="h-40 rounded-3xl border border-neutral-800 bg-neutral-900" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Notificações financeiras"
      subtitle="Acompanhe parcelas vencidas, que vencem hoje e próximas do vencimento."
      headerVariant="premium"
      headerIcon={BellRing}
      headerBadge="Monitor financeiro"
      rightAction={
        <Button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="
            relative h-11 rounded-2xl px-5
            border border-sky-400/20
            bg-gradient-to-b from-[#4F8CFF] to-[#3A6FE8]
            text-white font-medium tracking-tight
            shadow-[0_6px_18px_rgba(79,140,255,0.25)]
            transition-transform transition-colors duration-200
            hover:-translate-y-[1px]
            hover:from-[#5A98FF] hover:to-[#4A7CF0]
            hover:shadow-[0_10px_26px_rgba(79,140,255,0.35)]
            active:translate-y-[0px]
            active:shadow-[0_4px_12px_rgba(79,140,255,0.25)]
            disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0
          "
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      }
    >
      <div data-testid="notifications-page" className="space-y-8 lg:space-y-10">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-rose-500/20 bg-neutral-900 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3">
                <AlertTriangle className="h-5 w-5 text-rose-300" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Vencidas
                </p>
                <p className="mt-1 text-3xl font-bold text-rose-300">{summary.overdue}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-neutral-400">
              Parcelas com até 14 dias de atraso.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-500/20 bg-neutral-900 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
                <Clock className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Vence hoje
                </p>
                <p className="mt-1 text-3xl font-bold text-amber-300">{summary.today}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-neutral-400">
              Parcelas que exigem atenção imediata hoje.
            </p>
          </div>

          <div className="rounded-3xl border border-sky-500/20 bg-neutral-900 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3">
                <Calendar className="h-5 w-5 text-sky-300" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Próximas
                </p>
                <p className="mt-1 text-3xl font-bold text-sky-300">{summary.upcoming}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-neutral-400">
              Parcelas com vencimento nos próximos 7 dias.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-50">Filtrar notificações</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Visualize apenas o grupo de parcelas que deseja acompanhar.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterButtons.map((button) => (
                <Button
                  key={button.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilter(button.value)}
                  className={`rounded-2xl ${
                    filter === button.value
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-50'
                  }`}
                >
                  {button.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {filtered.length === 0 ? (
          <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-8 text-center sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10">
              <CheckCircle className="h-7 w-7 text-emerald-300" />
            </div>

            <h3 className="mt-5 text-xl font-bold text-neutral-50">
              Nenhuma notificação encontrada
            </h3>
            <p className="mx-auto mt-2 max-w-2xl text-neutral-400">
              {filter === 'all'
                ? 'No momento não há parcelas vencidas, que vencem hoje ou próximas do vencimento dentro da regra atual.'
                : 'Não existem parcelas nesse filtro no momento. Você pode revisar outra categoria ou acompanhar todas as notificações.'}
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                onClick={() => setFilter('all')}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Ver todas
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/installments')}
                className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
              >
                Ir para parcelas
              </Button>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            {filtered.map((item) => {
              const iconStyles = getIconStyles(item.type);
              const ItemIcon = iconStyles.Icon;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 transition-colors hover:border-neutral-700"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${iconStyles.wrap}`}
                      >
                        <ItemIcon className={`h-5 w-5 ${iconStyles.icon}`} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-neutral-50">
                            {item.title}
                          </h3>
                          <Badge className={`${getBadgeStyles(item.type)} border font-medium`}>
                            {item.label}
                          </Badge>
                        </div>

                        <p className="mt-2 text-sm text-neutral-400">
                          Parcela {item.number}/{item.total_installments} •{' '}
                          {item.customer_name}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-400">
                          <span className="inline-flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-neutral-500" />
                            {formatCurrency(item.updated_amount || item.amount)}
                          </span>

                          <span className="inline-flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-neutral-500" />
                            {format(new Date(`${item.due_date}T00:00:00`), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                      <Button
                        variant="outline"
                        onClick={() => navigate('/installments')}
                        className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                      >
                        Ver parcela
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => handlePay(item.id)}
                        disabled={payingId === item.id}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {payingId === item.id ? 'Registrando...' : 'Marcar como paga'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </AppShell>
  );
};

export default Notifications;