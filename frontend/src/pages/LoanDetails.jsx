import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { API, formatApiErrorDetail } from '../App';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft,
  DollarSign,
  Calendar,
  Percent,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LoanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [loanRes, installmentsRes] = await Promise.all([
        axios.get(`${API}/loans/${id}`),
        axios.get(`${API}/installments/loan/${id}`)
      ]);
      setLoan(loanRes.data);
      setInstallments(installmentsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados do empréstimo');
      navigate('/loans');
    } finally {
      setLoading(false);
    }
  };

  const handlePayInstallment = async (installmentId) => {
    setPayingId(installmentId);
    try {
      await axios.post(`${API}/installments/${installmentId}/pay`);
      toast.success('Pagamento registrado com sucesso!');
      fetchData();
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao registrar pagamento');
    } finally {
      setPayingId(null);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: {
        label: 'Pago',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      },
      pending: {
        label: 'Pendente',
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      },
      overdue: {
        label: 'Atrasado',
        className: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.className} border font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status) => {
    const icons = {
      paid: <CheckCircle className="h-5 w-5 text-emerald-500" />,
      pending: <Clock className="h-5 w-5 text-amber-500" />,
      overdue: <AlertTriangle className="h-5 w-5 text-rose-500" />
    };
    return icons[status] || icons.pending;
  };

  // Calculate progress
  const paidCount = installments.filter(i => i.status === 'paid').length;
  const progress = installments.length > 0 ? (paidCount / installments.length) * 100 : 0;
  const totalPaid = installments.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.updated_amount, 0);
  const totalPending = installments.filter(i => i.status !== 'paid').reduce((acc, i) => acc + i.updated_amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <Sidebar />
      
      <main className="ml-64 p-8" data-testid="loan-details-page">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/loans')}
          className="mb-6 text-neutral-400 hover:text-neutral-50 gap-2"
          data-testid="back-to-loans"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Empréstimos
        </Button>

        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-3xl font-bold text-neutral-50 tracking-tight">
            Empréstimo - {loan?.customer_name}
          </h1>
          <p className="text-neutral-400 mt-1">
            Detalhes e parcelas do empréstimo
          </p>
        </div>

        {/* Loan Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-6 animate-fade-in">
            <h2 className="font-heading text-xl font-semibold text-neutral-50 mb-6">
              Resumo do Empréstimo
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">Valor Principal</span>
                </div>
                <p className="text-xl font-mono font-semibold text-neutral-50">
                  {formatCurrency(loan?.amount)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <Percent className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">Juros Mensal</span>
                </div>
                <p className="text-xl font-mono font-semibold text-neutral-50">
                  {loan?.interest_rate}%
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">Valor Total</span>
                </div>
                <p className="text-xl font-mono font-semibold text-emerald-500">
                  {formatCurrency(loan?.total_amount)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">Data Início</span>
                </div>
                <p className="text-xl font-mono font-semibold text-neutral-50">
                  {loan?.start_date && formatDate(loan.start_date)}
                </p>
              </div>
            </div>
            
            {/* Progress */}
            <div className="mt-6 pt-6 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-400">Progresso de Pagamento</span>
                <span className="text-sm font-mono text-neutral-50">
                  {paidCount}/{installments.length} parcelas
                </span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 animate-fade-in">
            <h3 className="font-heading text-lg font-semibold text-neutral-50 mb-4">
              Situação Financeira
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Total Recebido</span>
                <span className="font-mono font-semibold text-emerald-500">
                  {formatCurrency(totalPaid)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Total Pendente</span>
                <span className="font-mono font-semibold text-amber-500">
                  {formatCurrency(totalPending)}
                </span>
              </div>
              <div className="pt-4 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-50 font-medium">Lucro</span>
                  <span className="font-mono font-semibold text-blue-500">
                    {formatCurrency(loan?.total_amount - loan?.amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Installments Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden animate-fade-in">
          <div className="px-6 py-4 border-b border-neutral-800">
            <h2 className="font-heading text-xl font-semibold text-neutral-50">
              Parcelas
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  Nº
                </th>
                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  Valor Original
                </th>
                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  Valor Atualizado
                </th>
                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  Vencimento
                </th>
                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  Atraso
                </th>
                <th className="text-right px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {installments.map((installment) => (
                <tr 
                  key={installment.id} 
                  className="border-b border-neutral-800/50 table-row-hover transition-colors"
                  data-testid={`installment-row-${installment.number}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(installment.status)}
                      <span className="text-neutral-50 font-medium">
                        Parcela {installment.number}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-neutral-400 font-mono">
                    {formatCurrency(installment.amount)}
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold">
                    <span className={installment.status === 'overdue' ? 'text-rose-500' : 'text-neutral-50'}>
                      {formatCurrency(installment.updated_amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-neutral-300 font-mono">
                    {formatDate(installment.due_date)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(installment.status)}
                  </td>
                  <td className="px-6 py-4 text-neutral-400">
                    {installment.days_overdue > 0 ? (
                      <span className="text-rose-500 font-medium">
                        {installment.days_overdue} dias
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {installment.status !== 'paid' && (
                      <Button
                        size="sm"
                        onClick={() => handlePayInstallment(installment.id)}
                        disabled={payingId === installment.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        data-testid={`pay-installment-${installment.number}`}
                      >
                        {payingId === installment.id ? 'Registrando...' : 'Registrar Pagamento'}
                      </Button>
                    )}
                    {installment.status === 'paid' && (
                      <span className="text-emerald-500 text-sm">
                        Pago em {installment.paid_at && formatDate(installment.paid_at)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default LoanDetails;
