import React, { useRef, KeyboardEvent } from 'react';
import './style.scss';

export interface ConversationInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onStop?: () => void;
    isStreaming?: boolean;
    disabled?: boolean;
    placeholder?: string;
    maxLength?: number;
    showCharCount?: boolean;
    autoResize?: boolean;
    className?: string;
    inputClassName?: string;
    buttonClassName?: string;
}

export const ConversationInput: React.FC<ConversationInputProps> = ({
    value,
    onChange,
    onSend,
    onStop,
    isStreaming = false,
    disabled = false,
    placeholder = 'Type your message...',
    maxLength = 4000,
    showCharCount = true,
    autoResize = true,
    className = '',
    inputClassName = '',
    buttonClassName = ''
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        const trimmed = value.trim();
        if (trimmed && !isStreaming && !disabled) {
            onSend();
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if (newValue.length <= maxLength) {
            onChange(newValue);
            
            // Auto-resize textarea
            if (autoResize && textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            }
        }
    };

    const handleStop = () => {
        if (onStop) {
            onStop();
        }
    };

    const isDisabled = disabled || (!value.trim() && !isStreaming);

    return (
        <div 
            className={`conversation-input ${className}`}
            style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                flexShrink: 0,
                paddingTop: '20px'
            }}
        >
            <div 
                className="input-container"
                style={{ 
                    flex: 1,
                    position: 'relative'
                }}
            >
                <textarea
                    ref={textareaRef}
                    className={`glass-textarea ${inputClassName}`}
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={1}
                    style={{
                        width: '100%',
                        minHeight: '80px',
                        maxHeight: '200px',
                        resize: 'vertical'
                    }}
                />
                
                {showCharCount && (
                    <div 
                        className="char-count"
                        style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '12px',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            background: 'var(--surface)',
                            padding: '2px 6px',
                            borderRadius: '4px'
                        }}
                    >
                        {value.length}/{maxLength}
                    </div>
                )}
            </div>
            
            <div className="input-actions">
                {isStreaming ? (
                    <button 
                        className={`danger-btn ${buttonClassName}`}
                        onClick={handleStop}
                        disabled={!onStop}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 6h12v12H6z" />
                        </svg>
                        <span>Stop</span>
                    </button>
                ) : (
                    <button
                        className={`primary-btn ${buttonClassName}`}
                        onClick={handleSend}
                        disabled={isDisabled}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                        <span>Send</span>
                    </button>
                )}
            </div>
        </div>
    );
};