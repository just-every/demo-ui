import React from 'react';
import { GlassCard } from './GlassCard';
import './style.scss';

export interface SettingsPanelProps {
    /** Panel title */
    title?: string;
    /** Panel content */
    children: React.ReactNode;
    /** Whether the panel is collapsible */
    collapsible?: boolean;
    /** Default expanded state (for collapsible panels) */
    defaultExpanded?: boolean;
    /** Custom className */
    className?: string;
    /** Show border around panel */
    bordered?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    title,
    children,
    collapsible = false,
    defaultExpanded = true,
    className = '',
    bordered = true
}) => {
    const [expanded, setExpanded] = React.useState(defaultExpanded);

    const content = (
        <>
            {title && (
                <div className="settings-panel-header">
                    <h3 className="settings-panel-title">{title}</h3>
                    {collapsible && (
                        <button
                            className="settings-panel-toggle"
                            onClick={() => setExpanded(!expanded)}
                            aria-label={expanded ? 'Collapse' : 'Expand'}
                        >
                            <svg
                                className={`chevron ${expanded ? 'expanded' : ''}`}
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                            >
                                <path
                                    d="M4 6L8 10L12 6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            )}
            {(!collapsible || expanded) && (
                <div className="settings-panel-content">
                    {children}
                </div>
            )}
        </>
    );

    if (bordered) {
        return (
            <GlassCard className={`settings-panel ${className}`} padding={true}>
                {content}
            </GlassCard>
        );
    }

    return (
        <div className={`settings-panel ${className}`}>
            {content}
        </div>
    );
};