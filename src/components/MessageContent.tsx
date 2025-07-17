// MessageContent.tsx (Updated to match border fixes)
import React, { useState, useRef, useEffect } from 'react';
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
    // Function to ensure text ends with punctuation
    const ensurePunctuation = (text: string): string => {
        if (!text) return text;
        const trimmed = text.trim();
        if (!trimmed) return trimmed;
        
        // Check if the text already ends with punctuation
        const lastChar = trimmed[trimmed.length - 1];
        const punctuationMarks = ['.', '!', '?', ':', ';', '。', '！', '？'];
        
        if (!punctuationMarks.includes(lastChar)) {
            return trimmed + '.';
        }
        return trimmed;
    };
    
    // Combine summaries if tool result is present
    let summary = message.metadata?.summary;
    if (message.toolResult && message.toolResult.metadata?.summary) {
        // Only use tool result summary if it exists
        summary = ensurePunctuation(message.toolResult.metadata.summary);
    } else if (summary) {
        summary = ensurePunctuation(summary);
    }
    
    const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default if summary exists
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number | null>(null);

    useEffect(() => {
        if (contentRef.current) {
            setContentHeight(contentRef.current.scrollHeight);
        }
    }, [message.content, message.thinking_content, message.tools, isExpanded]);

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
    
    const handleSummaryClick = () => {
        if (summary) {
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <div className={`message-content ${role} ${className}`} >
            <div className="message-body glass" style={{
                cursor: summary ? 'pointer' : 'default', 
                background: `rgba(${message.color}, 0.03)`, // Lighter
                borderColor: `rgba(${message.color}, 0.15)`, // Softer border
            }}>
                {summary && (
                    <div 
                        className={"message-summary"+(isExpanded ? ' expanded' : '')}
                        onClick={handleSummaryClick}
                        style={{ 
                            marginBottom: isExpanded ? '12px' : 0,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <span>{summary}</span>
                        <span 
                            className="expand-icon"
                            style={{ 
                                opacity: 0.5, 
                                flexShrink: 0,
                                transition: 'transform 0.3s ease',
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(180deg)'
                            }}
                        >
                            ▶
                        </span>
                    </div>
                )}
                <div 
                    className="expandable-content"
                    style={{
                        maxHeight: (!summary || isExpanded) ? `${contentHeight || 5000}px` : '0px',
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease-out, opacity 0.3s ease-out',
                        opacity: (!summary || isExpanded) ? 1 : 0
                    }}
                >
                    <div ref={contentRef}>
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
                                    <ToolCall key={tool.id || index} toolCall={tool} />
                                ))}
                                
                                {/* Tool result if present */}
                                {message.toolResult && (
                                    <div className="tool-result">
                                        <div dangerouslySetInnerHTML={{
                                                __html: renderContent(message.toolResult.content, false)
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Main message content with summary */}
                        {content && (
                            <div dangerouslySetInnerHTML={{
                                    __html: renderContent(content, isUser)
                                }}
                            />
                        )}
                    </div>
                </div>
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