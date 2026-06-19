import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, Upload, Settings, LogOut,
  UserSearch, BriefcaseBusiness, UploadCloud
} from 'lucide-react';

function NavItem({ to, icon: Icon, label, onClose }) {
  return (
    <NavLink
      to={to}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive ? 'text-white' : 'text-white/50 hover:text-white/90 hover:bg-white/5'
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
  );
}

function SectionLabel({ label }) {
  return (
    <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-3 pt-3 pb-1">
      {label}
    </p>
  );
}

export default function Sidebar({ onClose }) {
  const { user, empresa, logout, isDono, isRH, isVendedor, hasVendas, hasRecrutamento } = useAuth();
  const navigate = useNavigate();

  function handleLogout() { logout(); navigate('/'); }

  const tipoLabel = isDono ? 'Dono' : isRH ? 'RH' : 'Vendedor';
  const tipoStyle = isDono
    ? { background: 'rgba(21,101,245,0.25)', color: '#60b0ff' }
    : isRH
      ? { background: 'rgba(0,200,120,0.20)', color: '#4ade80' }
      : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' };

  const showVendas      = hasVendas && (isDono || isVendedor);
  const showRecrutamento = hasRecrutamento && (isDono || isRH);

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
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={tipoStyle}>
              {tipoLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">

        {showVendas && (
          <>
            {showRecrutamento && <SectionLabel label="Vendas" />}
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClose={onClose} />
            <NavItem to="/leads" icon={FileText} label="Leads" onClose={onClose} />
            {isDono && <NavItem to="/importar" icon={Upload} label="Importar Leads" onClose={onClose} />}
          </>
        )}

        {showRecrutamento && (
          <>
            {showVendas && <SectionLabel label="Recrutamento" />}
            {!showVendas && <SectionLabel label="Recrutamento" />}
            <NavItem to="/recrutamento/dashboard" icon={BriefcaseBusiness} label="Dashboard RH" onClose={onClose} />
            <NavItem to="/recrutamento/candidatos" icon={UserSearch} label="Candidatos" onClose={onClose} />
            {isDono && <NavItem to="/recrutamento/importar" icon={UploadCloud} label="Importar Candidatos" onClose={onClose} />}
          </>
        )}

        {isDono && (
          <>
            <SectionLabel label="Administração" />
            <NavItem to="/usuarios" icon={Users} label="Usuários" onClose={onClose} />
            <NavItem to="/configuracoes" icon={Settings} label="Configurações" onClose={onClose} />
          </>
        )}
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
