import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  ArrowRight,
  Calculator,
  CircleDollarSign,
  Percent,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';

export default function Simulator() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [installments, setInstallments] = useState('');
  const [result, setResult] = useState(null);

  const isFilled = amount && rate && installments;

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);

  useEffect(() => {
    if (!isFilled) return;

    const timeout = setTimeout(() => {
      simulate();
    }, 400);

    return () => clearTimeout(timeout);
  }, [amount, rate, installments]);

  const simulate = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/simulate-loan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(amount),
          rate: Number(rate),
          installments: Number(installments),
        }),
      });

      if (!res.ok) throw new Error('Erro na requisição');

      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error('Erro ao simular:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetSimulation = () => {
    setAmount('');
    setRate('');
    setInstallments('');
    setResult(null);
  };

  const handleCreateLoan = () => {
    navigate('/loans');
  };

  const exampleAmount = Number(amount) || 1000;
  const exampleRate = Number(rate) || 10;
  const exampleInstallments = Number(installments) || 10;

  const exampleTotal = exampleAmount + (exampleAmount * exampleRate) / 100;
  const exampleInstallment = exampleTotal / exampleInstallments;

return (
  <AppShell
    title="Simulador"
    subtitle="Simule seus empréstimos com cálculo automático"
    headerVariant="premium"
    headerIcon={Calculator}
    headerBadge="Simulação financeira"
  >
    <div className="space-y-8 lg:space-y-10">
      
        
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/10">
            <div className="border-b border-neutral-800 bg-gradient-to-r from-blue-600/10 via-indigo-500/5 to-transparent p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3">
                  <Calculator className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-50">
                    Simulação Inteligente
                  </h2>
                  <p className="text-sm text-neutral-400">
                    Preencha os campos e veja o resultado automaticamente
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              {/* Inputs */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm text-neutral-300">Valor</label>
                  <div className="relative">
                    <CircleDollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                      className="h-12 rounded-2xl border-neutral-800 bg-neutral-950 pl-10 text-white"
                      placeholder="Ex: 1000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-neutral-300">Taxa (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                      className="h-12 rounded-2xl border-neutral-800 bg-neutral-950 pl-10 text-white"
                      placeholder="Ex: 10"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-neutral-300">Parcelas</label>
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                      className="h-12 rounded-2xl border-neutral-800 bg-neutral-950 pl-10 text-white"
                      placeholder="Ex: 12"
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Estado inicial */}
              {!result && !loading && (
                <div className="mt-6 animate-fade-in">
                  <div className="space-y-4 rounded-2xl border border-neutral-700 bg-neutral-800 p-5 text-sm text-neutral-300">
                    <div>
                      <p className="mb-1 text-xs text-neutral-400">💡 Dica</p>
                      <p>
                        Taxas entre <span className="font-medium text-white">5% e 15%</span> são
                        comuns em muitas operações.
                      </p>
                    </div>

                    <div className="border-t border-neutral-700 pt-3">
                      <p className="mb-1 text-xs text-neutral-400">📊 Simulação rápida</p>
                      <p>
                        {formatCurrency(exampleAmount)} →{' '}
                        <span className="font-medium text-white">
                          {formatCurrency(exampleTotal)}
                        </span>{' '}
                        em {exampleInstallments}x de{' '}
                        <span className="font-medium text-emerald-500">
                          {formatCurrency(exampleInstallment)}
                        </span>
                      </p>
                    </div>

                    <div className="border-t border-neutral-700 pt-3">
                      <p className="mb-1 text-xs text-neutral-400">⚡ Benefício</p>
                      <p>Veja automaticamente o lucro e tome decisões mais rápidas.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="mt-6 flex justify-center">
                  <div className="h-7 w-7 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
                </div>
              )}

              {/* Resultado */}
              {result && !loading && (
                <div className="mt-6 animate-fade-in">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-neutral-800 bg-neutral-800 p-4">
                      <p className="text-xs text-neutral-400">Total</p>
                      <p className="text-lg font-bold text-white">
                        {formatCurrency(result.total)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-neutral-800 bg-neutral-800 p-4">
                      <p className="text-xs text-neutral-400">Juros</p>
                      <p className="text-lg font-bold text-amber-500">
                        {formatCurrency(result.interest)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-neutral-800 bg-neutral-800 p-4">
                      <p className="text-xs text-neutral-400">Parcela</p>
                      <p className="text-lg font-bold text-emerald-500">
                        {formatCurrency(result.installment_value)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="mb-3 text-sm text-neutral-400">Parcelas</h3>

                    <div className="space-y-2">
                      {[...Array(Number(installments))].map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-800 p-3"
                        >
                          <span className="text-neutral-300">Parcela {i + 1}</span>
                          <span className="font-medium text-white">
                            {formatCurrency(result.installment_value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={resetSimulation}
                      variant="outline"
                      className="h-11 rounded-2xl border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800"
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Nova simulação
                    </Button>

                    <Button
                      onClick={handleCreateLoan}
                      className="h-11 rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 px-4 text-white shadow-[0_10px_30px_rgba(56,189,248,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:from-sky-300 hover:via-blue-400 hover:to-blue-500 hover:shadow-[0_14px_36px_rgba(96,165,250,0.34)]"
                    >
                      Criar empréstimo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}