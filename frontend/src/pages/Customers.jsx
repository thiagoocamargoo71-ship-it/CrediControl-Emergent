import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API, formatApiErrorDetail } from '../App';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Users } from 'lucide-react';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Plus,
  Edit2,
  Trash2,
  Phone,
  FileText,
  User,
  Search,
  Eye,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  UserPlus,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  document: '',
  address: '',
  notes: '',
  is_referral: false,
  referral_name: '',
  referral_phone: '',
};

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [customerStatuses, setCustomerStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data || []);

      const statuses = {};
      for (const customer of response.data || []) {
        try {
          const statusRes = await axios.get(`${API}/customers/${customer.id}/status`);
          statuses[customer.id] = statusRes.data;
        } catch (error) {
          statuses[customer.id] = { status: 'no_loans', label: 'Sem Empréstimo' };
        }
      }
      setCustomerStatuses(statuses);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchCustomers();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchCustomers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        referral_name: formData.is_referral ? formData.referral_name : null,
        referral_phone: formData.is_referral ? formData.referral_phone : null,
      };

      if (selectedCustomer && !isDetailsModalOpen) {
        await axios.put(`${API}/customers/${selectedCustomer.id}`, payload);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await axios.post(`${API}/customers`, payload);
        toast.success('Cliente criado com sucesso!');
      }

      fetchCustomers();
      closeModal();
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao salvar cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;

    try {
      await axios.delete(`${API}/customers/${selectedCustomer.id}`);
      toast.success('Cliente excluído com sucesso!');
      fetchCustomers();
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao excluir cliente');
    }
  };

  const openModal = (customer = null) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        document: customer.document || '',
        address: customer.address || '',
        notes: customer.notes || '',
        is_referral: customer.is_referral || false,
        referral_name: customer.referral_name || '',
        referral_phone: customer.referral_phone || '',
      });
    } else {
      setSelectedCustomer(null);
      setFormData(emptyForm);
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    setFormData(emptyForm);
  };

  const openDetailsModal = async (customer) => {
    setSelectedCustomer(customer);

    try {
      const statusRes = await axios.get(`${API}/customers/${customer.id}/status`);
      setCustomerStatuses((prev) => ({ ...prev, [customer.id]: statusRes.data }));
    } catch (error) {
      console.error('Error fetching status:', error);
    }

    setIsDetailsModalOpen(true);
  };

  const handleViewLoans = (customerId) => {
    setIsDetailsModalOpen(false);
    navigate(`/loans?customer=${customerId}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getStatusConfig = (status) => {
    const configs = {
      on_time: {
        badge: 'border-emerald-500/20 bg-emerald-500/8 text-emerald-400',
        icon: CheckCircle,
        iconWrap: 'border-emerald-500/18 bg-emerald-500/8 text-emerald-400',
        subtleText: 'text-emerald-400',
      },
      overdue: {
        badge: 'border-rose-500/20 bg-rose-500/8 text-rose-400',
        icon: AlertTriangle,
        iconWrap: 'border-rose-500/18 bg-rose-500/8 text-rose-400',
        subtleText: 'text-rose-400',
      },
      no_loans: {
        badge: 'border-amber-500/20 bg-amber-500/8 text-amber-400',
        icon: Clock,
        iconWrap: 'border-amber-500/18 bg-amber-500/8 text-amber-400',
        subtleText: 'text-amber-400',
      },
    };

    return configs[status] || configs.no_loans;
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
  );

  const rightAction = (
    <Button
      onClick={() => openModal()}
      className="h-11 rounded-2xl border border-blue-400/20 bg-blue-500 px-4 text-white shadow-[0_10px_30px_rgba(59,130,246,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-400"
      data-testid="add-customer-button"
    >
      <Plus className="mr-2 h-4 w-4" />
      <span className="hidden sm:inline">Novo Cliente</span>
    </Button>
  );

  if (loading) {
    return (
      <AppShell
        title="Gerencie seus clientes"
        headerVariant="premium"
        headerIcon={Users}
        headerBadge="Gestão de clientes"
      >
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Gerencie seus clientes"
      rightAction={rightAction}
      headerVariant="premium"
      headerIcon={Users}
      headerBadge="Gestão de clientes"
    >
      <div data-testid="customers-page" className="space-y-8 lg:space-y-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-xl flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 rounded-2xl border-white/8 bg-neutral-900/90 pl-11 text-neutral-50 placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-0"
              data-testid="search-customers-input"
            />
          </div>

          <div className="flex items-center gap-2 self-start rounded-2xl border border-white/8 bg-neutral-900/80 px-4 py-3 text-sm text-neutral-400">
            <Users className="h-4 w-4 text-neutral-500" />
            <span>
              {filteredCustomers.length}{' '}
              {filteredCustomers.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
            </span>
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(22,22,27,0.96)_0%,rgba(15,15,19,0.98)_100%)] p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.20)] sm:p-12">
            <User className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
            <h3 className="mb-2 text-lg font-medium text-neutral-50">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h3>
            <p className="mb-6 text-neutral-500">
              {searchTerm ? 'Tente outra busca' : 'Comece adicionando seu primeiro cliente'}
            </p>

            {!searchTerm && (
              <Button
                onClick={() => openModal()}
                className="rounded-2xl bg-blue-500 text-white hover:bg-blue-400"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Cliente
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCustomers.map((customer, index) => {
              const status = customerStatuses[customer.id];
              const statusConfig = getStatusConfig(status?.status);
              const StatusIcon = statusConfig.icon;
              const initial = customer.name?.charAt(0)?.toUpperCase() || '?';

              return (
                <div
                  key={customer.id}
                  className={`group relative overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(23,23,28,0.97)_0%,rgba(15,15,19,0.99)_100%)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/12 hover:shadow-[0_24px_55px_rgba(0,0,0,0.24)] animate-fade-in-delay-${Math.min(index % 3, 2)}`}
                  data-testid={`customer-card-${customer.id}`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_28%)] opacity-80" />

                  <div className="relative">
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-500/15 bg-blue-500/8 shadow-inner">
                          <span className="text-lg font-semibold text-blue-400">
                            {initial}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold tracking-tight text-neutral-50">
                            {customer.name}
                          </h3>

                          {customer.is_referral ? (
                            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-blue-500/15 bg-blue-500/6 px-2.5 py-1 text-[11px] text-blue-300">
                              <UserPlus className="h-3 w-3" />
                              Indicação
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {status ? (
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${statusConfig.iconWrap}`}
                        >
                          <StatusIcon className="h-4.5 w-4.5" />
                        </div>
                      ) : null}
                    </div>

                    {status ? (
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <Badge
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusConfig.badge}`}
                        >
                          {status.label}
                        </Badge>

                        {status.total_loans > 0 ? (
                          <span className="text-xs text-neutral-500">
                            {status.total_loans} empréstimo{status.total_loans > 1 ? 's' : ''}
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="rounded-[22px] border border-white/6 bg-black/22 p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-neutral-300">
                          <Phone className="h-4 w-4 shrink-0 text-neutral-500" />
                          <span className="truncate">{customer.phone || '-'}</span>
                        </div>

                        {customer.email ? (
                          <div className="flex items-center gap-3 text-sm text-neutral-300">
                            <Mail className="h-4 w-4 shrink-0 text-neutral-500" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        ) : null}

                        {customer.document ? (
                          <div className="flex items-center gap-3 text-sm text-neutral-300">
                            <FileText className="h-4 w-4 shrink-0 text-neutral-500" />
                            <span className="truncate">{customer.document}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailsModal(customer)}
                        className="h-10 flex-1 justify-start rounded-2xl border border-white/8 bg-white/[0.02] px-3 text-neutral-200 transition-colors hover:bg-white/[0.04] hover:text-white"
                        data-testid={`view-customer-${customer.id}`}
                      >
                        <Eye className="mr-2 h-4 w-4 text-neutral-400" />
                        Detalhes
                        <ChevronRight className="ml-auto h-4 w-4 text-neutral-500" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="h-10 w-10 rounded-2xl border border-white/8 bg-white/[0.02] p-0 text-neutral-400 hover:bg-rose-500/10 hover:text-rose-400"
                        data-testid={`delete-customer-${customer.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-white/8 bg-neutral-900 text-neutral-50 sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {selectedCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name" className="text-neutral-300">
                    Nome *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome do cliente"
                      className="h-11 rounded-2xl border-white/8 bg-neutral-950 pl-10 text-neutral-50"
                      required
                      data-testid="customer-name-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-neutral-300">
                    Telefone *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="h-11 rounded-2xl border-white/8 bg-neutral-950 pl-10 text-neutral-50"
                      required
                      data-testid="customer-phone-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-neutral-300">
                    E-mail
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="h-11 rounded-2xl border-white/8 bg-neutral-950 pl-10 text-neutral-50"
                      data-testid="customer-email-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document" className="text-neutral-300">
                    Documento
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                      id="document"
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                      placeholder="CPF ou RG"
                      className="h-11 rounded-2xl border-white/8 bg-neutral-950 pl-10 text-neutral-50"
                      data-testid="customer-document-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-neutral-300">
                    Endereço
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, número, bairro, cidade"
                      className="h-11 rounded-2xl border-white/8 bg-neutral-950 pl-10 text-neutral-50"
                      data-testid="customer-address-input"
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes" className="text-neutral-300">
                    Observações
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Anotações sobre o cliente..."
                    className="min-h-[90px] rounded-2xl border-white/8 bg-neutral-950 text-neutral-50"
                    data-testid="customer-notes-input"
                  />
                </div>

                <div className="border-t border-white/8 pt-4 sm:col-span-2">
                  <div className="mb-4 flex items-center space-x-2">
                    <Checkbox
                      id="is_referral"
                      checked={!!formData.is_referral}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_referral: Boolean(checked) })
                      }
                      className="border-neutral-600 data-[state=checked]:bg-blue-600"
                      data-testid="customer-referral-checkbox"
                    />
                    <Label
                      htmlFor="is_referral"
                      className="flex cursor-pointer items-center gap-2 text-neutral-300"
                    >
                      <UserPlus className="h-4 w-4 text-blue-400" />
                      Este cliente foi indicado
                    </Label>
                  </div>

                  {formData.is_referral && (
                    <div className="grid grid-cols-1 gap-4 border-l-2 border-blue-500/20 pl-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="referral_name" className="text-neutral-300">
                          Nome de quem indicou
                        </Label>
                        <Input
                          id="referral_name"
                          value={formData.referral_name}
                          onChange={(e) =>
                            setFormData({ ...formData, referral_name: e.target.value })
                          }
                          placeholder="Nome do indicador"
                          className="h-11 rounded-2xl border-white/8 bg-neutral-950 text-neutral-50"
                          data-testid="customer-referral-name-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="referral_phone" className="text-neutral-300">
                          Telefone de quem indicou
                        </Label>
                        <Input
                          id="referral_phone"
                          value={formData.referral_phone}
                          onChange={(e) =>
                            setFormData({ ...formData, referral_phone: e.target.value })
                          }
                          placeholder="(00) 00000-0000"
                          className="h-11 rounded-2xl border-white/8 bg-neutral-950 text-neutral-50"
                          data-testid="customer-referral-phone-input"
                        />
                      </div>
                    </div>
                  )}
                </div>
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
                  {submitting
                    ? 'Salvando...'
                    : selectedCustomer
                    ? 'Salvar alterações'
                    : 'Criar cliente'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-white/8 bg-neutral-900 text-neutral-50 sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Detalhes do Cliente
              </DialogTitle>
            </DialogHeader>

            {selectedCustomer && (
              <div className="space-y-5 py-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/15 bg-blue-500/8">
                      <span className="text-2xl font-semibold text-blue-400">
                        {selectedCustomer.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight text-neutral-50">
                        {selectedCustomer.name}
                      </h3>
                      {customerStatuses[selectedCustomer.id] && (
                        <div className="mt-2">
                          <Badge
                            className={`${getStatusConfig(customerStatuses[selectedCustomer.id]?.status).badge} border rounded-full`}
                          >
                            {customerStatuses[selectedCustomer.id]?.label}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedCustomer.is_referral && (
                    <Badge className="w-fit rounded-full border border-blue-500/15 bg-blue-500/8 text-blue-300">
                      <UserPlus className="mr-1 h-3 w-3" />
                      Cliente indicado
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-neutral-950 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Contato
                    </p>
                    <div className="space-y-2 text-sm text-neutral-300">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-neutral-500" />
                        <span>{selectedCustomer.phone || '-'}</span>
                      </div>
                      {selectedCustomer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-neutral-500" />
                          <span className="break-all">{selectedCustomer.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-neutral-950 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Dados adicionais
                    </p>
                    <div className="space-y-2 text-sm text-neutral-300">
                      {selectedCustomer.document && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-neutral-500" />
                          <span>{selectedCustomer.document}</span>
                        </div>
                      )}
                      {selectedCustomer.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 text-neutral-500" />
                          <span>{selectedCustomer.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedCustomer.is_referral &&
                  (selectedCustomer.referral_name || selectedCustomer.referral_phone) && (
                    <div className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.04] p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-300">
                        Indicação
                      </p>

                      <div className="space-y-2 text-sm text-neutral-300">
                        {selectedCustomer.referral_name && (
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-blue-400" />
                            <span>{selectedCustomer.referral_name}</span>
                          </div>
                        )}
                        {selectedCustomer.referral_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-blue-400" />
                            <span>{selectedCustomer.referral_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {selectedCustomer.notes && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Observações
                    </p>
                    <p className="rounded-2xl border border-white/8 bg-neutral-950 p-4 text-neutral-300">
                      {selectedCustomer.notes}
                    </p>
                  </div>
                )}

                <div className="border-t border-white/8 pt-4">
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Calendar className="h-4 w-4" />
                    <span>Cadastrado em {formatDate(selectedCustomer.created_at)}</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              {customerStatuses[selectedCustomer?.id]?.total_loans > 0 && (
                <Button
                  onClick={() => handleViewLoans(selectedCustomer.id)}
                  className="w-full rounded-2xl border border-emerald-500/15 bg-emerald-500/90 text-white hover:bg-emerald-500 sm:w-auto"
                  data-testid="view-customer-loans"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Consultar Empréstimos
                </Button>
              )}

              <Button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  openModal(selectedCustomer);
                }}
                className="w-full rounded-2xl bg-blue-500 text-white hover:bg-blue-400 sm:w-auto"
                data-testid="edit-customer-from-details"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Editar Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="border-white/8 bg-neutral-900">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-neutral-50">
                Excluir Cliente
              </AlertDialogTitle>
              <AlertDialogDescription className="text-neutral-400">
                Tem certeza que deseja excluir o cliente "{selectedCustomer?.name}"?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
              <AlertDialogCancel className="border-white/8 bg-neutral-950 text-neutral-300 hover:bg-neutral-900 hover:text-white">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-rose-600 text-white hover:bg-rose-500"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  );
};

export default Customers;