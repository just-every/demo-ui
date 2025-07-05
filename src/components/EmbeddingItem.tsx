import React from 'react';
import './style.scss';

export interface EmbeddingData {
    id: string;
    text: string;
    model: string;
    dimensions: number;
    timestamp: number;
    embedding?: number[];
}

export interface EmbeddingItemProps {
    /** Embedding data */
    embedding: EmbeddingData;
    /** Whether the item is selected */
    selected?: boolean;
    /** Click handler */
    onClick?: (id: string) => void;
    /** Delete handler */
    onDelete?: (id: string) => void;
    /** Show delete button */
    showDelete?: boolean;
    /** Show metadata */
    showMetadata?: boolean;
    /** Custom className */
    className?: string;
}

export const EmbeddingItem: React.FC<EmbeddingItemProps> = ({
    embedding,
    selected = false,
    onClick,
    onDelete,
    showDelete = true,
    showMetadata = true,
    className = ''
}) => {
    const handleClick = () => {
        if (onClick) {
            onClick(embedding.id);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(embedding.id);
        }
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div
            className={`embedding-item ${selected ? 'selected' : ''} ${className}`}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-selected={selected}
        >
            <div className="embedding-header">
                <div className="embedding-text">{embedding.text}</div>
                {showDelete && onDelete && (
                    <button
                        className="icon-btn"
                        onClick={handleDelete}
                        aria-label="Delete embedding"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                    </button>
                )}
            </div>
            
            {showMetadata && (
                <div className="embedding-meta">
                    <span>Model: {embedding.model}</span>
                    <span>Dimensions: {embedding.dimensions}</span>
                    <span>Created: {formatTimestamp(embedding.timestamp)}</span>
                </div>
            )}
        </div>
    );
};