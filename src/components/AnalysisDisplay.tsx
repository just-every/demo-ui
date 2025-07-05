import React from 'react';
import './style.scss';

export interface AnalysisDisplayProps {
    /** Analysis content */
    content: string;
    /** Display title */
    title?: string;
    /** Show copy button */
    showCopy?: boolean;
    /** Maximum height before scrolling */
    maxHeight?: string | number;
    /** Whether content is loading */
    isLoading?: boolean;
    /** Loading message */
    loadingMessage?: string;
    /** Custom className */
    className?: string;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({
    content,
    title = 'Analysis',
    showCopy = true,
    maxHeight = '400px',
    isLoading = false,
    loadingMessage = 'Analyzing...',
    className = ''
}) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className={`analysis-display ${className}`}>
            <div className="analysis-header">
                <h3 className="analysis-title">{title}</h3>
                {showCopy && content && !isLoading && (
                    <button
                        className={`copy-button ${copied ? 'copied' : ''}`}
                        onClick={handleCopy}
                        aria-label="Copy analysis"
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
            </div>
            
            <div 
                className="analysis-content"
                style={{ maxHeight, overflowY: 'auto' }}
            >
                {isLoading ? (
                    <div className="analysis-loading">
                        <p>{loadingMessage}</p>
                    </div>
                ) : content ? (
                    <pre>{content}</pre>
                ) : (
                    <div className="analysis-empty">
                        <p>No analysis available</p>
                    </div>
                )}
            </div>
        </div>
    );
};