// MessageContent.tsx (Updated to match border fixes)
import React, { useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { TypingIndicator } from './TypingIndicator';
import { ToolCall } from './ToolCall';
import type { MessageData } from './Message';
import './style.scss';

export interface MessageContentProps {
    message: MessageData;
    className?: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({
    message,
    className = ''
}) => {
    const summary = message.metadata?.summary;
    const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default if summary exists
    const renderContent = (text: string, isUser: boolean) => {
        if (isUser) {
            return DOMPurify.sanitize(text);
        }
        return DOMPurify.sanitize(marked.parse(text) as string);
    };

    // Extract values from message
    const content = message.content;
    const thinkingContent = message.thinking_content;
    const role = message.role;
    const tools = message.tools || [];
    const isTyping = message.role === 'assistant' && message.streaming && !message.content;
    const isUser = role === 'user';
    return (
        <div className={`message-content ${role} ${className}`} >
            <div className="message-body glass" style={{
                cursor: summary ? 'default' : 'pointer', 
                background: `rgba(${message.color}, 0.03)`, // Lighter
                borderColor: `rgba(${message.color}, 0.15)`, // Softer border
            }}
            onClick={() => summary && setIsExpanded(!isExpanded)}>
                {summary && (
                    <div 
                        className={"message-summary"+(isExpanded ? ' expanded' : '')}
                        style={{ 
                            marginBottom: isExpanded ? '12px' : 0,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <span>{summary}</span>
                        <span style={{ opacity: 0.5, flexShrink: 0 }}>
                            {isExpanded ? '▼' : '◀'}
                        </span>
                    </div>
                )}
                {(!summary || isExpanded) && (
                    <>
                    {/* Thinking content for reasoning models */}
                        {thinkingContent && (
                            <div className="thinking-body" dangerouslySetInnerHTML={{
                                    __html: renderContent(thinkingContent, false)
                                }}
                            />
                        )}

                        {/* Tool calls */}
                        {tools.length > 0 && (
                            <div className="tool-calls">
                                {tools.map((tool, index) => (
                                    <ToolCall className="glass" key={tool.id || index} toolCall={tool} />
                                ))}
                            </div>
                        )}

                        {/* Main message content with summary */}
                        {content && (
                            <div dangerouslySetInnerHTML={{
                                    __html: renderContent(content, isUser)
                                }}
                            />
                        )}
                    </>
                )}
            </div>
            
            
            

            {/* Typing indicator */}
            {isTyping && (
                <div className="message-body">
                    <TypingIndicator />
                </div>
            )}
        </div>
    );
};