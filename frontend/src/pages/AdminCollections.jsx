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
                Central Premium de Cobranças
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
              <div className="hidden grid-cols-[1.3fr_1.2fr_1fr_0.7fr_0.9fr_0.8fr_1fr_0.9fr] px-4 text-xs uppercase tracking-[0.2em] text-neutral-600 xl:grid">
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
                  className="grid gap-4 rounded-[26px] border border-white/8 bg-black/25 p-4 text-sm text-neutral-200 shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition hover:border-blue-400/25 hover:bg-white/[0.045] xl:grid-cols-[1.3fr_1.2fr_1fr_0.7fr_0.9fr_0.8fr_1fr_0.9fr] xl:items-center"
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

                  <div className="xl:text-right">
                    <a
                      href={buildWhatsAppUrl(row)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(16,185,129,0.25)] transition hover:scale-[1.01] hover:from-emerald-400 hover:to-emerald-600 xl:w-auto"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminCollections;