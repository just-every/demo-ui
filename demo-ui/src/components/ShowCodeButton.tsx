import React from 'react';
import { GlassButton } from './GlassButton';
import './style.scss';

export interface ShowCodeButtonProps {
    /** Click handler */
    onClick: () => void;
    /** Button text */
    text?: string;
    /** Show icon */
    showIcon?: boolean;
    /** Button variant */
    variant?: 'primary' | 'success' | 'danger' | 'warning' | 'default' | 'outline';
    /** Custom className */
    className?: string;
}

export const ShowCodeButton: React.FC<ShowCodeButtonProps> = ({
    onClick,
    text = 'Show Code',
    showIcon = true,
    variant = 'default',
    className = ''
}) => {
    return (
        <GlassButton
            onClick={onClick}
            variant={variant}
            className={`show-code-button ${className}`}
        >
            {showIcon && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
                </svg>
            )}
            <span>{text}</span>
        </GlassButton>
    );
};