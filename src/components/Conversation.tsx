import React, { useEffect, useRef } from 'react';
import { Message, MessageData } from './Message';
import { useAutoScroll } from '../hooks/useAutoScroll';
import './style.scss';

export interface ConversationProps {
    messages: MessageData[];
    isStreaming?: boolean;
    showAvatars?: boolean;
    showMetadata?: boolean;
    showTimestamps?: boolean;
    showModels?: boolean;
    showTools?: boolean;
    showThinking?: boolean;
    showThreadInfo?: boolean;
    isCompact?: boolean;
    emptyMessage?: string;
    avatarSize?: number;
    className?: string;
    containerClassName?: string;
    messageClassName?: string;
    autoScroll?: boolean;
    maxHeight?: string;
}

export const Conversation: React.FC<ConversationProps> = ({
    messages,
    isStreaming = false,
    showAvatars = true,
    showMetadata = true,
    showTimestamps = true,
    showModels = true,
    showTools = true,
    showThinking = true,
    showThreadInfo = true,
    isCompact = false,
    emptyMessage = 'No messages yet.',
    avatarSize = 36,
    className = '',
    containerClassName = '',
    messageClassName = '',
    autoScroll = true,
    maxHeight = '600px'
}) => {
    const { containerRef, scrollToBottom, handleScroll } = useAutoScroll<HTMLDivElement>();
    const previousMessageCount = useRef(messages.length);

    // Auto-scroll when new messages are added or streaming updates
    useEffect(() => {
        if (autoScroll && (
            messages.length > previousMessageCount.current || 
            isStreaming
        )) {
            scrollToBottom();
        }
        previousMessageCount.current = messages.length;
    }, [messages, isStreaming, autoScroll, scrollToBottom]);

    return (
        <div className={`conversation ${className}`}>
            <div 
                ref={containerRef}
                className={`conversation-container ${containerClassName}`}
                onScroll={handleScroll}
                style={{ 
                    maxHeight,
                    overflowY: 'auto',
                    scrollBehavior: 'smooth'
                }}
            >
                <div className="messages">
                    {messages.length === 0 ? (
                        <div className="empty-state">
                            {emptyMessage}
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <Message
                                key={index}
                                message={message}
                                showAvatar={showAvatars}
                                showMetadata={showMetadata}
                                showTimestamp={showTimestamps}
                                showModel={showModels}
                                showTools={showTools}
                                showThinking={showThinking}
                                showThreadInfo={showThreadInfo}
                                avatarSize={avatarSize}
                                className={messageClassName}
                                isCompact={isCompact}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};