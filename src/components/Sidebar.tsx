import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Folder, Users, Settings, Presentation, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { icon: <Home size={20} />, label: 'Início', path: '/', roles: ['admin', 'editor', 'viewer'] },
    { icon: <LayoutGrid size={20} />, label: 'Meus Slides', path: '/my-slides', roles: ['admin', 'editor'] },
    { icon: <Folder size={20} />, label: 'Arquivos', path: '/assets', roles: ['admin', 'editor'] },
    { icon: <Users size={20} />, label: 'Equipes', path: '/teams', roles: ['admin'] },
  ];

  const currentRole = user?.role || 'viewer';
  const isAdminUser = currentRole === 'admin';

  return (
    <aside className="w-64 bg-bg-secondary border-r border-border-color flex flex-col h-full shrink-0">
      <div className="p-6 flex items-center gap-4">
        {/* Quantum Core Logo */}
        <div className="relative w-10 h-10 flex items-center justify-center group cursor-pointer">
          {/* Inner Glow Core */}
          <div className="absolute inset-0 bg-accent/20 rounded-full blur-md animate-quantum-pulse group-hover:bg-accent/40 transition-all duration-500"></div>

          {/* Outer Ring 1 */}
          <div className="absolute inset-0 border border-accent/30 rounded-full animate-spin-slow"></div>

          {/* Outer Ring 2 (Dashed/Fragmented) */}
          <div className="absolute inset-[-4px] border border-dashed border-accent/20 rounded-full animate-spin-reverse-slower"></div>

          {/* The Icon Core */}
          <div className="relative w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-bg-primary shadow-[0_0_15px_rgba(0,245,255,0.5)] transform transition-transform group-hover:scale-110 duration-300">
            <Presentation size={20} fill="currentColor" />
          </div>

          {/* Orbiting Particle */}
          <div className="absolute inset-[-6px] animate-spin-slow">
            <div className="w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_8px_var(--accent)] absolute top-0 left-1/2 -translate-x-1/2"></div>
          </div>
        </div>

        <div className="flex flex-col">
          <h1 className="text-white font-bold text-lg leading-tight tracking-tight">
            Slides do <span className="text-accent">Miguel</span>
          </h1>
          {isAdmin && <span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Painel de Controle</span>}
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '');
          const isRestricted = !item.roles.includes(currentRole);
          const isVisitor = !user;

          // If visitor, don't show restricted items at all to keep it clean
          if (isRestricted && isVisitor) return null;

          const content = (
            <>
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {isRestricted && <Lock size={14} className="text-slate-500" />}
            </>
          );

          const baseClasses = `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive
            ? 'bg-bg-tertiary text-accent shadow-lg shadow-accent/5'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
            } ${isRestricted ? 'opacity-40 cursor-not-allowed grayscale' : ''}`;

          if (isRestricted) {
            return (
              <div key={item.label} className={baseClasses} title="Acesso Restrito ao seu papel">
                {content}
              </div>
            );
          }

          return (
            <Link key={item.label} to={item.path} className={baseClasses}>
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-4 space-y-2">
        {!user ? (
          <button
            onClick={() => navigate('/access')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-bg-primary font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-accent/20 mb-4"
          >
            <Lock size={18} />
            Acessar com Senha
          </button>
        ) : (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bg-tertiary text-text-secondary hover:text-red-400 hover:bg-red-400/10 font-bold rounded-xl transition-all border border-border-color mb-4"
          >
            <LogOut size={18} />
            Sair do Painel
          </button>
        )}

        {isAdminUser ? (
          <Link
            to={isAdmin ? '/admin/settings' : '/settings'}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${location.pathname.includes('settings')
              ? 'bg-bg-tertiary text-accent'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
              }`}
          >
            <Settings size={20} />
            <span>Configurações</span>
          </Link>
        ) : (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-text-secondary opacity-40 cursor-not-allowed grayscale"
            title="Acesso Restrito ao Admin"
          >
            <Settings size={20} />
            <span className="flex-1">Settings</span>
            <Lock size={14} className="text-slate-500" />
          </div>
        )}

        {isAdminUser && (
          <div className="bg-bg-tertiary rounded-xl p-4 animate-fadeIn mt-4">
            <h3 className="text-accent text-[10px] font-bold tracking-widest uppercase mb-3">Uso de Armazenamento</h3>
            <div className="w-full h-1.5 bg-bg-secondary rounded-full overflow-hidden mb-2">
              <div className="h-full bg-accent w-[60%] rounded-full shadow-[0_0_10px_var(--accent)]"></div>
            </div>
            <p className="text-text-secondary text-xs">1.2GB de 2GB usados</p>
          </div>
        )}
      </div>
    </aside>
  );
}
