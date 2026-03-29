import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  LogOut,
  ChevronRight,
  Receipt
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
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/customers', label: 'Clientes', icon: Users },
    { path: '/loans', label: 'Empréstimos', icon: CreditCard },
    { path: '/installments', label: 'Parcelas', icon: Receipt },
  ];

  const adminLinks = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Usuários', icon: Users },
  ];

  const links = user?.role === 'admin' ? adminLinks : userLinks;

  return (
    <aside className="w-64 bg-neutral-950 border-r border-neutral-800 min-h-screen flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-neutral-800">
        <h1 className="font-heading text-xl font-bold text-neutral-50 tracking-tight">
          Credi<span className="text-blue-500">Control</span>
        </h1>
        <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">
          {user?.role === 'admin' ? 'Painel Admin' : 'Painel do Usuário'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            
            return (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? 'bg-blue-600/10 text-blue-500' 
                      : 'text-neutral-400 hover:text-neutral-50 hover:bg-neutral-900'
                  }`}
                  data-testid={`nav-${link.label.toLowerCase()}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                  <span className="font-medium">{link.label}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info & logout */}
      <div className="p-4 border-t border-neutral-800">
        <div className="px-4 py-3 mb-3">
          <p className="text-sm font-medium text-neutral-50 truncate">{user?.name}</p>
          <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-3 text-neutral-400 hover:text-neutral-50 hover:bg-neutral-900"
          data-testid="logout-button"
        >
          <LogOut className="h-5 w-5" strokeWidth={1.5} />
          Sair
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
