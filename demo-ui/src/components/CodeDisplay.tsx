import React, { useRef, useState } from 'react';
import './style.scss';

export interface CodeDisplayProps {
    /** Code content to display */
    code: string;
    /** Programming language for syntax highlighting */
    language?: string;
    /** Show copy button */
    showCopyButton?: boolean;
    /** Show line numbers */
    showLineNumbers?: boolean;
    /** Maximum height before scrolling */
    maxHeight?: string | number;
    /** Code title/filename */
    title?: string;
    /** Custom className */
    className?: string;
    /** Whether to wrap long lines */
    wrapLines?: boolean;
    /** Copy button position */
    copyButtonPosition?: 'top-right' | 'bottom-right';
}

export const CodeDisplay: React.FC<CodeDisplayProps> = ({
    code,
    language = 'typescript',
    showCopyButton = true,
    showLineNumbers = false,
    maxHeight = '500px',
    title,
    className = '',
    wrapLines = false,
    copyButtonPosition = 'top-right'
}) => {
    const [copied, setCopied] = useState(false);
    const codeRef = useRef<HTMLPreElement>(null);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const renderLineNumbers = () => {
        if (!showLineNumbers) return null;
        
        const lines = code.split('\n');
        return (
            <div className="line-numbers">
                {lines.map((_, index) => (
                    <div key={index} className="line-number">
                        {index + 1}
                    </div>
                ))}
            </div>
        );
    };

    const copyButtonPositionClass = copyButtonPosition === 'bottom-right' ? 'bottom' : 'top';

    return (
        <div className={`code-display ${className}`}>
            {title && (
                <div className="code-header">
                    <span className="code-title">{title}</span>
                    <span className="code-language">{language}</span>
                </div>
            )}
            
            <div className="code-container" style={{ maxHeight }}>
                {showCopyButton && (
                    <button
                        className={`copy-button ${copyButtonPositionClass} ${copied ? 'copied' : ''}`}
                        onClick={handleCopy}
                        aria-label="Copy code"
                    >
                        {copied ? (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                                </svg>
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                )}
                
                <div className="code-content">
                    {renderLineNumbers()}
                    <pre
                        ref={codeRef}
                        className={`code-block ${wrapLines ? 'wrap-lines' : ''}`}
                        data-language={language}
                    >
                        <code>{code}</code>
                    </pre>
                </div>
            </div>
        </div>
    );
};