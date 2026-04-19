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
  EyeOff,
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
    password: '',
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
        const updateData = { name: formData.name, email: formData.email };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await axios.put(`${API}/admin/users/${selectedUser.id}`, updateData);
        toast.success('Usuário atualizado com sucesso!');
      } else {
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
      toast.error(
        formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao salvar usuário'
      );
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
      toast.error(
        formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao bloquear usuário'
      );
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
      toast.error(
        formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao desbloquear usuário'
      );
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
      toast.error(
        formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao excluir usuário'
      );
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
        password: '',
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

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-950 overflow-x-hidden">
      <Sidebar />

      <main
        className="w-full px-4 pt-20 pb-6 sm:px-6 sm:pt-24 sm:pb-8 lg:ml-64 lg:px-8 lg:pt-8"
        data-testid="admin-users-page"
      >
        <div className="mx-auto w-full max-w-7xl">
          {/* Header */}
          <div className="mb-6 animate-fade-in sm:mb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-50 sm:text-3xl lg:text-4xl">
                  Gestão de Usuários
                </h1>
                <p className="mt-2 text-sm text-neutral-400 sm:text-base">
                  Crie, edite e gerencie os usuários do sistema
                </p>
              </div>

              <Button
                onClick={() => openModal()}
                className="h-11 w-full gap-2 bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                data-testid="add-user-button"
              >
                <Plus className="h-4 w-4" />
                Novo Usuário
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6 w-full animate-fade-in sm:mb-8 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
            <Input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 border-neutral-800 bg-neutral-900 pl-10 text-neutral-50 placeholder:text-neutral-600"
              data-testid="search-users-input"
            />
          </div>

          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center sm:min-h-[320px]">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-500 sm:h-12 sm:w-12" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="animate-fade-in rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center sm:p-12">
              <User className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
              <h3 className="mb-2 text-lg font-medium text-neutral-50">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              </h3>
              <p className="mb-6 text-sm text-neutral-500 sm:text-base">
                {searchTerm ? 'Tente outra busca' : 'Comece adicionando o primeiro usuário'}
              </p>

              {!searchTerm && (
                <Button
                  onClick={() => openModal()}
                  className="h-11 w-full gap-2 bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Novo Usuário
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop / Tablet large table */}
              <div className="hidden animate-fade-in overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 lg:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-neutral-800">
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          Usuário
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          Cadastro
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-neutral-800/50 transition-colors hover:bg-neutral-900/80"
                          data-testid={`user-row-${user.id}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/20 bg-blue-600/10">
                                <span className="font-medium text-blue-500">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-neutral-50">{user.name}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-neutral-300">
                              <Mail className="h-4 w-4 text-neutral-500" />
                              <span className="break-all">{user.email}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            {user.is_blocked ? (
                              <Badge className="border border-rose-500/20 bg-rose-500/10 font-medium text-rose-400">
                                Bloqueado
                              </Badge>
                            ) : (
                              <Badge className="border border-emerald-500/20 bg-emerald-500/10 font-medium text-emerald-400">
                                Ativo
                              </Badge>
                            )}
                          </td>

                          <td className="px-6 py-4 font-mono text-sm text-neutral-400">
                            {formatDate(user.created_at)}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openViewModal(user)}
                                className="text-neutral-400 hover:bg-blue-500/10 hover:text-blue-500"
                                data-testid={`view-user-${user.id}`}
                                title="Ver detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openModal(user)}
                                className="text-neutral-400 hover:bg-neutral-800 hover:text-neutral-50"
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
                                  className="text-neutral-400 hover:bg-emerald-500/10 hover:text-emerald-500"
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
                                  className="text-neutral-400 hover:bg-amber-500/10 hover:text-amber-500"
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
                                className="text-neutral-400 hover:bg-rose-500/10 hover:text-rose-500"
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
              </div>

              {/* Mobile / Tablet cards */}
              <div className="grid grid-cols-1 gap-4 animate-fade-in lg:hidden">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5"
                    data-testid={`user-row-${user.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-blue-500/20 bg-blue-600/10">
                        <span className="font-medium text-blue-500">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="break-words font-medium text-neutral-50">
                              {user.name}
                            </p>
                            <div className="mt-1 flex items-start gap-2 text-sm text-neutral-300">
                              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                              <span className="break-all">{user.email}</span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {user.is_blocked ? (
                              <Badge className="border border-rose-500/20 bg-rose-500/10 font-medium text-rose-400">
                                Bloqueado
                              </Badge>
                            ) : (
                              <Badge className="border border-emerald-500/20 bg-emerald-500/10 font-medium text-emerald-400">
                                Ativo
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                            Cadastro
                          </p>
                          <p className="mt-1 text-sm text-neutral-300">
                            {formatDate(user.created_at)}
                          </p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                          <Button
                            variant="ghost"
                            onClick={() => openViewModal(user)}
                            className="h-10 justify-center border border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-blue-500/10 hover:text-blue-500"
                            data-testid={`view-user-${user.id}`}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            onClick={() => openModal(user)}
                            className="h-10 justify-center border border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-800 hover:text-neutral-50"
                            data-testid={`edit-user-${user.id}`}
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          {user.is_blocked ? (
                            <Button
                              variant="ghost"
                              onClick={() => openDialog(user, 'unblock')}
                              className="h-10 justify-center border border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-emerald-500/10 hover:text-emerald-500"
                              data-testid={`unblock-user-${user.id}`}
                              title="Desbloquear"
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              onClick={() => openDialog(user, 'block')}
                              className="h-10 justify-center border border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-amber-500/10 hover:text-amber-500"
                              data-testid={`block-user-${user.id}`}
                              title="Bloquear"
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            onClick={() => openDialog(user, 'delete')}
                            className="h-10 justify-center border border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-rose-500/10 hover:text-rose-500"
                            data-testid={`delete-user-${user.id}`}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <div className="col-span-2 sm:col-span-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Create/Edit User Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-[calc(100vw-2rem)] border-neutral-800 bg-neutral-900 text-neutral-50 sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">
                  {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-neutral-300">
                      Nome completo *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Nome do usuário"
                        className="border-neutral-800 bg-neutral-950 pl-10 text-neutral-50"
                        required
                        data-testid="user-name-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-neutral-300">
                      Email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="email@exemplo.com"
                        className="border-neutral-800 bg-neutral-950 pl-10 text-neutral-50"
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
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder={isEditing ? '••••••••' : 'Mínimo 6 caracteres'}
                        className="border-neutral-800 bg-neutral-950 pl-10 pr-10 text-neutral-50"
                        required={!isEditing}
                        minLength={isEditing && formData.password ? 6 : undefined}
                        data-testid="user-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={closeModal}
                    className="w-full text-neutral-400 hover:text-neutral-50 sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
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
            <DialogContent className="max-w-[calc(100vw-2rem)] border-neutral-800 bg-neutral-900 text-neutral-50 sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">
                  Detalhes do Usuário
                </DialogTitle>
              </DialogHeader>

              {selectedUser && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-4 border-b border-neutral-800 pb-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-blue-500/20 bg-blue-600/10 sm:h-16 sm:w-16">
                      <span className="text-xl font-bold text-blue-500 sm:text-2xl">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="break-words text-base font-semibold text-neutral-50 sm:text-lg">
                        {selectedUser.name}
                      </h3>
                      <p className="break-all text-sm text-neutral-400">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        ID
                      </p>
                      <p className="break-all font-mono text-sm text-neutral-300">
                        {selectedUser.id}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Role
                      </p>
                      <p className="text-neutral-300">{selectedUser.role}</p>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Status
                      </p>
                      {selectedUser.is_blocked ? (
                        <Badge className="border border-rose-500/20 bg-rose-500/10 font-medium text-rose-400">
                          Bloqueado
                        </Badge>
                      ) : (
                        <Badge className="border border-emerald-500/20 bg-emerald-500/10 font-medium text-emerald-400">
                          Ativo
                        </Badge>
                      )}
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Cadastro
                      </p>
                      <p className="text-sm text-neutral-300">
                        {formatDate(selectedUser.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openModal(selectedUser);
                  }}
                  className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar Usuário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Block Dialog */}
          <AlertDialog
            open={dialogAction === 'block'}
            onOpenChange={() => setDialogAction(null)}
          >
            <AlertDialogContent className="max-w-[calc(100vw-2rem)] border-neutral-800 bg-neutral-900 sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-neutral-50">
                  Bloquear Usuário
                </AlertDialogTitle>
                <AlertDialogDescription className="text-neutral-400">
                  Tem certeza que deseja bloquear o usuário "{selectedUser?.name}"?
                  Ele não poderá acessar o sistema até ser desbloqueado.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                <AlertDialogCancel className="w-full border-neutral-700 bg-neutral-800 text-neutral-50 hover:bg-neutral-700 sm:w-auto">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBlock}
                  className="w-full bg-amber-500 text-white hover:bg-amber-600 sm:w-auto"
                  data-testid="confirm-block-user"
                >
                  Bloquear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Unblock Dialog */}
          <AlertDialog
            open={dialogAction === 'unblock'}
            onOpenChange={() => setDialogAction(null)}
          >
            <AlertDialogContent className="max-w-[calc(100vw-2rem)] border-neutral-800 bg-neutral-900 sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-neutral-50">
                  Desbloquear Usuário
                </AlertDialogTitle>
                <AlertDialogDescription className="text-neutral-400">
                  Tem certeza que deseja desbloquear o usuário "{selectedUser?.name}"?
                  Ele poderá acessar o sistema novamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                <AlertDialogCancel className="w-full border-neutral-700 bg-neutral-800 text-neutral-50 hover:bg-neutral-700 sm:w-auto">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleUnblock}
                  className="w-full bg-emerald-500 text-white hover:bg-emerald-600 sm:w-auto"
                  data-testid="confirm-unblock-user"
                >
                  Desbloquear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Dialog */}
          <AlertDialog
            open={dialogAction === 'delete'}
            onOpenChange={() => setDialogAction(null)}
          >
            <AlertDialogContent className="max-w-[calc(100vw-2rem)] border-neutral-800 bg-neutral-900 sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-neutral-50">
                  Excluir Usuário
                </AlertDialogTitle>
                <AlertDialogDescription className="text-neutral-400">
                  Tem certeza que deseja excluir o usuário "{selectedUser?.name}"?
                  Esta ação não pode ser desfeita e todos os dados do usuário serão removidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                <AlertDialogCancel className="w-full border-neutral-700 bg-neutral-800 text-neutral-50 hover:bg-neutral-700 sm:w-auto">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="w-full bg-rose-500 text-white hover:bg-rose-600 sm:w-auto"
                  data-testid="confirm-delete-user"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;