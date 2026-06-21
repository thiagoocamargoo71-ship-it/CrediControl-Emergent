import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import {
  CalendarClock,
  Wallet,
  Users,
  Receipt,
} from 'lucide-react';
import axios from 'axios';
import { API } from '../App';

const ReceivablesForecast = () => {
const [loading, setLoading] = useState(true);

const [forecast, setForecast] = useState({
  total_amount: 0,
  total_installments: 0,
  total_customers: 0,
  grouped_installments: {},
});

useEffect(() => {
  fetchForecast();
}, []);

const fetchForecast = async () => {
  try {
    setLoading(true);

    const response = await axios.get(
      `${API}/reports/receivables-forecast`
    );

    setForecast(response.data);
  } catch (error) {
    console.error(
      'Erro ao carregar previsão:',
      error
    );
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-neutral-950">
      <Sidebar />

      <main className="lg:ml-[276px] p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">


          {/* Cabeçalho */}

          <div className="mb-8 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">

            <div className="flex items-center gap-4">

              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-blue-700 shadow-[0_10px_40px_rgba(59,130,246,0.35)]">
                <CalendarClock className="h-8 w-8 text-white" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-white">
                  Previsão de Recebimentos
                </h1>

                <p className="mt-1 text-neutral-400">
                  Acompanhe os recebimentos previstos para os próximos dias.
                </p>
              </div>

            </div>

          </div>

          {/* Cards */}

          <div className="grid gap-6 md:grid-cols-3">

            <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-6">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">
                  Valor Previsto
                </span>

                <Wallet className="text-sky-400" />
              </div>

              <div className="mt-8 rounded-3xl border border-white/10 bg-neutral-900/60 p-6">

  <h2 className="mb-6 text-xl font-semibold text-white">
    Próximos Recebimentos
  </h2>

  {loading ? (
    <p className="text-neutral-400">
      Carregando...
    </p>
  ) : Object.keys(forecast.grouped_installments).length === 0 ? (
    <p className="text-neutral-400">
      Nenhum recebimento previsto para os próximos dias.
    </p>
  ) : (
    <div className="space-y-6">

      {Object.entries(
        forecast.grouped_installments
      ).map(([date, installments]) => (
        <div
          key={date}
          className="rounded-2xl border border-white/5 bg-black/20 p-5"
        >
          <h3 className="mb-4 text-lg font-semibold text-sky-400">
            {new Date(date).toLocaleDateString('pt-BR', {
              timeZone: 'UTC',
            })}
          </h3>

          <div className="space-y-3">

            {installments.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl bg-white/5 p-4"
              >
                <div>
                  <p className="font-medium text-white">
                    {item.customer_name}
                  </p>

                  <p className="text-sm text-neutral-400">
                    Parcela {item.installment_number}
                  </p>
                </div>

                <span className="font-semibold text-emerald-400">
                  {item.amount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
            ))}

          </div>
        </div>
      ))}

    </div>
  )}

</div>

              <h2 className="mt-4 text-3xl font-bold text-white">
                {forecast.total_amount.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </h2>
            </div>

            <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-6">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">
                  Parcelas Previstas
                </span>

                <Receipt className="text-sky-400" />
              </div>

              <h2 className="mt-4 text-3xl font-bold text-white">
                {forecast.total_installments}
              </h2>
            </div>

            <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-6">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">
                  Clientes Previstos
                </span>

                <Users className="text-sky-400" />
              </div>

              <h2 className="mt-4 text-3xl font-bold text-white">
                {forecast.total_customers}
              </h2>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default ReceivablesForecast;