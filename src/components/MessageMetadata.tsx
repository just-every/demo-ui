import React from 'react';
import type { MessageData } from './Message';
import './style.scss';

export interface MessageMetadataProps {
    message: MessageData;
    className?: string;
}

export const MessageMetadata: React.FC<MessageMetadataProps> = ({
    message,
    className = ''
}) => {
    const formatTimestamp = (ts?: number | Date) => {
        if (!ts) return '';
        const date = ts instanceof Date ? ts : new Date(ts);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };


    const formatDuration = (ms?: number) => {
        if (ms === undefined) return '';
        
        if (ms < 1000) {
            return `${Math.round(ms)}ms`;
        } else if (ms < 60000) {
            return `${(ms / 1000).toFixed(1)}s`;
        } else {
            const minutes = Math.floor(ms / 60000);
            const seconds = ((ms % 60000) / 1000).toFixed(1);
            return `${minutes}m ${seconds}s`;
        }
    };

    // Extract values
    const model = message.model;
    const modelClass = message.modelClass;
    const timestamp = message.timestamp;
    const isStreaming = message.streaming;
    const tags = message.metadata?.tags || [];
    const summary = message.metadata?.summary;
    const agentTags = message.agentTags || [];
    const requestCost = message.requestCost;
    const requestDuration = message.requestDuration;
    const isTyping = message.role === 'assistant' && message.streaming && !message.content;

    const shouldShow = model || modelClass || timestamp || isStreaming || 
                      (tags.length > 0) || agentTags.length > 0 || summary || 
                      requestCost !== undefined || requestDuration !== undefined;
    if (!shouldShow) return null;

    return (
        <div className={`message-metadata ${className}`}>
            <span className="message-prefix">{message.role}</span>
            <div className="message-details">
                {(modelClass || model) && (
                    <span className="message-model">
                        {modelClass && (
                            <>
                                {modelClass}
                                {model && <span> • {model}</span>}
                            </>
                        )}
                        {!modelClass && model && (
                            <span>{model}</span>
                        )}
                    </span>
                )}
                {requestDuration !== undefined && (
                    <span className="streaming-status"> • {formatDuration(requestDuration)}</span>
                )}
                {isTyping && (
                    <span className="streaming-status"> • Responding...</span>
                )}
                {agentTags.length > 0 && (
                    <span className="message-agent-tags">
                        {agentTags.map((tag: string, index: number) => (
                            <span key={tag} className="message-agent-tag">
                                {tag}
                            </span>
                        ))}
                    </span>
                )}
            </div>
        </div>
    );
};