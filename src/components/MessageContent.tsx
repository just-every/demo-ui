import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { TypingIndicator } from './TypingIndicator';
import { ToolCall, ToolCallData } from './ToolCall';
import './style.scss';

export interface MessageContentProps {
    content: string;
    thinkingContent?: string;
    role: 'user' | 'assistant';
    tools?: ToolCallData[];
    isStreaming?: boolean;
    showTools?: boolean;
    showThinking?: boolean;
    isTyping?: boolean;
    className?: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({
    content,
    thinkingContent,
    role,
    tools = [],
    isStreaming: _isStreaming = false,
    showTools = true,
    showThinking = true,
    isTyping = false,
    className = ''
}) => {
    const renderContent = (text: string, isUser: boolean) => {
        if (isUser) {
            return DOMPurify.sanitize(text);
        }
        return DOMPurify.sanitize(marked.parse(text) as string);
    };

    const isUser = role === 'user';

    return (
        <div className={`message-content ${role} ${className}`}>
            {/* Thinking content for reasoning models */}
            {showThinking && thinkingContent && (
                <div className="glass thinking-content">
                    <div className="thinking-body" dangerouslySetInnerHTML={{
                            __html: renderContent(thinkingContent, false)
                        }}
                    />
                </div>
            )}

            {/* Tool calls */}
            {showTools && tools.length > 0 && (
                <div className="tool-calls">
                    {tools.map((tool, index) => (
                        <ToolCall className="glass" key={tool.id || index} toolCall={tool} />
                    ))}
                </div>
            )}

            {/* Main message content */}
            {content && (
                <div className="message-body glass">
                    <div
                        dangerouslySetInnerHTML={{
                            __html: renderContent(content, isUser)
                        }}
                    />
                </div>
            )}

            {/* Typing indicator */}
            {isTyping && (
                <div className="message-body">
                    <TypingIndicator />
                </div>
            )}
        </div>
    );
};