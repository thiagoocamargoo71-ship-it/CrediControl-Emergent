import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API, formatApiErrorDetail } from '../App';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Receipt } from 'lucide-react';
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
  TrendingUp,
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
        axios.get(`${API}/installments/stats`),
      ]);

      setInstallments(installmentsRes.data || []);
      setStats(statsRes.data || null);
    } catch (error) {
      toast.error('Erro ao carregar parcelas');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, periodFilter, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      toast.error(
        formatApiErrorDetail(error.response?.data?.detail) ||
          'Erro ao registrar pagamento'
      );
    } finally {
      setPayingId(null);
    }
  };

  const openDetailsModal = (installment) => {
    setSelectedInstallment(installment);
    setIsDetailsModalOpen(true);
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(`${dateStr}T00:00:00`);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
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
        iconColor: 'text-emerald-500',
      },
      paid: {
        label: 'Pago',
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        icon: CheckCircle,
        iconColor: 'text-blue-500',
      },
      overdue: {
        label: 'Atrasado',
        color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        icon: AlertTriangle,
        iconColor: 'text-rose-500',
      },
    };

    return configs[status] || configs.pending;
  };

  const statusButtons = [
    { value: 'all', label: 'Todas' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'paid', label: 'Pagas' },
    { value: 'overdue', label: 'Atrasadas' },
  ];

  const periodButtons = [
    { value: '', label: 'Todas' },
    { value: 'today', label: 'Hoje' },
    { value: 'next7days', label: 'Próximos 7 dias' },
    { value: 'overdue', label: 'Vencidas' },
  ];

  const rightAction = (
    <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-300">
      <CreditCard className="h-4 w-4 text-blue-400" />
      {installments.length} parcelas
    </div>
  );

  if (loading) {
    return (
      <AppShell
        title="Gerencie todas as parcelas dos seus empréstimos"
        rightAction={rightAction}
    headerVariant="premium"
    headerIcon={Receipt}
    headerBadge="Controle de parcelas"
      >
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
        </div>
      </AppShell>
    );
  }

