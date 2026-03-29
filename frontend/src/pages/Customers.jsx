import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, formatApiErrorDetail } from '../App';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
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
  Search
} from 'lucide-react';
import { toast } from 'sonner';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    document: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (selectedCustomer) {
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
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden animate-fade-in">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Nome
                  </th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Telefone
                  </th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Documento
                  </th>
                  <th className="text-right px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className="border-b border-neutral-800/50 table-row-hover transition-colors"
                    data-testid={`customer-row-${customer.id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                          <span className="text-blue-500 font-medium">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-neutral-50 font-medium">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-300 font-mono">
                      {customer.phone}
                    </td>
                    <td className="px-6 py-4 text-neutral-400">
                      {customer.document || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
