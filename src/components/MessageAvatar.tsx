import React from 'react';
import './style.scss';

export interface MessageAvatarProps {
    role: 'user' | 'assistant';
    size?: number;
    className?: string;
}

export const MessageAvatar: React.FC<MessageAvatarProps> = ({ 
    role, 
    size = 36, 
    className = '' 
}) => {
    const isUser = role === 'user';
    
    return (
        <div 
            className={`message-avatar ${role} ${className}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: isUser ? 'var(--accent-primary)' : 'var(--accent-success)',
                boxShadow: isUser 
                    ? '0 0 10px var(--accent-primary-glow)'
                    : '0 0 10px rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: `${size * 0.4}px`
            }}
        >
            {isUser ? 'U' : 'A'}
        </div>
    );
};