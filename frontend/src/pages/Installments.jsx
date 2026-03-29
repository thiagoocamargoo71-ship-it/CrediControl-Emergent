import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API, formatApiErrorDetail } from '../App';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { 
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Eye,
  DollarSign,
  User,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Installments = () => {
  const navigate = useNavigate();
  const [installments, setInstallments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('');
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [payingId, setPayingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (periodFilter) params.append('period', periodFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const [installmentsRes, statsRes] = await Promise.all([
        axios.get(`${API}/installments?${params.toString()}`),
        axios.get(`${API}/installments/stats`)
      ]);
      
      setInstallments(installmentsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar parcelas');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, periodFilter, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handlePayInstallment = async (installmentId) => {
    setPayingId(installmentId);
    try {
      await axios.post(`${API}/installments/${installmentId}/pay`);
      toast.success('Pagamento registrado com sucesso!');
      fetchData();
      if (isDetailsModalOpen) {
        setIsDetailsModalOpen(false);
      }
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao registrar pagamento');
    } finally {
      setPayingId(null);
    }
  };

  const openDetailsModal = (installment) => {
    setSelectedInstallment(installment);
    setIsDetailsModalOpen(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: 'Pendente',
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: Clock,
        iconColor: 'text-emerald-500'
      },
      paid: {
        label: 'Pago',
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        icon: CheckCircle,
        iconColor: 'text-blue-500'
      },
      overdue: {
        label: 'Atrasado',
        color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        icon: AlertTriangle,
        iconColor: 'text-rose-500'
      }
    };
    return configs[status] || configs.pending;
  };

  const statusButtons = [
    { value: 'all', label: 'Todas' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'paid', label: 'Pagas' },
    { value: 'overdue', label: 'Atrasadas' }
  ];

  const periodButtons = [
    { value: '', label: 'Todas' },
    { value: 'today', label: 'Hoje' },
    { value: 'next7days', label: 'Próximos 7 dias' },
    { value: 'overdue', label: 'Vencidas' }
  ];

  return (
    <div className="min-h-screen bg-neutral-950">
      <Sidebar />
      
      <main className="ml-64 p-8" data-testid="installments-page">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-3xl font-bold text-neutral-50 tracking-tight">
            Parcelas
          </h1>
          <p className="text-neutral-400 mt-1">
            Gerencie todas as parcelas dos seus empréstimos
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 animate-fade-in">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Clock className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-mono font-bold text-neutral-50">{stats.total_pending}</p>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Pendentes</p>
                </div>
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-2xl font-mono font-bold text-neutral-50">{stats.total_overdue}</p>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Atrasadas</p>
                </div>
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-mono font-bold text-neutral-50">{stats.total_paid}</p>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Pagas</p>
                </div>
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-lg font-mono font-bold text-neutral-50">{formatCurrency(stats.pending_amount)}</p>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">A Receber</p>
                </div>
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <TrendingUp className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-lg font-mono font-bold text-rose-400">{formatCurrency(stats.overdue_amount)}</p>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Em Atraso</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-6 animate-fade-in">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
              <Input
                type="text"
                placeholder="Buscar por cliente ou nº da parcela..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-950 border-neutral-800 text-neutral-50 placeholder:text-neutral-600"
                data-testid="search-installments-input"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">Status:</span>
              <div className="flex gap-1">
                {statusButtons.map((btn) => (
                  <Button
                    key={btn.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter(btn.value)}
                    className={`${
                      statusFilter === btn.value
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800'
                    }`}
                    data-testid={`filter-status-${btn.value}`}
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Period Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">Período:</span>
              <div className="flex gap-1">
                {periodButtons.map((btn) => (
                  <Button
                    key={btn.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => setPeriodFilter(btn.value)}
                    className={`${
                      periodFilter === btn.value
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800'
                    }`}
                    data-testid={`filter-period-${btn.value || 'all'}`}
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Installments Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : installments.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center animate-fade-in">
            <CreditCard className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-50 mb-2">
              Nenhuma parcela encontrada
            </h3>
            <p className="text-neutral-500">
              {searchTerm || statusFilter !== 'all' || periodFilter
                ? 'Tente ajustar os filtros'
                : 'Crie empréstimos para ver as parcelas aqui'}
            </p>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                      Cliente
                    </th>
                    <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                      Nº Parcela
                    </th>
                    <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                      Valor
                    </th>
                    <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                      Vencimento
                    </th>
                    <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                      Status
                    </th>
                    <th className="text-right px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((installment) => {
                    const statusConfig = getStatusConfig(installment.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <tr 
                        key={installment.id} 
                        className="border-b border-neutral-800/50 table-row-hover transition-colors"
                        data-testid={`installment-row-${installment.id}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                              <span className="text-blue-500 font-medium">
                                {installment.customer_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-neutral-50 font-medium">{installment.customer_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-neutral-300 font-mono">
                            {installment.number}/{installment.total_installments}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className={`font-mono font-semibold ${installment.status === 'overdue' ? 'text-rose-400' : 'text-neutral-50'}`}>
                              {formatCurrency(installment.updated_amount)}
                            </p>
                            {installment.status === 'overdue' && installment.updated_amount !== installment.amount && (
                              <p className="text-xs text-neutral-500 line-through">
                                {formatCurrency(installment.amount)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-neutral-500" />
                            <span className="text-neutral-300 font-mono">{formatDate(installment.due_date)}</span>
                          </div>
                          {installment.days_overdue > 0 && (
                            <p className="text-xs text-rose-400 mt-1">
                              {installment.days_overdue} dias em atraso
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${statusConfig.color} border font-medium gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailsModal(installment)}
                              className="text-neutral-400 hover:text-blue-500 hover:bg-blue-500/10"
                              data-testid={`view-installment-${installment.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {installment.status !== 'paid' && (
                              <Button
                                size="sm"
                                onClick={() => handlePayInstallment(installment.id)}
                                disabled={payingId === installment.id}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                data-testid={`pay-installment-${installment.id}`}
                              >
                                {payingId === installment.id ? 'Pagando...' : 'Pagar'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Details Modal */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                Detalhes da Parcela
              </DialogTitle>
            </DialogHeader>
            {selectedInstallment && (
              <div className="space-y-6 py-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-50">{selectedInstallment.customer_name}</h3>
                      <p className="text-neutral-400 text-sm">
                        Parcela {selectedInstallment.number} de {selectedInstallment.total_installments}
                      </p>
                    </div>
                  </div>
                  {(() => {
                    const statusConfig = getStatusConfig(selectedInstallment.status);
                    return (
                      <Badge className={`${statusConfig.color} border font-medium`}>
                        {statusConfig.label}
                      </Badge>
                    );
                  })()}
                </div>

                {/* Values */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                        Valor Original
                      </p>
                      <p className="text-xl font-mono font-semibold text-neutral-50">
                        {formatCurrency(selectedInstallment.amount)}
                      </p>
                    </div>
                    {selectedInstallment.status === 'overdue' && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                          Valor Atualizado
                        </p>
                        <p className="text-xl font-mono font-semibold text-rose-400">
                          {formatCurrency(selectedInstallment.updated_amount)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                      Vencimento
                    </p>
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Calendar className="h-4 w-4 text-neutral-500" />
                      <span className="font-mono">{formatDate(selectedInstallment.due_date)}</span>
                    </div>
                  </div>
                  {selectedInstallment.paid_at && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                        Data de Pagamento
                      </p>
                      <div className="flex items-center gap-2 text-neutral-300">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span className="font-mono">{formatDateTime(selectedInstallment.paid_at)}</span>
                      </div>
                    </div>
                  )}
                  {selectedInstallment.days_overdue > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                        Dias em Atraso
                      </p>
                      <div className="flex items-center gap-2 text-rose-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-semibold">{selectedInstallment.days_overdue} dias</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                      Taxa de Juros
                    </p>
                    <div className="flex items-center gap-2 text-neutral-300">
                      <TrendingUp className="h-4 w-4 text-neutral-500" />
                      <span>{selectedInstallment.interest_rate}% ao mês</span>
                    </div>
                  </div>
                </div>

                {/* Loan Info */}
                <div className="pt-4 border-t border-neutral-800">
                  <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-3">
                    Empréstimo Relacionado
                  </p>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-neutral-500" />
                      <div>
                        <p className="text-neutral-300">Valor: {formatCurrency(selectedInstallment.loan_amount)}</p>
                        <p className="text-xs text-neutral-500">Total: {formatCurrency(selectedInstallment.loan_total)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        navigate(`/loans/${selectedInstallment.loan_id}`);
                      }}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    >
                      Ver Empréstimo
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              {selectedInstallment && selectedInstallment.status !== 'paid' && (
                <Button
                  onClick={() => handlePayInstallment(selectedInstallment.id)}
                  disabled={payingId === selectedInstallment.id}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  data-testid="pay-installment-modal"
                >
                  <CheckCircle className="h-4 w-4" />
                  {payingId === selectedInstallment.id ? 'Registrando...' : 'Marcar como Paga'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Installments;
