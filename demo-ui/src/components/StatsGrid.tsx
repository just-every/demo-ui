import React from 'react';
import './style.scss';

export interface Stat {
    label: string;
    value: string | number;
    format?: 'number' | 'currency' | 'duration' | 'bytes';
    icon?: React.ReactNode;
}

interface StatsGridProps {
    stats: Stat[];
    columns?: 2 | 3 | 4;
    className?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ 
    stats, 
    columns = 2, 
    className = '' 
}) => {
    const formatValue = (value: string | number, format?: string) => {
        if (typeof value === 'string') return value;
        
        switch (format) {
            case 'currency':
                return `$${value.toFixed(2)}`;
            case 'number':
                return value.toLocaleString();
            case 'duration':
                return `${value.toFixed(1)}s`;
            case 'bytes': {
                if (value === 0) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(value) / Math.log(k));
                return `${parseFloat((value / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
            }
            default:
                return value.toString();
        }
    };

    const gridClass = columns === 3 ? 'three-col' : '';

    return (
        <div className={`stats-grid ${gridClass} ${className}`}>
            {stats.map((stat, index) => (
                <div key={index} className="stat-card">
                    <div className="stat-value">
                        {formatValue(stat.value, stat.format)}
                    </div>
                    <div className="stat-label">
                        {stat.label}
                    </div>
                </div>
            ))}
        </div>
    );
};