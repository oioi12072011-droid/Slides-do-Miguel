import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '../contexts/ModalContext';
import { AlertCircle, HelpCircle, Trash2, X } from 'lucide-react';

export function PremiumModal() {
    const { modalState, closeModal } = useModal();
    const { isOpen, type, title, message, options } = modalState;

    const variants = {
        cyan: {
            bg: 'bg-accent/10',
            border: 'border-accent/30',
            glow: 'shadow-accent/20',
            text: 'text-accent',
            button: 'bg-accent text-bg-primary hover:brightness-110 shadow-accent/20',
            icon: <HelpCircle className="text-accent" size={48} />
        },
        red: {
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            glow: 'shadow-red-500/20',
            text: 'text-red-500',
            button: 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20',
            icon: <Trash2 className="text-red-500" size={48} />
        },
        purple: {
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/30',
            glow: 'shadow-purple-500/20',
            text: 'text-purple-500',
            button: 'bg-purple-500 text-white hover:bg-purple-600 shadow-purple-500/20',
            icon: <AlertCircle className="text-purple-500" size={48} />
        }
    };

    const v = variants[options.variant || 'cyan'];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => type !== 'confirm' && type !== 'delete' && closeModal(false)}
                        className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className={`relative w-full max-w-md overflow-hidden rounded-2xl border ${v.border} ${v.bg} p-8 shadow-2xl ${v.glow} backdrop-blur-xl`}
                    >
                        {/* Decoration */}
                        <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full ${v.bg} blur-3xl`} />
                        <div className={`absolute -left-12 -bottom-12 h-32 w-32 rounded-full ${v.bg} blur-3xl`} />

                        <div className="relative flex flex-col items-center text-center">
                            {/* Icon */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                                className="mb-6 rounded-2xl bg-bg-secondary p-4 shadow-inner"
                            >
                                {type === 'alert' ? <AlertCircle className={v.text} size={48} /> : v.icon}
                            </motion.div>

                            {/* Title */}
                            <h3 className={`mb-2 text-2xl font-bold tracking-tight ${v.text}`}>
                                {title}
                            </h3>

                            {/* Message */}
                            <p className="mb-8 text-text-secondary leading-relaxed">
                                {message}
                            </p>

                            {/* Actions */}
                            <div className="flex w-full gap-3">
                                {(type === 'confirm' || type === 'delete') && (
                                    <button
                                        onClick={() => closeModal(false)}
                                        className="flex-1 rounded-xl border border-border-color bg-bg-tertiary/50 px-6 py-3 font-bold text-text-primary transition-all hover:bg-bg-tertiary hover:text-white"
                                    >
                                        {options.cancelLabel || 'Cancelar'}
                                    </button>
                                )}
                                <button
                                    onClick={() => closeModal(true)}
                                    className={`flex-1 rounded-xl px-6 py-3 font-bold transition-all shadow-lg ${v.button}`}
                                >
                                    {options.confirmLabel || (type === 'alert' ? 'Entendido' : 'Confirmar')}
                                </button>
                            </div>
                        </div>

                        {/* Close button (only for alerts) */}
                        {type === 'alert' && (
                            <button
                                onClick={() => closeModal(false)}
                                className="absolute right-4 top-4 text-text-secondary transition-colors hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        )}

                        {/* Futuristic Scanline Effect */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                            <div
                                className="w-full h-[1px] absolute top-0"
                                style={{
                                    background: `linear-gradient(90deg, transparent, ${v.text === 'text-accent' ? 'var(--accent)' : v.text.replace('text-', '')}, transparent)`,
                                    animation: 'scan 3s linear infinite'
                                }}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
