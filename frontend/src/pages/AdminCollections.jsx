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

const AdminCollections = () => {
  const [overdueInstallments, setOverdueInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // 🔥 NOVOS ESTADOS
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

  useEffect(() => {
    loadOverdueInstallments();
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return overdueInstallments;

    return overdueInstallments.filter((row) => (
      row.customer_name?.toLowerCase().includes(term) ||
      row.customer_phone?.toLowerCase().includes(term) ||
      row.creditor_name?.toLowerCase().includes(term)
    ));
  }, [overdueInstallments, search]);

  // 🔥 FUNÇÃO DETALHES
  const openDetails = async (row) => {
    setSelectedInstallment(row);
    setLoadingTimeline(true);

    try {
      const response = await axios.get(
        `${API}/admin/installments/${row.installment_id}/collection-messages`
      );

      setTimeline(response.data.messages || []);
    } catch (err) {
      console.error('Erro ao carregar timeline', err);
      setTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <Sidebar />

      <main className="px-4 py-6 lg:ml-[276px] lg:px-8">

        <h1 className="text-2xl font-bold mb-4">Central de Cobranças</h1>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="mb-4 p-3 rounded bg-neutral-900 w-full"
        />

        {loading ? (
          <div>Carregando...</div>
        ) : (
          <div className="space-y-3">
            {filteredRows.map((row) => (
              <div key={row.installment_id} className="p-4 bg-neutral-900 rounded-xl flex justify-between items-center">

                <div>
                  <div className="font-bold">{row.customer_name}</div>
                  <div className="text-sm text-neutral-400">{row.customer_phone}</div>
                  <div className="text-xs text-neutral-500">
                    Parcela {row.number}/{row.total_installments}
                  </div>
                </div>

                <div className="flex gap-2">

                  {/* 🔵 BOTÃO DETALHES */}
                  <button
                    onClick={() => openDetails(row)}
                    className="px-4 py-2 bg-blue-600 rounded"
                  >
                    Detalhes
                  </button>

                  {/* 🟢 WHATSAPP */}
                  <button
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
                        alert('Erro ao gerar mensagem');
                      }
                    }}
                    className="px-4 py-2 bg-green-600 rounded"
                  >
                    WhatsApp
                  </button>

                </div>
              </div>
            ))}
          </div>
        )}

        {/* 🔥 MODAL */}
        {selectedInstallment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-2xl rounded-2xl bg-[#0b0b0f] p-6">

              <h2 className="text-xl font-bold mb-4">Detalhes da Cobrança</h2>

              <div className="mb-4 text-sm text-neutral-300">
                <p><b>Cliente:</b> {selectedInstallment.customer_name}</p>
                <p><b>Parcela:</b> {selectedInstallment.number}/{selectedInstallment.total_installments}</p>
                <p><b>Valor:</b> {formatCurrency(selectedInstallment.updated_amount)}</p>
                <p><b>Atraso:</b> {selectedInstallment.days_overdue} dias</p>
              </div>

              <h3 className="mb-2 text-sm font-semibold">Timeline</h3>

              {loadingTimeline ? (
                <div>Carregando...</div>
              ) : timeline.length === 0 ? (
                <div>Nenhuma cobrança registrada</div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-auto">
                  {timeline.map((msg) => (
                    <div key={msg.id} className="p-3 bg-black rounded">
                      <div className="text-xs text-blue-300 font-bold">{msg.status}</div>
                      <div className="text-xs text-neutral-500">
                        {new Date(msg.created_at).toLocaleString()}
                      </div>
                      <div className="text-xs mt-2 whitespace-pre-line">{msg.message}</div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setSelectedInstallment(null)}
                className="mt-4 w-full bg-red-600 py-2 rounded"
              >
                Fechar
              </button>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminCollections;