import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
} from 'lucide-react';

const formatCurrency = (value) => {
  const number = Number(value || 0);

  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('pt-BR');
};

const formatDateTime = (value) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('pt-BR');
};

const formatStatus = (status) => {
  const map = {
    created: 'Criada',
    sent: 'Enviada',
    visualized: 'Visualizada',
    responded: 'Respondida',
  };

  return map[status] || status || 'Sem status';
};

const statusClassName = (status) => {
  if (status === 'sent') {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  }

  if (status === 'visualized') {
    return 'border-blue-500/20 bg-blue-500/10 text-blue-300';
  }

  if (status === 'responded') {
    return 'border-purple-500/20 bg-purple-500/10 text-purple-300';
  }

  return 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300';
};

const onlyNumbers = (value) => String(value || '').replace(/\D/g, '');

const buildWhatsAppUrl = (row) => {
  const phone = onlyNumbers(row.customer_phone);

  const message = `Olá, ${row.customer_name}. Aqui é a CrediControl, prestadora de serviço responsável pela administração de cobrança do credor ${row.creditor_name}.

Identificamos uma parcela em atraso:

Parcela: ${row.number}/${row.total_installments}
Vencimento: ${formatDate(row.due_date)}
Dias em atraso: ${row.days_overdue}
Valor atualizado: ${formatCurrency(row.updated_amount)}

Por favor, entre em contato para regularização.`;

  return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
};

