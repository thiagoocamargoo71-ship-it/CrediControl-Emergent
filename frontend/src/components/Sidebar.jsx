import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useNotifications } from '../context/NotificationContext';
import {
  BellRing,
  LayoutDashboard,
  Users,
  Calculator,
  Wallet,
  LogOut,
  ChevronRight,
  Receipt,
  Settings,
  BarChart3,
  Home as HomeIcon,
  X,
  Menu,
} from 'lucide-react';
import { Button } from '../components/ui/button';

const SidebarContent = ({
  links,
  location,
  onNavigate,
  handleLogout,
  notificationCount,
  isMobile = false,
}) => {
  return (
    <>
      <div className="relative shrink-0 border-b border-white/6 px-4 py-4 sm:px-5 sm:py-5">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
        <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-300/20 to-transparent" />

        <div className="relative overflow-hidden rounded-[26px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] px-4 py-4 shadow-[0_16px_50px_rgba(0,0,0,0.30)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-8 bottom-0 h-20 w-20 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-sky-400/18 bg-gradient-to-br from-sky-400/18 via-blue-500/14 to-indigo-600/10 shadow-[0_0_40px_rgba(59,130,246,0.18)] sm:h-14 sm:w-14">
              <div className="absolute inset-0 rounded-[18px] bg-[linear-gradient(135deg,rgba(255,255,255,0.09),transparent_55%)]" />
              <span className="relative text-xs font-bold tracking-[0.22em] text-sky-300 sm:text-sm">
                CC
              </span>
            </div>

            <div className="min-w-0">
              <h1 className="font-heading text-[1.05rem] font-semibold leading-none tracking-tight text-white sm:text-[1.22rem]">
                Credi<span className="text-sky-400">Control</span>
              </h1>
              <p className="mt-1.5 truncate text-[10px] font-medium uppercase tracking-[0.24em] text-neutral-500">
                {isMobile ? 'Menu' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <nav className="sidebar-scroll relative min-h-0 flex-1 overflow-y-auto px-3 py-4 pb-6">
        <ul className="space-y-2 pb-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              location.pathname === link.path ||
              (link.path !== '/home' && location.pathname.startsWith(link.path));

            const isNotifications = link.path === '/notifications';
            const hasNotificationBadge = isNotifications && notificationCount > 0;

            return (
              <li key={link.path}>
                <Link
                  to={link.path}
                  onClick={onNavigate}
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-[22px] px-3 py-3 transition-all duration-300 ${
                    isActive
                      ? 'border border-sky-400/18 bg-[linear-gradient(135deg,rgba(79,140,255,0.96),rgba(58,111,232,0.96))] text-white shadow-[0_14px_34px_rgba(59,130,246,0.24)]'
                      : hasNotificationBadge
                        ? 'border border-amber-500/12 bg-[linear-gradient(180deg,rgba(245,158,11,0.06),rgba(255,255,255,0.01))] text-neutral-200 hover:border-amber-500/20 hover:bg-[linear-gradient(180deg,rgba(245,158,11,0.09),rgba(255,255,255,0.02))] hover:text-white'
                        : 'border border-transparent bg-transparent text-neutral-400 hover:border-white/6 hover:bg-white/[0.03] hover:text-neutral-50'
                  }`}
                >
                  {isActive && (
                    <>
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_40%,transparent)]" />
                      <div className="pointer-events-none absolute left-0 top-1/2 h-9 w-1 -translate-y-1/2 rounded-r-full bg-white/80" />
                    </>
                  )}

                  <div
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 sm:h-11 sm:w-11 ${
                      isActive
                        ? 'border-white/10 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]'
                        : hasNotificationBadge
                          ? 'border-amber-500/12 bg-amber-500/10 text-amber-300 group-hover:border-amber-500/20 group-hover:bg-amber-500/12 group-hover:text-amber-200'
                          : 'border-neutral-800 bg-neutral-900/90 text-neutral-500 group-hover:border-neutral-700 group-hover:bg-neutral-800/90 group-hover:text-neutral-200'
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="block truncate text-[13px] font-medium tracking-[0.01em] sm:text-[14px]">
                        {link.label}
                      </span>

                      {hasNotificationBadge ? (
                        <span className="inline-flex min-w-[24px] items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/12 px-2 py-0.5 text-[10px] font-semibold text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.10)]">
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                      ) : null}
                    </div>

                    <span
                      className={`mt-0.5 block truncate text-[10px] uppercase tracking-[0.18em] transition-colors duration-300 ${
                        isActive
                          ? 'text-white/70'
                          : hasNotificationBadge
                            ? 'text-amber-200/70 group-hover:text-amber-200/80'
                            : 'text-neutral-600 group-hover:text-neutral-500'
                      }`}
                    >
                      {link.path === '/home'
                        ? 'Tela principal'
                        : link.path === '/dashboard' || link.path === '/admin'
                          ? 'Visão geral'
                          : link.path === '/customers' || link.path === '/admin/users'
                            ? 'Gestão'
                            : link.path === '/loans'
                              ? 'Operações'
                              : link.path === '/installments'
                                ? 'Controle'
                                : link.path === '/reports'
                                  ? 'Análises'
                                  : link.path === '/simulator'
                                    ? 'Cálculos'
                                    : link.path === '/notifications'
                                      ? 'Monitoramento'
                                      : 'Preferências'}
                    </span>
                  </div>

                  <ChevronRight
                    className={`relative h-4 w-4 shrink-0 transition-all duration-300 ${
                      isActive
                        ? 'translate-x-0 text-white opacity-100'
                        : hasNotificationBadge
                          ? 'translate-x-0 text-amber-300/70 opacity-100'
                          : '-translate-x-1 text-neutral-700 opacity-0 group-hover:translate-x-0 group-hover:text-neutral-500 group-hover:opacity-100'
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-white/6 bg-[linear-gradient(180deg,rgba(10,10,10,0.88),rgba(6,6,8,0.96))] p-3 pb-5 sm:p-4 sm:pb-6">
        <div className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-2 shadow-[0_14px_40px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <Button
            onClick={handleLogout}
            className="
              relative h-11 w-full gap-3 rounded-[20px] px-4
              border border-sky-400/20
              bg-gradient-to-b from-[#4F8CFF] to-[#3A6FE8]
              text-white font-medium tracking-tight
              shadow-[0_10px_28px_rgba(79,140,255,0.24)]
              transition-all duration-200
              hover:-translate-y-[1px]
              hover:from-[#5A98FF] hover:to-[#4A7CF0]
              hover:shadow-[0_14px_34px_rgba(79,140,255,0.34)]
              active:translate-y-[0px]
              active:shadow-[0_6px_16px_rgba(79,140,255,0.22)]
            "
            data-testid="logout-button"
          >
            <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_46%)]" />
            <LogOut className="relative h-4 w-4 opacity-90" strokeWidth={1.9} />
            <span className="relative">Sair</span>
          </Button>
        </div>
      </div>
    </>
  );
};

const Sidebar = ({ mobileOpen: controlledMobileOpen, setMobileOpen: controlledSetMobileOpen }) => {
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { count: notificationCount } = useNotifications();

  const isControlled =
    typeof controlledMobileOpen === 'boolean' &&
    typeof controlledSetMobileOpen === 'function';

  const mobileOpen = isControlled ? controlledMobileOpen : internalMobileOpen;
  const setMobileOpen = isControlled ? controlledSetMobileOpen : setInternalMobileOpen;

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [mobileOpen, setMobileOpen]);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/login');
  };

  const handleNavigate = () => {
    setMobileOpen(false);
  };

  const userLinks = useMemo(
    () => [
      { path: '/home', label: 'Início', icon: HomeIcon },
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/customers', label: 'Clientes', icon: Users },
      { path: '/loans', label: 'Empréstimos', icon: Wallet },
      { path: '/installments', label: 'Parcelas', icon: Receipt },
      { path: '/reports', label: 'Relatórios', icon: BarChart3 },
      { path: '/simulator', label: 'Simulador', icon: Calculator },
      { path: '/notifications', label: 'Notificações', icon: BellRing },
      { path: '/settings', label: 'Configurações', icon: Settings },
    ],
    []
  );

  const adminLinks = useMemo(
    () => [
      { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/admin/users', label: 'Usuários', icon: Users },
    ],
    []
  );

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

      {!isControlled && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed left-4 top-4 z-[90] flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-neutral-900/85 text-neutral-100 shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-800 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[276px] flex-col overflow-hidden border-r border-white/6 bg-[linear-gradient(180deg,rgba(10,10,10,0.96),rgba(6,6,8,0.98))] backdrop-blur-2xl lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-16 h-56 w-56 rounded-full bg-sky-500/10 blur-[90px]" />
          <div className="absolute top-[22%] -right-20 h-44 w-44 rounded-full bg-blue-600/10 blur-[90px]" />
          <div className="absolute bottom-10 left-4 h-32 w-32 rounded-full bg-indigo-500/8 blur-[80px]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_16%,transparent_84%,rgba(255,255,255,0.02))]" />
        </div>

        <SidebarContent
          links={links}
          location={location}
          onNavigate={handleNavigate}
          handleLogout={handleLogout}
          notificationCount={notificationCount}
        />
      </aside>

      <div
        className={`fixed inset-0 z-[95] bg-black/65 backdrop-blur-sm transition-all duration-300 lg:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 z-[100] flex h-screen w-[88%] max-w-[360px] flex-col overflow-hidden border-r border-white/6 bg-[linear-gradient(180deg,rgba(10,10,10,0.97),rgba(6,6,8,0.99))] backdrop-blur-2xl transition-transform duration-300 sm:w-[72%] md:w-[52%] lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-12 top-0 h-40 w-40 rounded-full bg-sky-500/10 blur-[80px]" />
          <div className="absolute bottom-10 right-0 h-36 w-36 rounded-full bg-indigo-500/10 blur-[80px]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_20%,transparent_84%,rgba(255,255,255,0.02))]" />
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-neutral-900/80 text-neutral-200 transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-800"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>

        <SidebarContent
          links={links}
          location={location}
          onNavigate={handleNavigate}
          handleLogout={handleLogout}
          notificationCount={notificationCount}
          isMobile
        />
      </aside>
    </>
  );
};

export default Sidebar;