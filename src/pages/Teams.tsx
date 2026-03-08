import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { UserPlus, MoreVertical, History, User, Send, Trash2, Shield } from 'lucide-react';
import { useTeams, TeamMember } from '../contexts/TeamsContext';
import { useModal } from '../contexts/ModalContext';

const ROLE_STYLES: Record<string, string> = {
    Admin: 'bg-accent/10 text-accent border-accent/30',
    Editor: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
    Viewer: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

function formatTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora mesmo';
    if (mins < 60) return `Há ${mins} minutos`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Há ${hours} horas`;
    const days = Math.floor(hours / 24);
    return `Há ${days} dias`;
}

export function Teams() {
    const { members, activityLog, addMember, removeMember, updateRole } = useTeams();
    const { showDelete, showAlert } = useModal();
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'Admin' | 'Editor' | 'Viewer'>('Viewer');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || !inviteName.trim()) return;
        addMember(inviteName.trim(), inviteEmail.trim(), inviteRole);
        setInviteName('');
        setInviteEmail('');
        setInviteRole('Viewer');
    };

    const handleRemove = async (member: TeamMember) => {
        if (await showDelete('Remover Membro', `Deseja remover ${member.name} da equipe? Essa pessoa perderá todo o acesso admin.`)) {
            removeMember(member.id);
            setOpenMenuId(null);
        }
    };

    const handleRoleChange = (id: string, role: 'Admin' | 'Editor' | 'Viewer') => {
        updateRole(id, role);
        setOpenMenuId(null);
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-bg-primary">
            <Sidebar />
            <main className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
                <Header title="Teams" />

                <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold tracking-tight text-accent">Equipes</h1>
                            <p className="text-text-secondary max-w-lg">Gerencie membros, permissões e colabore em tempo real.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Members Table */}
                            <div className="bg-bg-secondary border border-border-color rounded-xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-border-color flex justify-between items-center bg-accent/5">
                                    <h2 className="font-bold text-lg flex items-center gap-2 text-text-primary">
                                        <User className="text-accent" size={20} />
                                        Membros da Equipe
                                    </h2>
                                    <span className="text-xs font-medium px-2 py-1 bg-accent/10 text-accent rounded border border-accent/20">
                                        {members.length} Membro{members.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-text-secondary text-xs uppercase tracking-wider border-b border-border-color/50">
                                                <th className="px-6 py-4 font-medium">Identificador</th>
                                                <th className="px-6 py-4 font-medium">Senha de Acesso</th>
                                                <th className="px-6 py-4 font-medium">Papel</th>
                                                <th className="px-6 py-4 font-medium">Status</th>
                                                <th className="px-6 py-4 font-medium"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-color/30">
                                            {members.map((member) => (
                                                <tr key={member.id} className="hover:bg-accent/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full ${member.role === 'Admin' ? 'bg-gradient-to-tr from-accent to-blue-500' : 'bg-bg-tertiary'} p-[2px]`}>
                                                                <div className="w-full h-full rounded-full bg-bg-secondary flex items-center justify-center">
                                                                    <Shield size={18} className={member.role === 'Admin' ? 'text-accent' : 'text-text-secondary'} />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-text-primary">{member.name}</div>
                                                                <div className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Acesso via Senha</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 group">
                                                            <code className="bg-bg-tertiary px-2 py-1 rounded text-accent text-xs border border-border-color/50">
                                                                {member.password}
                                                            </code>
                                                            <button
                                                                onClick={async () => {
                                                                    navigator.clipboard.writeText(member.password);
                                                                    await showAlert('Copiado', 'Senha copiada para a área de transferência!');
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-accent transition-all"
                                                                title="Copiar Senha"
                                                            >
                                                                <Send size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_STYLES[member.role]}`}>
                                                            {member.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-xs">
                                                            {(() => {
                                                                const isActuallyOnline = member.online && (Date.now() - member.lastSeen < 60000);
                                                                return (
                                                                    <>
                                                                        <span className={`w-2 h-2 rounded-full ${isActuallyOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-600'}`}></span>
                                                                        <div className="flex flex-col">
                                                                            <span className={isActuallyOnline ? 'text-green-400 font-bold' : 'text-text-secondary'}>
                                                                                {isActuallyOnline ? 'Online' : 'Offline'}
                                                                            </span>
                                                                            {!isActuallyOnline && member.lastSeen && (
                                                                                <span className="text-[10px] text-text-secondary opacity-60">
                                                                                    Visto {formatTimeAgo(member.lastSeen)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right relative">
                                                        <button
                                                            onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                                                            className="text-text-secondary hover:text-accent transition-colors"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>
                                                        {openMenuId === member.id && (
                                                            <div className="absolute right-6 top-12 z-50 bg-bg-tertiary border border-border-color rounded-xl shadow-2xl py-2 min-w-[180px]">
                                                                <p className="px-4 py-1 text-[10px] text-text-secondary uppercase tracking-widest font-bold">Alterar Papel</p>
                                                                {(['Admin', 'Editor', 'Viewer'] as const).map(role => (
                                                                    <button
                                                                        key={role}
                                                                        onClick={() => handleRoleChange(member.id, role)}
                                                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-accent/10 transition-colors flex items-center gap-2 ${member.role === role ? 'text-accent' : 'text-text-primary'}`}
                                                                    >
                                                                        <Shield size={14} />
                                                                        {role} {member.role === role && '✓'}
                                                                    </button>
                                                                ))}
                                                                <div className="border-t border-border-color my-1"></div>
                                                                <button
                                                                    onClick={() => handleRemove(member)}
                                                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                                                >
                                                                    <Trash2 size={14} />
                                                                    Remover da Equipe
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        <aside className="space-y-8">
                            {/* Activity Log */}
                            <div className="bg-bg-secondary border border-border-color p-6 rounded-xl">
                                <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-text-primary">
                                    <History className="text-accent" size={20} />
                                    Atividade Recente
                                </h3>
                                {activityLog.length === 0 ? (
                                    <p className="text-sm text-text-secondary">Nenhuma atividade ainda.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {activityLog.slice(0, 8).map((act, i) => (
                                            <div key={act.id} className={`relative pl-6 border-l ${i === 0 ? 'border-accent/30' : 'border-border-color'} space-y-1`}>
                                                <div className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full ${i === 0 ? 'bg-accent' : 'bg-slate-600'}`}></div>
                                                <p className="text-sm font-medium text-text-primary">{act.user} <span className="text-text-secondary font-normal">{act.action}</span> {act.target}</p>
                                                <p className="text-[10px] text-text-secondary uppercase">{formatTimeAgo(act.time)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Invite Form */}
                            <div className="bg-bg-secondary border border-border-color p-6 rounded-xl relative overflow-hidden group">
                                <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-all"></div>
                                <h3 className="font-bold text-lg mb-4 text-text-primary flex items-center gap-2">
                                    <UserPlus className="text-accent" size={20} />
                                    Gerar Nova Senha
                                </h3>
                                <p className="text-[10px] text-text-secondary mb-4 uppercase tracking-tighter">Crie um identificador e uma senha para dar acesso a outras pessoas.</p>
                                <form className="space-y-4" onSubmit={handleInvite}>
                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Identificador (Login)</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Equipe de Vendas"
                                            value={inviteName}
                                            onChange={(e) => setInviteName(e.target.value)}
                                            required
                                            className="w-full bg-bg-primary border border-border-color rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent text-text-primary placeholder:text-text-secondary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Senha de Acesso</label>
                                        <input
                                            type="text"
                                            placeholder="Crie uma senha forte"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            required
                                            className="w-full bg-bg-primary border border-border-color rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent text-text-primary placeholder:text-text-secondary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Papel</label>
                                        <select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value as any)}
                                            className="w-full bg-bg-primary border border-border-color rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
                                        >
                                            <option value="Viewer">Viewer</option>
                                            <option value="Editor">Editor</option>
                                            <option value="Admin">Admin</option>
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-accent text-bg-primary py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 hover:bg-accent-hover shadow-lg shadow-accent/20"
                                    >
                                        <Shield size={14} />
                                        Gerar Senha de Acesso
                                    </button>
                                </form>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}