const AdminCollections = () => {
  const [overdueInstallments, setOverdueInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const loadOverdueInstallments = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API}/admin/installments/overdue`);
      setOverdueInstallments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Não foi possível carregar as parcelas vencidas.');
      setOverdueInstallments([]);
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (row) => {
    setSelectedInstallment(row);
    setTimeline([]);
    setLoadingTimeline(true);

    try {
      const response = await axios.get(
        `${API}/admin/installments/${row.installment_id}/collection-messages`
      );

      setTimeline(Array.isArray(response.data?.messages) ? response.data.messages : []);
    } catch (err) {
      console.error('Erro ao carregar histórico de cobranças', err);
      setTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const closeDetails = () => {
    setSelectedInstallment(null);
    setTimeline([]);
    setLoadingTimeline(false);
  };

  useEffect(() => {
    loadOverdueInstallments();
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return overdueInstallments;

    return overdueInstallments.filter((row) => (
      row.customer_name?.toLowerCase().includes(term) ||
      row.customer_phone?.toLowerCase().includes(term) ||
      row.creditor_name?.toLowerCase().includes(term) ||
      row.creditor_email?.toLowerCase().includes(term)
    ));
  }, [overdueInstallments, search]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.count += 1;
        acc.amount += Number(row.updated_amount || 0);

        if (Number(row.days_overdue || 0) > acc.maxDelay) {
          acc.maxDelay = Number(row.days_overdue || 0);
        }

        return acc;
      },
      { count: 0, amount: 0, maxDelay: 0 }
    );
  }, [filteredRows]);

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <Sidebar />

      <main className="min-h-screen px-4 py-6 lg:ml-[276px] lg:px-8">
        <section className="relative mb-7 overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.25),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(7,7,10,0.98)_55%,rgba(20,12,32,0.95))] p-7 shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative z-10 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-300">
            <ShieldCheck className="h-4 w-4" />
            Admin Control
          </div>

          <div className="relative z-10 mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                Central de Cobranças
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-400">
                Monitore parcelas vencidas de todos os credores, acompanhe valores atualizados
                e acione clientes em atraso com uma mensagem direta pelo WhatsApp.
              </p>
            </div>

            <button
              type="button"
              onClick={loadOverdueInstallments}
              disabled={loading}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 px-6 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(37,99,235,0.35)] transition hover:scale-[1.01] hover:from-blue-400 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar cobranças
            </button>
          </div>
        </section>

        <section className="mb-7 grid gap-4 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(30,64,175,0.18),rgba(255,255,255,0.035))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="absolute right-5 top-5 rounded-2xl border border-blue-400/20 bg-blue-400/10 p-3 text-blue-300">
              <WalletCards className="h-5 w-5" />
            </div>
            <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">Parcelas vencidas</p>
            <p className="mt-5 text-4xl font-semibold text-white">{totals.count}</p>
            <p className="mt-2 text-sm text-neutral-500">Registros pendentes de cobrança.</p>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(255,255,255,0.035))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="absolute right-5 top-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-300">
              <Banknote className="h-5 w-5" />
            </div>
            <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">Valor atualizado</p>
            <p className="mt-5 text-3xl font-semibold text-white">{formatCurrency(totals.amount)}</p>
            <p className="mt-2 text-sm text-neutral-500">Total filtrado em aberto.</p>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(239,68,68,0.14),rgba(255,255,255,0.035))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="absolute right-5 top-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-red-300">
              <CalendarClock className="h-5 w-5" />
            </div>
            <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">Maior atraso</p>
            <p className="mt-5 text-4xl font-semibold text-white">{totals.maxDelay}</p>
            <p className="mt-2 text-sm text-neutral-500">Dias de atraso no filtro atual.</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-neutral-300">
                <Sparkles className="h-4 w-4 text-blue-300" />
                Gestão de inadimplência
              </div>
              <h2 className="mt-3 text-xl font-semibold text-white">Fila de cobranças</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Selecione uma cobrança e acione o cliente pelo WhatsApp.
              </p>
            </div>

            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente, telefone ou credor..."
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 pl-11 pr-4 text-sm text-white outline-none placeholder:text-neutral-600 transition focus:border-blue-500/60 focus:bg-black/35"
              />
            </div>
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-white/8 bg-black/20 text-sm text-neutral-400">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Carregando parcelas vencidas...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-white/8 bg-black/20 text-center">
              <AlertTriangle className="mb-3 h-9 w-9 text-neutral-600" />
              <p className="text-sm font-medium text-neutral-300">Nenhuma parcela vencida encontrada.</p>
              <p className="mt-1 text-xs text-neutral-600">Altere a busca ou atualize os dados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="hidden grid-cols-[1.3fr_1.2fr_1fr_0.7fr_0.9fr_0.8fr_1fr_1.25fr] px-4 text-xs uppercase tracking-[0.2em] text-neutral-600 xl:grid">
                <div>Credor</div>
                <div>Cliente</div>
                <div>Telefone</div>
                <div>Parcela</div>
                <div>Vencimento</div>
                <div>Atraso</div>
                <div>Valor</div>
                <div className="text-right">Ação</div>
              </div>

              {filteredRows.map((row) => (
                <div
                  key={row.installment_id}
                  className="grid gap-4 rounded-[26px] border border-white/8 bg-black/25 p-4 text-sm text-neutral-200 shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition hover:border-blue-400/25 hover:bg-white/[0.045] xl:grid-cols-[1.3fr_1.2fr_1fr_0.7fr_0.9fr_0.8fr_1fr_1.25fr] xl:items-center"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 xl:hidden">Credor</p>
                    <div className="font-semibold text-white">{row.creditor_name}</div>
                    <div className="mt-1 text-xs text-neutral-500">{row.creditor_email}</div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 xl:hidden">Cliente</p>
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-blue-300">
                        <UserRound className="h-4 w-4" />
                      </span>
                      {row.customer_name}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 xl:hidden">Telefone</p>
                    <span className="text-neutral-300">{row.customer_phone}</span>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 xl:hidden">Parcela</p>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-neutral-300">
                      {row.number}/{row.total_installments}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 xl:hidden">Vencimento</p>
                    <span>{formatDate(row.due_date)}</span>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 xl:hidden">Atraso</p>
                    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                      {row.days_overdue} dias
                    </span>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-600 xl:hidden">Valor</p>
                    <span className="text-base font-semibold text-white">
                      {formatCurrency(row.updated_amount)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end xl:text-right">
                    <button
                      type="button"
                      onClick={() => openDetails(row)}
                      className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 text-sm font-semibold text-blue-300 shadow-[0_16px_35px_rgba(59,130,246,0.12)] transition hover:scale-[1.01] hover:border-blue-400/40 hover:bg-blue-500/20 xl:w-auto"
                    >
                      Detalhes
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const response = await axios.post(
                            `${API}/admin/installments/${row.installment_id}/collection-message`
                          );

                          const data = response.data;

                          if (data?.whatsapp_url) {
                            window.open(data.whatsapp_url, '_blank');

                            if (data?.message_id) {
                              await axios.post(
                                `${API}/admin/collection-messages/${data.message_id}/mark-as-sent`
                              );
                            }
                          }
                        } catch (err) {
                          console.error('Erro ao criar mensagem', err);

                          const fallbackUrl = buildWhatsAppUrl(row);

                          if (fallbackUrl) {
                            window.open(fallbackUrl, '_blank');
                          } else {
                            alert('Erro ao gerar mensagem de cobrança');
                          }
                        }
                      }}
                      className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(16,185,129,0.25)] transition hover:scale-[1.01] hover:from-emerald-400 hover:to-emerald-600 xl:w-auto"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {selectedInstallment ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
            <div className="relative max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,20,26,0.98),rgba(7,7,10,0.98))] shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
              <div className="absolute -bottom-24 left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="relative z-10 flex items-start justify-between gap-4 border-b border-white/10 p-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-medium text-blue-300">
                    <Sparkles className="h-4 w-4" />
                    Timeline de cobrança
                  </div>

                  <h3 className="mt-3 text-2xl font-semibold text-white">
                    {selectedInstallment.customer_name}
                  </h3>

                  <p className="mt-1 text-sm text-neutral-500">
                    Parcela {selectedInstallment.number}/{selectedInstallment.total_installments} • Credor {selectedInstallment.creditor_name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-neutral-400 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
                >
                  ×
                </button>
              </div>

              <div className="relative z-10 max-h-[calc(88vh-110px)] overflow-y-auto p-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-600">Telefone</p>
                    <p className="mt-2 text-sm font-semibold text-white">{selectedInstallment.customer_phone}</p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-600">Vencimento</p>
                    <p className="mt-2 text-sm font-semibold text-white">{formatDate(selectedInstallment.due_date)}</p>
                  </div>

                  <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-red-300/70">Atraso</p>
                    <p className="mt-2 text-sm font-semibold text-red-300">{selectedInstallment.days_overdue} dias</p>
                  </div>

                  <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/70">Valor atualizado</p>
                    <p className="mt-2 text-sm font-semibold text-emerald-300">
                      {formatCurrency(selectedInstallment.updated_amount)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-black/25 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-white">Resumo do empréstimo</h4>
                      <p className="mt-1 text-sm text-neutral-500">
                        Informações relacionadas à parcela em atraso.
                      </p>
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-neutral-300">
                      Parcela {selectedInstallment.number}/{selectedInstallment.total_installments}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-600">Valor original</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {formatCurrency(selectedInstallment.amount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-600">Valor atualizado</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {formatCurrency(selectedInstallment.updated_amount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-600">ID da parcela</p>
                      <p className="mt-1 break-all text-xs font-medium text-neutral-400">
                        {selectedInstallment.installment_id}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-black/25 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-white">Histórico de cobranças</h4>
                      <p className="mt-1 text-sm text-neutral-500">
                        Registros gerados para esta parcela.
                      </p>
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-neutral-400">
                      {timeline.length} registro(s)
                    </span>
                  </div>

                  {loadingTimeline ? (
                    <div className="flex min-h-[160px] items-center justify-center rounded-3xl border border-white/8 bg-black/20 text-sm text-neutral-400">
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Carregando timeline...
                    </div>
                  ) : timeline.length === 0 ? (
                    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-3xl border border-white/8 bg-black/20 text-center">
                      <AlertTriangle className="mb-3 h-8 w-8 text-neutral-600" />
                      <p className="text-sm font-medium text-neutral-300">Nenhuma cobrança registrada ainda.</p>
                      <p className="mt-1 text-xs text-neutral-600">
                        Clique em WhatsApp para gerar o primeiro registro.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {timeline.map((message) => (
                        <div
                          key={message.id}
                          className="rounded-3xl border border-white/10 bg-white/[0.035] p-4"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClassName(message.status)}`}>
                                {formatStatus(message.status)}
                              </span>

                              <p className="mt-2 text-xs text-neutral-500">
                                Criada em {formatDateTime(message.created_at)}
                              </p>

                              {message.sent_at ? (
                                <p className="mt-1 text-xs text-emerald-300">
                                  Enviada em {formatDateTime(message.sent_at)}
                                </p>
                              ) : null}
                            </div>

                            <div className="text-xs text-neutral-500">
                              Canal: {message.channel || 'whatsapp'}
                            </div>
                          </div>

                          <div className="mt-4 whitespace-pre-line rounded-2xl border border-white/8 bg-black/30 p-4 text-sm leading-6 text-neutral-300">
                            {message.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeDetails}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-neutral-300 transition hover:bg-white/[0.08]"
                  >
                    Fechar
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await axios.post(
                          `${API}/admin/installments/${selectedInstallment.installment_id}/collection-message`
                        );

                        const data = response.data;

                        if (data?.whatsapp_url) {
                          window.open(data.whatsapp_url, '_blank');

                          if (data?.message_id) {
                            await axios.post(
                              `${API}/admin/collection-messages/${data.message_id}/mark-as-sent`
                            );
                          }

                          await openDetails(selectedInstallment);
                        }
                      } catch (err) {
                        console.error('Erro ao criar mensagem pelo modal', err);
                        alert('Erro ao gerar mensagem de cobrança');
                      }
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(16,185,129,0.25)] transition hover:scale-[1.01] hover:from-emerald-400 hover:to-emerald-600"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Cobrar novamente
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default AdminCollections;