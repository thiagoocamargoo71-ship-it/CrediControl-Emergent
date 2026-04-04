import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      navigate(user.role === 'admin' ? '/admin' : '/home');
    } catch (error) {
      toast.error(formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 lg:grid lg:grid-cols-2">
      {/* Form */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-12 xl:px-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-40px] top-10 h-40 w-40 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative w-full max-w-md animate-fade-in">
          <div className="mb-8">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-indigo-500/10 shadow-[0_0_30px_rgba(37,99,235,0.10)]">
              <span className="text-sm font-bold tracking-wide text-blue-400">CC</span>
            </div>

            <h1 className="font-heading text-3xl font-bold tracking-tight text-neutral-50 sm:text-4xl">
              Credi<span className="text-blue-500">Control</span>
            </h1>
            <p className="mt-2 text-sm text-neutral-400 sm:text-base">
              Sistema de gestão de empréstimos pessoais
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-300">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="h-12 rounded-2xl border-neutral-800 bg-neutral-950 pl-10 text-neutral-50 placeholder:text-neutral-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                    required
                    data-testid="login-email-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-300">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 rounded-2xl border-neutral-800 bg-neutral-950 pl-10 pr-11 text-neutral-50 placeholder:text-neutral-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                    required
                    data-testid="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-300"
                    data-testid="toggle-password-visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-2xl bg-blue-600 font-medium text-white transition-colors hover:bg-blue-700"
                data-testid="login-submit-button"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-white" />
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

            <p className="mt-6 text-center text-sm text-neutral-500">
              Entre em contato com o administrador para obter acesso.
            </p>
          </div>
        </div>
      </div>

      {/* Visual side */}
      <div className="relative hidden overflow-hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://static.prod-images.emergentagent.com/jobs/0a19eab2-5eb8-4568-9ff2-80185a925cbe/images/a32bcfc2148611a3980435ea47e0366c2f116f099217a9daba35b0228cfc4984.png')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/50 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.20),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(79,70,229,0.18),transparent_30%)]" />

        <div className="absolute bottom-8 left-8 right-8 xl:bottom-12 xl:left-12 xl:right-12">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/75 p-6 backdrop-blur-xl xl:p-7">
            <p className="text-lg leading-relaxed text-neutral-300 xl:text-xl">
              "Gerencie seus empréstimos com total controle. Parcelas, juros e clientes em um só lugar."
            </p>
            <p className="mt-4 font-medium text-neutral-500">— CrediControl</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;