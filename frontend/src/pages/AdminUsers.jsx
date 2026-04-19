import React, { useState, useEffect, useMemo } from 'react';
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
  Shield,
  Users,
  UserCog,
  Sparkles,
  Crown,
  ChevronDown,
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
    role: 'user',
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

  const stats = useMemo(() => {
    const total = users.length;
    const blocked = users.filter((user) => user.is_blocked).length;
    const active = total - blocked;
    const admins = users.filter((user) => (user.role || '').toLowerCase() === 'admin').length;

    return { total, active, blocked, admins };
  }, [users]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditing) {
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };

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
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'user',
      });
    } else {
      setIsEditing(false);
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
      });
    }

    setShowPassword(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setIsEditing(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
    });
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

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      (user.role || '').toLowerCase().includes(term)
    );
  });

  const getRoleBadge = (role) => {
    if ((role || '').toLowerCase() === 'admin') {
      return (
        <Badge className="border border-violet-500/20 bg-violet-500/10 font-medium text-violet-300">
          <Crown className="mr-1 h-3 w-3" />
          Administrador
        </Badge>
      );
    }

    return (
      <Badge className="border border-sky-500/20 bg-sky-500/10 font-medium text-sky-300">
        <User className="mr-1 h-3 w-3" />
        Usuário
      </Badge>
    );
  };

  const getStatusBadge = (isBlocked) => {
    return isBlocked ? (
      <Badge className="border border-rose-500/20 bg-rose-500/10 font-medium text-rose-400">
        Bloqueado
      </Badge>
    ) : (
      <Badge className="border border-emerald-500/20 bg-emerald-500/10 font-medium text-emerald-400">
        Ativo
      </Badge>
    );
  };

  const PremiumStatCard = ({ title, value, description, icon: Icon, accent = 'blue' }) => {
    const accents = {
      blue: 'from-blue-500/20 via-blue-500/8 to-transparent border-blue-500/10 text-blue-400',
      violet:
        'from-violet-500/20 via-violet-500/8 to-transparent border-violet-500/10 text-violet-300',
      emerald:
        'from-emerald-500/20 via-emerald-500/8 to-transparent border-emerald-500/10 text-emerald-400',
      rose: 'from-rose-500/20 via-rose-500/8 to-transparent border-rose-500/10 text-rose-400',
    };

    return (
      <div className="group relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,24,0.98)_0%,rgba(10,10,14,1)_100%)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.34)]">
        <div className={`absolute inset-0 bg-gradient-to-br ${accents[accent]} opacity-100`} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              {title}
            </p>
            <p className="mt-3 text-[28px] font-bold leading-none tracking-tight text-white">
              {value}
            </p>
            <p className="mt-3 text-sm leading-5 text-neutral-400">{description}</p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <Icon className={`h-5 w-5 ${accents[accent].split(' ').slice(-1)[0]}`} strokeWidth={1.8} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-neutral-950">
      <Sidebar />

      <main
        className="
          min-w-0
          px-4 pt-20 pb-6
          sm:px-6 sm:pt-24 sm:pb-8
          lg:ml-64 lg:w-[calc(100%-16rem)] lg:px-8 lg:pt-8
        "
        data-testid="admin-users-page"
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="space-y-6 lg:space-y-8">
            <section className="relative overflow-hidden rounded-[32px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_24%),linear-gradient(180deg,rgba(14,14,20,0.98)_0%,rgba(8,8,12,1)_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:p-7">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_20%)]" />

              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                    <Shield className="h-3.5 w-3.5" />
                    Admin Control
                  </div>

                  <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    Gestão Premium de Usuários
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400 sm:text-base">
                    Gerencie acessos, perfis e segurança da plataforma com uma
                    visão administrativa mais sofisticada, distinta da área padrão
                    do usuário final.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <Button
                    onClick={() => openModal()}
                    className="h-11 gap-2 rounded-2xl border border-blue-400/20 bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 px-5 text-white shadow-[0_10px_30px_rgba(56,189,248,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:from-sky-300 hover:via-blue-400 hover:to-blue-500 hover:shadow-[0_14px_36px_rgba(96,165,250,0.34)]"
                    data-testid="add-user-button"
                  >
                    <Plus className="h-4 w-4" />
                    Novo Usuário
                  </Button>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
              <PremiumStatCard
                title="Total de contas"
                value={stats.total}
                description="Todos os usuários cadastrados na base."
                icon={Users}
                accent="blue"
              />
              <PremiumStatCard
                title="Usuários ativos"
                value={stats.active}
                description="Contas liberadas para acesso ao sistema."
                icon={Sparkles}
                accent="emerald"
              />
              <PremiumStatCard
                title="Administradores"
                value={stats.admins}
                description="Perfis com privilégios administrativos."
                icon={UserCog}
                accent="violet"
              />
              <PremiumStatCard
                title="Contas bloqueadas"
                value={stats.blocked}
                description="Usuários temporariamente impedidos de acessar."
                icon={Lock}
                accent="rose"
              />
            </section>

            <section className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,24,0.96)_0%,rgba(10,10,14,0.98)_100%)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-white">
                    Base de usuários
                  </h2>
                  <p className="mt-1 text-sm text-neutral-400">
                    Consulte, filtre e execute ações administrativas com segurança.
                  </p>
                </div>

                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
                  <Input
                    type="text"
                    placeholder="Buscar por nome, email ou perfil..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 rounded-2xl border-white/8 bg-black/30 pl-10 text-neutral-50 placeholder:text-neutral-600"
                    data-testid="search-users-input"
                  />
                </div>
              </div>
            </section>

            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center sm:min-h-[320px]">
                <div className="relative h-14 w-14">
                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />
                  <div className="absolute inset-2 rounded-full border border-blue-500/20 bg-blue-500/5" />
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,24,0.96)_0%,rgba(10,10,14,0.98)_100%)] p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:p-12">
                <User className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
                <h3 className="mb-2 text-lg font-medium text-neutral-50">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                </h3>
                <p className="mb-6 text-sm text-neutral-500 sm:text-base">
                  {searchTerm ? 'Tente outro termo de busca.' : 'Comece criando o primeiro usuário da plataforma.'}
                </p>

                {!searchTerm && (
                  <Button
                    onClick={() => openModal()}
                    className="h-11 w-full gap-2 rounded-2xl border border-blue-400/20 bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 text-white shadow-[0_10px_30px_rgba(56,189,248,0.28)] sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Novo Usuário
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,24,0.96)_0%,rgba(10,10,14,0.98)_100%)] shadow-[0_18px_50px_rgba(0,0,0,0.24)] xl:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-white/6 bg-white/[0.02]">
                          <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                            Usuário
                          </th>
                          <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                            Email
                          </th>
                          <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                            Perfil
                          </th>
                          <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                            Cadastro
                          </th>
                          <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b border-white/6 transition-colors hover:bg-white/[0.02]"
                            data-testid={`user-row-${user.id}`}
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-600/10">
                                  <span className="font-semibold text-blue-400">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-neutral-50">
                                    {user.name}
                                  </p>
                                  <p className="mt-0.5 text-xs text-neutral-500">
                                    ID: {user.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2 text-neutral-300">
                                <Mail className="h-4 w-4 shrink-0 text-neutral-500" />
                                <span className="break-all">{user.email}</span>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              {getRoleBadge(user.role)}
                            </td>

                            <td className="px-6 py-5">
                              {getStatusBadge(user.is_blocked)}
                            </td>

                            <td className="px-6 py-5 font-mono text-sm whitespace-nowrap text-neutral-400">
                              {formatDate(user.created_at)}
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openViewModal(user)}
                                  className="rounded-xl text-neutral-400 hover:bg-blue-500/10 hover:text-blue-400"
                                  data-testid={`view-user-${user.id}`}
                                  title="Ver detalhes"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openModal(user)}
                                  className="rounded-xl text-neutral-400 hover:bg-white/10 hover:text-white"
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
                                    className="rounded-xl text-neutral-400 hover:bg-emerald-500/10 hover:text-emerald-400"
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
                                    className="rounded-xl text-neutral-400 hover:bg-amber-500/10 hover:text-amber-400"
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
                                  className="rounded-xl text-neutral-400 hover:bg-rose-500/10 hover:text-rose-400"
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

                <div className="grid grid-cols-1 gap-4 xl:hidden">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,24,0.96)_0%,rgba(10,10,14,0.98)_100%)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:p-5"
                      data-testid={`user-row-${user.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-600/10">
                          <span className="font-semibold text-blue-400">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="break-words font-medium text-neutral-50">
                                {user.name}
                              </p>
                              <div className="mt-1 flex items-start gap-2 text-sm text-neutral-300">
                                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                                <span className="break-all">{user.email}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {getRoleBadge(user.role)}
                              {getStatusBadge(user.is_blocked)}
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl border border-white/6 bg-black/30 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                              Cadastro
                            </p>
                            <p className="mt-1 text-sm text-neutral-300">
                              {formatDate(user.created_at)}
                            </p>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <Button
                              variant="ghost"
                              onClick={() => openViewModal(user)}
                              className="h-10 justify-center rounded-xl border border-white/6 bg-black/30 text-neutral-300 hover:bg-blue-500/10 hover:text-blue-400"
                              data-testid={`view-user-${user.id}`}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              onClick={() => openModal(user)}
                              className="h-10 justify-center rounded-xl border border-white/6 bg-black/30 text-neutral-300 hover:bg-white/10 hover:text-white"
                              data-testid={`edit-user-${user.id}`}
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>

                            {user.is_blocked ? (
                              <Button
                                variant="ghost"
                                onClick={() => openDialog(user, 'unblock')}
                                className="h-10 justify-center rounded-xl border border-white/6 bg-black/30 text-neutral-300 hover:bg-emerald-500/10 hover:text-emerald-400"
                                data-testid={`unblock-user-${user.id}`}
                                title="Desbloquear"
                              >
                                <Unlock className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                onClick={() => openDialog(user, 'block')}
                                className="h-10 justify-center rounded-xl border border-white/6 bg-black/30 text-neutral-300 hover:bg-amber-500/10 hover:text-amber-400"
                                data-testid={`block-user-${user.id}`}
                                title="Bloquear"
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              onClick={() => openDialog(user, 'delete')}
                              className="h-10 justify-center rounded-xl border border-white/6 bg-black/30 text-neutral-300 hover:bg-rose-500/10 hover:text-rose-400"
                              data-testid={`delete-user-${user.id}`}
                              title="Excluir"
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
              <DialogContent className="max-w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,24,0.98)_0%,rgba(10,10,14,1)_100%)] p-0 text-neutral-50 shadow-[0_30px_100px_rgba(0,0,0,0.5)] sm:max-w-2xl">
                <div className="relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_24%)]" />

                  <div className="relative border-b border-white/6 px-6 py-5 sm:px-7">
                    <DialogHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                            {isEditing ? <Edit2 className="h-5 w-5" /> : <UserCog className="h-5 w-5" />}
                          </div>

                          <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-violet-300">
                              Admin Flow
                            </div>
                            <DialogTitle className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                              {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
                            </DialogTitle>
                            <p className="mt-2 text-sm text-neutral-400">
                              Configure dados de acesso e defina o perfil de permissão do usuário.
                            </p>
                          </div>
                        </div>
                      </div>
                    </DialogHeader>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-7">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
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
                          className="h-12 rounded-2xl border-white/8 bg-black/30 pl-10 text-neutral-50 placeholder:text-neutral-600"
                          required
                          data-testid="user-name-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
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
                          className="h-12 rounded-2xl border-white/8 bg-black/30 pl-10 text-neutral-50 placeholder:text-neutral-600"
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
                          className="h-12 rounded-2xl border-white/8 bg-black/30 pl-10 pr-10 text-neutral-50 placeholder:text-neutral-600"
                          required={!isEditing}
                          minLength={isEditing && formData.password ? 6 : undefined}
                          data-testid="user-password-input"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-300"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-neutral-300">
                        Perfil de acesso *
                      </Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                        <select
                          id="role"
                          value={formData.role}
                          onChange={(e) =>
                            setFormData({ ...formData, role: e.target.value })
                          }
                          className="h-12 w-full appearance-none rounded-2xl border border-white/8 bg-black/30 pl-10 pr-10 text-sm text-neutral-50 outline-none transition-colors focus:border-blue-500/40"
                        >
                          <option value="user" className="bg-neutral-950 text-white">
                            Usuário
                          </option>
                          <option value="admin" className="bg-neutral-950 text-white">
                            Administrador
                          </option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/6 bg-black/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      Resumo da permissão
                    </p>
                    <p className="mt-2 text-sm leading-6 text-neutral-400">
                      {formData.role === 'admin'
                        ? 'Administrador poderá acessar a área administrativa e realizar operações de gestão do sistema.'
                        : 'Usuário terá acesso apenas às funcionalidades padrão da plataforma.'}
                    </p>
                  </div>

                  <DialogFooter className="mt-6 flex-col gap-2 border-t border-white/6 pt-5 sm:flex-row">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={closeModal}
                      className="h-11 w-full rounded-2xl border border-white/6 bg-white/[0.02] text-neutral-300 hover:bg-white/[0.06] hover:text-white sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="h-11 w-full rounded-2xl border border-blue-400/20 bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 px-5 text-white shadow-[0_10px_30px_rgba(56,189,248,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:from-sky-300 hover:via-blue-400 hover:to-blue-500 sm:w-auto"
                      data-testid="save-user-button"
                    >
                      {submitting ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
              <DialogContent className="max-w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,24,0.98)_0%,rgba(10,10,14,1)_100%)] p-0 text-neutral-50 shadow-[0_30px_100px_rgba(0,0,0,0.5)] sm:max-w-xl">
                <div className="border-b border-white/6 px-6 py-5 sm:px-7">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                      Detalhes do Usuário
                    </DialogTitle>
                    <p className="mt-2 text-sm text-neutral-400">
                      Visualização administrativa completa do perfil selecionado.
                    </p>
                  </DialogHeader>
                </div>

                {selectedUser && (
                  <div className="px-6 py-6 sm:px-7">
                    <div className="flex items-center gap-4 border-b border-white/6 pb-5">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-blue-500/20 bg-blue-600/10">
                        <span className="text-2xl font-bold text-blue-400">
                          {selectedUser.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-semibold text-neutral-50">
                          {selectedUser.name}
                        </h3>
                        <p className="break-all text-sm text-neutral-400">
                          {selectedUser.email}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {getRoleBadge(selectedUser.role)}
                          {getStatusBadge(selectedUser.is_blocked)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/6 bg-black/30 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                          ID
                        </p>
                        <p className="mt-2 break-all font-mono text-sm text-neutral-300">
                          {selectedUser.id}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/6 bg-black/30 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                          Perfil
                        </p>
                        <div className="mt-2">{getRoleBadge(selectedUser.role)}</div>
                      </div>

                      <div className="rounded-2xl border border-white/6 bg-black/30 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                          Status
                        </p>
                        <div className="mt-2">{getStatusBadge(selectedUser.is_blocked)}</div>
                      </div>

                      <div className="rounded-2xl border border-white/6 bg-black/30 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                          Cadastro
                        </p>
                        <p className="mt-2 text-sm text-neutral-300">
                          {formatDate(selectedUser.created_at)}
                        </p>
                      </div>
                    </div>

                    <DialogFooter className="mt-6 flex-col gap-2 border-t border-white/6 pt-5 sm:flex-row">
                      <Button
                        onClick={() => {
                          setIsViewModalOpen(false);
                          openModal(selectedUser);
                        }}
                        className="h-11 w-full gap-2 rounded-2xl border border-blue-400/20 bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 text-white shadow-[0_10px_30px_rgba(56,189,248,0.28)] sm:w-auto"
                      >
                        <Edit2 className="h-4 w-4" />
                        Editar Usuário
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <AlertDialog
              open={dialogAction === 'block'}
              onOpenChange={() => setDialogAction(null)}
            >
              <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,24,0.98)_0%,rgba(10,10,14,1)_100%)] sm:max-w-md">
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
                  <AlertDialogCancel className="w-full rounded-2xl border-white/8 bg-white/[0.03] text-neutral-50 hover:bg-white/[0.06] sm:w-auto">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBlock}
                    className="w-full rounded-2xl bg-amber-500 text-white hover:bg-amber-600 sm:w-auto"
                    data-testid="confirm-block-user"
                  >
                    Bloquear
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
              open={dialogAction === 'unblock'}
              onOpenChange={() => setDialogAction(null)}
            >
              <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,24,0.98)_0%,rgba(10,10,14,1)_100%)] sm:max-w-md">
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
                  <AlertDialogCancel className="w-full rounded-2xl border-white/8 bg-white/[0.03] text-neutral-50 hover:bg-white/[0.06] sm:w-auto">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleUnblock}
                    className="w-full rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 sm:w-auto"
                    data-testid="confirm-unblock-user"
                  >
                    Desbloquear
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
              open={dialogAction === 'delete'}
              onOpenChange={() => setDialogAction(null)}
            >
              <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,24,0.98)_0%,rgba(10,10,14,1)_100%)] sm:max-w-md">
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
                  <AlertDialogCancel className="w-full rounded-2xl border-white/8 bg-white/[0.03] text-neutral-50 hover:bg-white/[0.06] sm:w-auto">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="w-full rounded-2xl bg-rose-500 text-white hover:bg-rose-600 sm:w-auto"
                    data-testid="confirm-delete-user"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;