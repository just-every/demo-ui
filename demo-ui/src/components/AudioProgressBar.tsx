import React from 'react';
import './style.scss';

export interface AudioProgressBarProps {
    /** Progress percentage (0-100) */
    progress: number;
    /** Whether the progress bar is active/visible */
    isActive?: boolean;
    /** Custom height */
    height?: number;
    /** Show percentage text */
    showPercentage?: boolean;
    /** Custom label */
    label?: string;
    /** Animated gradient effect */
    animated?: boolean;
    /** Custom className */
    className?: string;
}

export const AudioProgressBar: React.FC<AudioProgressBarProps> = ({
    progress,
    isActive = true,
    height = 8,
    showPercentage = false,
    label,
    animated = true,
    className = ''
}) => {
    const clampedProgress = Math.max(0, Math.min(100, progress));

    return (
        <div className={`audio-progress-container ${className}`}>
            {(label || showPercentage) && (
                <div className="progress-header">
                    {label && <span className="progress-label">{label}</span>}
                    {showPercentage && (
                        <span className="progress-percentage">{Math.round(clampedProgress)}%</span>
                    )}
                </div>
            )}
            
            <div 
                className={`progress-bar ${isActive ? 'active' : ''} ${animated ? 'animated' : ''}`}
                style={{ height: `${height}px` }}
            >
                <div 
                    className="progress-fill audio-progress"
                    style={{ width: `${clampedProgress}%` }}
                />
            </div>
        </div>
    );
};