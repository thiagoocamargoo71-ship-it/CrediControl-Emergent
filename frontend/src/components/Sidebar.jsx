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
  X,
} from 'lucide-react';
import { Button } from '../components/ui/button';

const SidebarContent = ({ links, location, onNavigate, user, handleLogout }) => {
  return (
    <>
      <div className="relative shrink-0 border-b border-neutral-800/90 px-4 py-4 sm:px-5 sm:py-5 bg-neutral-950/85 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-indigo-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.12)]">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent" />
            <span className="relative text-blue-400 font-bold text-sm tracking-wide">CC</span>
          </div>

          <div className="min-w-0">
            <h1 className="font-heading text-xl font-bold text-neutral-50 tracking-tight leading-none">
              Credi<span className="text-blue-500">Control</span>
            </h1>
            <p className="mt-1 truncate text-[10px] uppercase tracking-[0.22em] text-neutral-500">
              {user?.role === 'admin' ? 'Painel Admin' : 'Painel do Usuário'}
            </p>
          </div>
        </div>
      </div>

      <nav className="relative flex-1 min-h-0 overflow-y-auto px-3 py-4 sidebar-scroll">
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
                  onClick={onNavigate}
                  className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white border border-blue-400/20 shadow-[0_10px_30px_rgba(37,99,235,0.18)]'
                      : 'text-neutral-400 border border-transparent hover:border-neutral-800 hover:bg-neutral-900/85 hover:text-neutral-50'
                  }`}
                  data-testid={`nav-${link.label.toLowerCase()}`}
                >
                  {isActive && (
                    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_38%,transparent)]" />
                  )}

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

                  <div className="relative min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium tracking-[0.01em]">
                      {link.label}
                    </span>

                    {!isActive && link.path === '/home' && (
                      <span className="mt-0.5 block text-[10px] uppercase tracking-[0.18em] text-neutral-600 group-hover:text-neutral-500">
                        Tela principal
                      </span>
                    )}
                  </div>

                  <ChevronRight
                    className={`relative h-4 w-4 shrink-0 transition-all duration-300 ${
                      isActive
                        ? 'translate-x-0 text-white opacity-100'
                        : '-translate-x-1 text-neutral-700 opacity-0 group-hover:translate-x-0 group-hover:text-neutral-500 group-hover:opacity-100'
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="relative shrink-0 border-t border-neutral-800/90 p-4 bg-neutral-950/90 backdrop-blur-xl">
        <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 px-4 py-3 shadow-inner">
          <p className="truncate text-sm font-medium text-neutral-100">
            {user?.name || 'Usuário'}
          </p>
          <p className="mt-1 truncate text-xs text-neutral-500">
            {user?.email || 'email@exemplo.com'}
          </p>
        </div>

        <Button
          onClick={handleLogout}
          variant="ghost"
          className="mt-3 h-11 w-full justify-start gap-3 rounded-2xl border border-transparent text-neutral-400 transition-all duration-300 hover:border-neutral-800 hover:bg-neutral-900 hover:text-white"
          data-testid="logout-button"
        >
          <LogOut className="h-5 w-5" strokeWidth={1.8} />
          Sair
        </Button>
      </div>
    </>
  );
};

const Sidebar = ({ mobileOpen = false, setMobileOpen = () => {} }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/login');
  };

  const handleNavigate = () => {
    setMobileOpen(false);
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

      {/* Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col overflow-hidden border-r border-neutral-800 bg-black/95 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-24 h-52 w-52 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute top-1/3 -right-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_18%,transparent_82%,rgba(255,255,255,0.02))]" />
        </div>

        <SidebarContent
          links={links}
          location={location}
          onNavigate={handleNavigate}
          user={user}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Overlay mobile/tablet */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-all duration-300 lg:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer mobile/tablet */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[88%] max-w-[340px] flex-col overflow-hidden border-r border-neutral-800 bg-black/95 backdrop-blur-2xl transition-transform duration-300 sm:w-[78%] md:max-w-[360px] lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/80 text-neutral-200 transition-colors hover:bg-neutral-800"
        >
          <X className="h-5 w-5" />
        </button>

        <SidebarContent
          links={links}
          location={location}
          onNavigate={handleNavigate}
          user={user}
          handleLogout={handleLogout}
        />
      </aside>
    </>
  );
};

export default Sidebar;