import React, { useState, useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Plus, MoreVertical, Clock, LayoutGrid, List, Search, ChevronLeft, ChevronRight, Edit, Trash2, PlayCircle, Copy, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePresentation } from '../hooks/usePresentation';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';

const ITEMS_PER_PAGE = 6;

export function MySlides() {
    const { presentations, deletePresentation, duplicatePresentation, toggleFeatured } = usePresentation();
    const { user } = useAuth();
    const { showDelete } = useModal();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
    const [page, setPage] = useState(1);

    const filteredAndSorted = useMemo(() => {
        let result = [...presentations];

        // Filter by search
        if (searchQuery) {
            result = result.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        // Sort
        if (sortBy === 'date') {
            result.sort((a, b) => b.updatedAt - a.updatedAt);
        } else {
            result.sort((a, b) => a.title.localeCompare(b.title));
        }

        return result;
    }, [presentations, searchQuery, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginatedItems = filteredAndSorted.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const formatDate = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return 'Agora mesmo';
        if (hours < 24) return `${hours}h atrás`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d atrás`;
        return new Date(timestamp).toLocaleDateString('pt-BR');
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-bg-primary">
            <Sidebar />
            <main className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
                <Header
                    title="My Slides"
                    searchValue={searchQuery}
                    onSearchChange={(val) => { setSearchQuery(val); setPage(1); }}
                />

                <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
                    {/* Title + Create Button */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-text-primary uppercase">My Slides</h1>
                            <p className="text-text-secondary mt-2 text-lg">Gerencie suas apresentações de alta performance</p>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center justify-center gap-2 bg-accent text-bg-primary px-6 py-3 rounded-lg font-bold hover:shadow-[0_0_20px_var(--accent)] transition-all"
                            >
                                <Plus size={20} />
                                <span>CRIAR NOVO</span>
                            </button>
                        )}
                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-bg-tertiary/50 p-2 rounded-xl border border-border-color">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                            <input
                                type="text"
                                placeholder="Buscar apresentações..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className="bg-bg-primary border border-border-color rounded-lg py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent/50 w-64"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-widest px-2">
                                <span>Ordenar:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="bg-transparent border-none text-text-primary focus:ring-0 text-xs font-bold cursor-pointer p-0"
                                >
                                    <option value="date">Data de Modificação</option>
                                    <option value="name">Nome (A-Z)</option>
                                </select>
                            </div>
                            <div className="flex border-l border-border-color ml-2 pl-4 gap-2">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 ${viewMode === 'grid' ? 'text-accent' : 'text-text-secondary'}`}
                                >
                                    <LayoutGrid size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 ${viewMode === 'list' ? 'text-accent' : 'text-text-secondary'}`}
                                >
                                    <List size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Slides Grid/List */}
                    {paginatedItems.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-text-secondary text-lg">
                                {searchQuery ? 'Nenhuma apresentação encontrada.' : 'Nenhuma apresentação criada ainda.'}
                            </p>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8'
                            : 'flex flex-col gap-4'
                        }>
                            {paginatedItems.map(presentation => (
                                <div
                                    key={presentation.id}
                                    onClick={() => navigate(`/editor/${presentation.id}`)}
                                    className={`group relative flex ${viewMode === 'list' ? 'flex-row items-center' : 'flex-col'} bg-bg-tertiary/30 rounded-xl overflow-hidden border border-transparent hover:border-accent/40 transition-all hover:translate-y-[-4px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer`}
                                >
                                    <div className={`relative ${viewMode === 'list' ? 'w-48 h-28' : 'aspect-video'} bg-bg-tertiary overflow-hidden shrink-0`}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 to-transparent z-10"></div>
                                        <div
                                            className="w-full h-full bg-center bg-cover"
                                            style={{ backgroundImage: `url('${presentation.thumbnail || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop'}')` }}
                                        ></div>
                                        <div className="absolute top-3 right-3 z-20 flex gap-2">
                                            <span className="bg-bg-primary/80 backdrop-blur-md text-accent text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-tighter border border-accent/20">
                                                {presentation.slides.length} slides
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5 flex flex-col gap-3 flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg leading-tight text-text-primary group-hover:text-accent transition-colors">{presentation.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-text-secondary uppercase tracking-widest font-semibold">
                                            <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(presentation.updatedAt)}</span>
                                            <span className="flex items-center gap-1 text-accent">{presentation.category}</span>
                                        </div>
                                        {/* Action Buttons on Hover */}
                                        <div className="flex items-center gap-3 mt-auto pt-3 border-t border-border-color/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isAdmin && (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleFeatured(presentation.id);
                                                        }}
                                                        className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${presentation.isFeatured ? 'text-yellow-400 hover:text-yellow-500' : 'text-text-secondary hover:text-accent'}`}
                                                        title={presentation.isFeatured ? "Remover Destaque" : "Marcar como Destaque"}
                                                    >
                                                        <Star size={14} fill={presentation.isFeatured ? "currentColor" : "none"} /> Destaque
                                                    </button>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            duplicatePresentation(presentation.id);
                                                        }}
                                                        className="text-xs text-text-secondary hover:text-accent font-bold uppercase tracking-wider flex items-center gap-1"
                                                    >
                                                        <Copy size={14} /> Duplicar
                                                    </button>
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (await showDelete('Excluir Apresentação', 'Tem certeza que deseja excluir esta apresentação?')) {
                                                                deletePresentation(presentation.id);
                                                            }
                                                        }}
                                                        className="text-xs text-text-secondary hover:text-red-400 font-bold uppercase tracking-wider flex items-center gap-1"
                                                    >
                                                        <Trash2 size={14} /> Excluir
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Create New Card (grid only) */}
                            {isAdmin && viewMode === 'grid' && (
                                <div
                                    onClick={() => navigate('/')}
                                    className="group flex flex-col border-2 border-dashed border-border-color rounded-xl aspect-video items-center justify-center gap-4 hover:border-accent/40 hover:bg-accent/5 transition-all cursor-pointer"
                                >
                                    <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                                        <Plus className="text-text-secondary group-hover:text-accent" size={24} />
                                    </div>
                                    <span className="text-text-secondary font-bold uppercase tracking-widest text-xs group-hover:text-accent transition-colors">Novo Projeto</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 pt-4">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-10 h-10 rounded-lg flex items-center justify-center border border-border-color hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={18} className="text-text-secondary" />
                            </button>
                            <div className="flex gap-2">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-colors ${p === currentPage
                                            ? 'bg-accent text-bg-primary'
                                            : 'hover:bg-accent/10 text-text-secondary'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="w-10 h-10 rounded-lg flex items-center justify-center border border-border-color hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={18} className="text-text-secondary" />
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
