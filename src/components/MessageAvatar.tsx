import React from 'react';
import './style.scss';

export interface MessageAvatarProps {
    role: string;
    color: string;
    size?: number;
    className?: string;
}

export const MessageAvatar: React.FC<MessageAvatarProps> = ({ 
    role, 
    color, 
    size = 36, 
    className = '' 
}) => {

    return (
        <div 
            className={`message-avatar ${role.toLowerCase()} ${className}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: `rgba(${color}, 0.06)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: `${size * 0.4}px`,
                marginTop: '10px',
                backdropFilter: 'blur(8px)',
            }}
        >
            {role.charAt(0).toUpperCase()}
        </div>
    );
};