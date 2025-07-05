import React, { useEffect, useRef } from 'react';
import './style.scss';

export interface EnhancedModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Close handler */
    onClose: () => void;
    /** Modal title */
    title?: string;
    /** Modal content */
    children: React.ReactNode;
    /** Custom width */
    width?: string | number;
    /** Custom max width */
    maxWidth?: string | number;
    /** Custom max height */
    maxHeight?: string | number;
    /** Close on overlay click */
    closeOnOverlayClick?: boolean;
    /** Close on escape key */
    closeOnEscape?: boolean;
    /** Show close button */
    showCloseButton?: boolean;
    /** Custom header content (replaces title) */
    header?: React.ReactNode;
    /** Custom footer content */
    footer?: React.ReactNode;
    /** Custom className for the modal */
    className?: string;
    /** Custom className for the overlay */
    overlayClassName?: string;
}

export const EnhancedModal: React.FC<EnhancedModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    width = '90%',
    maxWidth = '800px',
    maxHeight = '80vh',
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    header,
    footer,
    className = '',
    overlayClassName = ''
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle escape key
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeOnEscape, onClose]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    // Focus trap
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        firstElement?.focus();

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        document.addEventListener('keydown', handleTabKey);
        return () => document.removeEventListener('keydown', handleTabKey);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className={`modal-overlay active ${overlayClassName}`}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
        >
            <div
                ref={modalRef}
                className={`modal ${className}`}
                style={{
                    width,
                    maxWidth,
                    maxHeight
                }}
            >
                {(title || header || showCloseButton) && (
                    <div className="modal-header">
                        {header || (
                            title && <h2 id="modal-title" className="modal-title">{title}</h2>
                        )}
                        {showCloseButton && (
                            <button
                                className="modal-close"
                                onClick={onClose}
                                aria-label="Close modal"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
                
                <div className="modal-body">
                    {children}
                </div>
                
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};