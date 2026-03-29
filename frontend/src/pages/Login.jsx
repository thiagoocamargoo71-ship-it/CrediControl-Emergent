import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, formatApiErrorDetail } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Login realizado com sucesso!');
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 xl:px-24 bg-neutral-950">
        <div className="max-w-md w-full mx-auto animate-fade-in">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold text-neutral-50 tracking-tight">
              Credi<span className="text-blue-500">Control</span>
            </h1>
            <p className="text-neutral-400 mt-2">
              Sistema de gestão de empréstimos pessoais
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10 bg-neutral-900 border-neutral-800 text-neutral-50 placeholder:text-neutral-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  required
                  data-testid="login-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-300">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-neutral-900 border-neutral-800 text-neutral-50 placeholder:text-neutral-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  required
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
              data-testid="login-submit-button"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Entrando...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Entrar
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          {/* Contact admin note */}
          <p className="mt-8 text-center text-neutral-500 text-sm">
            Entre em contato com o administrador para obter acesso.
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://static.prod-images.emergentagent.com/jobs/0a19eab2-5eb8-4568-9ff2-80185a925cbe/images/a32bcfc2148611a3980435ea47e0366c2f116f099217a9daba35b0228cfc4984.png')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/50 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-xl p-6">
            <p className="text-neutral-300 text-lg leading-relaxed">
              "Gerencie seus empréstimos com total controle. Parcelas, juros e clientes em um só lugar."
            </p>
            <p className="text-neutral-500 mt-4 font-medium">
              — CrediControl
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
