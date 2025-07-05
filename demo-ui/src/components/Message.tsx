import React from 'react';
import { MessageAvatar } from './MessageAvatar';
import { MessageContent } from './MessageContent';
import { MessageMetadata } from './MessageMetadata';
import { ToolCallData } from './ToolCall';
import './style.scss';

export interface MessageData {
    role: 'user' | 'assistant';
    content: string;
    thinking_content?: string;
    model?: string;
    modelClass?: string;
    tools?: ToolCallData[];
    streaming?: boolean;
    timestamp?: number;
    // Thread support
    threadId?: string;
    threadName?: string;
    threadType?: 'main' | 'metamemory' | 'metacognition';
}

export interface MessageProps {
    message: MessageData;
    showAvatar?: boolean;
    showMetadata?: boolean;
    showTimestamp?: boolean;
    showModel?: boolean;
    showTools?: boolean;
    showThinking?: boolean;
    showThreadInfo?: boolean;
    avatarSize?: number;
    className?: string;
    isCompact?: boolean;
}

export const Message: React.FC<MessageProps> = ({
    message,
    showAvatar = true,
    showMetadata = true,
    showTimestamp = true,
    showModel = true,
    showTools = true,
    showThinking = true,
    showThreadInfo = true,
    avatarSize = 36,
    className = '',
    isCompact = false
}) => {
    const isTyping = message.role === 'assistant' && message.streaming && !message.content;
    const threadClass = message.threadType ? `thread-${message.threadType}` : '';
    
    return (
        <div className={`message ${message.role} ${threadClass} ${isCompact ? 'compact' : ''} ${className}`}>
            {showMetadata && (
                <MessageMetadata
                    model={message.model}
                    modelClass={message.modelClass}
                    timestamp={message.timestamp}
                    isStreaming={message.streaming}
                    showModel={showModel}
                    showTimestamp={showTimestamp}
                    isTyping={isTyping}
                    threadName={showThreadInfo ? message.threadName : undefined}
                    threadType={showThreadInfo ? message.threadType : undefined}
                />
            )}

            <div className="message-row">
                {showAvatar && (
                    <MessageAvatar
                        role={message.role}
                        size={avatarSize}
                    />
                )}

                <MessageContent
                    content={message.content}
                    thinkingContent={message.thinking_content}
                    role={message.role}
                    tools={message.tools}
                    isStreaming={message.streaming}
                    showTools={showTools}
                    showThinking={showThinking}
                    isTyping={isTyping}
                />
            </div>
        </div>
    );
};