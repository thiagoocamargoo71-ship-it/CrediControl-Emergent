import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API } from '../App';
import AppShell from '../components/AppShell';
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  CreditCard,
  ArrowUpRight,
  Wallet,
  CheckCircle2,
  BarChart3,
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
    }).format(Number(value) || 0);

  const dashboard = useMemo(() => {
    if (!stats) return null;

    const totalLoaned = Number(stats.total_loaned) || 0;
    const totalPending = Number(stats.total_pending) || 0;
    const totalReceived = Number(stats.total_received) || 0;
    const totalWithInterest = Number(stats.total_with_interest) || 0;
    const overdueCount = Number(stats.overdue_count) || 0;
    const customersCount = Number(stats.customers_count) || 0;
    const loansCount = Number(stats.loans_count) || 0;

    const expectedProfit = Math.max(totalWithInterest - totalLoaned, 0);
    const receiptRate =
      totalWithInterest > 0 ? (totalReceived / totalWithInterest) * 100 : 0;
    const pendingRate =
      totalWithInterest > 0 ? (totalPending / totalWithInterest) * 100 : 0;
    const averageTicket =
      loansCount > 0 ? totalLoaned / loansCount : 0;
    const portfolioHealth =
      overdueCount === 0
        ? 'Excelente'
        : overdueCount <= 2
        ? 'Atenção moderada'
        : 'Requer atenção';

    return {
      totalLoaned,
      totalPending,
      totalReceived,
      totalWithInterest,
      overdueCount,
      customersCount,
      loansCount,
      expectedProfit,
      receiptRate,
      pendingRate,
      averageTicket,
      portfolioHealth,
    };
  }, [stats]);

  const getAccentClasses = (variant) => {
    const variants = {
      blue: {
        soft: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
        strong: 'from-blue-500/18 via-blue-500/8 to-transparent',
        text: 'text-blue-400',
        ring: 'ring-blue-500/20',
      },
      emerald: {
        soft: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        strong: 'from-emerald-500/18 via-emerald-500/8 to-transparent',
        text: 'text-emerald-400',
        ring: 'ring-emerald-500/20',
      },
      amber: {
        soft: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
        strong: 'from-amber-500/18 via-amber-500/8 to-transparent',
        text: 'text-amber-400',
        ring: 'ring-amber-500/20',
      },
      rose: {
        soft: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
        strong: 'from-rose-500/18 via-rose-500/8 to-transparent',
        text: 'text-rose-400',
        ring: 'ring-rose-500/20',
      },
    };

    return variants[variant] || variants.blue;
  };

  const PremiumStatCard = ({
    title,
    value,
    description,
    icon: Icon,
    variant = 'blue',
    badge,
  }) => {
    const accent = getAccentClasses(variant);

    return (
      <div className="group relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,22,0.96)_0%,rgba(12,12,16,0.98)_100%)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/12">
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.strong} opacity-100`}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {title}
              </p>
              {badge ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-neutral-300">
                  {badge}
                </span>
              ) : null}
            </div>

            <p className="mt-3 break-words text-[28px] font-bold leading-none tracking-tight text-white">
              {value}
            </p>

            <p className="mt-3 text-sm leading-5 text-neutral-400">
              {description}
            </p>
          </div>

          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border backdrop-blur-sm ${accent.soft}`}
          >
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </div>
        </div>
      </div>
    );
  };

  const InfoCard = ({ title, icon: Icon, children, badge }) => (
    <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,22,0.96)_0%,rgba(12,12,16,0.98)_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            {title}
          </h2>
          {badge ? (
            <p className="mt-1 text-sm text-neutral-400">{badge}</p>
          ) : null}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-neutral-200">
          <Icon className="h-5 w-5" strokeWidth={1.7} />
        </div>
      </div>

      {children}
    </div>
  );

  const MetricRow = ({ label, value, valueClassName = 'text-white' }) => (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/6 bg-black/30 px-4 py-3">
      <span className="text-sm text-neutral-400">{label}</span>
      <span className={`text-sm font-semibold ${valueClassName}`}>{value}</span>
    </div>
  );

  if (loading) {
    return (
      <AppShell
        title="Visão geral da carteira"
        headerVariant="premium"
        headerIcon={LayoutDashboard}
        headerBadge="Dashboard"
      >
        <div className="flex h-72 items-center justify-center">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />
            <div className="absolute inset-2 rounded-full border border-blue-500/20 bg-blue-500/5" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Visão geral da carteira"
      headerVariant="premium"
      headerIcon={LayoutDashboard}
      headerBadge="Dashboard"
    >
      <div data-testid="user-dashboard" className="space-y-8 lg:space-y-10">
        {dashboard && (
          <>
            <section className="relative overflow-hidden rounded-[32px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_28%),linear-gradient(180deg,rgba(15,15,20,0.98)_0%,rgba(9,9,13,1)_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-7">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_20%)]" />

              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  

                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Dashboard premium da sua operação financeira
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400 sm:text-base">
                    Acompanhe capital investido, valor previsto, recebimentos,
                    atrasos e desempenho da carteira com foco nas informações
                    mais importantes.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[520px]">
                  <div className="rounded-2xl border border-white/8 bg-black/30 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                      Saúde da carteira
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {dashboard.portfolioHealth}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/30 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                      Taxa de recebimento
                    </p>
                    <p className="mt-2 text-lg font-semibold text-emerald-400">
                      {dashboard.receiptRate.toFixed(1)}%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/30 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                      Lucro previsto
                    </p>
                    <p className="mt-2 text-lg font-semibold text-blue-400">
                      {formatCurrency(dashboard.expectedProfit)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
              <PremiumStatCard
                title="Capital investido"
                value={formatCurrency(dashboard.totalLoaned)}
                description="Valor principal total liberado aos clientes."
                icon={Wallet}
                variant="blue"
              />

              <PremiumStatCard
                title="Total previsto"
                value={formatCurrency(dashboard.totalWithInterest)}
                description="Valor total esperado ao final dos contratos."
                icon={Clock}
                variant="amber"
              />

              <PremiumStatCard
                title="Total recebido"
                value={formatCurrency(dashboard.totalReceived)}
                description="Pagamentos já confirmados na carteira."
                icon={TrendingUp}
                variant="emerald"
                badge={`${dashboard.receiptRate.toFixed(1)}%`}
              />

              <PremiumStatCard
                title="Em atraso"
                value={dashboard.overdueCount}
                description="Quantidade de parcelas que exigem atenção imediata."
                icon={AlertTriangle}
                variant="rose"
              />
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="xl:col-span-7">
                <InfoCard
                  title="Resumo financeiro"
                  icon={DollarSign}
                  badge="Visão consolidada da operação"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] border border-white/8 bg-black/30 p-5">
                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                        Total a receber
                      </p>
                      <p className="mt-3 text-2xl font-bold tracking-tight text-white">
                        {formatCurrency(dashboard.totalPending)}
                      </p>
                      <p className="mt-2 text-sm text-neutral-400">
                        Saldo ainda pendente de recebimento.
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-white/8 bg-black/30 p-5">
                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                        Lucro esperado
                      </p>
                      <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-400">
                        {formatCurrency(dashboard.expectedProfit)}
                      </p>
                      <p className="mt-2 text-sm text-neutral-400">
                        Diferença entre o total previsto e o capital investido.
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-white/8 bg-black/30 p-5">
                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                        Ticket médio por empréstimo
                      </p>
                      <p className="mt-3 text-2xl font-bold tracking-tight text-white">
                        {formatCurrency(dashboard.averageTicket)}
                      </p>
                      <p className="mt-2 text-sm text-neutral-400">
                        Média do valor emprestado por contrato.
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-white/8 bg-black/30 p-5">
                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                        Percentual pendente
                      </p>
                      <p className="mt-3 text-2xl font-bold tracking-tight text-amber-400">
                        {dashboard.pendingRate.toFixed(1)}%
                      </p>
                      <p className="mt-2 text-sm text-neutral-400">
                        Parte do valor total previsto que ainda falta receber.
                      </p>
                    </div>
                  </div>
                </InfoCard>
              </div>

              <div className="xl:col-span-5">
                <InfoCard
                  title="Saúde da carteira"
                  icon={CheckCircle2}
                  badge="Indicadores rápidos e fáceis de interpretar"
                >
                  <div className="space-y-3">
                    <MetricRow
                      label="Clientes cadastrados"
                      value={dashboard.customersCount}
                    />
                    <MetricRow
                      label="Empréstimos ativos"
                      value={dashboard.loansCount}
                    />
                    <MetricRow
                      label="Taxa de recebimento"
                      value={`${dashboard.receiptRate.toFixed(1)}%`}
                      valueClassName="text-emerald-400"
                    />
                    <MetricRow
                      label="Parcelas atrasadas"
                      value={dashboard.overdueCount}
                      valueClassName={
                        dashboard.overdueCount > 0 ? 'text-rose-400' : 'text-white'
                      }
                    />
                    <MetricRow
                      label="Status geral"
                      value={dashboard.portfolioHealth}
                      valueClassName={
                        dashboard.overdueCount === 0
                          ? 'text-emerald-400'
                          : dashboard.overdueCount <= 2
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }
                    />
                  </div>
                </InfoCard>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,22,0.96)_0%,rgba(12,12,16,0.98)_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-400">
                      Capital emprestado
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                      {formatCurrency(dashboard.totalLoaned)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-400">
                    <DollarSign className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,22,0.96)_0%,rgba(12,12,16,0.98)_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-400">
                      Receita já realizada
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                      {formatCurrency(dashboard.totalReceived)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-400">
                    <ArrowUpRight className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,22,0.96)_0%,rgba(12,12,16,0.98)_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-400">
                      Base operacional
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                      {dashboard.customersCount} clientes
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {dashboard.loansCount} empréstimos registrados
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-neutral-200">
                    <Users className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default UserDashboard;