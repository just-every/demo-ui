import React from 'react';
import { EmbeddingItem, EmbeddingData } from './EmbeddingItem';
import './style.scss';

export interface EmbeddingsListProps {
    /** Array of embeddings */
    embeddings: EmbeddingData[];
    /** Set of selected embedding IDs */
    selectedIds?: Set<string>;
    /** Item click handler */
    onItemClick?: (id: string) => void;
    /** Item delete handler */
    onItemDelete?: (id: string) => void;
    /** Empty state message */
    emptyMessage?: string;
    /** Show delete buttons */
    showDelete?: boolean;
    /** Show metadata */
    showMetadata?: boolean;
    /** Maximum height before scrolling */
    maxHeight?: string | number;
    /** Custom className */
    className?: string;
}

export const EmbeddingsList: React.FC<EmbeddingsListProps> = ({
    embeddings,
    selectedIds = new Set(),
    onItemClick,
    onItemDelete,
    emptyMessage = 'No embeddings yet. Create some to get started!',
    showDelete = true,
    showMetadata = true,
    maxHeight = '400px',
    className = ''
}) => {
    if (embeddings.length === 0) {
        return (
            <div className={`embeddings-list empty ${className}`}>
                <p className="empty-message">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div
            className={`embeddings-list ${className}`}
            style={{ maxHeight, overflowY: 'auto' }}
        >
            {embeddings.map(embedding => (
                <EmbeddingItem
                    key={embedding.id}
                    embedding={embedding}
                    selected={selectedIds.has(embedding.id)}
                    onClick={onItemClick}
                    onDelete={onItemDelete}
                    showDelete={showDelete}
                    showMetadata={showMetadata}
                />
            ))}
        </div>
    );
};