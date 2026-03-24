import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"

const UIContext = createContext(null);

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within UIProvider');
    }
    return context;
};

export const UIProvider = ({ children }) => {
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        content: null,
        footer: null,
        onCloseCallback: null // Renamed to avoid conflict with internal onClose
    });

    const showToast = useCallback((message, type = 'info') => {
        toast({
            title: type.toUpperCase(),
            description: message,
            variant: type === 'error' ? 'destructive' : 'default',
        });
    }, []);

    const openModal = useCallback(({ title, content, footer, onClose }) => {
        setModal({
            isOpen: true,
            title,
            content,
            footer,
            onClose: () => {
                if (onClose) onClose();
                setModal((prev) => ({ ...prev, isOpen: false }));
            }
        });
    }, []);

    const closeModal = useCallback(() => {
        if (modal.onClose) modal.onClose();
        setModal((prev) => ({ ...prev, isOpen: false }));
    }, [modal]);

    const confirm = useCallback(({ title, message, onConfirm, confirmText = 'Confirm', variant = 'primary' }) => {
        openModal({
            title,
            content: <p>{message}</p>,
            footer: (
                <>
                    <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                    <button
                        className={`btn-${variant}`}
                        onClick={() => {
                            onConfirm();
                            closeModal();
                        }}
                    >
                        {confirmText}
                    </button>
                </>
            )
        });
    }, [openModal, closeModal]);

    return (
        <UIContext.Provider value={{ showToast, openModal, closeModal, confirm }}>
            {children}
            <Dialog open={modal.isOpen} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 text-slate-100">
                    <DialogHeader>
                        <DialogTitle>{modal.title}</DialogTitle>
                        {/* Radix dialog accessibility requires a description element for aria-describedby */}
                        <DialogDescription className="sr-only">Dialog</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {modal.content}
                    </div>
                    {modal.footer && (
                        <DialogFooter>
                            {modal.footer}
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </UIContext.Provider>
    );
};
