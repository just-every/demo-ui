import React from 'react';
import './style.scss';

export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

interface ConnectionStatusProps {
    status: ConnectionState;
    message?: string;
    className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
    status, 
    message, 
    className = '' 
}) => {
    const getStatusText = () => {
        if (message) return message;
        
        switch (status) {
            case 'connected':
                return 'Connected';
            case 'connecting':
                return 'Connecting...';
            case 'disconnected':
                return 'Disconnected';
            case 'error':
                return 'Connection Error';
            default:
                return 'Unknown';
        }
    };

    return (
        <div className={`status ${status} ${className}`}>
            <div className="status-indicator" />
            <span>{getStatusText()}</span>
        </div>
    );
};