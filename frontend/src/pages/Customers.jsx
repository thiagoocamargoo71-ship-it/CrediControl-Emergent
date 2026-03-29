import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API, formatApiErrorDetail } from '../App';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
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
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [customerStatuses, setCustomerStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    document: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
      
      // Fetch status for each customer
      const statuses = {};
      for (const customer of response.data) {
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

  // Refresh data periodically for synchronization
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCustomers();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchCustomers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (selectedCustomer && !isDetailsModalOpen) {
        await axios.put(`${API}/customers/${selectedCustomer.id}`, formData);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await axios.post(`${API}/customers`, formData);
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
        name: customer.name,
        phone: customer.phone,
        document: customer.document || '',
        notes: customer.notes || ''
      });
    } else {
      setSelectedCustomer(null);
      setFormData({ name: '', phone: '', document: '', notes: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    setFormData({ name: '', phone: '', document: '', notes: '' });
  };

  const openDetailsModal = async (customer) => {
    setSelectedCustomer(customer);
    // Refresh status when opening details
    try {
      const statusRes = await axios.get(`${API}/customers/${customer.id}/status`);
      setCustomerStatuses(prev => ({ ...prev, [customer.id]: statusRes.data }));
    } catch (error) {
      console.error('Error fetching status:', error);
    }
    setIsDetailsModalOpen(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getStatusConfig = (status) => {
    const configs = {
      on_time: {
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: CheckCircle,
        iconColor: 'text-emerald-500'
      },
      overdue: {
        color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        icon: AlertTriangle,
        iconColor: 'text-rose-500'
      },
      no_loans: {
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: Clock,
        iconColor: 'text-amber-500'
      }
    };
    return configs[status] || configs.no_loans;
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-neutral-950">
      <Sidebar />
      
      <main className="ml-64 p-8" data-testid="customers-page">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="font-heading text-3xl font-bold text-neutral-50 tracking-tight">
              Clientes
            </h1>
            <p className="text-neutral-400 mt-1">
              Gerencie seus clientes
            </p>
          </div>
          <Button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            data-testid="add-customer-button"
          >
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md animate-fade-in">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
          <Input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-neutral-900 border-neutral-800 text-neutral-50 placeholder:text-neutral-600"
            data-testid="search-customers-input"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center animate-fade-in">
            <User className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-50 mb-2">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h3>
            <p className="text-neutral-500 mb-6">
              {searchTerm ? 'Tente outra busca' : 'Comece adicionando seu primeiro cliente'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => openModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Cliente
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredCustomers.map((customer, index) => {
              const status = customerStatuses[customer.id];
              const statusConfig = getStatusConfig(status?.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={customer.id}
                  className={`bg-neutral-900 border border-neutral-800 rounded-xl p-6 card-hover animate-fade-in-delay-${Math.min(index % 3, 2)}`}
                  data-testid={`customer-card-${customer.id}`}
                >
                  {/* Customer Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                        <span className="text-blue-500 text-lg font-bold">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-neutral-50 font-semibold">{customer.name}</h3>
                        <div className="flex items-center gap-1 text-neutral-400 text-sm mt-0.5">
                          <Phone className="h-3 w-3" />
                          <span className="font-mono">{customer.phone}</span>
                        </div>
                      </div>
                    </div>
                    {status && (
                      <div className={`p-2 rounded-lg border ${statusConfig.color}`}>
                        <StatusIcon className={`h-4 w-4 ${statusConfig.iconColor}`} />
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  {status && (
                    <div className="mb-4">
                      <Badge className={`${statusConfig.color} border font-medium`}>
                        {status.label}
                      </Badge>
                      {status.total_loans > 0 && (
                        <span className="text-neutral-500 text-xs ml-2">
                          {status.total_loans} empréstimo{status.total_loans > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Document if exists */}
                  {customer.document && (
                    <div className="flex items-center gap-2 text-neutral-400 text-sm mb-4">
                      <FileText className="h-4 w-4" />
                      <span>{customer.document}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-4 border-t border-neutral-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetailsModal(customer)}
                      className="flex-1 text-neutral-400 hover:text-blue-500 hover:bg-blue-500/10 gap-2"
                      data-testid={`view-customer-${customer.id}`}
                    >
                      <Eye className="h-4 w-4" />
                      Detalhes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(customer)}
                      className="text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800"
                      data-testid={`edit-customer-${customer.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10"
                      data-testid={`delete-customer-${customer.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                {selectedCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-neutral-300">Nome *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome do cliente"
                      className="pl-10 bg-neutral-950 border-neutral-800 text-neutral-50"
                      required
                      data-testid="customer-name-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-neutral-300">Telefone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="pl-10 bg-neutral-950 border-neutral-800 text-neutral-50"
                      required
                      data-testid="customer-phone-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document" className="text-neutral-300">Documento (opcional)</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      id="document"
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                      placeholder="CPF ou RG"
                      className="pl-10 bg-neutral-950 border-neutral-800 text-neutral-50"
                      data-testid="customer-document-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-neutral-300">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Anotações sobre o cliente..."
                    className="bg-neutral-950 border-neutral-800 text-neutral-50 min-h-[80px]"
                    data-testid="customer-notes-input"
                  />
                </div>
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
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="save-customer-button"
                >
                  {submitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Details Modal */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                Detalhes do Cliente
              </DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-6 py-4">
                {/* Customer Header with Status */}
                <div className="flex items-center gap-4 pb-4 border-b border-neutral-800">
                  <div className="h-16 w-16 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-500 text-2xl font-bold">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-neutral-50">{selectedCustomer.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {customerStatuses[selectedCustomer.id] && (() => {
                        const status = customerStatuses[selectedCustomer.id];
                        const statusConfig = getStatusConfig(status.status);
                        return (
                          <Badge className={`${statusConfig.color} border font-medium`}>
                            {status.label}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Status Details */}
                {customerStatuses[selectedCustomer.id] && (
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                    {(() => {
                      const status = customerStatuses[selectedCustomer.id];
                      const statusConfig = getStatusConfig(status.status);
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg border ${statusConfig.color}`}>
                            <StatusIcon className={`h-6 w-6 ${statusConfig.iconColor}`} />
                          </div>
                          <div>
                            <p className="text-neutral-50 font-medium">{status.label}</p>
                            {status.status === 'no_loans' ? (
                              <p className="text-neutral-500 text-sm">
                                Este cliente ainda não possui empréstimos
                              </p>
                            ) : (
                              <p className="text-neutral-500 text-sm">
                                {status.total_loans} empréstimo{status.total_loans > 1 ? 's' : ''} • 
                                {status.total_pending > 0 && ` ${status.total_pending} pendente${status.total_pending > 1 ? 's' : ''}`}
                                {status.total_overdue > 0 && ` • ${status.total_overdue} atrasada${status.total_overdue > 1 ? 's' : ''}`}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                      Telefone
                    </p>
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Phone className="h-4 w-4 text-neutral-500" />
                      <span className="font-mono">{selectedCustomer.phone}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                      Documento
                    </p>
                    <div className="flex items-center gap-2 text-neutral-300">
                      <FileText className="h-4 w-4 text-neutral-500" />
                      <span>{selectedCustomer.document || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedCustomer.notes && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-2">
                      Observações
                    </p>
                    <p className="text-neutral-300 bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                      {selectedCustomer.notes}
                    </p>
                  </div>
                )}

                {/* Created At */}
                <div className="pt-4 border-t border-neutral-800">
                  <div className="flex items-center gap-2 text-neutral-500 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Cadastrado em {formatDate(selectedCustomer.created_at)}</span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  openModal(selectedCustomer);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Editar Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-neutral-900 border-neutral-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-neutral-50">Excluir Cliente</AlertDialogTitle>
              <AlertDialogDescription className="text-neutral-400">
                Tem certeza que deseja excluir o cliente "{selectedCustomer?.name}"? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-neutral-50 hover:bg-neutral-700">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-rose-500 hover:bg-rose-600 text-white"
                data-testid="confirm-delete-customer"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Customers;
