import React from 'react';
import { SimilarityBar } from './SimilarityBar';
import './style.scss';

export interface SearchResult {
    id?: string;
    text: string;
    model: string;
    similarity: number;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface SearchResultsProps {
    /** Array of search results */
    results: SearchResult[];
    /** Whether search is in progress */
    isSearching?: boolean;
    /** Result click handler */
    onResultClick?: (result: SearchResult, index: number) => void;
    /** Show model info */
    showModel?: boolean;
    /** Show timestamp */
    showTimestamp?: boolean;
    /** Show similarity bar */
    showSimilarityBar?: boolean;
    /** Loading message */
    loadingMessage?: string;
    /** Empty message */
    emptyMessage?: string;
    /** Custom className */
    className?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
    results,
    isSearching = false,
    onResultClick,
    showModel = true,
    showTimestamp = true,
    showSimilarityBar = true,
    loadingMessage = 'Searching...',
    emptyMessage = 'No results found',
    className = ''
}) => {
    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isSearching) {
        return (
            <div className={`search-results loading ${className}`}>
                <p className="loading-message">{loadingMessage}</p>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className={`search-results empty ${className}`}>
                <p className="empty-message">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={`search-results ${className}`}>
            {results.map((result, index) => (
                <div
                    key={result.id || index}
                    className="result-item"
                    onClick={() => onResultClick?.(result, index)}
                    role="button"
                    tabIndex={0}
                >
                    <div className="result-header">
                        <div className="result-content">
                            <div className="result-text">{result.text}</div>
                            {(showModel || showTimestamp) && (
                                <div className="result-meta">
                                    {showModel && <span>Model: {result.model}</span>}
                                    {showModel && showTimestamp && <span> | </span>}
                                    {showTimestamp && <span>Created: {formatTimestamp(result.timestamp)}</span>}
                                </div>
                            )}
                        </div>
                        <div className="similarity-score">
                            {(result.similarity * 100).toFixed(1)}%
                        </div>
                    </div>
                    
                    {showSimilarityBar && (
                        <SimilarityBar similarity={result.similarity} />
                    )}
                </div>
            ))}
        </div>
    );
};