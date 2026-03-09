import React, { useState, useRef, DragEvent } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Upload, Search, Image, Film, Link2, Pencil, Trash2, Check, X } from 'lucide-react';
import { useAssets } from '../contexts/AssetsContext';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';

function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const MAX_STORAGE = 2 * 1073741824; // 2 GB

export function Assets() {
    const { assets, addAsset, deleteAsset, renameAsset, totalStorageUsed } = useAssets();
    const { user } = useAuth();
    const { showDelete } = useModal();
    const [searchQuery, setSearchQuery] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter assets (show user's assets AND global assets)
    const filteredAssets = assets.filter(a => {
        // Show if it belongs to the user OR if it's a global/system asset
        // Also show if userId is null (legacy assets uploaded before the owner system)
        const isOwner = a.userId === user?.uid || a.userId === null;
        if (!isOwner && !a.isGlobal) return false;

        // Type filter (only media)
        if (a.type !== 'image' && a.type !== 'video') return false;

        // Search filter
        if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        return true;
    });

    const storagePercent = Math.min(100, (totalStorageUsed / MAX_STORAGE) * 100);

    const handleFiles = async (files: FileList | null | File[]) => {
        if (!files) return;
        const filesArray = Array.isArray(files) ? files : Array.from(files);
        for (const file of filesArray) {
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;
            await addAsset(file);
        }
    };

    // Clipboard Paste Support
    React.useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const files = e.clipboardData?.files;
            if (files && files.length > 0) {
                handleFiles(files);
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDelete = async (id: string) => {
        if (await showDelete('Excluir Arquivo', 'Deseja excluir permanentemente este arquivo?')) {
            deleteAsset(id);
        }
    };

    const startRename = (id: string, currentName: string) => {
        setRenamingId(id);
        setRenameValue(currentName);
    };

    const submitRename = () => {
        if (renamingId && renameValue.trim()) {
            renameAsset(renamingId, renameValue.trim());
        }
        setRenamingId(null);
        setRenameValue('');
    };

    const copyLink = (asset: any) => {
        const text = asset.data || asset.thumbnail || asset.name;
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-bg-primary">
            <Sidebar />
            <main className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
                <Header
                    title="Arquivos"
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                />

                <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-accent">Arquivos</h1>
                            <p className="text-text-secondary mt-2">
                                Suas imagens e vídeos pessoais para as apresentações.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,video/*"
                                multiple
                                onChange={(e) => handleFiles(e.target.files)}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-accent hover:brightness-110 text-bg-primary font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_var(--accent)]"
                            >
                                <Upload size={18} />
                                Enviar
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-4 bg-bg-tertiary/50 p-3 rounded-xl border border-border-color">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Image size={14} className="text-accent" />
                                <span className="text-xs text-text-secondary font-bold">{filteredAssets.length} arquivos</span>
                            </div>
                            <div className="w-32 h-2 bg-bg-primary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-accent rounded-full"
                                    style={{ width: `${storagePercent}%`, boxShadow: '0 0 8px var(--accent)' }}
                                ></div>
                            </div>
                            <span className="text-[10px] text-accent font-bold">{formatSize(totalStorageUsed)} / 2GB</span>
                        </div>
                    </div>

                    {/* Drop Zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative rounded-xl p-10 text-center border-2 border-dashed group cursor-pointer transition-all ${isDragging
                            ? 'border-accent bg-accent/10 scale-[1.02]'
                            : 'border-accent/30 hover:bg-accent/5'
                            }`}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className={`w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent transition-transform ${isDragging ? 'scale-125' : 'group-hover:scale-110'}`}>
                                <Upload size={32} />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-text-primary mb-1">
                                    {isDragging ? 'Solte o arquivo aqui!' : 'Arraste e solte suas imagens e vídeos aqui'}
                                </h4>
                                <p className="text-text-secondary text-sm">Aceita PNG, JPG, GIF, WebP, MP4, WebM</p>
                            </div>
                        </div>
                    </div>

                    {/* Images Grid */}
                    {filteredAssets.length === 0 ? (
                        <div className="text-center py-16">
                            <Search size={48} className="text-text-secondary/30 mx-auto mb-4" />
                            <p className="text-text-secondary text-lg">Nenhum arquivo encontrado.</p>
                            <p className="text-text-secondary text-sm">
                                Faça upload e eles estarão disponíveis aqui.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {filteredAssets.map((asset) => (
                                <div key={asset.id} className="group relative bg-bg-secondary border border-border-color rounded-xl p-3 hover:scale-[1.02] transition-all hover:shadow-[0_0_10px_var(--accent)]">
                                    <div className="aspect-square rounded-lg mb-3 bg-bg-tertiary overflow-hidden relative">
                                        {asset.type === 'video' ? (
                                            <div className="w-full h-full flex items-center justify-center bg-bg-tertiary">
                                                <Film size={40} className="text-accent" />
                                            </div>
                                        ) : (
                                            <img
                                                src={asset.thumbnail || asset.data}
                                                alt={asset.name}
                                                className="w-full h-full object-cover"
                                            />
                                        )}

                                        {/* Hover Actions */}
                                        <div className="absolute inset-0 bg-bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startRename(asset.id, asset.name); }}
                                                className="w-full py-1.5 text-xs bg-accent/20 hover:bg-accent/40 text-accent rounded border border-accent/30 flex items-center justify-center gap-1"
                                            >
                                                <Pencil size={12} /> Renomear
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); copyLink(asset); }}
                                                className="w-full py-1.5 text-xs bg-accent/20 hover:bg-accent/40 text-accent rounded border border-accent/30 flex items-center justify-center gap-1"
                                            >
                                                <Link2 size={12} /> Copiar Link
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }}
                                                className="w-full py-1.5 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded border border-red-500/30 flex items-center justify-center gap-1"
                                            >
                                                <Trash2 size={12} /> Excluir
                                            </button>
                                        </div>
                                    </div>
                                    {/* Inline Rename */}
                                    {renamingId === asset.id ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && submitRename()}
                                                autoFocus
                                                className="text-sm font-bold text-text-primary bg-bg-primary border border-accent rounded px-1.5 py-0.5 w-full focus:outline-none"
                                            />
                                            <button onClick={submitRename} className="text-accent"><Check size={14} /></button>
                                            <button onClick={() => setRenamingId(null)} className="text-red-400"><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <h5 className="text-sm font-bold text-text-primary truncate">{asset.name}</h5>
                                    )}
                                    <p className="text-[11px] text-text-secondary">{formatSize(asset.size)} • {formatDate(asset.createdAt)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
