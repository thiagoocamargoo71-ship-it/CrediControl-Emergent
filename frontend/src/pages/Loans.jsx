import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API, formatApiErrorDetail } from '../App';
import Sidebar from '../components/Sidebar';
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
  User
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
    interval_days: '30'
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Set filter customer name when data is loaded
  useEffect(() => {
    if (customerFilter && customers.length > 0) {
      const customer = customers.find(c => c.id === customerFilter);
      if (customer) {
        setFilterCustomerName(customer.name);
      }
    }
  }, [customerFilter, customers]);

  const fetchData = async () => {
    try {
      const [loansRes, customersRes] = await Promise.all([
        axios.get(`${API}/loans`),
        axios.get(`${API}/customers`)
      ]);
      setLoans(loansRes.data);
      setCustomers(customersRes.data);
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
        number_of_installments: parseInt(formData.number_of_installments),
        start_date: startDate.toISOString().split('T')[0],
        interval_days: parseInt(formData.interval_days)
      };

      await axios.post(`${API}/loans`, payload);
      toast.success('Empréstimo criado com sucesso!');
      fetchData();
      closeModal();
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao criar empréstimo');
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
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao excluir empréstimo');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      customer_id: '',
      amount: '',
      interest_rate: '',
      number_of_installments: '',
      interval_days: '30'
    });
    setStartDate(new Date());
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

  // Calculate preview
  const calculatePreview = () => {
    if (!formData.amount || !formData.interest_rate || !formData.number_of_installments) {
      return null;
    }
    const amount = parseFloat(formData.amount);
    const rate = parseFloat(formData.interest_rate);
    const total = amount + (amount * rate / 100);
    const installment = total / parseInt(formData.number_of_installments);
    return { total, installment };
  };

  const preview = calculatePreview();

  const filteredLoans = loans.filter(loan => {
    // Apply customer filter from URL
    if (customerFilter && loan.customer_id !== customerFilter) {
      return false;
    }
    // Apply search term
    return loan.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-neutral-950">
      <Sidebar />
      
      <main className="ml-64 p-8" data-testid="loans-page">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="font-heading text-3xl font-bold text-neutral-50 tracking-tight">
              Empréstimos
            </h1>
            <p className="text-neutral-400 mt-1">
              Gerencie seus empréstimos
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            disabled={customers.length === 0}
            data-testid="add-loan-button"
          >
            <Plus className="h-4 w-4" />
            Novo Empréstimo
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md animate-fade-in">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
          <Input
            type="text"
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-neutral-900 border-neutral-800 text-neutral-50 placeholder:text-neutral-600"
            data-testid="search-loans-input"
          />
        </div>

        {/* Customer Filter Badge */}
        {customerFilter && filterCustomerName && (
          <div className="mb-6 animate-fade-in">
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 border py-2 px-4 text-sm gap-2">
              <User className="h-4 w-4" />
              Filtrando por: <span className="font-semibold">{filterCustomerName}</span>
              <button
                onClick={clearFilter}
                className="ml-2 hover:text-blue-300"
                data-testid="clear-customer-filter"
              >
                <X className="h-4 w-4" />
              </button>
            </Badge>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center animate-fade-in">
            <CreditCard className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-50 mb-2">
              Cadastre um cliente primeiro
            </h3>
            <p className="text-neutral-500 mb-6">
              Você precisa ter pelo menos um cliente cadastrado para criar empréstimos
            </p>
            <Button
              onClick={() => navigate('/customers')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Ir para Clientes
            </Button>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center animate-fade-in">
            <CreditCard className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-50 mb-2">
              {searchTerm ? 'Nenhum empréstimo encontrado' : 'Nenhum empréstimo cadastrado'}
            </h3>
            <p className="text-neutral-500 mb-6">
              {searchTerm ? 'Tente outra busca' : 'Comece criando seu primeiro empréstimo'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Empréstimo
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden animate-fade-in">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Cliente
                  </th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Valor
                  </th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Juros
                  </th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Total
                  </th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Parcelas
                  </th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Data Início
                  </th>
                  <th className="text-right px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan) => (
                  <tr 
                    key={loan.id} 
                    className="border-b border-neutral-800/50 table-row-hover transition-colors"
                    data-testid={`loan-row-${loan.id}`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-neutral-50 font-medium">{loan.customer_name}</span>
                    </td>
                    <td className="px-6 py-4 text-neutral-300 font-mono">
                      {formatCurrency(loan.amount)}
                    </td>
                    <td className="px-6 py-4 text-neutral-300 font-mono">
                      {loan.interest_rate}%
                    </td>
                    <td className="px-6 py-4 text-emerald-500 font-mono font-semibold">
                      {formatCurrency(loan.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-neutral-300">
                      {loan.number_of_installments}x ({loan.interval_days} dias)
                    </td>
                    <td className="px-6 py-4 text-neutral-400 font-mono">
                      {formatDate(loan.start_date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/loans/${loan.id}`)}
                          className="text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800"
                          data-testid={`view-loan-${loan.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(loan.id)}
                          className="text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10"
                          data-testid={`delete-loan-${loan.id}`}
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
        )}

        {/* Create Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                Novo Empréstimo
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                {/* Customer Select */}
                <div className="space-y-2">
                  <Label className="text-neutral-300">Cliente *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  >
                    <SelectTrigger className="bg-neutral-950 border-neutral-800 text-neutral-50" data-testid="loan-customer-select">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
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

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-neutral-300">Valor Emprestado (R$) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="1000.00"
                      className="pl-10 bg-neutral-950 border-neutral-800 text-neutral-50"
                      required
                      data-testid="loan-amount-input"
                    />
                  </div>
                </div>

                {/* Interest Rate */}
                <div className="space-y-2">
                  <Label htmlFor="interest_rate" className="text-neutral-300">Juros Mensal (%) *</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      id="interest_rate"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.interest_rate}
                      onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                      placeholder="10"
                      className="pl-10 bg-neutral-950 border-neutral-800 text-neutral-50"
                      required
                      data-testid="loan-interest-input"
                    />
                  </div>
                </div>

                {/* Number of Installments */}
                <div className="space-y-2">
                  <Label htmlFor="installments" className="text-neutral-300">Número de Parcelas *</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="1"
                    value={formData.number_of_installments}
                    onChange={(e) => setFormData({ ...formData, number_of_installments: e.target.value })}
                    placeholder="12"
                    className="bg-neutral-950 border-neutral-800 text-neutral-50"
                    required
                    data-testid="loan-installments-input"
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label className="text-neutral-300">Data Inicial *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left bg-neutral-950 border-neutral-800 text-neutral-50 hover:bg-neutral-900"
                        data-testid="loan-date-picker"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PPP', { locale: ptBR }) : 'Selecione uma data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-800" align="start">
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

                {/* Interval */}
                <div className="space-y-2">
                  <Label className="text-neutral-300">Intervalo entre Parcelas *</Label>
                  <Select
                    value={formData.interval_days}
                    onValueChange={(value) => setFormData({ ...formData, interval_days: value })}
                  >
                    <SelectTrigger className="bg-neutral-950 border-neutral-800 text-neutral-50" data-testid="loan-interval-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
                      <SelectItem value="15" className="text-neutral-50 focus:bg-neutral-800">15 dias (Quinzenal)</SelectItem>
                      <SelectItem value="30" className="text-neutral-50 focus:bg-neutral-800">30 dias (Mensal)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview */}
                {preview && (
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 mt-4">
                    <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-3">
                      Prévia do Empréstimo
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-neutral-400">Valor Total</p>
                        <p className="text-lg font-mono font-semibold text-emerald-500">
                          {formatCurrency(preview.total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-400">Valor da Parcela</p>
                        <p className="text-lg font-mono font-semibold text-neutral-50">
                          {formatCurrency(preview.installment)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeModal}
                  className="text-neutral-400 hover:text-neutral-50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !formData.customer_id}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="save-loan-button"
                >
                  {submitting ? 'Criando...' : 'Criar Empréstimo'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Loans;
