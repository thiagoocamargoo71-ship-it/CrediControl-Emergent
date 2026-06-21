import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import {
  CalendarClock,
  Wallet,
  Users,
  Receipt,
  Copy,
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

const handleCopyWhatsApp = async () => {
  let message = `📊 *PREVISÃO DE RECEBIMENTOS*\n\n`;

  const today = new Date();

  const limitDate = new Date();
  limitDate.setDate(today.getDate() + 7);

  message += `📅 *Período:* ${today.toLocaleDateString(
    'pt-BR'
  )} até ${limitDate.toLocaleDateString('pt-BR')}\n\n`;

  message += `💰 *Valor Previsto:* ${forecast.total_amount.toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    }
  )}\n`;

  message += `📄 *Parcelas Previstas:* ${forecast.total_installments}\n`;

  message += `👥 *Clientes Previstos:* ${forecast.total_customers}\n\n`;

  message += `━━━━━━━━━━━━━━\n\n`;

  Object.entries(forecast.grouped_installments).forEach(
    ([date, installments]) => {
      message += `📅 *${new Date(date).toLocaleDateString(
        'pt-BR',
        {
          timeZone: 'UTC',
        }
      )}*\n\n`;

      installments.forEach((item) => {
        message += `• ${item.customer_name}\n`;
        message += `Parcela ${item.installment_number} - ${item.amount.toLocaleString(
          'pt-BR',
          {
            style: 'currency',
            currency: 'BRL',
          }
        )}\n\n`;
      });

      message += `━━━━━━━━━━━━━━\n\n`;
    }
  );

  message += `Atenciosamente,\n\n`;
  message += `*CrediControl Assessoria Financeira*`;

  await navigator.clipboard.writeText(message);

  alert('Mensagem copiada com sucesso!');
};


  return (
  <div className="min-h-screen bg-neutral-950">
    <Sidebar />

    <main className="lg:ml-[276px] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Cabeçalho */}

        <div className="
          relative
          overflow-hidden
          mb-8
          rounded-3xl
          border border-white/10
          bg-gradient-to-br
          from-slate-900
          via-slate-950
          to-sky-950/80
          p-8
          shadow-[0_20px_60px_rgba(0,0,0,0.45)]
          backdrop-blur-xl
        ">

          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-5">

              <div className="
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-3xl
                bg-gradient-to-br
                from-sky-500
                via-blue-600
                to-indigo-700
                shadow-[0_15px_40px_rgba(59,130,246,0.35)]
              ">
                <CalendarClock className="h-10 w-10 text-white" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-white">
                  Previsão de Recebimentos
                </h1>

                <p className="mt-2 text-neutral-400">
                  Acompanhe e antecipe os recebimentos previstos da sua carteira.
                </p>
              </div>

            </div>

            <button
              onClick={handleCopyWhatsApp}
              className="
                inline-flex
                items-center
                justify-center
                gap-3
                rounded-2xl
                bg-gradient-to-r
                from-emerald-600
                to-emerald-700
                px-6
                py-4
                font-semibold
                text-white
                shadow-[0_10px_30px_rgba(5,150,105,0.35)]
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-[0_15px_40px_rgba(5,150,105,0.5)]
              "
            >
              <Copy className="h-5 w-5" />
              Copiar para WhatsApp
            </button>

          </div>

        </div>

        {/* Cards */}

        <div className="grid gap-6 md:grid-cols-3">

          {/* Valor Previsto */}

          <div className="
            group
            rounded-3xl
            border border-white/10
            bg-gradient-to-b
            from-white/10
            to-white/5
            p-6
            backdrop-blur-xl
            transition-all
            duration-300
            hover:-translate-y-1
            hover:border-emerald-500/30
            hover:shadow-[0_20px_60px_rgba(16,185,129,0.15)]
          ">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-neutral-400">
                  Valor Previsto
                </p>

                <h2 className="mt-4 text-4xl font-bold text-white">
                  {forecast.total_amount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </h2>
              </div>

              <div className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-emerald-500/20
              ">
                <Wallet className="h-7 w-7 text-emerald-400" />
              </div>

            </div>

          </div>

          {/* Parcelas */}

          <div className="
            group
            rounded-3xl
            border border-white/10
            bg-gradient-to-b
            from-white/10
            to-white/5
            p-6
            backdrop-blur-xl
            transition-all
            duration-300
            hover:-translate-y-1
            hover:border-sky-500/30
            hover:shadow-[0_20px_60px_rgba(59,130,246,0.15)]
          ">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-neutral-400">
                  Parcelas Previstas
                </p>

                <h2 className="mt-4 text-4xl font-bold text-white">
                  {forecast.total_installments}
                </h2>
              </div>

              <div className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-sky-500/20
              ">
                <Receipt className="h-7 w-7 text-sky-400" />
              </div>

            </div>

          </div>

          {/* Clientes */}

          <div className="
            group
            rounded-3xl
            border border-white/10
            bg-gradient-to-b
            from-white/10
            to-white/5
            p-6
            backdrop-blur-xl
            transition-all
            duration-300
            hover:-translate-y-1
            hover:border-violet-500/30
            hover:shadow-[0_20px_60px_rgba(139,92,246,0.15)]
          ">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-neutral-400">
                  Clientes Previstos
                </p>

                <h2 className="mt-4 text-4xl font-bold text-white">
                  {forecast.total_customers}
                </h2>
              </div>

              <div className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-violet-500/20
              ">
                <Users className="h-7 w-7 text-violet-400" />
              </div>

            </div>

          </div>

        </div>

        {/* Próximos Recebimentos */}

        <div className="
          mt-8
          rounded-3xl
          border border-white/10
          bg-gradient-to-b
          from-white/10
          to-white/5
          p-8
          backdrop-blur-xl
        ">

          <div className="mb-8">

            <h2 className="text-2xl font-bold text-white">
              Próximos Recebimentos
            </h2>

            <p className="mt-1 text-neutral-400">
              Parcelas previstas para os próximos 7 dias.
            </p>

          </div>

          {loading ? (

            <div className="py-10 text-center text-neutral-400">
              Carregando previsões...
            </div>

          ) : Object.keys(forecast.grouped_installments).length === 0 ? (

            <div className="py-10 text-center text-neutral-400">
              Nenhum recebimento previsto.
            </div>

          ) : (

            <div className="space-y-8">

              {Object.entries(forecast.grouped_installments).map(
                ([date, installments]) => (

                  <div key={date}>

                    <div className="mb-5 flex items-center gap-3">

                      <div className="h-px flex-1 bg-white/10" />

                      <span className="
                        rounded-full
                        bg-sky-500/15
                        px-4
                        py-2
                        text-sm
                        font-semibold
                        text-sky-300
                      ">
                        {new Date(date).toLocaleDateString(
                          'pt-BR',
                          { timeZone: 'UTC' }
                        )}
                      </span>

                      <div className="h-px flex-1 bg-white/10" />

                    </div>

                    <div className="space-y-4">

                      {installments.map((item) => (

                        <div
                          key={item.id}
                          className="
                            flex
                            items-center
                            justify-between
                            rounded-3xl
                            border border-white/5
                            bg-black/20
                            p-5
                            transition-all
                            duration-300
                            hover:border-sky-500/20
                            hover:bg-white/5
                          "
                        >

                          <div>

                            <p className="text-lg font-semibold text-white">
                              {item.customer_name}
                            </p>

                            <p className="text-sm text-neutral-400">
                              Parcela #{item.installment_number}
                            </p>

                          </div>

                          <p className="text-xl font-bold text-emerald-400">
                            {item.amount.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </p>

                        </div>

                      ))}

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>
    </main>
  </div>
);
};

export default ReceivablesForecast;