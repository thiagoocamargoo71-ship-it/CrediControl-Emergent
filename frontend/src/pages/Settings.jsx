import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, formatApiErrorDetail, useAuth } from '../App';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Percent,
  Calendar,
  Shield,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { user, checkAuth } = useAuth();

  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [preferencesData, setPreferencesData] = useState({
    default_interest_rate: '',
    default_interval_days: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      const data = response.data;

      setAccountData({
        name: data.name || '',
        email: data.email || '',
      });

      setPreferencesData({
        default_interest_rate: data.preferences?.default_interest_rate?.toString() || '',
        default_interval_days: data.preferences?.default_interval_days?.toString() || '',
      });
    } catch (error) {
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);

    try {
      await axios.put(`${API}/settings/account`, accountData);
      toast.success('Dados atualizados com sucesso!');
      checkAuth();
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao atualizar dados');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSavingPassword(true);

    try {
      await axios.put(`${API}/settings/password`, passwordData);
      toast.success('Senha alterada com sucesso!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao alterar senha');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPreferences(true);

    try {
      const payload = {};

      if (preferencesData.default_interest_rate) {
        payload.default_interest_rate = parseFloat(preferencesData.default_interest_rate);
      }

      if (preferencesData.default_interval_days) {
        payload.default_interval_days = parseInt(preferencesData.default_interval_days, 10);
      }

      if (Object.keys(payload).length === 0) {
        toast.error('Preencha pelo menos uma preferência');
        setSavingPreferences(false);
        return;
      }

      await axios.put(`${API}/settings/preferences`, payload);
      toast.success('Preferências salvas com sucesso!');
    } catch (error) {
      toast.error(
        formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao salvar preferências'
      );
    } finally {
      setSavingPreferences(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (loading) {
    return (
      <AppShell
        title="Configurações"
        subtitle="Gerencie sua conta e preferências"
      >
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Configurações"
      subtitle="Gerencie sua conta e preferências"
    >
      <div data-testid="settings-page">
        <div className="mb-6 hidden lg:block">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-neutral-50">
            Configurações
          </h1>
          <p className="mt-1 text-neutral-400">
            Gerencie sua conta e preferências
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Dados da Conta */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-50">Dados da Conta</h2>
                <p className="text-sm text-neutral-500">
                  Atualize suas informações pessoais
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-neutral-300">
                  Nome
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <Input
                    id="name"
                    value={accountData.name}
                    onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                    placeholder="Seu nome"
                    className="h-11 rounded-2xl border-neutral-800 bg-neutral-950 pl-10 text-neutral-50"
                    required
                    data-testid="settings-name-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-300">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <Input
                    id="email"
                    type="email"
                    value={accountData.email}
                    onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="h-11 rounded-2xl border-neutral-800 bg-neutral-950 pl-10 text-neutral-50"
                    required
                    data-testid="settings-email-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={savingAccount}
                className="h-11 w-full rounded-2xl bg-blue-600 text-white hover:bg-blue-700"
                data-testid="save-account-button"
              >
                <Save className="mr-2 h-4 w-4" />
                {savingAccount ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </div>

          {/* Segurança */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                <Shield className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-50">Segurança</h2>
                <p className="text-sm text-neutral-500">
                  Altere sua senha de acesso
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password" className="text-neutral-300">
                  Senha Atual
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <Input
                    id="current_password"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.current_password}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, current_password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="h-11 rounded-2xl border-neutral-800 bg-neutral-950 pl-10 pr-10 text-neutral-50"
                    required
                    data-testid="settings-current-password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password" className="text-neutral-300">
                  Nova Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <Input
                    id="new_password"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.new_password}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, new_password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="h-11 rounded-2xl border-neutral-800 bg-neutral-950 pl-10 pr-10 text-neutral-50"
                    required
                    minLength={6}
                    data-testid="settings-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-neutral-300">
                  Confirmar Nova Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <Input
                    id="confirm_password"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirm_password}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirm_password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="h-11 rounded-2xl border-neutral-800 bg-neutral-950 pl-10 pr-10 text-neutral-50"
                    required
                    data-testid="settings-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={savingPassword}
                className="h-11 w-full rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
                data-testid="change-password-button"
              >
                <Lock className="mr-2 h-4 w-4" />
                {savingPassword ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </form>
          </div>

          {/* Preferências */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 xl:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <Sliders className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-50">Preferências</h2>
                <p className="text-sm text-neutral-500">
                  Defina valores padrão para novos empréstimos
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="default_interest_rate" className="text-neutral-300">
                    Juros padrão (%)
                  </Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                      id="default_interest_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={preferencesData.default_interest_rate}
                      onChange={(e) =>
                        setPreferencesData({
                          ...preferencesData,
                          default_interest_rate: e.target.value,
                        })
                      }
                      placeholder="Ex: 10"
                      className="h-11 rounded-2xl border-neutral-800 bg-neutral-950 pl-10 text-neutral-50"
                      data-testid="settings-default-interest-rate"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_interval_days" className="text-neutral-300">
                    Intervalo padrão
                  </Label>
                  <Select
                    value={preferencesData.default_interval_days}
                    onValueChange={(value) =>
                      setPreferencesData({
                        ...preferencesData,
                        default_interval_days: value,
                      })
                    }
                  >
                    <SelectTrigger
                      className="h-11 rounded-2xl border-neutral-800 bg-neutral-950 text-neutral-50"
                      data-testid="settings-default-interval-days"
                    >
                      <SelectValue placeholder="Selecione o intervalo" />
                    </SelectTrigger>
                    <SelectContent className="border-neutral-800 bg-neutral-900">
                      <SelectItem value="7" className="text-neutral-50 focus:bg-neutral-800">
                        7 dias
                      </SelectItem>
                      <SelectItem value="15" className="text-neutral-50 focus:bg-neutral-800">
                        15 dias
                      </SelectItem>
                      <SelectItem value="30" className="text-neutral-50 focus:bg-neutral-800">
                        30 dias
                      </SelectItem>
                      <SelectItem value="45" className="text-neutral-50 focus:bg-neutral-800">
                        45 dias
                      </SelectItem>
                      <SelectItem value="60" className="text-neutral-50 focus:bg-neutral-800">
                        60 dias
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Percent className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm">Juros padrão para novos cadastros</span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">
                    Esse valor será pré-preenchido na criação de empréstimos.
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm">Intervalo entre parcelas</span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">
                    Facilita o cadastro com um padrão operacional definido.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={savingPreferences}
                className="h-11 w-full rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
                data-testid="save-preferences-button"
              >
                <Save className="mr-2 h-4 w-4" />
                {savingPreferences ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Settings;