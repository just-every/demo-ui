import React from 'react';
import './style.scss';

export interface SimilarityBarProps {
    /** Similarity score (0-1) */
    similarity: number;
    /** Show percentage label */
    showLabel?: boolean;
    /** Bar height */
    height?: number;
    /** Animate on mount */
    animate?: boolean;
    /** Custom className */
    className?: string;
}

export const SimilarityBar: React.FC<SimilarityBarProps> = ({
    similarity,
    showLabel = false,
    height = 8,
    animate = true,
    className = ''
}) => {
    const percentage = Math.max(0, Math.min(100, similarity * 100));
    
    const getColorClass = () => {
        if (percentage >= 80) return 'high';
        if (percentage >= 60) return 'medium';
        if (percentage >= 40) return 'low';
        return 'very-low';
    };

    return (
        <div className={`similarity-bar-container ${className}`}>
            {showLabel && (
                <div className="similarity-label">
                    {percentage.toFixed(1)}% match
                </div>
            )}
            <div
                className="similarity-bar"
                style={{ height: `${height}px` }}
            >
                <div
                    className={`similarity-fill ${getColorClass()} ${animate ? 'animated' : ''}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};