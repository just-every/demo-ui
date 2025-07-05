import React, { useState } from 'react';
import './style.scss';

export interface AdvancedSettingsProps {
    /** Content to show in the advanced section */
    children: React.ReactNode;
    /** Default expanded state */
    defaultExpanded?: boolean;
    /** Custom label text */
    label?: string;
    /** Show count of settings inside */
    settingsCount?: number;
    /** Custom className */
    className?: string;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
    children,
    defaultExpanded = false,
    label = 'Advanced Settings',
    settingsCount,
    className = ''
}) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <div className={`advanced-settings ${className}`}>
            <button
                type="button"
                className={`advanced-toggle ${expanded ? 'expanded' : ''}`}
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
            >
                <svg
                    className="chevron"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                >
                    <path
                        d="M6 4L10 8L6 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                <span className="advanced-label">
                    {label}
                    {settingsCount !== undefined && (
                        <span className="settings-count">({settingsCount})</span>
                    )}
                </span>
            </button>
            
            <div className={`advanced-content ${expanded ? 'expanded' : ''}`}>
                <div className="advanced-inner">
                    {children}
                </div>
            </div>
        </div>
    );
};