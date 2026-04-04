import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
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
        tone: 'rose',
      });
    }

    if (homeData.portfolio.installmentsDueToday > 0) {
      items.push({
        title: 'Vencimentos de hoje',
        value:
          homeData.portfolio.installmentsDueToday === 1
            ? '1 parcela vence hoje'
            : `${homeData.portfolio.installmentsDueToday} parcelas vencem hoje`,
        tone: 'amber',
      });
    }

    if (homeData.cashflow.projectedCashStatus === 'pressionado') {
      items.push({
        title: 'Caixa projetado',
        value: 'Operação com pressão no curto prazo',
        tone: 'rose',
      });
    }

    if (homeData.risk.concentrationTopCustomersPercent > 40) {
      items.push({
        title: 'Concentração da carteira',
        value: `${formatPercent(homeData.risk.concentrationTopCustomersPercent)} concentrados nos principais clientes`,
        tone: 'amber',
      });
    }

    if (!items.length) {
      items.push({
        title: 'Sem alerta dominante',
        value: 'A operação não apresenta pressão crítica agora',
        tone: 'emerald',
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
      <div className="min-h-screen bg-neutral-950">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-72 rounded-lg bg-neutral-900" />
            <div className="h-64 rounded-2xl bg-neutral-900 border border-neutral-800" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="h-32 rounded-2xl bg-neutral-900 border border-neutral-800"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="h-80 rounded-2xl bg-neutral-900 border border-neutral-800 xl:col-span-2" />
              <div className="h-80 rounded-2xl bg-neutral-900 border border-neutral-800" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!homeData || !executiveSummary || !statusMeta) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center">
            <Briefcase className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-neutral-50 mb-2">
              Seu dashboard inteligente vai aparecer aqui
            </h1>
            <p className="text-neutral-400 max-w-2xl mx-auto mb-6">
              Assim que você tiver clientes, empréstimos e parcelas cadastrados, o sistema
              começará a montar seu resumo executivo, score da operação e alertas
              inteligentes.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => navigate('/customers')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Cadastrar clientes
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/loans')}
                className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
              >
                Ir para empréstimos
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const statusStyles = getStatusStyles(executiveSummary.status);

  return (
    <div className="min-h-screen bg-neutral-950">
      <Sidebar />

      <main className="ml-64 p-8" data-testid="dashboard-page">
        <div className="flex items-start justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-heading text-3xl font-bold text-neutral-50 tracking-tight">
                Resumo Inteligente
              </h1>
              {refreshing && (
                <span className="text-xs text-neutral-500">Atualizando...</span>
              )}
            </div>
            <p className="text-neutral-400">
              Sua leitura operacional da carteira, do risco e das oportunidades.
            </p>
          </div>

          <Button
            onClick={() => fetchDashboardData(true)}
            variant="outline"
            className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
          >
            Atualizar agora
          </Button>
        </div>

        <section
          className={`relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 mb-6 animate-fade-in`}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${statusStyles.accent} pointer-events-none`}
          />

          <div className="relative p-6 md:p-8">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <div
                    className={`h-11 w-11 rounded-xl border flex items-center justify-center ${statusStyles.iconWrap}`}
                  >
                    <Sparkles className={`h-5 w-5 ${statusStyles.iconColor}`} />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 font-semibold">
                      Resumo Executivo Inteligente
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${statusStyles.badge} border`}>
                        {statusMeta.label}
                      </Badge>
                      <span className="text-sm text-neutral-500">
                        {statusMeta.description}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-neutral-50 text-lg leading-8 max-w-4xl">
                  {executiveSummary.headline}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4">
                    <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                      Recebimentos 7 dias
                    </p>
                    <p className="text-xl font-mono font-bold text-neutral-50">
                      {formatCurrency(executiveSummary.metrics.expectedReceipts7d)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4">
                    <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                      Inadimplência
                    </p>
                    <p className="text-xl font-mono font-bold text-neutral-50">
                      {formatPercent(executiveSummary.metrics.delinquencyRate)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4">
                    <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                      Clientes em risco
                    </p>
                    <p className="text-xl font-mono font-bold text-neutral-50">
                      {executiveSummary.metrics.riskyClients}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                      Ação recomendada
                    </p>
                    <p className="text-neutral-200">{executiveSummary.recommendedAction}</p>
                  </div>

                  <Button
                    onClick={quickAction.onClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 self-start lg:self-auto"
                  >
                    {quickAction.label}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="xl:w-[260px]">
                <div
                  className={`rounded-2xl border p-5 ${statusStyles.score} backdrop-blur-sm`}
                >
                  <p className="text-xs uppercase tracking-[0.18em] font-semibold opacity-80">
                    Score da operação
                  </p>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-5xl font-bold leading-none">
                      {executiveSummary.score}
                    </span>
                    <span className="text-base opacity-80 mb-1">/100</span>
                  </div>
                  <p className="mt-3 text-sm opacity-90">
                    {statusMeta.description}
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-wider opacity-70">
                        Caixa projetado
                      </p>
                      <p className="mt-1 font-semibold capitalize">
                        {homeData.cashflow.projectedCashStatus}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
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

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  Total emprestado
                </p>
                <p className="mt-2 text-2xl font-mono font-bold text-neutral-50">
                  {formatCurrency(homeData.portfolio.totalLoaned)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <CircleDollarSign className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  Em aberto
                </p>
                <p className="mt-2 text-2xl font-mono font-bold text-neutral-50">
                  {formatCurrency(homeData.portfolio.totalOpenBalance)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <CreditCard className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  A receber em 7 dias
                </p>
                <p className="mt-2 text-2xl font-mono font-bold text-neutral-50">
                  {formatCurrency(homeData.cashflow.expectedNext7Days)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  Clientes ativos
                </p>
                <p className="mt-2 text-2xl font-mono font-bold text-neutral-50">
                  {homeData.portfolio.activeCustomers}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <Users className="h-5 w-5 text-violet-400" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <ShieldAlert className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-50">Alertas do sistema</h2>
                  <p className="text-sm text-neutral-400">
                    Pontos que merecem atenção imediata na operação
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alertItems.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
                  >
                    <p className="text-sm font-semibold text-neutral-100">{item.title}</p>
                    <p className="text-sm text-neutral-400 mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-50">Oportunidades</h2>
                  <p className="text-sm text-neutral-400">
                    Espaços de crescimento e ação comercial com mais segurança
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunityItems.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
                  >
                    <p className="text-sm font-semibold text-neutral-100">{item.title}</p>
                    <p className="text-sm text-neutral-400 mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
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
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                  <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Score geral
                  </p>
                  <p className="mt-2 text-3xl font-bold text-neutral-50">
                    {executiveSummary.score}
                    <span className="text-neutral-500 text-lg">/100</span>
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                  <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Inadimplência
                  </p>
                  <p className="mt-2 text-xl font-mono font-bold text-neutral-50">
                    {formatPercent(homeData.portfolio.delinquencyRate)}
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                  <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Caixa projetado
                  </p>
                  <p className="mt-2 text-xl font-semibold capitalize text-neutral-50">
                    {homeData.cashflow.projectedCashStatus}
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                  <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Parcelas em atraso
                  </p>
                  <p className="mt-2 text-xl font-bold text-neutral-50">
                    {homeData.portfolio.overdueInstallments}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
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
                  className="w-full text-left rounded-xl border border-neutral-800 bg-neutral-950 p-4 hover:bg-neutral-900 transition-colors"
                >
                  <p className="text-sm font-semibold text-neutral-100">Parcelas</p>
                  <p className="text-sm text-neutral-400 mt-1">
                    Acompanhe vencimentos, atrasos e pagamentos
                  </p>
                </button>

                <button
                  onClick={() => navigate('/loans')}
                  className="w-full text-left rounded-xl border border-neutral-800 bg-neutral-950 p-4 hover:bg-neutral-900 transition-colors"
                >
                  <p className="text-sm font-semibold text-neutral-100">Empréstimos</p>
                  <p className="text-sm text-neutral-400 mt-1">
                    Revise a carteira e a concentração por cliente
                  </p>
                </button>

                <button
                  onClick={() => navigate('/customers')}
                  className="w-full text-left rounded-xl border border-neutral-800 bg-neutral-950 p-4 hover:bg-neutral-900 transition-colors"
                >
                  <p className="text-sm font-semibold text-neutral-100">Clientes</p>
                  <p className="text-sm text-neutral-400 mt-1">
                    Analise perfis, bons pagadores e novas oportunidades
                  </p>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;