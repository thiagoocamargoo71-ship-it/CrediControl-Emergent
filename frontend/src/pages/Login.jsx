import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, formatApiErrorDetail } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Users,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

const REMEMBER_EMAIL_KEY = 'credicontrol_remember_email';
const REMEMBER_EMAIL_ENABLED_KEY = 'credicontrol_remember_email_enabled';

const LoginSkeleton = () => {
  return (
    <div className="grid min-h-screen w-full items-center px-5 py-8 sm:px-6 lg:grid-cols-[minmax(420px,500px)_minmax(460px,1fr)] lg:gap-16 lg:px-12 xl:px-20">
      <div className="w-full max-w-[500px] lg:justify-self-center">
        <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-7">
          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 animate-pulse rounded-2xl border border-white/8 bg-white/5" />
              <div className="space-y-2">
                <div className="h-6 w-40 animate-pulse rounded-lg bg-white/5" />
                <div className="h-4 w-28 animate-pulse rounded-lg bg-white/5" />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <div className="mb-2 h-4 w-16 animate-pulse rounded bg-white/5" />
              <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
            </div>

            <div>
              <div className="mb-2 h-4 w-16 animate-pulse rounded bg-white/5" />
              <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
            </div>

            <div className="space-y-2 pt-1">
              <div className="h-4 w-28 animate-pulse rounded bg-white/5" />
              <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
            </div>

            <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="h-14 w-[30rem] animate-pulse rounded-2xl bg-white/5" />
        <div className="mt-5 h-20 w-[40rem] animate-pulse rounded-2xl bg-white/5" />
        <div className="mt-4 h-20 w-[36rem] animate-pulse rounded-2xl bg-white/5" />
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="h-36 animate-pulse rounded-3xl bg-white/5" />
          <div className="h-36 animate-pulse rounded-3xl bg-white/5" />
          <div className="h-36 animate-pulse rounded-3xl bg-white/5" />
        </div>
      </div>
    </div>
  );
};

