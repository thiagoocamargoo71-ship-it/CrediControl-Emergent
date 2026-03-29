import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, formatApiErrorDetail } from '../App';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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
  Mail
} from 'lucide-react';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogAction, setDialogAction] = useState(null);

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
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
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-3xl font-bold text-neutral-50 tracking-tight">
            Gestão de Usuários
          </h1>
          <p className="text-neutral-400 mt-1">
            Gerencie os usuários do sistema
          </p>
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
            <p className="text-neutral-500">
              {searchTerm ? 'Tente outra busca' : 'Os usuários aparecerão aqui quando se cadastrarem'}
            </p>
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
                    <td className="px-6 py-4 text-neutral-400 font-mono">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {user.is_blocked ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDialog(user, 'unblock')}
                            className="text-neutral-400 hover:text-emerald-500 hover:bg-emerald-500/10"
                            data-testid={`unblock-user-${user.id}`}
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
