import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layers, Lock, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export function TeamLogin() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(identifier, password);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Identificador ou senha incorretos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-bg-primary flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="w-full max-w-md z-10">
                <div className="flex flex-col items-center mb-8 animate-fadeIn">
                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-4 border border-accent/20 shadow-lg shadow-accent/5">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight text-center">Acesso à Equipe</h1>
                    <p className="text-text-secondary mt-2 text-center">Entre com seu identificador e senha de acesso</p>
                </div>

                <div className="bg-bg-secondary border border-border-color p-8 rounded-3xl shadow-2xl relative animate-slideUp">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-shake">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">
                                Identificador
                            </label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full bg-bg-tertiary border border-border-color rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-slate-600"
                                placeholder="Ex: Equipe de Vendas"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">
                                Senha de Acesso
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-bg-tertiary border border-border-color rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-slate-600"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent text-bg-primary font-bold py-4 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-bg-primary border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Entrar no Painel</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-border-color text-center">
                        <p className="text-text-secondary text-sm flex items-center justify-center gap-2">
                            <ShieldCheck size={16} className="text-accent/60" />
                            Sessão segura e criptografada
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="mt-8 w-full text-text-secondary hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                    Voltar para a Home
                </button>
            </div>
        </div>
    );
}
