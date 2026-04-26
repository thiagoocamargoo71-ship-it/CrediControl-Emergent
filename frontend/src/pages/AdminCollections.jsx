import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import {
  AlertTriangle,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';

const formatCurrency = (value) => {
  const number = Number(value || 0);

  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const onlyNumbers = (value) => String(value || '').replace(/\D/g, '');

const buildWhatsAppUrl = (row) => {
  const phone = onlyNumbers(row.customer_phone);

  const message = `Olá, ${row.customer_name}. Aqui é a CrediControl, prestadora de serviço responsável pela administração de cobrança do credor ${row.creditor_name}.

Identificamos uma parcela em atraso:

Parcela: ${row.number}/${row.total_installments}
Vencimento: ${row.due_date}
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

    return overdueInstallments.filter((row) => {
      return (
        row.customer_name?.toLowerCase().includes(term) ||
        row.customer_phone?.toLowerCase().includes(term) ||
        row.creditor_name?.toLowerCase().includes(term) ||
        row.creditor_email?.toLowerCase().includes(term)
      );
    });
  }, [overdueInstallments, search]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.count += 1;
        acc.amount += Number(row.updated_amount || 0);
        return acc;
      },
      { count: 0, amount: 0 }
    );
  }, [filteredRows]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Sidebar />

      <main className="min-h-screen px-4 py-6 lg:ml-[276px] lg:px-8">
        <section className="mb-6 rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(8,8,12,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-300">
            <ShieldCheck className="h-4 w-4" />
            Admin Control
          </div>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">
                Central de Cobranças
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
                Visualize parcelas vencidas de todos os credores, selecione clientes em atraso
                e envie mensagens de cobrança pelo WhatsApp.
              </p>
            </div>

            <button
             type="button"
             onClick={loadOverdueInstallments}
             disabled={loading}
             className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
           >
             <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
             Atualizar
           </button>
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">
              Parcelas vencidas
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">{totals.count}</p>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">
              Valor total atualizado
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {formatCurrency(totals.amount)}
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/8 bg-neutral-950/70 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por cliente, telefone ou credor..."
                className="h-11 w-full rounded-2xl border border-white/8 bg-white/[0.03] pl-11 pr-4 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-blue-500/50"
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-neutral-400">
              Carregando parcelas vencidas...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/[0.02] text-center">
              <AlertTriangle className="mb-3 h-8 w-8 text-neutral-600" />
              <p className="text-sm text-neutral-400">Nenhuma parcela vencida encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-neutral-500">
                    <th className="px-4 py-3">Credor</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Telefone</th>
                    <th className="px-4 py-3">Parcela</th>
                    <th className="px-4 py-3">Vencimento</th>
                    <th className="px-4 py-3">Atraso</th>
                    <th className="px-4 py-3">Valor</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={row.installment_id}
                      className="rounded-2xl border border-white/8 bg-white/[0.035] text-sm text-neutral-200"
                    >
                      <td className="rounded-l-2xl px-4 py-4">
                        <div className="font-medium text-white">{row.creditor_name}</div>
                        <div className="text-xs text-neutral-500">{row.creditor_email}</div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-white">{row.customer_name}</div>
                      </td>

                      <td className="px-4 py-4">{row.customer_phone}</td>

                      <td className="px-4 py-4">
                        {row.number}/{row.total_installments}
                      </td>

                      <td className="px-4 py-4">{row.due_date}</td>

                      <td className="px-4 py-4">
                        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
                          {row.days_overdue} dias
                        </span>
                      </td>

                      <td className="px-4 py-4 font-medium text-white">
                        {formatCurrency(row.updated_amount)}
                      </td>

                      <td className="rounded-r-2xl px-4 py-4 text-right">
                        <a
                          href={buildWhatsAppUrl(row)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-500"
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          WhatsApp
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminCollections;