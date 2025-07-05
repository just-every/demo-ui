import React, { useRef, useEffect } from 'react';
import './style.scss';

export interface FormTextareaProps {
    /** Current value */
    value: string;
    /** Change handler */
    onChange: (value: string) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Number of visible rows */
    rows?: number;
    /** Maximum character length */
    maxLength?: number;
    /** Show character counter */
    showCharCount?: boolean;
    /** Auto-resize based on content */
    autoResize?: boolean;
    /** Minimum height when auto-resizing */
    minHeight?: number;
    /** Maximum height when auto-resizing */
    maxHeight?: number;
    /** Whether the textarea is disabled */
    disabled?: boolean;
    /** Whether the textarea is read-only */
    readOnly?: boolean;
    /** Label for the textarea */
    label?: string;
    /** Help text shown below the textarea */
    helpText?: string;
    /** Error message */
    error?: string;
    /** Whether the field is required */
    required?: boolean;
    /** Custom className */
    className?: string;
    /** Key down handler */
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
    value,
    onChange,
    placeholder,
    rows = 4,
    maxLength,
    showCharCount = false,
    autoResize = false,
    minHeight = 80,
    maxHeight = 400,
    disabled = false,
    readOnly = false,
    label,
    helpText,
    error,
    required = false,
    className = '',
    onKeyDown
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if (!maxLength || newValue.length <= maxLength) {
            onChange(newValue);
        }
    };

    // Auto-resize functionality
    useEffect(() => {
        if (autoResize && textareaRef.current) {
            const textarea = textareaRef.current;
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
            textarea.style.height = `${newHeight}px`;
        }
    }, [value, autoResize, minHeight, maxHeight]);

    const hasError = !!error;
    const charCount = value.length;
    const charCountColor = maxLength && charCount > maxLength * 0.9 ? 'warning' : 'normal';

    return (
        <div className={`form-textarea-wrapper ${className} ${hasError ? 'has-error' : ''}`}>
            {label && (
                <label className="form-label">
                    {label}
                    {required && <span className="required-indicator">*</span>}
                </label>
            )}
            
            <div className="textarea-container">
                <textarea
                    ref={textareaRef}
                    className="glass-textarea"
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    rows={rows}
                    disabled={disabled}
                    readOnly={readOnly}
                    onKeyDown={onKeyDown}
                    style={{
                        minHeight: autoResize ? `${minHeight}px` : undefined,
                        maxHeight: autoResize ? `${maxHeight}px` : undefined,
                        resize: autoResize ? 'none' : 'vertical'
                    }}
                />
                
                {showCharCount && (
                    <div className={`char-counter ${charCountColor}`}>
                        {charCount}
                        {maxLength && ` / ${maxLength}`}
                    </div>
                )}
            </div>
            
            {helpText && !error && (
                <span className="form-help-text">{helpText}</span>
            )}
            
            {error && (
                <span className="form-error-text">{error}</span>
            )}
        </div>
    );
};