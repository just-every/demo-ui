import React from 'react';
import { CustomEvent } from '../utils/customEventProcessor';
import './style.scss';
import './CustomEventView.scss';

export interface CustomEventViewProps<T = any> {
    events: CustomEvent<T>[];
    state: T;
    latest: CustomEvent<T> | null;
    renderEvent?: (event: CustomEvent<T>, index: number) => React.ReactNode;
    renderState?: (state: T) => React.ReactNode;
    renderLatest?: (event: CustomEvent<T>) => React.ReactNode;
    title?: string;
    className?: string;
    maxEventsShown?: number;
    reverseOrder?: boolean;
}

export function CustomEventView<T = any>({
    events,
    state,
    latest,
    renderEvent,
    renderState,
    renderLatest,
    title,
    className = '',
    maxEventsShown = 50,
    reverseOrder = true
}: CustomEventViewProps<T>) {
    const displayEvents = reverseOrder 
        ? [...events].reverse().slice(0, maxEventsShown)
        : events.slice(-maxEventsShown);

    const defaultRenderEvent = (event: CustomEvent<T>, index: number) => (
        <div key={index} className="custom-event-item">
            <div className="event-header">
                <span className="event-type">{event.type}</span>
                {event.subtype && (
                    <span className="event-subtype">{event.subtype}</span>
                )}
                <span className="event-time">
                    {new Date(event.timestamp).toLocaleTimeString()}
                </span>
            </div>
            <div className="event-data">
                <pre>{JSON.stringify(event.data, null, 2)}</pre>
            </div>
        </div>
    );

    return (
        <div className={`custom-event-view ${className}`}>
            {title && <h3>{title}</h3>}

            {renderLatest && latest && (
                <div className="latest-event-section">
                    <h4>Latest</h4>
                    {renderLatest(latest)}
                </div>
            )}

            {renderState && (
                <div className="state-section">
                    <h4>Current State</h4>
                    {renderState(state)}
                </div>
            )}

            {displayEvents.length > 0 && (
                <div className="events-section">
                    <h4>Events History</h4>
                    <div className="events-list">
                        {displayEvents.map((event, index) => 
                            renderEvent ? renderEvent(event, index) : defaultRenderEvent(event, index)
                        )}
                    </div>
                </div>
            )}

            {events.length === 0 && (
                <div className="empty-state">
                    <p>No events yet</p>
                </div>
            )}
        </div>
    );
}

/**
 * Image Gallery View Component
 */
export interface ImageGalleryViewProps {
    images: Array<{ url: string; prompt: string; timestamp?: number }>;
    latestImage: { url: string; prompt: string } | null;
    columns?: number;
    imageSize?: 'small' | 'medium' | 'large';
    showPrompts?: boolean;
    className?: string;
}

export const ImageGalleryView: React.FC<ImageGalleryViewProps> = ({
    images,
    latestImage,
    columns = 3,
    imageSize = 'medium',
    showPrompts = true,
    className = ''
}) => {
    const sizeClasses = {
        small: 'gallery-small',
        medium: 'gallery-medium',
        large: 'gallery-large'
    };

    return (
        <div className={`image-gallery-view ${sizeClasses[imageSize]} ${className}`}>
            {latestImage && (
                <div className="latest-image-section">
                    <h3>Latest Image</h3>
                    <div className="latest-image">
                        <img src={latestImage.url} alt={latestImage.prompt} />
                        {showPrompts && (
                            <div className="image-prompt">{latestImage.prompt}</div>
                        )}
                    </div>
                </div>
            )}

            {images.length > 0 && (
                <div className="gallery-section">
                    <h3>All Images ({images.length})</h3>
                    <div 
                        className="image-grid" 
                        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                    >
                        {images.map((image, index) => (
                            <div key={index} className="gallery-item">
                                <img src={image.url} alt={image.prompt} />
                                {showPrompts && (
                                    <div className="image-caption">
                                        <div className="image-prompt">{image.prompt}</div>
                                        {image.timestamp && (
                                            <div className="image-time">
                                                {new Date(image.timestamp).toLocaleTimeString()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {images.length === 0 && !latestImage && (
                <div className="empty-state">
                    <div className="empty-icon">🖼️</div>
                    <p>No images generated yet</p>
                </div>
            )}
        </div>
    );
};

/**
 * Design Iterations View Component
 */
export interface DesignIterationsViewProps {
    iterations: Array<{
        version: number;
        description: string;
        imageUrl?: string;
        feedback?: string;
        approved?: boolean;
        timestamp?: number;
    }>;
    currentVersion: number;
    className?: string;
}

export const DesignIterationsView: React.FC<DesignIterationsViewProps> = ({
    iterations,
    currentVersion,
    className = ''
}) => {
    return (
        <div className={`design-iterations-view ${className}`}>
            <div className="iterations-header">
                <h3>Design Iterations</h3>
                <span className="current-version">v{currentVersion}</span>
            </div>

            <div className="iterations-timeline">
                {iterations.map((iteration, index) => (
                    <div 
                        key={index} 
                        className={`iteration-item ${
                            iteration.version === currentVersion ? 'current' : ''
                        } ${iteration.approved ? 'approved' : ''}`}
                    >
                        <div className="iteration-marker">
                            <span className="version-number">v{iteration.version}</span>
                            {iteration.approved && <span className="approved-badge">✓</span>}
                        </div>
                        
                        <div className="iteration-content">
                            <div className="iteration-description">{iteration.description}</div>
                            
                            {iteration.imageUrl && (
                                <div className="iteration-image">
                                    <img src={iteration.imageUrl} alt={`Version ${iteration.version}`} />
                                </div>
                            )}
                            
                            {iteration.feedback && (
                                <div className="iteration-feedback">
                                    <strong>Feedback:</strong> {iteration.feedback}
                                </div>
                            )}
                            
                            {iteration.timestamp && (
                                <div className="iteration-time">
                                    {new Date(iteration.timestamp).toLocaleString()}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {iterations.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">🎨</div>
                    <p>No design iterations yet</p>
                </div>
            )}
        </div>
    );
};