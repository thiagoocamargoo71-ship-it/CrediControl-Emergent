import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Simulator() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [installments, setInstallments] = useState("");
  const [result, setResult] = useState(null);

  const isFilled = amount && rate && installments;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  // 🔁 Simulação automática
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

      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/simulate-loan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Number(amount),
            rate: Number(rate),
            installments: Number(installments),
          }),
        }
      );

      if (!res.ok) throw new Error("Erro na requisição");

      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Erro ao simular:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetSimulation = () => {
    setAmount("");
    setRate("");
    setInstallments("");
    setResult(null);
  };

  const handleCreateLoan = () => {
    navigate("/loans");
  };

  // 📊 EXEMPLO DINÂMICO
  const exampleAmount = Number(amount) || 1000;
  const exampleRate = Number(rate) || 10;
  const exampleInstallments = Number(installments) || 10;

  const exampleTotal = exampleAmount + (exampleAmount * exampleRate) / 100;
  const exampleInstallment = exampleTotal / exampleInstallments;

  return (
    <div className="min-h-screen bg-neutral-950">
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-neutral-50">
            Simulador
          </h1>
          <p className="text-neutral-400 mt-1">
            Simule seus empréstimos
          </p>
        </div>

        {/* CARD */}
        <div className="bg-zinc-900 p-6 rounded-xl max-w-4xl mx-auto animate-fade-in-delay-1">
          
          {/* INPUTS FIXOS */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <input
              className="p-3 rounded bg-zinc-800 text-white"
              placeholder="Valor (ex: 1000)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <input
              className="p-3 rounded bg-zinc-800 text-white"
              placeholder="Taxa (%) (ex: 10)"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />

            <input
              className="p-3 rounded bg-zinc-800 text-white"
              placeholder="Parcelas (ex: 12)"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
            />
          </div>

          {/* 🔵 RESUMO INTELIGENTE */}
          {!result && !loading && (
            <div className="animate-fade-in">

              <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-5 text-sm text-neutral-300 space-y-4">
                
                {/* DICA */}
                <div>
                  <p className="text-neutral-400 text-xs mb-1">💡 Dica</p>
                  <p>
                    Taxas entre <span className="text-white font-medium">5% e 15%</span> são mais utilizadas no mercado.
                  </p>
                </div>

                {/* EXEMPLO DINÂMICO */}
                <div className="border-t border-neutral-700 pt-3">
                  <p className="text-neutral-400 text-xs mb-1">📊 Simulação rápida</p>
                  <p>
                    {formatCurrency(exampleAmount)} →{" "}
                    <span className="text-white font-medium">
                      {formatCurrency(exampleTotal)}
                    </span>{" "}
                    em {exampleInstallments}x de{" "}
                    <span className="text-emerald-500 font-medium">
                      {formatCurrency(exampleInstallment)}
                    </span>
                  </p>
                </div>

                {/* BENEFÍCIO */}
                <div className="border-t border-neutral-700 pt-3">
                  <p className="text-neutral-400 text-xs mb-1">⚡ Benefício</p>
                  <p>
                    Veja automaticamente o lucro e tome decisões mais rápidas.
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div className="flex justify-center mt-6">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* RESULTADO */}
          {result && !loading && (
            <div className="mt-6 animate-fade-in">

              {/* Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-neutral-800 p-4 rounded-lg">
                  <p className="text-xs text-neutral-400">Total</p>
                  <p className="text-lg font-bold text-white">
                    {formatCurrency(result.total)}
                  </p>
                </div>

                <div className="bg-neutral-800 p-4 rounded-lg">
                  <p className="text-xs text-neutral-400">Juros</p>
                  <p className="text-lg font-bold text-amber-500">
                    {formatCurrency(result.interest)}
                  </p>
                </div>

                <div className="bg-neutral-800 p-4 rounded-lg">
                  <p className="text-xs text-neutral-400">Parcela</p>
                  <p className="text-lg font-bold text-emerald-500">
                    {formatCurrency(result.installment_value)}
                  </p>
                </div>
              </div>

              {/* Parcelas */}
              <div className="mt-8">
                <h3 className="text-sm text-neutral-400 mb-3">
                  Parcelas
                </h3>

                <div className="space-y-2">
                  {[...Array(Number(installments))].map((_, i) => (
                    <div
                      key={i}
                      className="flex justify-between bg-neutral-800 p-3 rounded"
                    >
                      <span className="text-neutral-300">
                        Parcela {i + 1}
                      </span>
                      <span className="text-white font-medium">
                        {formatCurrency(result.installment_value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTÕES */}
              <div className="mt-6 flex gap-4">
                <button
                  onClick={resetSimulation}
                  className="w-1/2 bg-zinc-700 p-3 rounded hover:bg-zinc-600 text-white"
                >
                  Nova simulação
                </button>

                <button
                  onClick={handleCreateLoan}
                  className="w-1/2 bg-emerald-600 p-3 rounded hover:bg-emerald-700 text-white font-medium"
                >
                  Criar empréstimo
                </button>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}