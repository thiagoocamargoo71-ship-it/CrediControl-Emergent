import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  Gauge,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { buildDashboardHomeData } from '../utils/buildDashboardHomeData';
import {
  buildExecutiveSummary,
  getExecutiveStatusMeta,
} from '../utils/buildExecutiveSummary';

const Dashboard = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [customerStatuses, setCustomerStatuses] = useState({});
  const [loans, setLoans] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [installmentStats, setInstallmentStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isBackgroundRefresh = false) => {
    try {
      if (isBackgroundRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [customersRes, loansRes, installmentsRes, statsRes] = await Promise.all([
        axios.get(`${API}/customers`),
        axios.get(`${API}/loans`),
        axios.get(`${API}/installments`),
        axios.get(`${API}/installments/stats`),
      ]);

      const customersData = customersRes.data || [];
      setCustomers(customersData);
      setLoans(loansRes.data || []);
      setInstallments(installmentsRes.data || []);
      setInstallmentStats(statsRes.data || null);

      const statusEntries = await Promise.all(
        customersData.map(async (customer) => {
          try {
            const statusRes = await axios.get(`${API}/customers/${customer.id}/status`);
            return [customer.id, statusRes.data];
          } catch (error) {
            return [customer.id, { status: 'no_loans', label: 'Sem Empréstimo' }];
          }
        })
      );

      setCustomerStatuses(Object.fromEntries(statusEntries));
    } catch (error) {
      toast.error('Erro ao carregar o dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const homeData = useMemo(() => {
    if (!customers.length && !loans.length && !installments.length) return null;

    return buildDashboardHomeData({
      customers,
      customerStatuses,
      loans,
      installments,
      installmentStats,
    });
  }, [customers, customerStatuses, loans, installments, installmentStats]);

  const executiveSummary = useMemo(() => {
    if (!homeData) return null;
    return buildExecutiveSummary(homeData);
  }, [homeData]);

  const statusMeta = useMemo(() => {
    if (!executiveSummary) return null;
    return getExecutiveStatusMeta(executiveSummary.status);
  }, [executiveSummary]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value || 0));

  const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

  const getStatusStyles = (status) => {
    const styles = {
      saudavel: {
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        score: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
        accent: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
        iconWrap: 'bg-emerald-500/10 border-emerald-500/20',
        iconColor: 'text-emerald-400',
      },
      estavel: {
        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        score: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
        accent: 'from-blue-500/10 via-blue-500/5 to-transparent',
        iconWrap: 'bg-blue-500/10 border-blue-500/20',
        iconColor: 'text-blue-400',
      },
      atencao: {
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        score: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
        accent: 'from-amber-500/10 via-amber-500/5 to-transparent',
        iconWrap: 'bg-amber-500/10 border-amber-500/20',
        iconColor: 'text-amber-400',
      },
      critico: {
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        score: 'text-rose-400 border-rose-500/20 bg-rose-500/10',
        accent: 'from-rose-500/10 via-rose-500/5 to-transparent',
        iconWrap: 'bg-rose-500/10 border-rose-500/20',
        iconColor: 'text-rose-400',
      },
    };

    return styles[status] || styles.estavel;
  };

  const getQuickActionConfig = () => {
    if (!homeData || !executiveSummary) {
      return {
        label: 'Ver operação',
        onClick: () => navigate('/installments'),
      };
    }

    switch (homeData.risk.mainRiskType) {
      case 'atraso_critico':
        return {
          label: 'Ir para cobranças',
          onClick: () => navigate('/installments'),
        };

      case 'vencimentos_hoje':
        return {
          label: 'Ver vencimentos',
          onClick: () => navigate('/installments'),
        };

      case 'concentracao':
        return {
          label: 'Analisar carteira',
          onClick: () => navigate('/loans'),
        };

      case 'caixa':
        return {
          label: 'Ver parcelas',
          onClick: () => navigate('/installments'),
        };

      default:
        if (homeData.opportunity.mainOpportunityType === 'novas_concessoes') {
          return {
            label: 'Ver oportunidades',
            onClick: () => navigate('/customers'),
          };
        }

        return {
          label: 'Ver operação',
          onClick: () => navigate('/loans'),
        };
    }
  };

  const getAlertItems = () => {
    if (!homeData || !executiveSummary) return [];

    const items = [];

    if (homeData.risk.criticalRiskCustomers > 0) {
      items.push({
        title: 'Clientes em atraso crítico',
        value:
          homeData.risk.criticalRiskCustomers === 1
            ? '1 cliente exige ação imediata'
            : `${homeData.risk.criticalRiskCustomers} clientes exigem ação imediata`,
      });
    }

    if (homeData.portfolio.installmentsDueToday > 0) {
      items.push({
        title: 'Vencimentos de hoje',
        value:
          homeData.portfolio.installmentsDueToday === 1
            ? '1 parcela vence hoje'
            : `${homeData.portfolio.installmentsDueToday} parcelas vencem hoje`,
      });
    }

    if (homeData.cashflow.projectedCashStatus === 'pressionado') {
      items.push({
        title: 'Caixa projetado',
        value: 'Operação com pressão no curto prazo',
      });
    }

    if (homeData.risk.concentrationTopCustomersPercent > 40) {
      items.push({
        title: 'Concentração da carteira',
        value: `${formatPercent(homeData.risk.concentrationTopCustomersPercent)} concentrados nos principais clientes`,
      });
    }

    if (!items.length) {
      items.push({
        title: 'Sem alerta dominante',
        value: 'A operação não apresenta pressão crítica agora',
      });
    }

    return items.slice(0, 4);
  };

  const getOpportunityItems = () => {
    if (!homeData) return [];

    const items = [];

    if (homeData.opportunity.eligibleForNewCredit > 0) {
      items.push({
        title: 'Clientes aptos para novo crédito',
        value:
          homeData.opportunity.eligibleForNewCredit === 1
            ? '1 cliente elegível'
            : `${homeData.opportunity.eligibleForNewCredit} clientes elegíveis`,
      });
    }

    if (homeData.opportunity.goodPayers > 0) {
      items.push({
        title: 'Bons pagadores',
        value:
          homeData.opportunity.goodPayers === 1
            ? '1 cliente com bom histórico'
            : `${homeData.opportunity.goodPayers} clientes com bom histórico`,
      });
    }

    if (homeData.opportunity.customersFinishingLoansSoon > 0) {
      items.push({
        title: 'Clientes encerrando operações',
        value:
          homeData.opportunity.customersFinishingLoansSoon === 1
            ? '1 cliente perto de finalizar empréstimo'
            : `${homeData.opportunity.customersFinishingLoansSoon} clientes perto de finalizar empréstimo`,
      });
    }

    if (!items.length) {
      items.push({
        title: 'Foco em preservação',
        value: 'O melhor movimento agora é manter a carteira saudável',
      });
    }

    return items.slice(0, 4);
  };

  const quickAction = getQuickActionConfig();
  const alertItems = getAlertItems();
  const opportunityItems = getOpportunityItems();

  if (loading) {
    return (
      <AppShell
        title="Resumo Inteligente"
        subtitle="Sua leitura operacional da carteira, do risco e das oportunidades."
      >
        <div className="animate-pulse space-y-5 sm:space-y-6">
          <div className="h-8 w-56 rounded-lg bg-neutral-900 sm:h-10 sm:w-72" />
          <div className="h-72 rounded-3xl border border-neutral-800 bg-neutral-900" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="h-32 rounded-3xl border border-neutral-800 bg-neutral-900"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="h-80 rounded-3xl border border-neutral-800 bg-neutral-900 xl:col-span-2" />
            <div className="h-80 rounded-3xl border border-neutral-800 bg-neutral-900" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!homeData || !executiveSummary || !statusMeta) {
    return (
      <AppShell
        title="Resumo Inteligente"
        subtitle="Sua leitura operacional da carteira, do risco e das oportunidades."
      >
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 text-center sm:p-8 lg:p-10">
          <Briefcase className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
          <h1 className="mb-2 text-2xl font-bold text-neutral-50">
            Seu dashboard inteligente vai aparecer aqui
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-neutral-400">
            Assim que você tiver clientes, empréstimos e parcelas cadastrados, o sistema
            começará a montar seu resumo executivo, score da operação e alertas inteligentes.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={() => navigate('/customers')}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
            >
              Cadastrar clientes
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/loans')}
              className="w-full border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 sm:w-auto"
            >
              Ir para empréstimos
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const statusStyles = getStatusStyles(executiveSummary.status);

  return (
    <AppShell
      title="Resumo Inteligente"
      subtitle="Sua leitura operacional da carteira, do risco e das oportunidades."
     
      rightAction={
  <Button
    onClick={() => fetchDashboardData(true)}
    disabled={refreshing}
    variant="outline"
    className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
  >
    {refreshing ? 'Atualizando...' : 'Atualizar'}
  </Button>
}
    >
      <div data-testid="dashboard-page">
        
        {/* Header mobile status */}
        <div className="mb-4 lg:hidden">
          {refreshing && <span className="text-xs text-neutral-500">Atualizando...</span>}
        </div>

        <section className="relative mb-6 overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 animate-fade-in">
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${statusStyles.accent}`}
          />

          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex-1">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border ${statusStyles.iconWrap}`}
                  >
                    <Sparkles className={`h-5 w-5 ${statusStyles.iconColor}`} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Resumo Executivo Inteligente
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge className={`${statusStyles.badge} border`}>
                        {statusMeta.label}
                      </Badge>
                      <span className="text-sm text-neutral-500">
                        {statusMeta.description}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="max-w-4xl text-base leading-7 text-neutral-50 sm:text-lg sm:leading-8">
                  {executiveSummary.headline}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Recebimentos 7 dias
                    </p>
                    <p className="break-words text-xl font-bold text-neutral-50 sm:text-2xl">
                      {formatCurrency(executiveSummary.metrics.expectedReceipts7d)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Inadimplência
                    </p>
                    <p className="text-xl font-bold text-neutral-50 sm:text-2xl">
                      {formatPercent(executiveSummary.metrics.delinquencyRate)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Clientes em risco
                    </p>
                    <p className="text-xl font-bold text-neutral-50 sm:text-2xl">
                      {executiveSummary.metrics.riskyClients}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Ação recomendada
                    </p>
                    <p className="text-neutral-200">{executiveSummary.recommendedAction}</p>
                  </div>

                  <Button
                    onClick={quickAction.onClick}
                    className="h-11 w-full gap-2 self-start bg-blue-600 text-white hover:bg-blue-700 sm:w-auto lg:self-auto"
                  >
                    {quickAction.label}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="xl:w-[280px]">
                <div
                  className={`rounded-3xl border p-5 backdrop-blur-sm ${statusStyles.score}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                    Score da operação
                  </p>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-5xl font-bold leading-none">
                      {executiveSummary.score}
                    </span>
                    <span className="mb-1 text-base opacity-80">/100</span>
                  </div>
                  <p className="mt-3 text-sm opacity-90">{statusMeta.description}</p>

                  <div className="mt-5 grid grid-cols-1 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-wider opacity-70">
                        Caixa projetado
                      </p>
                      <p className="mt-1 font-semibold capitalize">
                        {homeData.cashflow.projectedCashStatus}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-wider opacity-70">
                        Concentração
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatPercent(homeData.risk.concentrationTopCustomersPercent)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 animate-fade-in">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Total emprestado
                </p>
                <p className="mt-2 break-words text-2xl font-bold text-neutral-50">
                  {formatCurrency(homeData.portfolio.totalLoaned)}
                </p>
              </div>
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
                <CircleDollarSign className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Em aberto
                </p>
                <p className="mt-2 break-words text-2xl font-bold text-neutral-50">
                  {formatCurrency(homeData.portfolio.totalOpenBalance)}
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                <CreditCard className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  A receber em 7 dias
                </p>
                <p className="mt-2 break-words text-2xl font-bold text-neutral-50">
                  {formatCurrency(homeData.cashflow.expectedNext7Days)}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Clientes ativos
                </p>
                <p className="mt-2 text-2xl font-bold text-neutral-50">
                  {homeData.portfolio.activeCustomers}
                </p>
              </div>
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3">
                <Users className="h-5 w-5 text-violet-400" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3 animate-fade-in">
          <div className="space-y-6 xl:col-span-2">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                  <ShieldAlert className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-50">Alertas do sistema</h2>
                  <p className="text-sm text-neutral-400">
                    Pontos que merecem atenção imediata na operação
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {alertItems.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4"
                  >
                    <p className="text-sm font-semibold text-neutral-100">{item.title}</p>
                    <p className="mt-1 text-sm text-neutral-400">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-50">Oportunidades</h2>
                  <p className="text-sm text-neutral-400">
                    Espaços de crescimento e ação comercial com mais segurança
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {opportunityItems.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4"
                  >
                    <p className="text-sm font-semibold text-neutral-100">{item.title}</p>
                    <p className="mt-1 text-sm text-neutral-400">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <Gauge className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-50">Saúde do sistema</h2>
                  <p className="text-sm text-neutral-400">
                    Leitura resumida da operação atual
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Score geral
                  </p>
                  <p className="mt-2 text-3xl font-bold text-neutral-50">
                    {executiveSummary.score}
                    <span className="text-lg text-neutral-500">/100</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Inadimplência
                  </p>
                  <p className="mt-2 text-xl font-bold text-neutral-50">
                    {formatPercent(homeData.portfolio.delinquencyRate)}
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Caixa projetado
                  </p>
                  <p className="mt-2 text-xl font-semibold capitalize text-neutral-50">
                    {homeData.cashflow.projectedCashStatus}
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Parcelas em atraso
                  </p>
                  <p className="mt-2 text-xl font-bold text-neutral-50">
                    {homeData.portfolio.overdueInstallments}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                  <CalendarClock className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-50">Próximos passos</h2>
                  <p className="text-sm text-neutral-400">
                    Ação direta para o momento atual
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/installments')}
                  className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-left transition-colors hover:bg-neutral-900"
                >
                  <p className="text-sm font-semibold text-neutral-100">Parcelas</p>
                  <p className="mt-1 text-sm text-neutral-400">
                    Acompanhe vencimentos, atrasos e pagamentos
                  </p>
                </button>

                <button
                  onClick={() => navigate('/loans')}
                  className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-left transition-colors hover:bg-neutral-900"
                >
                  <p className="text-sm font-semibold text-neutral-100">Empréstimos</p>
                  <p className="mt-1 text-sm text-neutral-400">
                    Revise a carteira e a concentração por cliente
                  </p>
                </button>

                <button
                  onClick={() => navigate('/customers')}
                  className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-left transition-colors hover:bg-neutral-900"
                >
                  <p className="text-sm font-semibold text-neutral-100">Clientes</p>
                  <p className="mt-1 text-sm text-neutral-400">
                    Analise perfis, bons pagadores e novas oportunidades
                  </p>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Dashboard;