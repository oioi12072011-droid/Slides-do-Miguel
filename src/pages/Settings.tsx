import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Palette, User, Shield, Cloud, History, CreditCard, Settings as SettingsIcon, View, Sparkles, Save, LayoutGrid } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-primary">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
        <Header title="Settings" />

        <div className="p-8 space-y-8 max-w-4xl mx-auto w-full">
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-text-primary">Appearance</h1>
            <p className="text-text-secondary">Manage how the interface looks and feels across your devices.</p>
          </div>

          {/* Theme Selection */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                <Palette className="text-accent" size={20} />
                Theme Selection
              </h2>
              <span className="text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded">Active: {theme}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Cyber Blue */}
              <div
                onClick={() => setTheme('default')}
                className="group relative cursor-pointer"
              >
                <div className={`aspect-video rounded-xl overflow-hidden mb-3 bg-slate-900 transition-all ${theme === 'default' ? 'border-2 border-accent shadow-[0_0_15px_var(--accent)]' : 'border border-border-color hover:border-accent/50'}`}>
                  <div className="w-full h-full bg-gradient-to-br from-[#0D1117] via-[#0f2223] to-[#00F5FF]/20 flex items-center justify-center">
                    <div className="w-12 h-1 bg-[#00F5FF] rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className={`text-sm font-bold text-center transition-colors ${theme === 'default' ? 'text-accent' : 'text-text-primary group-hover:text-accent'}`}>Cyber Blue</p>
              </div>

              {/* Cyber Red */}
              <div
                onClick={() => setTheme('cyber-red')}
                className="group relative cursor-pointer"
              >
                <div className={`aspect-video rounded-xl overflow-hidden mb-3 bg-slate-900 transition-all ${theme === 'cyber-red' ? 'border-2 border-[#ff3333] shadow-[0_0_15px_#ff3333]' : 'border border-border-color hover:border-[#ff3333]/50'}`}>
                  <div className="w-full h-full bg-gradient-to-br from-[#1a0505] via-[#2a0808] to-[#ff3333]/20 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="w-3 h-3 bg-[#ff3333] rounded-sm opacity-50"></div>
                      <div className="w-3 h-3 bg-[#ff3333] rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <p className={`text-sm font-bold text-center transition-colors ${theme === 'cyber-red' ? 'text-[#ff3333]' : 'text-text-primary group-hover:text-[#ff3333]'}`}>Cyber Red</p>
              </div>

              {/* Cyber Purple */}
              <div
                onClick={() => setTheme('cyber-purple')}
                className="group relative cursor-pointer"
              >
                <div className={`aspect-video rounded-xl overflow-hidden mb-3 bg-slate-900 transition-all ${theme === 'cyber-purple' ? 'border-2 border-[#b026ff] shadow-[0_0_15px_#b026ff]' : 'border border-border-color hover:border-[#b026ff]/50'}`}>
                  <div className="w-full h-full bg-gradient-to-br from-[#12051a] via-[#1d082a] to-[#b026ff]/20 flex items-center justify-center">
                    <div className="space-y-1">
                      <div className="w-8 h-1 bg-[#b026ff] rounded-full"></div>
                      <div className="w-6 h-1 bg-[#b026ff] opacity-40 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <p className={`text-sm font-bold text-center transition-colors ${theme === 'cyber-purple' ? 'text-[#b026ff]' : 'text-text-primary group-hover:text-[#b026ff]'}`}>Cyber Purple</p>
              </div>

              {/* Matrix Clean */}
              <div
                onClick={() => setTheme('matrix-clean')}
                className="group relative cursor-pointer"
              >
                <div className={`aspect-video rounded-xl overflow-hidden mb-3 bg-slate-900 transition-all ${theme === 'matrix-clean' ? 'border-2 border-[#00ff41] shadow-[0_0_15px_#00ff41]' : 'border border-border-color hover:border-[#00ff41]/50'}`}>
                  <div className="w-full h-full bg-gradient-to-br from-[#051a0b] via-[#082a12] to-[#00ff41]/20 flex items-center justify-center">
                    <span className="text-[#00ff41] opacity-60 font-mono font-bold">{'>_'}</span>
                  </div>
                </div>
                <p className={`text-sm font-bold text-center transition-colors ${theme === 'matrix-clean' ? 'text-[#00ff41]' : 'text-text-primary group-hover:text-[#00ff41]'}`}>Matrix Clean</p>
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-text-primary">
              <SettingsIcon className="text-accent" size={20} />
              Interface Preferences
            </h2>

            <div className="bg-bg-tertiary rounded-xl border border-border-color divide-y divide-border-color">
              {/* High Contrast */}
              <div className="flex items-center justify-between p-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    <View size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">High Contrast</p>
                    <p className="text-xs text-text-secondary">Increase contrast for better accessibility</p>
                  </div>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-accent/20">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-text-primary transition translate-x-1"></span>
                </button>
              </div>

              {/* Compact Mode */}
              <div className="flex items-center justify-between p-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    <LayoutGrid size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">Compact Layout</p>
                    <p className="text-xs text-text-secondary">Show more information with less white space</p>
                  </div>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-accent">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-bg-primary transition translate-x-6"></span>
                </button>
              </div>

              {/* Glassmorphism */}
              <div className="flex items-center justify-between p-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">Glassmorphism Effects</p>
                    <p className="text-xs text-text-secondary">Enable transparency and blur effects on UI elements</p>
                  </div>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-accent">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-bg-primary transition translate-x-6"></span>
                </button>
              </div>

              {/* Auto-save */}
              <div className="flex items-center justify-between p-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    <Save size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">Real-time Auto-save</p>
                    <p className="text-xs text-text-secondary">Automatically save your changes as you edit</p>
                  </div>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-accent">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-bg-primary transition translate-x-6"></span>
                </button>
              </div>
            </div>
          </section>

          {/* Footer Actions */}
          <div className="mt-12 pt-8 border-t border-border-color flex justify-end gap-4">
            <button className="px-6 py-2.5 rounded-lg font-bold text-text-secondary hover:bg-accent/10 transition-colors">
              Reset to Default
            </button>
            <button className="px-8 py-2.5 rounded-lg font-bold bg-accent text-bg-primary hover:shadow-lg hover:shadow-accent/20 transition-all">
              Save Changes
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
