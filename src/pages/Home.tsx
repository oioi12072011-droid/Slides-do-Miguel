import React, { useState, useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { PlayCircle, History, Plus, Edit, Trash2, X, Upload, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTeams } from '../contexts/TeamsContext';
import { useModal } from '../contexts/ModalContext';
import { usePresentation } from '../hooks/usePresentation';
import { useNavigate } from 'react-router-dom';

const PREDEFINED_COVERS = [
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop', // Space
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop', // Cyberpunk
  'https://images.unsplash.com/photo-1463171515643-952cee54d42a?q=80&w=2670&auto=format&fit=crop', // Tech
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2670&auto=format&fit=crop'  // Matrix
];

function timeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Agora mesmo';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  return new Date(timestamp).toLocaleDateString();
}

export function Home() {
  const { presentations, createPresentation, deletePresentation, setActivePresentationById } = usePresentation();
  const { user } = useAuth();
  const { members } = useTeams();
  const { showDelete } = useModal();
  const navigate = useNavigate();
  const isAdminUser = user?.role === 'admin';

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newThumbnail, setNewThumbnail] = useState(PREDEFINED_COVERS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllRecent, setShowAllRecent] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewThumbnail(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim() || 'Nova Apresentação';
    const category = newCategory.trim() || 'Sem Categoria';
    const newPres = createPresentation(title, category, newThumbnail, newDescription.trim());
    setIsModalOpen(false);

    // Reset form
    setNewTitle('');
    setNewCategory('');
    setNewDescription('');
    setNewThumbnail(PREDEFINED_COVERS[0]);

    navigate(`/editor/${newPres.id}`);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await showDelete(
      'Excluir Apresentação',
      'Tem certeza que deseja excluir esta apresentação? Esta ação não pode ser desfeita.'
    );

    if (confirmed) {
      deletePresentation(id);
    }
  };

  const filteredPresentations = React.useMemo(() => {
    if (!searchQuery) return presentations;
    return presentations.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [presentations, searchQuery]);

  const featured = searchQuery ? null : (filteredPresentations.find(p => p.isFeatured) || filteredPresentations[0]);
  const recent = searchQuery
    ? filteredPresentations
    : filteredPresentations.filter(p => p.id !== featured?.id);

  // Engagement calculation
  const getEngagementData = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return {
        date,
        label: days[date.getDay()],
        count: 0
      };
    });

    presentations.forEach(p => {
      [p.createdAt, p.updatedAt].forEach(timestamp => {
        if (!timestamp) return;
        const d = new Date(timestamp);
        d.setHours(0, 0, 0, 0);

        // Find which bucket this belongs to
        const bucket = data.find(b => b.date.getTime() === d.getTime());
        if (bucket) {
          bucket.count += 1; // Count creations and updates within the same day
        }
      });
    });

    const maxCount = Math.max(...data.map(d => d.count));

    return data.map((d, i) => ({
      ...d,
      isToday: i === 6,
      heightPercentage: maxCount === 0 ? 5 : Math.max(5, (d.count / maxCount) * 100)
    }));
  };

  const engagementData = getEngagementData();

  // Real computed metrics
  const chartMetrics = useMemo(() => {
    const totalPresentations = presentations.length;
    const totalSlides = presentations.reduce((sum, p) => sum + (p.slides?.length || 0), 0);
    const totalMembers = members.length;

    // Last edit
    const lastUpdated = presentations.reduce((latest, p) => Math.max(latest, p.updatedAt || 0), 0);
    const lastEditAgo = lastUpdated > 0 ? timeAgo(lastUpdated) : 'N/A';

    // Peak day count
    const peakCount = Math.max(...engagementData.map(d => d.count), 0);
    const totalActions = engagementData.reduce((sum, d) => sum + d.count, 0);

    // Generate SVG path from engagementData (7 points spread across 0-1000)
    const maxCount = Math.max(...engagementData.map(d => d.count), 1);
    const points = engagementData.map((d, i) => {
      const x = (i / (engagementData.length - 1)) * 1000;
      const y = 380 - (d.count / maxCount) * 340; // 380 = bottom, 40 = top
      return { x, y };
    });
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(' ');
    const areaPath = linePath + ` L1000,400 L0,400 Z`;

    // Find top 2 peaks for animated dots
    const sorted = [...engagementData].map((d, i) => ({ ...d, idx: i })).sort((a, b) => b.count - a.count);
    const peaks = sorted.slice(0, 2).filter(p => p.count > 0).map(p => ({
      x: (p.idx / (engagementData.length - 1)) * 1000,
      y: 380 - (p.count / maxCount) * 340
    }));

    return { totalPresentations, totalSlides, totalMembers, lastEditAgo, peakCount, totalActions, linePath, areaPath, points, peaks };
  }, [presentations, members, engagementData]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-primary">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
        <Header
          title={user ? "Dashboard" : "Painel de Visitante"}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {!user && (
          <div className="px-8 mt-6">
            <div className="bg-accent/10 border border-accent/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h4 className="text-accent font-bold text-lg flex items-center justify-center md:justify-start gap-2">
                  <Lock size={18} />
                  Área Restrita
                </h4>
                <p className="text-text-secondary text-sm">Tem uma senha de acesso? Faça login para editar slides e gerenciar a equipe.</p>
              </div>
              <button
                onClick={() => navigate('/access')}
                className="px-6 py-2.5 bg-accent text-bg-primary font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-accent/20 whitespace-nowrap"
              >
                Acessar com Senha
              </button>
            </div>
          </div>
        )}

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Featured Presentation */}
          {featured && (
            <section className="relative flex flex-col lg:flex-row items-stretch rounded-xl overflow-hidden bg-bg-tertiary border border-border-color shadow-2xl shadow-accent/5">
              <div
                className="w-full lg:w-3/5 bg-center bg-cover min-h-[300px]"
                style={{ backgroundImage: `url('${featured.thumbnail || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop'}')` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-bg-tertiary via-bg-tertiary/40 to-transparent"></div>
              </div>
              <div className="w-full lg:w-2/5 flex flex-col justify-center p-8 lg:p-10 relative z-10">
                <span className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest mb-4 border border-accent/30 w-fit">
                  SLIDE DESTAQUE
                </span>
                <h3 className="text-3xl font-bold text-text-primary mb-4 leading-tight">{featured.title}</h3>
                <p className="text-text-secondary text-base mb-6 leading-relaxed">
                  {featured.description || 'Nenhuma descrição fornecida para este projeto. Adicione uma descrição ao criar ou editar o projeto.'}
                </p>
                <div className="flex items-center gap-6 mb-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Atualizado</span>
                    <span className="text-text-primary text-sm font-medium">{timeAgo(featured.updatedAt)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Duração</span>
                    <span className="text-text-primary text-sm font-medium">{featured.slides.length} slides</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActivePresentationById(featured.id);
                    navigate(`/presentation/${featured.id}`);
                  }}
                  className="flex items-center justify-center gap-2 w-full lg:w-fit px-8 py-3 bg-accent text-bg-primary font-bold rounded-lg hover:brightness-110 transition-all shadow-lg shadow-accent/20"
                >
                  <PlayCircle size={20} />
                  <span>Apresentar</span>
                </button>
              </div>
            </section>
          )}

          {/* Recent Presentations Grid */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <History className="text-accent" size={24} />
                {searchQuery ? `Resultados para "${searchQuery}"` : (isAdminUser ? 'Minhas Apresentações' : 'Apresentações Recentes')}
              </h2>
              {isAdminUser && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-bg-primary font-bold rounded-lg hover:brightness-110 transition-all shadow-lg shadow-accent/20"
                >
                  <Plus size={18} />
                  <span>Novo Projeto</span>
                </button>
              )}
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${recent.length === 0 ? 'min-h-[200px] flex items-center justify-center' : ''}`}>
              {recent.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-bg-tertiary/20 rounded-xl border border-dashed border-border-color">
                  <p className="text-text-secondary">Nenhuma outra apresentação encontrada.</p>
                </div>
              ) : (
                recent.slice(0, showAllRecent ? recent.length : 4).map(presentation => (
                  <div
                    key={presentation.id}
                    onClick={() => navigate(`/presentation/${presentation.id}`)}
                    className="group flex flex-col bg-bg-tertiary/30 border border-border-color rounded-xl overflow-hidden hover:border-accent/40 transition-all hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <div
                        className="w-full h-full bg-center bg-cover transition-transform duration-500 group-hover:scale-110"
                        style={{ backgroundImage: `url('${presentation.thumbnail || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop'}')` }}
                      ></div>
                      <div className="absolute inset-0 bg-bg-primary/20 group-hover:bg-transparent transition-colors"></div>
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-bg-primary/80 backdrop-blur-md rounded text-[10px] font-bold text-accent border border-accent/20">
                        {presentation.slides.length} SLIDES
                      </div>
                    </div>
                    <div className="p-4 flex flex-col h-full">
                      <p className="text-accent text-[10px] font-bold uppercase tracking-widest mb-1">{presentation.category}</p>
                      <h4 className="text-text-primary font-bold text-base mb-1 group-hover:text-accent transition-colors">{presentation.title}</h4>
                      {presentation.description && (
                        <p className="text-text-secondary text-xs line-clamp-2 mb-1">{presentation.description}</p>
                      )}

                      {isAdminUser && (
                        <div className="mt-auto flex items-center justify-end gap-3 pt-3 border-t border-border-color/50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/editor/${presentation.id}`);
                            }}
                            className="text-slate-400 hover:text-accent transition-colors"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(presentation.id, e)}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {recent.length > 4 && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setShowAllRecent(!showAllRecent)}
                  className="px-6 py-3 bg-bg-tertiary/50 border border-accent/30 text-accent font-bold rounded-xl hover:bg-accent/10 hover:border-accent transition-all text-sm"
                >
                  {showAllRecent ? 'Mostrar Menos' : `Ver Mais (${recent.length - 4} restantes)`}
                </button>
              </div>
            )}
          </section>

          {/* Cyberpunk Engagement Chart */}
          <section>
            <div className="relative w-full p-8 bg-bg-secondary border border-accent/20 rounded-xl overflow-hidden shadow-2xl shadow-accent/5">
              {/* HUD Scanning Background Effect */}
              <div className="absolute inset-0 z-0 overflow-hidden opacity-30 pointer-events-none">
                <div
                  className="w-full h-[2px] absolute"
                  style={{
                    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                    opacity: 0.2,
                    animation: 'scan 4s linear infinite'
                  }}
                />
              </div>

              {/* Header */}
              <header className="relative z-10 flex justify-between items-end mb-12 border-b border-accent/10 pb-6">
                <div className="space-y-1">
                  <h2 className="text-xs uppercase tracking-[0.3em] text-accent/60 font-medium">Métricas do Sistema // Últimos 7 dias</h2>
                  <h1 className="text-4xl font-bold tracking-tight text-text-primary">Atividade do Projeto</h1>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-widest text-accent/60 mb-1">Pico de Atividade</div>
                  <div className="text-5xl font-bold text-accent" style={{ fontVariantNumeric: 'tabular-nums' }}>{chartMetrics.peakCount}<span className="text-2xl font-light opacity-50 ml-1">ações</span></div>
                </div>
              </header>

              {/* SVG Chart */}
              <div className="relative z-10 w-full h-[400px]">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <g>
                    <line x1="0" x2="1000" y1="100" y2="100" stroke="var(--accent)" strokeWidth="1" opacity="0.1" />
                    <line x1="0" x2="1000" y1="200" y2="200" stroke="var(--accent)" strokeWidth="1" opacity="0.1" />
                    <line x1="0" x2="1000" y1="300" y2="300" stroke="var(--accent)" strokeWidth="1" opacity="0.1" />
                    {engagementData.map((d, i) => {
                      const x = (i / (engagementData.length - 1)) * 1000;
                      return (
                        <g key={i}>
                          <line x1={x} x2={x} y1="0" y2="400" stroke="var(--accent)" strokeWidth="1" opacity="0.1" />
                          <text x={x} y="395" textAnchor="middle" fill="var(--accent)" opacity="0.4" fontSize="12" fontWeight="bold">{d.label}</text>
                        </g>
                      );
                    })}
                  </g>

                  {/* Area Fill */}
                  <path d={chartMetrics.areaPath} fill="url(#areaGradient)" />

                  {/* Main Data Line */}
                  <path
                    d={chartMetrics.linePath}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0 0 8px var(--accent))' }}
                  />

                  {/* All Data Points */}
                  {chartMetrics.points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--accent)" opacity="0.6" />
                  ))}

                  {/* Animated Peak Points */}
                  {chartMetrics.peaks.map((p, i) => (
                    <g key={`peak-${i}`}>
                      <circle cx={p.x} cy={p.y} r="5" fill="var(--accent)" className="animate-pulse" />
                      <circle cx={p.x} cy={p.y} r="12" fill="none" stroke="var(--accent)" className="animate-ping opacity-30" />
                    </g>
                  ))}
                </svg>

                {/* HUD Overlays */}
                <div className="absolute top-4 left-4 pointer-events-none">
                  <div className="flex items-center space-x-2 bg-bg-primary/80 border border-accent/30 px-3 py-1 rounded">
                    <span className="w-2 h-2 bg-accent animate-pulse rounded-full" />
                    <span className="text-[10px] uppercase tracking-tighter text-accent">Dados em Tempo Real</span>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 pointer-events-none text-right">
                  <p className="text-[10px] uppercase text-accent/40">Total Semanal</p>
                  <p className="text-sm font-mono text-accent">{chartMetrics.totalActions} ações</p>
                </div>
              </div>

              {/* Footer Metrics */}
              <footer className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                <div className="p-4 border-l-2 border-accent/20 bg-white/5 hover:bg-white/10 transition-colors rounded-r">
                  <p className="text-[10px] uppercase tracking-widest text-accent/60">Apresentações</p>
                  <p className="text-xl font-bold text-text-primary">{chartMetrics.totalPresentations} <span className="text-xs font-normal opacity-50">TOTAL</span></p>
                </div>
                <div className="p-4 border-l-2 border-accent/20 bg-white/5 hover:bg-white/10 transition-colors rounded-r">
                  <p className="text-[10px] uppercase tracking-widest text-accent/60">Total de Slides</p>
                  <p className="text-xl font-bold text-text-primary">{chartMetrics.totalSlides} <span className="text-xs font-normal opacity-50">SLIDES</span></p>
                </div>
                <div className="p-4 border-l-2 border-accent/20 bg-white/5 hover:bg-white/10 transition-colors rounded-r">
                  <p className="text-[10px] uppercase tracking-widest text-accent/60">Membros da Equipe</p>
                  <p className="text-xl font-bold text-text-primary">{chartMetrics.totalMembers} <span className="text-xs font-normal opacity-50">USERS</span></p>
                </div>
                <div className="p-4 border-l-2 border-accent/20 bg-white/5 hover:bg-white/10 transition-colors rounded-r">
                  <p className="text-[10px] uppercase tracking-widest text-accent/60">Última Edição</p>
                  <p className="text-xl font-bold text-text-primary">{chartMetrics.lastEditAgo}</p>
                </div>
              </footer>

              {/* Subtle Background Pattern */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(var(--accent) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            </div>
          </section>
        </div>

        {/* New Project Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-bg-secondary border border-border-color rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
              <div className="p-6 border-b border-border-color flex items-center justify-between">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Plus className="text-accent" />
                  Criar Novo Projeto
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wide">
                      Nome da Apresentação
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ex: Reunião de Resultados Trimestrais"
                      className="w-full bg-bg-tertiary text-text-primary border border-border-color rounded-xl px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wide">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Ex: Negócios, Educação..."
                      className="w-full bg-bg-tertiary text-text-primary border border-border-color rounded-xl px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wide">
                      Breve Descrição
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Descreva brevemente do que se trata este projeto..."
                      className="w-full bg-bg-tertiary text-text-primary border border-border-color rounded-xl px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all min-h-[100px] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wide">
                      Imagem de Capa
                    </label>

                    {/* Preview Area */}
                    <div
                      className="w-full aspect-video rounded-xl border border-border-color mb-4 bg-center bg-cover relative overflow-hidden group"
                      style={{ backgroundImage: `url('${newThumbnail}')` }}
                    >
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <label className="cursor-pointer bg-bg-primary/80 backdrop-blur px-4 py-2 rounded-lg font-bold text-text-primary flex items-center gap-2 hover:bg-accent hover:text-bg-primary transition-all">
                          <Upload size={16} />
                          Fazer Upload
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      </div>
                    </div>

                    {/* Presets */}
                    <p className="text-xs text-text-secondary mb-2">Ou escolha uma predefinida:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {PREDEFINED_COVERS.map((cover, idx) => (
                        <div
                          key={idx}
                          onClick={() => setNewThumbnail(cover)}
                          className={`aspect-video rounded-lg cursor-pointer bg-center bg-cover border-2 transition-all hover:opacity-90 ${newThumbnail === cover ? 'border-accent shadow-[0_0_10px_var(--accent)]' : 'border-transparent'}`}
                          style={{ backgroundImage: `url('${cover}')` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border-color flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 rounded-lg font-bold text-text-secondary hover:bg-bg-tertiary transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 bg-accent text-bg-primary font-bold rounded-lg hover:brightness-110 transition-all shadow-lg shadow-accent/20"
                  >
                    Criar Projeto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
