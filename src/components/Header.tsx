import React from 'react';
import { Search, Bell, HelpCircle, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Header({
  title,
  searchValue,
  onSearchChange
}: {
  title?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-20 bg-bg-secondary border-b border-border-color flex items-center justify-between px-8 shrink-0">
      <div className="flex-1 max-w-2xl">
        <div className="relative flex items-center w-full h-12 rounded-xl bg-bg-tertiary border border-transparent focus-within:border-accent/30 transition-colors">
          <Search className="absolute left-4 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search presentations, assets..."
            value={searchValue || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full h-full bg-transparent pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none text-sm font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 ml-8">
        <button className="relative text-slate-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full shadow-[0_0_8px_var(--accent)]"></span>
        </button>
        <button className="text-slate-400 hover:text-white transition-colors">
          <HelpCircle size={20} />
        </button>

        <div className="w-px h-8 bg-bg-tertiary"></div>

        {user ? (
          <div className="flex items-center gap-3 cursor-pointer group" onClick={logout}>
            <span className="text-sm font-bold text-white group-hover:text-accent transition-colors">Miguel Corrêa</span>
            <div className="w-10 h-10 rounded-full bg-bg-tertiary border-2 border-border-color group-hover:border-accent transition-colors flex items-center justify-center text-slate-400 group-hover:text-accent">
              <User size={20} />
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate('/admin/login')}
            className="px-6 py-2 bg-accent text-bg-primary font-bold rounded-lg hover:bg-accent-hover transition-colors shadow-lg shadow-accent/30"
          >
            IN
          </button>
        )}
      </div>
    </header>
  );
}
