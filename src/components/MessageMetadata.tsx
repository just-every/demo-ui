import React from 'react';
import type { MessageData } from './Message';
import './style.scss';

export interface MessageMetadataProps {
    message: MessageData;
    className?: string;
}

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

export const MessageMetadata: React.FC<MessageMetadataProps> = ({
    message,
    className = ''
}) => {
    // Extract values
    const model = message.model;
    const modelClass = message.modelClass;
    const agentTags = message.agentTags || [];
    const requestDuration = message.requestDuration;
    const isTyping = message.role === 'assistant' && message.streaming && !message.content;

    const metadata = [];
    if(isTyping) {
        metadata.push('Responding...');
    }
    if(modelClass) {
        metadata.push(modelClass);
    }
    if(model) {
        metadata.push(model);
    }
    if(requestDuration) {
        metadata.push(formatDuration(requestDuration));
    }
    if (!metadata.length) {
        if(message.role) {
            metadata.push(message.role.toLowerCase());
        }
        else {
            return null;
        }
    }

    return (
        <div className={`message-metadata ${className}`}>
            <div className="message-details">
                {metadata.length > 0 && (
                    <span className="message-model">
                        {metadata.join(' • ')}
                    </span>
                )}
                {agentTags.length > 0 && (
                    <span className="message-agent-tags">
                        {agentTags.map((tag: string) => (
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