return (
  <AppShell
    title="Gerencie todas as parcelas dos seus empréstimos"
    rightAction={rightAction}
    headerVariant="premium"
    headerIcon={Receipt}
    headerBadge="Controle de parcelas"
  >
    <div data-testid="installments-page" className="space-y-8 lg:space-y-10">
        
        {stats && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <Clock className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-50">{stats.total_pending}</p>
                  <p className="text-xs uppercase tracking-wider text-neutral-500">
                    Pendentes
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-50">{stats.total_overdue}</p>
                  <p className="text-xs uppercase tracking-wider text-neutral-500">
                    Atrasadas
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-50">{stats.total_paid}</p>
                  <p className="text-xs uppercase tracking-wider text-neutral-500">Pagas</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="break-words text-lg font-bold text-neutral-50">
                    {formatCurrency(stats.pending_amount)}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-neutral-500">
                    A Receber
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                  <TrendingUp className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <p className="break-words text-lg font-bold text-rose-400">
                    {formatCurrency(stats.overdue_amount)}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-neutral-500">
                    Em Atraso
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 rounded-3xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="relative max-w-xl flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
              <Input
                type="text"
                placeholder="Buscar por cliente ou nº da parcela..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 rounded-2xl border-neutral-800 bg-neutral-950 pl-10 text-neutral-50 placeholder:text-neutral-600"
                data-testid="search-installments-input"
              />
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <span className="text-sm text-neutral-500">Status:</span>
                <div className="flex flex-wrap gap-2">
                  {statusButtons.map((btn) => (
                    <Button
                      key={btn.value}
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusFilter(btn.value)}
                      className={`rounded-2xl ${
                        statusFilter === btn.value
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-50'
                      }`}
                      data-testid={`filter-status-${btn.value}`}
                    >
                      {btn.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <span className="text-sm text-neutral-500">Período:</span>
                <div className="flex flex-wrap gap-2">
                  {periodButtons.map((btn) => (
                    <Button
                      key={btn.value}
                      variant="ghost"
                      size="sm"
                      onClick={() => setPeriodFilter(btn.value)}
                      className={`rounded-2xl ${
                        periodFilter === btn.value
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-50'
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
        </div>

        {installments.length === 0 ? (
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-12 text-center">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
            <h3 className="mb-2 text-lg font-medium text-neutral-50">
              Nenhuma parcela encontrada
            </h3>
            <p className="text-neutral-500">
              {searchTerm || statusFilter !== 'all' || periodFilter
                ? 'Tente ajustar os filtros'
                : 'Crie empréstimos para ver as parcelas aqui'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px]">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Nº Parcela
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Valor
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Vencimento
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
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
                          className="border-b border-neutral-800/50 transition-colors hover:bg-neutral-800/30"
                          data-testid={`installment-row-${installment.id}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/20 bg-blue-600/10">
                                <span className="font-medium text-blue-500">
                                  {installment.customer_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-neutral-50">
                                {installment.customer_name}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-mono text-neutral-300">
                              {installment.number}/{installment.total_installments}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div>
                              <p
                                className={`font-semibold ${
                                  installment.status === 'overdue'
                                    ? 'text-rose-400'
                                    : 'text-neutral-50'
                                }`}
                              >
                                {formatCurrency(installment.updated_amount)}
                              </p>
                              {installment.status === 'overdue' &&
                                installment.updated_amount !== installment.amount && (
                                  <p className="text-xs text-neutral-500 line-through">
                                    {formatCurrency(installment.amount)}
                                  </p>
                                )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-neutral-500" />
                              <span className="font-mono text-neutral-300">
                                {formatDate(installment.due_date)}
                              </span>
                            </div>
                            {installment.days_overdue > 0 && (
                              <p className="mt-1 text-xs text-rose-400">
                                {installment.days_overdue} dias em atraso
                              </p>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <Badge className={`${statusConfig.color} border gap-1 font-medium`}>
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
                                className="rounded-2xl text-neutral-400 hover:bg-blue-500/10 hover:text-blue-500"
                                data-testid={`view-installment-${installment.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {installment.status !== 'paid' && (
                                <Button
                                  size="sm"
                                  onClick={() => handlePayInstallment(installment.id)}
                                  disabled={payingId === installment.id}
                                  className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
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

            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {installments.map((installment) => {
                const statusConfig = getStatusConfig(installment.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={installment.id}
                    className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5"
                    data-testid={`installment-row-${installment.id}`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-neutral-50">
                          {installment.customer_name}
                        </p>
                        <p className="mt-1 text-sm text-neutral-500">
                          Parcela {installment.number}/{installment.total_installments}
                        </p>
                      </div>

                      <Badge className={`${statusConfig.color} border gap-1 font-medium`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-500">
                          Valor
                        </p>
                        <p
                          className={`mt-1 font-semibold ${
                            installment.status === 'overdue'
                              ? 'text-rose-400'
                              : 'text-neutral-50'
                          }`}
                        >
                          {formatCurrency(installment.updated_amount)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-500">
                          Vencimento
                        </p>
                        <p className="mt-1 text-neutral-200">
                          {formatDate(installment.due_date)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-500">
                          Atraso
                        </p>
                        <p className="mt-1 text-neutral-200">
                          {installment.days_overdue > 0
                            ? `${installment.days_overdue} dias`
                            : '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-500">
                          Juros
                        </p>
                        <p className="mt-1 text-neutral-200">
                          {installment.interest_rate}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailsModal(installment)}
                        className="flex-1 rounded-2xl text-neutral-300 hover:bg-neutral-800 hover:text-white"
                        data-testid={`view-installment-${installment.id}`}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Detalhes
                      </Button>

                      {installment.status !== 'paid' && (
                        <Button
                          size="sm"
                          onClick={() => handlePayInstallment(installment.id)}
                          disabled={payingId === installment.id}
                          className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                          data-testid={`pay-installment-${installment.id}`}
                        >
                          {payingId === installment.id ? '...' : 'Pagar'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-neutral-800 bg-neutral-900 text-neutral-50 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                Detalhes da Parcela
              </DialogTitle>
            </DialogHeader>

            {selectedInstallment && (
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-500/20 bg-blue-600/10">
                      <User className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-50">
                        {selectedInstallment.customer_name}
                      </h3>
                      <p className="text-sm text-neutral-400">
                        Parcela {selectedInstallment.number} de{' '}
                        {selectedInstallment.total_installments}
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

                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Valor Original
                      </p>
                      <p className="text-xl font-semibold text-neutral-50">
                        {formatCurrency(selectedInstallment.amount)}
                      </p>
                    </div>

                    {selectedInstallment.status === 'overdue' && (
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          Valor Atualizado
                        </p>
                        <p className="text-xl font-semibold text-rose-400">
                          {formatCurrency(selectedInstallment.updated_amount)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Vencimento
                    </p>
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Calendar className="h-4 w-4 text-neutral-500" />
                      <span>{formatDate(selectedInstallment.due_date)}</span>
                    </div>
                  </div>

                  {selectedInstallment.paid_at && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Data de Pagamento
                      </p>
                      <div className="flex items-center gap-2 text-neutral-300">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span>{formatDateTime(selectedInstallment.paid_at)}</span>
                      </div>
                    </div>
                  )}

                  {selectedInstallment.days_overdue > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Dias em Atraso
                      </p>
                      <div className="flex items-center gap-2 text-rose-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-semibold">
                          {selectedInstallment.days_overdue} dias
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Taxa de Juros
                    </p>
                    <div className="flex items-center gap-2 text-neutral-300">
                      <TrendingUp className="h-4 w-4 text-neutral-500" />
                      <span>{selectedInstallment.interest_rate}% ao mês</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-800 pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Empréstimo Relacionado
                  </p>

                  <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-neutral-500" />
                      <div>
                        <p className="text-neutral-300">
                          Valor: {formatCurrency(selectedInstallment.loan_amount)}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Total: {formatCurrency(selectedInstallment.loan_total)}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        navigate(`/loans/${selectedInstallment.loan_id}`);
                      }}
                      className="rounded-2xl text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                    >
                      Ver Empréstimo
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              {selectedInstallment && selectedInstallment.status !== 'paid' && (
                <Button
                  onClick={() => handlePayInstallment(selectedInstallment.id)}
                  disabled={payingId === selectedInstallment.id}
                  className="w-full rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
                  data-testid="pay-installment-modal"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {payingId === selectedInstallment.id
                    ? 'Registrando...'
                    : 'Marcar como Paga'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
};

export default Installments;