import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API, formatApiErrorDetail } from '../App';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [formData, setFormData] = useState({
    customer_id: '',
    amount: '',
    interest_rate: '',
    number_of_installments: '',
    interval_days: '30',
  });
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
      setFormData({
        customer_id: '',
        amount: '',
        interest_rate: '',
        number_of_installments: '',
        interval_days: '30',
      });
    }

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
      onClick={() => setIsModalOpen(true)}
      className="h-11 rounded-2xl bg-blue-600 px-4 text-white hover:bg-blue-700"
      disabled={customers.length === 0}
      data-testid="add-loan-button"
    >
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">Novo Empréstimo</span>
    </Button>
  );

  if (loading) {
    return (
      <AppShell title="Empréstimos" subtitle="Gerencie seus empréstimos" rightAction={rightAction}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Empréstimos"
      subtitle="Gerencie seus empréstimos"
      rightAction={rightAction}
    >
      <div data-testid="loans-page">
        
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-xl flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
            <Input
              type="text"
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 rounded-2xl border-neutral-800 bg-neutral-900 pl-10 text-neutral-50 placeholder:text-neutral-600"
              data-testid="search-loans-input"
            />
          </div>

          {customerFilter && filterCustomerName && (
            <Badge className="flex w-fit items-center gap-2 border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
              <User className="h-4 w-4" />
              Filtrando por:
              <span className="font-semibold">{filterCustomerName}</span>
              <button
                onClick={clearFilter}
                className="ml-1 hover:text-blue-300"
                data-testid="clear-customer-filter"
              >
                <X className="h-4 w-4" />
              </button>
            </Badge>
          )}
        </div>

        {customers.length === 0 ? (
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-8 text-center sm:p-12">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
            <h3 className="mb-2 text-lg font-medium text-neutral-50">
              Cadastre um cliente primeiro
            </h3>
            <p className="mb-6 text-neutral-500">
              Você precisa ter pelo menos um cliente cadastrado para criar empréstimos
            </p>
            <Button
              onClick={() => navigate('/customers')}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Ir para Clientes
            </Button>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-8 text-center sm:p-12">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
            <h3 className="mb-2 text-lg font-medium text-neutral-50">
              {searchTerm ? 'Nenhum empréstimo encontrado' : 'Nenhum empréstimo cadastrado'}
            </h3>
            <p className="mb-6 text-neutral-500">
              {searchTerm ? 'Tente outra busca' : 'Comece criando seu primeiro empréstimo'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Empréstimo
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Valor
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Juros
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Total
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Parcelas
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Data Início
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoans.map((loan) => (
                      <tr
                        key={loan.id}
                        className="border-b border-neutral-800/50 transition-colors hover:bg-neutral-800/30"
                        data-testid={`loan-row-${loan.id}`}
                      >
                        <td className="px-6 py-4 text-neutral-50">{loan.customer_name}</td>
                        <td className="px-6 py-4 font-mono text-neutral-300">
                          {formatCurrency(loan.amount)}
                        </td>
                        <td className="px-6 py-4 font-mono text-neutral-300">
                          {loan.interest_rate}%
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-emerald-500">
                          {formatCurrency(loan.total_amount)}
                        </td>
                        <td className="px-6 py-4 text-neutral-300">
                          {loan.number_of_installments}x ({loan.interval_days} dias)
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
                              className="rounded-2xl text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                              data-testid={`contract-loan-${loan.id}`}
                              title="Contrato"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/loans/${loan.id}`)}
                              className="rounded-2xl text-neutral-400 hover:bg-neutral-800 hover:text-neutral-50"
                              data-testid={`view-loan-${loan.id}`}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(loan.id)}
                              className="rounded-2xl text-neutral-400 hover:bg-rose-500/10 hover:text-rose-500"
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

            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {filteredLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5"
                  data-testid={`loan-row-${loan.id}`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-neutral-50">
                        {loan.customer_name}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">
                        Início em {formatDate(loan.start_date)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-right">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-300">
                        Total
                      </p>
                      <p className="font-mono text-sm font-semibold text-emerald-400">
                        {formatCurrency(loan.total_amount)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-500">Valor</p>
                      <p className="mt-1 font-mono text-sm text-neutral-200">
                        {formatCurrency(loan.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-500">Juros</p>
                      <p className="mt-1 font-mono text-sm text-neutral-200">
                        {loan.interest_rate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-500">
                        Parcelas
                      </p>
                      <p className="mt-1 text-sm text-neutral-200">
                        {loan.number_of_installments}x
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-500">
                        Intervalo
                      </p>
                      <p className="mt-1 text-sm text-neutral-200">
                        {loan.interval_days} dias
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/loans/${loan.id}`)}
                      className="rounded-2xl text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                      data-testid={`contract-loan-${loan.id}`}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Contrato
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/loans/${loan.id}`)}
                      className="rounded-2xl text-neutral-300 hover:bg-neutral-800 hover:text-white"
                      data-testid={`view-loan-${loan.id}`}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(loan.id)}
                      className="rounded-2xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                      data-testid={`delete-loan-${loan.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-neutral-800 bg-neutral-900 text-neutral-50 sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Novo Empréstimo</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                {(formData.interest_rate || formData.interval_days) && preferencesLoaded && (
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3">
                    <p className="text-xs text-blue-400">
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
                      className="h-11 rounded-2xl border-neutral-800 bg-neutral-950 text-neutral-50"
                      data-testid="loan-customer-select"
                    >
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent className="border-neutral-800 bg-neutral-900">
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
                        className="h-11 rounded-2xl border-neutral-800 bg-neutral-950 pl-10 text-neutral-50"
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
                        className="h-11 rounded-2xl border-neutral-800 bg-neutral-950 pl-10 text-neutral-50"
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
                        className="h-11 rounded-2xl border-neutral-800 bg-neutral-950 pl-10 text-neutral-50"
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
                      className="h-11 rounded-2xl border-neutral-800 bg-neutral-950 text-neutral-50"
                      required
                      data-testid="loan-interval-days-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-300">Data Inicial *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-11 w-full justify-start rounded-2xl border-neutral-800 bg-neutral-950 text-left text-neutral-50 hover:bg-neutral-900"
                        data-testid="loan-date-picker"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate
                          ? format(startDate, 'PPP', { locale: ptBR })
                          : 'Selecione uma data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto border-neutral-800 bg-neutral-900 p-0"
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
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-500">
                        Total estimado
                      </p>
                      <p className="mt-1 font-mono text-lg font-semibold text-neutral-50">
                        {formatCurrency(preview.total)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-500">
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
                  className="w-full rounded-2xl text-neutral-400 hover:text-neutral-50 sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
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