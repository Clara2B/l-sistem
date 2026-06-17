import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, FileText, Upload, Settings, LogOut } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads',     icon: FileText,        label: 'Leads' },
  { to: '/importar',  icon: Upload,           label: 'Importar',      donoOnly: true },
  { to: '/usuarios',  icon: Users,            label: 'Usuários',      donoOnly: true },
  { to: '/configuracoes', icon: Settings,     label: 'Configurações', donoOnly: true },
];

export default function Sidebar({ onClose }) {
  const { user, empresa, logout, isDono } = useAuth();
  const navigate = useNavigate();

  function handleLogout() { logout(); navigate('/'); }

  const filtered = navItems.filter(i => !i.donoOnly || isDono);

  return (
    <aside className="flex flex-col h-full w-64 text-white" style={{ background: '#050505' }}>

      {/* Logo */}
      <div className="flex items-center justify-center px-4 py-6 border-b border-white/8">
        <img src="/logo.png" alt="B.BOTH" className="h-12 w-auto object-contain" />
      </div>

      {/* Empresa / usuário */}
      <div className="px-4 py-4 border-b border-white/8">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Empresa</p>
        <p className="font-semibold text-white text-sm leading-tight">{empresa?.nome}</p>
        <div className="flex items-center gap-2 mt-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black shrink-0"
            style={{ background: 'linear-gradient(135deg, #1565F5, #00D4F5)' }}
          >
            {user?.nome?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/90 truncate">{user?.nome}</p>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={isDono
                ? { background: 'rgba(21,101,245,0.25)', color: '#60b0ff' }
                : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
              }
            >
              {isDono ? 'Dono' : 'Vendedor'}
            </span>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {filtered.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'text-white'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive
              ? { background: 'linear-gradient(135deg, rgba(21,101,245,0.35) 0%, rgba(0,212,245,0.20) 100%)', borderLeft: '3px solid #00D4F5', paddingLeft: '9px' }
              : {}
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-white/8 pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
        >
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </aside>
  );
}
