import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API, formatApiErrorDetail } from '../App';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Wallet } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import {
  Plus,
  Eye,
  Trash2,
  DollarSign,
  Percent,
  Calendar as CalendarIcon,
  CreditCard,
  Search,
  X,
  User,
  FileText,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const initialFormState = {
  customer_id: '',
  amount: '',
  interest_rate: '',
  number_of_installments: '',
  interval_days: '30',
};

const Loans = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const customerFilter = searchParams.get('customer');

  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [filterCustomerName, setFilterCustomerName] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (customerFilter && customers.length > 0) {
      const customer = customers.find((c) => c.id === customerFilter);
      if (customer) {
        setFilterCustomerName(customer.name);
      }
    }
  }, [customerFilter, customers]);

  const fetchData = async () => {
    try {
      const [loansRes, customersRes, prefsRes] = await Promise.all([
        axios.get(`${API}/loans`),
        axios.get(`${API}/customers`),
        axios.get(`${API}/settings/preferences`),
      ]);

      setLoans(loansRes.data || []);
      setCustomers(customersRes.data || []);

      if (prefsRes.data && !preferencesLoaded) {
        setFormData((prev) => ({
          ...prev,
          interest_rate:
            prefsRes.data.default_interest_rate?.toString() || prev.interest_rate,
          interval_days:
            prefsRes.data.default_interval_days?.toString() || prev.interval_days,
        }));
        setPreferencesLoaded(true);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultPreferences = useCallback(async () => {
    try {
      const prefsRes = await axios.get(`${API}/settings/preferences`);
      setFormData({
        customer_id: '',
        amount: '',
        interest_rate: prefsRes.data.default_interest_rate?.toString() || '',
        number_of_installments: '',
        interval_days: prefsRes.data.default_interval_days?.toString() || '30',
      });
    } catch {
      setFormData(initialFormState);
    }
  }, []);

  const openModal = useCallback(async () => {
    await loadDefaultPreferences();
    setStartDate(new Date());
    setIsModalOpen(true);
  }, [loadDefaultPreferences]);

  const clearFilter = () => {
    setSearchParams({});
    setFilterCustomerName(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        customer_id: formData.customer_id,
        amount: parseFloat(formData.amount),
        interest_rate: parseFloat(formData.interest_rate),
        number_of_installments: parseInt(formData.number_of_installments, 10),
        start_date: startDate.toISOString().split('T')[0],
        interval_days: parseInt(formData.interval_days, 10),
      };

      await axios.post(`${API}/loans`, payload);
      toast.success('Empréstimo criado com sucesso!');
      fetchData();
      closeModal();
    } catch (error) {
      toast.error(
        formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao criar empréstimo'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (loanId) => {
    if (!window.confirm('Tem certeza que deseja excluir este empréstimo?')) return;

    try {
      await axios.delete(`${API}/loans/${loanId}`);
      toast.success('Empréstimo excluído com sucesso!');
      fetchData();
    } catch (error) {
      toast.error(
        formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao excluir empréstimo'
      );
    }
  };

  const closeModal = async () => {
    setIsModalOpen(false);
    await loadDefaultPreferences();
    setStartDate(new Date());
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const calculatePreview = () => {
    if (!formData.amount || !formData.interest_rate || !formData.number_of_installments) {
      return null;
    }

    const amount = parseFloat(formData.amount);
    const rate = parseFloat(formData.interest_rate);
    const total = amount + (amount * rate) / 100;
    const installment = total / parseInt(formData.number_of_installments, 10);

    return { total, installment };
  };

  const preview = calculatePreview();

  const filteredLoans = loans.filter((loan) => {
    if (customerFilter && loan.customer_id !== customerFilter) return false;
    return loan.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const rightAction = (
    <Button
      onClick={openModal}
      className="h-11 rounded-2xl border border-blue-400/20 bg-blue-500 px-4 text-white shadow-[0_10px_30px_rgba(59,130,246,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-400"
      disabled={customers.length === 0}
      data-testid="add-loan-button"
    >
      <Plus className="mr-2 h-4 w-4" />
      <span className="hidden sm:inline">Novo Empréstimo</span>
    </Button>
  );

  if (loading) {
    return (
      <AppShell
        title="Gerencie seus empréstimos"
        headerVariant="premium"
        headerIcon={Wallet}
        headerBadge="Operação financeira"
      >
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Gerencie seus empréstimos"
      rightAction={rightAction}
      headerVariant="premium"
      headerIcon={Wallet}
      headerBadge="Operação financeira"
    >
      <div data-testid="loans-page" className="space-y-8 lg:space-y-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-xl flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              type="text"
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 rounded-2xl border-white/8 bg-neutral-900/90 pl-11 text-neutral-50 placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-0"
              data-testid="search-loans-input"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {customerFilter && filterCustomerName ? (
              <Badge className="flex w-fit items-center gap-2 rounded-full border border-blue-500/15 bg-blue-500/8 px-4 py-2 text-sm text-blue-300">
                <User className="h-4 w-4" />
                Filtrando por
                <span className="font-semibold text-blue-200">{filterCustomerName}</span>
                <button
                  onClick={clearFilter}
                  className="ml-1 text-blue-300 transition-colors hover:text-white"
                  data-testid="clear-customer-filter"
                >
                  <X className="h-4 w-4" />
                </button>
              </Badge>
            ) : null}

            <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-neutral-900/80 px-4 py-3 text-sm text-neutral-400">
              <Wallet className="h-4 w-4 text-neutral-500" />
              <span>
                {filteredLoans.length}{' '}
                {filteredLoans.length === 1 ? 'empréstimo encontrado' : 'empréstimos encontrados'}
              </span>
            </div>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(22,22,27,0.96)_0%,rgba(15,15,19,0.98)_100%)] p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.20)] sm:p-12">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
            <h3 className="mb-2 text-lg font-medium text-neutral-50">
              Cadastre um cliente primeiro
            </h3>
            <p className="mb-6 text-neutral-500">
              Você precisa ter pelo menos um cliente cadastrado para criar empréstimos
            </p>
            <Button
              onClick={() => navigate('/customers')}
              className="rounded-2xl bg-blue-500 text-white hover:bg-blue-400"
            >
              Ir para Clientes
            </Button>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(22,22,27,0.96)_0%,rgba(15,15,19,0.98)_100%)] p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.20)] sm:p-12">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
            <h3 className="mb-2 text-lg font-medium text-neutral-50">
              {searchTerm ? 'Nenhum empréstimo encontrado' : 'Nenhum empréstimo cadastrado'}
            </h3>
            <p className="mb-6 text-neutral-500">
              {searchTerm ? 'Tente outra busca' : 'Comece criando seu primeiro empréstimo'}
            </p>
            {!searchTerm && (
              <Button
                onClick={openModal}
                className="rounded-2xl bg-blue-500 text-white hover:bg-blue-400"
                data-testid="add-customer-button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Empréstimo
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(23,23,28,0.97)_0%,rgba(15,15,19,0.99)_100%)] shadow-[0_18px_40px_rgba(0,0,0,0.18)] lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead>
                    <tr className="border-b border-white/8 bg-white/[0.02]">
                      <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                        Valor
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                        Juros
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                        Total
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                        Parcelas
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                        Data início
                      </th>
                      <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoans.map((loan) => (
                      <tr
                        key={loan.id}
                        className="border-b border-white/6 transition-colors hover:bg-white/[0.025]"
                        data-testid={`loan-row-${loan.id}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-500/15 bg-blue-500/8">
                              <span className="text-sm font-semibold text-blue-400">
                                {loan.customer_name?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-neutral-100">
                                {loan.customer_name}
                              </p>
                              <p className="text-sm text-neutral-500">Operação ativa</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-neutral-300">
                          {formatCurrency(loan.amount)}
                        </td>
                        <td className="px-6 py-4 font-mono text-neutral-300">
                          {loan.interest_rate}%
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-emerald-400">
                          {formatCurrency(loan.total_amount)}
                        </td>
                        <td className="px-6 py-4 text-neutral-300">
                          {loan.number_of_installments}x
                          <span className="ml-1 text-neutral-500">
                            ({loan.interval_days} dias)
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-neutral-400">
                          {formatDate(loan.start_date)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/loans/${loan.id}`)}
                              className="h-10 rounded-2xl border border-white/8 bg-white/[0.02] px-3 text-neutral-300 hover:bg-white/[0.04] hover:text-white"
                              data-testid={`contract-loan-${loan.id}`}
                              title="Contrato"
                            >
                              <FileText className="mr-2 h-4 w-4 text-neutral-400" />
                              Contrato
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/loans/${loan.id}`)}
                              className="h-10 rounded-2xl border border-white/8 bg-white/[0.02] px-3 text-neutral-300 hover:bg-white/[0.04] hover:text-white"
                              data-testid={`view-loan-${loan.id}`}
                              title="Visualizar"
                            >
                              <Eye className="mr-2 h-4 w-4 text-neutral-400" />
                              Ver
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(loan.id)}
                              className="h-10 w-10 rounded-2xl border border-white/8 bg-white/[0.02] p-0 text-neutral-400 hover:bg-rose-500/10 hover:text-rose-400"
                              data-testid={`delete-loan-${loan.id}`}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:hidden">
              {filteredLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="group relative overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(23,23,28,0.97)_0%,rgba(15,15,19,0.99)_100%)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
                  data-testid={`loan-row-${loan.id}`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_28%)] opacity-80" />

                  <div className="relative">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold tracking-tight text-neutral-50">
                          {loan.customer_name}
                        </p>
                        <p className="mt-1 text-sm text-neutral-500">
                          Início em {formatDate(loan.start_date)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/8 px-3 py-2 text-right">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-300">
                          Total
                        </p>
                        <p className="font-mono text-sm font-semibold text-emerald-400">
                          {formatCurrency(loan.total_amount)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-white/6 bg-black/22 p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                            Valor
                          </p>
                          <p className="mt-1 font-mono text-sm text-neutral-200">
                            {formatCurrency(loan.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                            Juros
                          </p>
                          <p className="mt-1 font-mono text-sm text-neutral-200">
                            {loan.interest_rate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                            Parcelas
                          </p>
                          <p className="mt-1 text-sm text-neutral-200">
                            {loan.number_of_installments}x
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                            Intervalo
                          </p>
                          <p className="mt-1 text-sm text-neutral-200">
                            {loan.interval_days} dias
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/loans/${loan.id}`)}
                        className="h-10 w-full justify-start rounded-2xl border border-white/8 bg-white/[0.02] px-3 text-neutral-200 hover:bg-white/[0.04] hover:text-white"
                        data-testid={`contract-loan-${loan.id}`}
                      >
                        <FileText className="mr-2 h-4 w-4 text-neutral-400" />
                        Ver contrato
                        <ArrowUpRight className="ml-auto h-4 w-4 text-neutral-500" />
                      </Button>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/loans/${loan.id}`)}
                          className="h-10 rounded-2xl border border-white/8 bg-white/[0.02] text-neutral-300 hover:bg-white/[0.04] hover:text-white"
                          data-testid={`view-loan-${loan.id}`}
                        >
                          <Eye className="mr-2 h-4 w-4 text-neutral-400" />
                          Detalhes
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(loan.id)}
                          className="h-10 rounded-2xl border border-white/8 bg-white/[0.02] text-neutral-400 hover:bg-rose-500/10 hover:text-rose-400"
                          data-testid={`delete-loan-${loan.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-white/8 bg-neutral-900 text-neutral-50 sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Novo Empréstimo
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                {(formData.interest_rate || formData.interval_days) && preferencesLoaded && (
                  <div className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.04] p-3">
                    <p className="text-xs text-blue-300">
                      Valores preenchidos automaticamente com base nas suas configurações
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-neutral-300">Cliente *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  >
                    <SelectTrigger
                      className="h-11 rounded-2xl border-white/8 bg-neutral-950 text-neutral-50"
                      data-testid="loan-customer-select"
                    >
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent className="border-white/8 bg-neutral-900">
                      {customers.map((customer) => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id}
                          className="text-neutral-50 focus:bg-neutral-800"
                        >
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-neutral-300">
                      Valor *
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0,00"
                        className="h-11 rounded-2xl border-white/8 bg-neutral-950 pl-10 text-neutral-50"
                        required
                        data-testid="loan-amount-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interest_rate" className="text-neutral-300">
                      Juros (%) *
                    </Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                      <Input
                        id="interest_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.interest_rate}
                        onChange={(e) =>
                          setFormData({ ...formData, interest_rate: e.target.value })
                        }
                        placeholder="0"
                        className="h-11 rounded-2xl border-white/8 bg-neutral-950 pl-10 text-neutral-50"
                        required
                        data-testid="loan-interest-rate-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="number_of_installments" className="text-neutral-300">
                      Parcelas *
                    </Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                      <Input
                        id="number_of_installments"
                        type="number"
                        min="1"
                        value={formData.number_of_installments}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            number_of_installments: e.target.value,
                          })
                        }
                        placeholder="Ex: 12"
                        className="h-11 rounded-2xl border-white/8 bg-neutral-950 pl-10 text-neutral-50"
                        required
                        data-testid="loan-installments-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interval_days" className="text-neutral-300">
                      Intervalo (dias) *
                    </Label>
                    <Input
                      id="interval_days"
                      type="number"
                      min="1"
                      value={formData.interval_days}
                      onChange={(e) =>
                        setFormData({ ...formData, interval_days: e.target.value })
                      }
                      placeholder="30"
                      className="h-11 rounded-2xl border-white/8 bg-neutral-950 text-neutral-50"
                      required
                      data-testid="loan-interval-days-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-300">Data inicial *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-11 w-full justify-start rounded-2xl border-white/8 bg-neutral-950 text-left text-neutral-50 hover:bg-neutral-900"
                        data-testid="loan-date-picker"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate
                          ? format(startDate, 'PPP', { locale: ptBR })
                          : 'Selecione uma data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto border-white/8 bg-neutral-900 p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        locale={ptBR}
                        className="text-neutral-50"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {preview && (
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/8 bg-neutral-950/80 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                        Total estimado
                      </p>
                      <p className="mt-1 font-mono text-lg font-semibold text-neutral-50">
                        {formatCurrency(preview.total)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                        Parcela estimada
                      </p>
                      <p className="mt-1 font-mono text-lg font-semibold text-emerald-400">
                        {formatCurrency(preview.installment)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeModal}
                  className="w-full rounded-2xl border border-white/8 text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-50 sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-blue-500 text-white hover:bg-blue-400 sm:w-auto"
                >
                  {submitting ? 'Criando...' : 'Criar empréstimo'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
};

export default Loans;