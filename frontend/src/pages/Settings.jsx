import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, formatApiErrorDetail, useAuth } from '../App';
import Sidebar from '../components/Sidebar';
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
  Settings as SettingsIcon,
  Save,
  Percent,
  Calendar,
  Shield,
  Sliders
} from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  
  // Account form
  const [accountData, setAccountData] = useState({
    name: '',
    email: ''
  });
  
  // Password form
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Preferences form
  const [preferencesData, setPreferencesData] = useState({
    default_interest_rate: '',
    default_interval_days: ''
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
        email: data.email || ''
      });
      
      setPreferencesData({
        default_interest_rate: data.preferences?.default_interest_rate?.toString() || '',
        default_interval_days: data.preferences?.default_interval_days?.toString() || ''
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
      checkAuth(); // Refresh user data in context
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
        confirm_password: ''
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
        payload.default_interval_days = parseInt(preferencesData.default_interval_days);
      }
      
      if (Object.keys(payload).length === 0) {
        toast.error('Preencha pelo menos uma preferência');
        setSavingPreferences(false);
        return;
      }
      
      await axios.put(`${API}/settings/preferences`, payload);
      toast.success('Preferências salvas com sucesso!');
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao salvar preferências');
    } finally {
      setSavingPreferences(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <Sidebar />
      
      <main className="ml-64 p-8" data-testid="settings-page">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-3xl font-bold text-neutral-50 tracking-tight">
            Configurações
          </h1>
          <p className="text-neutral-400 mt-1">
            Gerencie sua conta e preferências
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Section */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-50">Dados da Conta</h2>
                <p className="text-sm text-neutral-500">Atualize suas informações pessoais</p>
              </div>
            </div>
            
            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-neutral-300">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    id="name"
                    value={accountData.name}
                    onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                    placeholder="Seu nome"
                    className="pl-10 bg-neutral-950 border-neutral-800 text-neutral-50"
                    required
                    data-testid="settings-name-input"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    id="email"
                    type="email"
                    value={accountData.email}
                    onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="pl-10 bg-neutral-950 border-neutral-800 text-neutral-50"
                    required
                    data-testid="settings-email-input"
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={savingAccount}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                data-testid="save-account-button"
              >
                <Save className="h-4 w-4" />
                {savingAccount ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </div>

          {/* Security Section */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Shield className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-50">Segurança</h2>
                <p className="text-sm text-neutral-500">Altere sua senha de acesso</p>
              </div>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password" className="text-neutral-300">Senha Atual</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    id="current_password"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    placeholder="••••••••"
                    className="pl-10 pr-10 bg-neutral-950 border-neutral-800 text-neutral-50"
                    required
                    data-testid="settings-current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_password" className="text-neutral-300">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    id="new_password"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    placeholder="••••••••"
                    className="pl-10 pr-10 bg-neutral-950 border-neutral-800 text-neutral-50"
                    required
                    minLength={6}
                    data-testid="settings-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-neutral-300">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    id="confirm_password"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    placeholder="••••••••"
                    className="pl-10 pr-10 bg-neutral-950 border-neutral-800 text-neutral-50"
                    required
                    data-testid="settings-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={savingPassword}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2"
                data-testid="change-password-button"
              >
                <Lock className="h-4 w-4" />
                {savingPassword ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </form>
          </div>

          {/* Preferences Section */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 lg:col-span-2 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Sliders className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-50">Preferências de Empréstimos</h2>
                <p className="text-sm text-neutral-500">
                  Defina valores padrão para novos empréstimos
                </p>
              </div>
            </div>
            
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-400">
                <strong>Dica:</strong> Estes valores serão preenchidos automaticamente ao criar novos empréstimos, 
                mas você pode alterá-los a qualquer momento durante a criação.
              </p>
            </div>
            
            <form onSubmit={handleSavePreferences} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="default_interest_rate" className="text-neutral-300">
                    Taxa de Juros Padrão (% ao mês)
                  </Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      id="default_interest_rate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={preferencesData.default_interest_rate}
                      onChange={(e) => setPreferencesData({ ...preferencesData, default_interest_rate: e.target.value })}
                      placeholder="Ex: 10"
                      className="pl-10 bg-neutral-950 border-neutral-800 text-neutral-50"
                      data-testid="settings-interest-rate"
                    />
                  </div>
                  <p className="text-xs text-neutral-500">
                    Será usado como valor inicial ao criar empréstimos
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default_interval_days" className="text-neutral-300">
                    Intervalo Padrão entre Parcelas
                  </Label>
                  <Select
                    value={preferencesData.default_interval_days}
                    onValueChange={(value) => setPreferencesData({ ...preferencesData, default_interval_days: value })}
                  >
                    <SelectTrigger 
                      className="bg-neutral-950 border-neutral-800 text-neutral-50"
                      data-testid="settings-interval-days"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-neutral-500" />
                        <SelectValue placeholder="Selecione o intervalo" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
                      <SelectItem value="15" className="text-neutral-50 focus:bg-neutral-800">
                        15 dias (Quinzenal)
                      </SelectItem>
                      <SelectItem value="30" className="text-neutral-50 focus:bg-neutral-800">
                        30 dias (Mensal)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-neutral-500">
                    Define o intervalo padrão entre as parcelas
                  </p>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={savingPreferences}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                data-testid="save-preferences-button"
              >
                <Save className="h-4 w-4" />
                {savingPreferences ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
