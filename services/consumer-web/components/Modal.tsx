import React, { useEffect } from 'react';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    children,
    size = 'md',
    closeOnBackdrop = true,
    closeOnEscape = true,
}: ModalProps) {
    useEffect(() => {
        if (!closeOnEscape) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose, closeOnEscape]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeStyles = {
        sm: 'modal-sm',
        md: 'modal-md',
        lg: 'modal-lg',
        xl: 'modal-xl',
        full: 'modal-full',
    };

    return (
        <div
            className="modal-overlay"
            onClick={closeOnBackdrop ? onClose : undefined}
        >
            <div
                className={`modal-content ${sizeStyles[size]}`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

export interface ModalHeaderProps {
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
}

export function ModalHeader({ children, onClose, className = '' }: ModalHeaderProps) {
    return (
        <div className={`modal-header ${className}`}>
            <h3 className="modal-title">{children}</h3>
            {onClose && (
                <button onClick={onClose} className="modal-close" aria-label="Close">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            )}
        </div>
    );
}

export interface ModalBodyProps {
    children: React.ReactNode;
    className?: string;
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
    return <div className={`modal-body ${className}`}>{children}</div>;
}

export interface ModalFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
    return <div className={`modal-footer ${className}`}>{children}</div>;
}
