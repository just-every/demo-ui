import React from 'react';
import './style.scss';

export interface SettingsGridProps {
    /** Number of columns */
    columns?: 1 | 2 | 3;
    /** Gap between items */
    gap?: 'small' | 'medium' | 'large';
    /** Children to render in grid */
    children: React.ReactNode;
    /** Custom className */
    className?: string;
}

export const SettingsGrid: React.FC<SettingsGridProps> = ({
    columns = 2,
    gap = 'medium',
    children,
    className = ''
}) => {
    const gapSize = {
        small: '12px',
        medium: '16px',
        large: '24px'
    }[gap];

    return (
        <div
            className={`settings-grid columns-${columns} ${className}`}
            style={{
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: gapSize
            }}
        >
            {children}
        </div>
    );
};