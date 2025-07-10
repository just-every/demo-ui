import React from 'react';
import './style.scss';

export interface TypingIndicatorProps {
    className?: string;
    size?: 'small' | 'medium' | 'large';
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
    className = '', 
    size = 'medium' 
}) => {
    const dotSize = size === 'small' ? 3 : size === 'large' ? 6 : 4;
    
    return (
        <div className={`typing-indicator-modern ${size} ${className}`}>
            <div className="typing-dots">
                {[0, 0.2, 0.4].map((delay, index) => (
                    <span 
                        key={index}
                        className="typing-dot"
                        style={{
                            width: `${dotSize}px`,
                            height: `${dotSize}px`,
                            background: 'var(--text-secondary)',
                            borderRadius: '50%',
                            animation: `typing 1.4s infinite`,
                            animationDelay: `${delay}s`,
                            display: 'inline-block',
                            margin: '0 1px'
                        }}
                    />
                ))}
            </div>
        </div>
    );
};