const BrandMark = () => {
  return (
    <div className="flex items-center justify-center gap-3 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-400/18 via-blue-500/12 to-blue-700/10 shadow-[0_0_40px_rgba(56,189,248,0.14)]">
        <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_55%)]" />
        <span className="relative text-sm font-bold tracking-[0.22em] text-sky-300">
          CC
        </span>
      </div>

      <div className="min-w-0 text-left">
        <div className="text-[1.55rem] font-semibold leading-none tracking-tight text-white sm:text-[1.75rem]">
          Credi<span className="text-sky-400">Control</span>
        </div>
        <div className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-neutral-500" />
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.10),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
    <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky-400/10 blur-3xl" />
    <div className="pointer-events-none absolute -left-4 bottom-0 h-20 w-20 rounded-full bg-blue-500/8 blur-3xl" />

    <div className="relative mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/15 bg-sky-400/10 shadow-[0_0_24px_rgba(56,189,248,0.10)]">
      <Icon className="h-5 w-5 text-sky-300" />
    </div>

    <h3 className="relative text-base font-semibold tracking-tight text-white">
      {title}
    </h3>
    <p className="relative mt-2 text-sm leading-6 text-neutral-400">
      {description}
    </p>
  </div>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberUser, setRememberUser] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const rememberedEmailEnabled =
      localStorage.getItem(REMEMBER_EMAIL_ENABLED_KEY) === 'true';
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY) || '';

    if (rememberedEmailEnabled && rememberedEmail) {
      setRememberUser(true);
      setEmail(rememberedEmail);
    }

    const timer = setTimeout(() => {
      setBootLoading(false);
      requestAnimationFrame(() => setAnimateIn(true));
    }, 320);

    return () => clearTimeout(timer);
  }, []);

    const persistRememberEmail = (currentEmail) => {
    if (rememberUser && currentEmail.trim()) {
      localStorage.setItem(REMEMBER_EMAIL_ENABLED_KEY, 'true');
      localStorage.setItem(REMEMBER_EMAIL_KEY, currentEmail.trim());
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_ENABLED_KEY);
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      persistRememberEmail(email);

      const user = await login(email, password);

      toast.success('Login realizado com sucesso!');
      navigate(user.role === 'admin' ? '/admin' : '/home');
    } catch (error) {
      toast.error(
        formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao fazer login'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-100px] top-[-40px] h-80 w-80 rounded-full bg-sky-400/10 blur-[130px]" />
        <div className="absolute right-[-120px] top-[8%] h-[26rem] w-[26rem] rounded-full bg-blue-500/10 blur-[140px]" />
        <div className="absolute bottom-[-140px] left-[10%] h-80 w-80 rounded-full bg-indigo-500/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.08),transparent_24%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.06),transparent_22%),linear-gradient(180deg,rgba(10,10,10,0.96),rgba(10,10,10,1))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/30 to-transparent" />
      </div>

      <div className="relative grid min-h-screen w-full items-center px-5 py-8 sm:px-6 lg:grid-cols-[minmax(420px,500px)_minmax(520px,1fr)] lg:gap-16 lg:px-12 xl:px-20">
        {bootLoading ? (
          <LoginSkeleton />
        ) : (
          <>
            <div
              className={`w-full max-w-[500px] lg:justify-self-center transition-all duration-700 ease-out ${
                animateIn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
            >
              <div className="relative overflow-hidden rounded-[32px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.10),transparent_26%),linear-gradient(180deg,rgba(23,23,23,0.88),rgba(10,10,10,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-7">
                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/35 to-transparent" />
                <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-sky-400/8 blur-3xl" />

                <div className="mb-8 flex justify-center">
                  <BrandMark />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-neutral-300">
                      Email
                    </Label>

                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300/60" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="h-12 rounded-2xl border border-white/8 bg-black/25 pl-10 text-neutral-50 placeholder:text-neutral-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors focus:border-sky-400/40 focus:ring-1 focus:ring-sky-400/30"
                        required
                        autoComplete="email"
                        data-testid="login-email-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-neutral-300">
                      Senha
                    </Label>

                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300/60" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-12 rounded-2xl border border-white/8 bg-black/25 pl-10 pr-11 text-neutral-50 placeholder:text-neutral-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors focus:border-sky-400/40 focus:ring-1 focus:ring-sky-400/30"
                        required
                        autoComplete="current-password"
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

                  <div className="flex flex-col gap-2 pt-1">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-400">
                      <input
                        type="checkbox"
                        checked={rememberUser}
                        onChange={(e) => setRememberUser(e.target.checked)}
                        className="h-4 w-4 rounded border border-white/15 bg-black/30 text-sky-500 accent-sky-500"
                      />
                      Lembrar usuário
                    </label>
                  
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="
                      relative h-12 w-full rounded-2xl
                      border border-sky-400/20
                      bg-gradient-to-b from-[#4F8CFF] to-[#3A6FE8]
                      text-white font-medium tracking-tight
                      shadow-[0_10px_30px_rgba(79,140,255,0.25)]
                      transition-transform transition-colors duration-200
                      hover:-translate-y-[1px]
                      hover:from-[#5A98FF] hover:to-[#4A7CF0]
                      hover:shadow-[0_14px_36px_rgba(79,140,255,0.35)]
                      active:translate-y-[0px]
                      active:shadow-[0_4px_12px_rgba(79,140,255,0.25)]
                      disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0
                    "
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

                <div className="mt-6 rounded-2xl border border-white/6 bg-black/20 px-4 py-3">
                  <p className="text-center text-sm text-neutral-500">
                    Caso esqueça a senha, entre em contato com o Administrador.
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`hidden lg:block transition-all duration-700 ease-out ${
                animateIn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
            >
              <div className="max-w-[700px]">
                <h1 className="max-w-[13ch] text-[3rem] font-semibold leading-[1.02] tracking-tight text-white xl:text-[3.35rem]">
                  Operação, risco e carteira em uma única plataforma
                </h1>

                <p className="mt-5 max-w-[54ch] text-[15px] leading-7 text-neutral-400 xl:text-base">
                  O CrediControl organiza sua rotina financeira com mais clareza operacional,
                  velocidade de análise e controle sobre cada etapa da cobrança e do crédito.
                </p>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  <FeatureCard
                    icon={Users}
                    title="Clientes centralizados"
                    description="Histórico, relacionamento e dados operacionais em um só fluxo."
                  />
                  <FeatureCard
                    icon={Wallet}
                    title="Carteira sob controle"
                    description="Acompanhe contratos, juros, vencimentos e liquidação com precisão."
                  />
                  <FeatureCard
                    icon={BarChart3}
                    title="Visão estratégica"
                    description="Monitore risco, performance e oportunidades com leitura rápida."
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;