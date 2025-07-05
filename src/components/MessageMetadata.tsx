import React from 'react';
import './style.scss';

export interface MessageMetadataProps {
    model?: string;
    modelClass?: string;
    timestamp?: number;
    isStreaming?: boolean;
    showModel?: boolean;
    showTimestamp?: boolean;
    isTyping?: boolean;
    className?: string;
    threadName?: string;
    threadType?: 'main' | 'metamemory' | 'metacognition';
}

export const MessageMetadata: React.FC<MessageMetadataProps> = ({
    model,
    modelClass,
    timestamp,
    isStreaming = false,
    showModel = true,
    showTimestamp = true,
    isTyping = false,
    className = '',
    threadName,
    threadType
}) => {
    const formatTimestamp = (ts?: number) => {
        if (!ts) return '';
        return new Date(ts).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const shouldShow = showModel || showTimestamp || isStreaming || threadName;
    if (!shouldShow) return null;

    return (
        <div className={`message-metadata ${className}`}>
            {threadName && (
                <span className={`message-thread thread-${threadType || 'main'}`}>
                    <span className="thread-icon">
                        {threadType === 'metamemory' ? '🧵' : threadType === 'metacognition' ? '🧠' : '💬'}
                    </span>
                    {threadName}
                </span>
            )}
            {showModel && (modelClass || model) && (
                <span className="message-model">
                    {modelClass && (
                        <>
                            Class: {modelClass}
                            {model && <span> • Model: {model}</span>}
                        </>
                    )}
                    {!modelClass && model && (
                        <span>Model: {model}</span>
                    )}
                </span>
            )}
            {isTyping && (
                <span className="streaming-status"> • Responding...</span>
            )}
            {showTimestamp && timestamp && (
                <span className="message-timestamp">
                    {formatTimestamp(timestamp)}
                </span>
            )}
        </div>
    );
};