import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './style.scss';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
    showCloseButton?: boolean;
}

// Get or create modal root immediately
const getModalRoot = () => {
    let root = document.getElementById('modal-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'modal-root';
        document.body.appendChild(root);
    }
    return root;
};

export const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    children, 
    className = '',
    contentClassName = '',
    showCloseButton = true 
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
            // Force a reflow to ensure the modal appears immediately
            getModalRoot().offsetHeight;
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modalContent = (
        <div className={`modal-overlay active ${className}`} onClick={onClose}>
            <div className={`modal-content ${contentClassName}`} onClick={e => e.stopPropagation()}>
                {showCloseButton && (
                    <button className="modal-close" onClick={onClose} aria-label="Close modal">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                )}
                {children}
            </div>
        </div>
    );

    // Use portal to render at document body level
    return ReactDOM.createPortal(modalContent, getModalRoot());
};
