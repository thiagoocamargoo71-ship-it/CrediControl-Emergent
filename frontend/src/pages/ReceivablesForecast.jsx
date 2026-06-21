import React from 'react';
import Sidebar from '../components/Sidebar';
import {
  CalendarClock,
  Wallet,
  Users,
  Receipt,
} from 'lucide-react';

const ReceivablesForecast = () => {
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

              <h2 className="mt-4 text-3xl font-bold text-white">
                R$ 0,00
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
                0
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
                0
              </h2>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default ReceivablesForecast;