import React from 'react';
import './style.scss';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

// Simple card component that matches the original demo styling
export const Card: React.FC<CardProps> = ({ children, className = '', style = {} }) => {
    return (
        <div className={`card ${className}`} style={style}>
            {children}
        </div>
    );
};