// AdminCollections_v2.jsx (com Timeline + Detalhes)

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import {
  MessageCircle,
  RefreshCw,
  Search,
  UserRound,
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
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
};

const AdminCollections = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/installments/overdue`);
      setRows(res.data || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    if (!t) return rows;
    return rows.filter(r =>
      r.customer_name?.toLowerCase().includes(t) ||
      r.customer_phone?.includes(t)
    );
  }, [rows, search]);

  const openDetails = async (row) => {
    setSelected(row);
    setLoadingTimeline(true);

    try {
      const res = await axios.get(
        `${API}/admin/installments/${row.installment_id}/collection-messages`
      );
      setTimeline(res.data.messages || []);
    } catch {
      setTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar />

      <main className="p-6 lg:ml-[260px]">
        <h1 className="text-2xl font-bold mb-4">Central de Cobranças</h1>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="mb-4 p-3 rounded bg-neutral-900 w-full"
        />

        {loading ? (
          <div>Carregando...</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(row => (
              <div key={row.installment_id} className="p-4 bg-neutral-900 rounded-xl">
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold">{row.customer_name}</div>
                    <div className="text-sm text-neutral-400">{row.customer_phone}</div>
                    <div className="text-xs text-neutral-500">
                      {row.number}/{row.total_installments}
                    </div>
                  </div>

                  <div className="flex gap-2">

                    <button
                      onClick={() => openDetails(row)}
                      className="px-4 py-2 bg-blue-600 rounded"
                    >
                      Detalhes
                    </button>

                    <button
                      onClick={async () => {
                        const res = await axios.post(
                          `${API}/admin/installments/${row.installment_id}/collection-message`
                        );

                        if (res.data?.whatsapp_url) {
                          window.open(res.data.whatsapp_url, '_blank');

                          if (res.data?.message_id) {
                            await axios.post(
                              `${API}/admin/collection-messages/${res.data.message_id}/mark-as-sent`
                            );
                          }
                        }
                      }}
                      className="px-4 py-2 bg-green-600 rounded"
                    >
                      WhatsApp
                    </button>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL */}
        {selected && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
            <div className="bg-neutral-900 p-6 rounded-xl w-[600px] max-h-[80vh] overflow-auto">

              <h2 className="text-xl font-bold mb-4">
                Detalhes da Cobrança
              </h2>

              <div className="mb-4">
                <div><b>Cliente:</b> {selected.customer_name}</div>
                <div><b>Parcela:</b> {selected.number}/{selected.total_installments}</div>
                <div><b>Valor:</b> {formatCurrency(selected.updated_amount)}</div>
                <div><b>Atraso:</b> {selected.days_overdue} dias</div>
              </div>

              <h3 className="font-semibold mb-2">Timeline</h3>

              {loadingTimeline ? (
                <div>Carregando...</div>
              ) : (
                <div className="space-y-2">
                  {timeline.map(t => (
                    <div key={t.id} className="p-3 bg-black rounded">
                      <div className="text-sm font-bold">{t.status}</div>
                      <div className="text-xs text-neutral-500">
                        {new Date(t.created_at).toLocaleString()}
                      </div>
                      <div className="text-xs mt-2">{t.message}</div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setSelected(null)}
                className="mt-4 px-4 py-2 bg-red-600 rounded"
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