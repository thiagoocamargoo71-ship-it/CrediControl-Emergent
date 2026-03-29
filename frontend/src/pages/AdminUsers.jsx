import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, formatApiErrorDetail } from '../App';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
  User,
  Lock,
  Unlock,
  Trash2,
  Search,
  Mail,
  Plus,
  Edit2,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogAction, setDialogAction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`);
      setUsers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditing) {
        // Update user
        const updateData = { name: formData.name, email: formData.email };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await axios.put(`${API}/admin/users/${selectedUser.id}`, updateData);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Create user
        if (!formData.password || formData.password.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres');
          setSubmitting(false);
          return;
        }
        await axios.post(`${API}/admin/users`, formData);
        toast.success('Usuário criado com sucesso!');
      }
      fetchUsers();
      closeModal();
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao salvar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlock = async () => {
    try {
      await axios.post(`${API}/admin/users/${selectedUser.id}/block`);
      toast.success('Usuário bloqueado com sucesso!');
      fetchUsers();
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao bloquear usuário');
    } finally {
      setSelectedUser(null);
      setDialogAction(null);
    }
  };

  const handleUnblock = async () => {
    try {
      await axios.post(`${API}/admin/users/${selectedUser.id}/unblock`);
      toast.success('Usuário desbloqueado com sucesso!');
      fetchUsers();
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao desbloquear usuário');
    } finally {
      setSelectedUser(null);
      setDialogAction(null);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/admin/users/${selectedUser.id}`);
      toast.success('Usuário excluído com sucesso!');
      fetchUsers();
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao excluir usuário');
    } finally {
      setSelectedUser(null);
      setDialogAction(null);
    }
  };

  const openDialog = (user, action) => {
    setSelectedUser(user);
    setDialogAction(action);
  };

  const openModal = (user = null) => {
    if (user) {
      setIsEditing(true);
      setSelectedUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: ''
      });
    } else {
      setIsEditing(false);
      setSelectedUser(null);
      setFormData({ name: '', email: '', password: '' });
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setIsEditing(false);
    setFormData({ name: '', email: '', password: '' });
    setShowPassword(false);
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-950">
      <Sidebar />
      
      <main className="ml-64 p-8" data-testid="admin-users-page">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="font-heading text-3xl font-bold text-neutral-50 tracking-tight">
              Gestão de Usuários
            </h1>
            <p className="text-neutral-400 mt-1">
              Crie, edite e gerencie os usuários do sistema
            </p>
          </div>
          <Button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            data-testid="add-user-button"
          >
            <Plus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md animate-fade-in">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
          <Input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-neutral-900 border-neutral-800 text-neutral-50 placeholder:text-neutral-600"
            data-testid="search-users-input"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center animate-fade-in">
            <User className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-50 mb-2">
              {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            </h3>
            <p className="text-neutral-500 mb-6">
              {searchTerm ? 'Tente outra busca' : 'Comece adicionando o primeiro usuário'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => openModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Usuário
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden animate-fade-in">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Usuário
                  </th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Email
                  </th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Cadastro
                  </th>
                  <th className="text-right px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="border-b border-neutral-800/50 table-row-hover transition-colors"
                    data-testid={`user-row-${user.id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                          <span className="text-blue-500 font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-neutral-50 font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-neutral-300">
                        <Mail className="h-4 w-4 text-neutral-500" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_blocked ? (
                        <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 border font-medium">
                          Bloqueado
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border font-medium">
                          Ativo
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-400 font-mono text-sm">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewModal(user)}
                          className="text-neutral-400 hover:text-blue-500 hover:bg-blue-500/10"
                          data-testid={`view-user-${user.id}`}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal(user)}
                          className="text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800"
                          data-testid={`edit-user-${user.id}`}
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {user.is_blocked ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDialog(user, 'unblock')}
                            className="text-neutral-400 hover:text-emerald-500 hover:bg-emerald-500/10"
                            data-testid={`unblock-user-${user.id}`}
                            title="Desbloquear"
                          >
                            <Unlock className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDialog(user, 'block')}
                            className="text-neutral-400 hover:text-amber-500 hover:bg-amber-500/10"
                            data-testid={`block-user-${user.id}`}
                            title="Bloquear"
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(user, 'delete')}
                          className="text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10"
                          data-testid={`delete-user-${user.id}`}
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
        )}

        {/* Create/Edit User Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-neutral-300">Nome completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome do usuário"
                      className="pl-10 bg-neutral-950 border-neutral-800 text-neutral-50"
                      required
                      data-testid="user-name-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-neutral-300">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="pl-10 bg-neutral-950 border-neutral-800 text-neutral-50"
                      required
                      data-testid="user-email-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-neutral-300">
                    Senha {isEditing ? '(deixe em branco para manter)' : '*'}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={isEditing ? '••••••••' : 'Mínimo 6 caracteres'}
                      className="pl-10 pr-10 bg-neutral-950 border-neutral-800 text-neutral-50"
                      required={!isEditing}
                      minLength={isEditing && formData.password ? 6 : undefined}
                      data-testid="user-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
                  data-testid="save-user-button"
                >
                  {submitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View User Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                Detalhes do Usuário
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4 pb-4 border-b border-neutral-800">
                  <div className="h-16 w-16 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-500 text-2xl font-bold">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-50">{selectedUser.name}</h3>
                    <p className="text-neutral-400">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">ID</p>
                    <p className="text-neutral-300 font-mono text-sm">{selectedUser.id}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">Role</p>
                    <p className="text-neutral-300">{selectedUser.role}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">Status</p>
                    {selectedUser.is_blocked ? (
                      <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 border font-medium">
                        Bloqueado
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border font-medium">
                        Ativo
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">Cadastro</p>
                    <p className="text-neutral-300 text-sm">{formatDate(selectedUser.created_at)}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  openModal(selectedUser);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Editar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Block Dialog */}
        <AlertDialog open={dialogAction === 'block'} onOpenChange={() => setDialogAction(null)}>
          <AlertDialogContent className="bg-neutral-900 border-neutral-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-neutral-50">Bloquear Usuário</AlertDialogTitle>
              <AlertDialogDescription className="text-neutral-400">
                Tem certeza que deseja bloquear o usuário "{selectedUser?.name}"? 
                Ele não poderá acessar o sistema até ser desbloqueado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-neutral-50 hover:bg-neutral-700">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBlock}
                className="bg-amber-500 hover:bg-amber-600 text-white"
                data-testid="confirm-block-user"
              >
                Bloquear
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Unblock Dialog */}
        <AlertDialog open={dialogAction === 'unblock'} onOpenChange={() => setDialogAction(null)}>
          <AlertDialogContent className="bg-neutral-900 border-neutral-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-neutral-50">Desbloquear Usuário</AlertDialogTitle>
              <AlertDialogDescription className="text-neutral-400">
                Tem certeza que deseja desbloquear o usuário "{selectedUser?.name}"? 
                Ele poderá acessar o sistema novamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-neutral-50 hover:bg-neutral-700">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUnblock}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                data-testid="confirm-unblock-user"
              >
                Desbloquear
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Dialog */}
        <AlertDialog open={dialogAction === 'delete'} onOpenChange={() => setDialogAction(null)}>
          <AlertDialogContent className="bg-neutral-900 border-neutral-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-neutral-50">Excluir Usuário</AlertDialogTitle>
              <AlertDialogDescription className="text-neutral-400">
                Tem certeza que deseja excluir o usuário "{selectedUser?.name}"? 
                Esta ação não pode ser desfeita e todos os dados do usuário serão removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-neutral-50 hover:bg-neutral-700">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-rose-500 hover:bg-rose-600 text-white"
                data-testid="confirm-delete-user"
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

export default AdminUsers;
