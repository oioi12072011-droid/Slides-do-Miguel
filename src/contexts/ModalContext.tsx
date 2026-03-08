import React, { createContext, useContext, useState, useCallback } from 'react';

type ModalType = 'alert' | 'confirm' | 'delete';

interface ModalOptions {
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'cyan' | 'red' | 'purple';
}

interface ModalState {
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    options: ModalOptions;
    resolve: ((value: boolean) => void) | null;
}

interface ModalContextType {
    showAlert: (title: string, message: string, options?: ModalOptions) => Promise<boolean>;
    showConfirm: (title: string, message: string, options?: ModalOptions) => Promise<boolean>;
    showDelete: (title: string, message: string, options?: ModalOptions) => Promise<boolean>;
    modalState: ModalState;
    closeModal: (result: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [modalState, setModalState] = useState<ModalState>({
        isOpen: false,
        type: 'alert',
        title: '',
        message: '',
        options: {},
        resolve: null,
    });

    const showModal = useCallback((type: ModalType, title: string, message: string, options: ModalOptions = {}) => {
        return new Promise<boolean>((resolve) => {
            setModalState({
                isOpen: true,
                type,
                title,
                message,
                options,
                resolve,
            });
        });
    }, []);

    const showAlert = useCallback((title: string, message: string, options?: ModalOptions) => {
        return showModal('alert', title, message, { variant: 'cyan', ...options });
    }, [showModal]);

    const showConfirm = useCallback((title: string, message: string, options?: ModalOptions) => {
        return showModal('confirm', title, message, { variant: 'cyan', ...options });
    }, [showModal]);

    const showDelete = useCallback((title: string, message: string, options?: ModalOptions) => {
        return showModal('delete', title, message, { variant: 'red', confirmLabel: 'Excluir', ...options });
    }, [showModal]);

    const closeModal = useCallback((result: boolean) => {
        if (modalState.resolve) {
            modalState.resolve(result);
        }
        setModalState(prev => ({ ...prev, isOpen: false, resolve: null }));
    }, [modalState]);

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm, showDelete, modalState, closeModal }}>
            {children}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}
