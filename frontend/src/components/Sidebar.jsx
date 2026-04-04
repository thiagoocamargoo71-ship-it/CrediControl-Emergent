import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import {
  LayoutDashboard,
  Users,
  Calculator,
  CreditCard,
  LogOut,
  ChevronRight,
  Receipt,
  Settings,
  BarChart3,
  Home as HomeIcon,
} from 'lucide-react';
import { Button } from '../components/ui/button';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userLinks = [
    { path: '/home', label: 'Início', icon: HomeIcon },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/customers', label: 'Clientes', icon: Users },
    { path: '/loans', label: 'Empréstimos', icon: CreditCard },
    { path: '/installments', label: 'Parcelas', icon: Receipt },
    { path: '/reports', label: 'Relatórios', icon: BarChart3 },
    { path: '/simulator', label: 'Simulador', icon: Calculator },
    { path: '/settings', label: 'Configurações', icon: Settings },
  ];

  const adminLinks = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Usuários', icon: Users },
  ];

  const links = user?.role === 'admin' ? adminLinks : userLinks;

  return (
    <>
      <style>
        {`
          .sidebar-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(82, 82, 91, 0.7) transparent;
          }

          .sidebar-scroll::-webkit-scrollbar {
            width: 6px;
          }

          .sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .sidebar-scroll::-webkit-scrollbar-thumb {
            background: rgba(82, 82, 91, 0.65);
            border-radius: 999px;
          }

          .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(113, 113, 122, 0.85);
          }
        `}
      </style>

      <aside className="w-64 h-screen bg-black/95 border-r border-neutral-800 fixed left-0 top-0 flex flex-col overflow-hidden backdrop-blur-xl">
        {/* Glow decor */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-16 h-52 w-52 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute top-1/3 -right-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_18%,transparent_82%,rgba(255,255,255,0.02))]" />
        </div>

        {/* Logo */}
        <div className="relative shrink-0 border-b border-neutral-800/90 px-5 py-5 bg-neutral-950/85 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-indigo-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.12)]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent" />
              <span className="relative text-blue-400 font-bold text-sm tracking-wide">CC</span>
            </div>

            <div className="min-w-0">
              <h1 className="font-heading text-xl font-bold text-neutral-50 tracking-tight leading-none">
                Credi<span className="text-blue-500">Control</span>
              </h1>
              <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-[0.22em] truncate">
                {user?.role === 'admin' ? 'Painel Admin' : 'Painel do Usuário'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 min-h-0 px-3 py-4 overflow-y-auto sidebar-scroll">
          <ul className="space-y-2 pb-3">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive =
                location.pathname === link.path ||
                (link.path !== '/home' && location.pathname.startsWith(link.path));

              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white border border-blue-400/20 shadow-[0_10px_30px_rgba(37,99,235,0.18)]'
                        : 'text-neutral-400 border border-transparent hover:border-neutral-800 hover:bg-neutral-900/85 hover:text-neutral-50'
                    }`}
                    data-testid={`nav-${link.label.toLowerCase()}`}
                  >
                    {/* brilho suave do item ativo */}
                    {isActive && (
                      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_38%,transparent)]" />
                    )}

                    {/* barra lateral ativa */}
                    <div
                      className={`absolute left-0 top-1/2 h-8 -translate-y-1/2 rounded-r-full transition-all duration-300 ${
                        isActive ? 'w-1 bg-white/80' : 'w-0 bg-transparent'
                      }`}
                    />

                    <div
                      className={`relative h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                        isActive
                          ? 'bg-white/10 border-white/10 text-white'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-500 group-hover:bg-neutral-800 group-hover:border-neutral-700 group-hover:text-neutral-200'
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                    </div>

                    <div className="relative flex-1 min-w-0">
                      <span className="block truncate text-[14px] font-medium tracking-[0.01em]">
                        {link.label}
                      </span>

                      {!isActive && link.path === '/home' && (
                        <span className="block mt-0.5 text-[10px] uppercase tracking-[0.18em] text-neutral-600 group-hover:text-neutral-500">
                          Tela principal
                        </span>
                      )}
                    </div>

                    <ChevronRight
                      className={`relative h-4 w-4 shrink-0 transition-all duration-300 ${
                        isActive
                          ? 'text-white translate-x-0 opacity-100'
                          : 'text-neutral-700 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-neutral-500'
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="relative shrink-0 border-t border-neutral-800/90 p-4 bg-neutral-950/90 backdrop-blur-xl">
          <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 px-4 py-3 shadow-inner">
            <p className="text-sm font-medium text-neutral-100 truncate">
              {user?.name || 'Usuário'}
            </p>
            <p className="text-xs text-neutral-500 truncate mt-1">
              {user?.email || 'email@exemplo.com'}
            </p>
          </div>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="mt-3 h-11 w-full justify-start gap-3 rounded-2xl border border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900 hover:border-neutral-800 transition-all duration-300"
            data-testid="logout-button"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.8} />
            Sair
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;