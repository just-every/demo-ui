import React, { useState } from 'react';
import { MetaMemoryEventData, MemoryTaggingEvent } from '../utils/metaMemoryEventProcessor';
import type { TopicTagMetadata, MessageMetadata } from '@just-every/task';
import type { TaskState } from '../hooks/useTaskState';
import { formatDuration } from '../utils/formatters';
import './style.scss';
import './MemoryView.scss';

export interface MemoryViewProps {
    taskState: TaskState;
    className?: string;
}

export const MemoryView: React.FC<MemoryViewProps> = ({
    taskState,
    className = ''
}) => {
    const [activeTab, setActiveTab] = useState<'topics' | 'messages' | 'events'>('topics');
    const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    const toggleMessageExpanded = (messageId: string) => {
        const newExpanded = new Set(expandedMessages);
        if (newExpanded.has(messageId)) {
            newExpanded.delete(messageId);
        } else {
            newExpanded.add(messageId);
        }
        setExpandedMessages(newExpanded);
    };

    const findOriginalMessage = (messageId: string) => {
        // The messageId parameter here is actually the key from taggedMessages map
        // which should match the 'id' field of messages
        return taskState.messages.find(event => {
            // Check the message.id field from ResponseOutputEvent
            return event.message.id === messageId;
        });
    };

    const renderTaggingEvent = (event: MemoryTaggingEvent) => (
        <div key={event.eventId} className={`tagging-event ${event.isRunning ? 'running' : 'completed'}`}>
            <div className="event-header">
                <div className="event-meta">
                    <span className="event-status">
                        {event.isRunning ? (
                            <>⟳ Processing</>
                        ) : (
                            <>✓ Completed</>
                        )}
                    </span>
                    <span className="event-time">
                        {new Date(event.startedAt).toLocaleTimeString()}
                    </span>
                    {event.processingTime && (
                        <span className="event-duration">
                            {formatDuration(event.processingTime)}
                        </span>
                    )}
                </div>
                <span className="message-count">{event.messageCount} messages</span>
            </div>

            {event.completedAt && (
                <div className="event-stats">
                    <div className="stat-row">
                        {event.newTopicCount !== undefined && event.newTopicCount > 0 && (
                            <span 
                                className="stat-item new clickable"
                                onClick={() => {
                                    if (event.affectedTopics?.length) {
                                        setSelectedTopic(event.affectedTopics[0]);
                                        setActiveTab('topics');
                                    }
                                }}
                                title={event.affectedTopics?.join(', ')}
                            >
                                +{event.newTopicCount} new topics
                            </span>
                        )}
                        {event.updatedTopicCount !== undefined && event.updatedTopicCount > 0 && (
                            <span 
                                className="stat-item updated clickable"
                                onClick={() => {
                                    if (event.affectedTopics?.length) {
                                        setSelectedTopic(event.affectedTopics[0]);
                                        setActiveTab('topics');
                                    }
                                }}
                                title={event.affectedTopics?.join(', ')}
                            >
                                ↻{event.updatedTopicCount} updated topics
                            </span>
                        )}
                    </div>
                    <div className="stat-row">
                        {event.newMessageCount !== undefined && event.newMessageCount > 0 && (
                            <span 
                                className="stat-item new clickable"
                                onClick={() => {
                                    if (event.affectedMessages?.length) {
                                        // Find first affected message's topic to filter by
                                        const firstMsgId = event.affectedMessages[0];
                                        const msgMetadata = taggedMessages.get(firstMsgId);
                                        if (msgMetadata && msgMetadata.topic_tags.length > 0) {
                                            setSelectedTopic(msgMetadata.topic_tags[0]);
                                        }
                                        setActiveTab('messages');
                                    }
                                }}
                                title="View tagged messages"
                            >
                                +{event.newMessageCount} new tags
                            </span>
                        )}
                        {event.updatedMessageCount !== undefined && event.updatedMessageCount > 0 && (
                            <span 
                                className="stat-item updated clickable"
                                onClick={() => {
                                    if (event.affectedMessages?.length) {
                                        // Find first affected message's topic to filter by
                                        const firstMsgId = event.affectedMessages[0];
                                        const msgMetadata = taggedMessages.get(firstMsgId);
                                        if (msgMetadata && msgMetadata.topic_tags.length > 0) {
                                            setSelectedTopic(msgMetadata.topic_tags[0]);
                                        }
                                        setActiveTab('messages');
                                    }
                                }}
                                title="View updated messages"
                            >
                                ↻{event.updatedMessageCount} updated tags
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const renderTopic = (topic: string, metadata: TopicTagMetadata) => (
        <div
            key={topic}
            className={`topic-item ${metadata.type} ${selectedTopic === topic ? 'selected' : ''}`}
            onClick={() => {
                setSelectedTopic(topic);
                setActiveTab('messages');
            }}
        >
            <div className="topic-header">
                <span className="topic-name">{topic}</span>
                <span className={`topic-type ${metadata.type}`}>{metadata.type}</span>
            </div>
            <div className="topic-description">{metadata.description}</div>
            <div className="topic-meta">
                Last updated: {new Date(metadata.last_update).toLocaleString()}
            </div>
        </div>
    );

    const renderMessage = (messageId: string, metadata: MessageMetadata) => {
        // Try finding by the map key first, then by the metadata.message_id
        const originalMessage = findOriginalMessage(messageId) || findOriginalMessage(metadata.message_id);
        const isExpanded = expandedMessages.has(messageId);

        return (
            <div key={messageId} className="tagged-message">
                <div className="message-header" onClick={() => toggleMessageExpanded(messageId)}>
                    <div className="message-summary">
                        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                        <span className="message-id">{messageId.substring(0, 8)}...</span>
                        <span className="message-summary-text">{metadata.summary}</span>
                    </div>
                    <div className="message-tags">
                        {metadata.topic_tags.map(tag => (
                            <span
                                key={tag}
                                className={`tag ${selectedTopic === tag ? 'selected' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTopic(selectedTopic === tag ? null : tag);
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                {isExpanded && (
                    <div className="message-content">
                        {originalMessage ? (
                            <div>
                                <div className="message-info">
                                    <div><strong>Type:</strong> {originalMessage.message.type}</div>
                                    {'role' in originalMessage.message && (
                                        <div><strong>Role:</strong> {originalMessage.message.role}</div>
                                    )}
                                    <div><strong>Status:</strong> {originalMessage.message.status}</div>
                                    {originalMessage.request_id && (
                                        <div><strong>Request ID:</strong> {originalMessage.request_id}</div>
                                    )}
                                </div>
                                <div className="message-text">
                                    <strong>Content:</strong>
                                    {'content' in originalMessage.message ? (
                                        <pre>{typeof originalMessage.message.content === 'string' 
                                            ? originalMessage.message.content 
                                            : JSON.stringify(originalMessage.message.content, null, 2)}</pre>
                                    ) : (
                                        <pre>{JSON.stringify(originalMessage.message, null, 2)}</pre>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                Original message not found. Message ID: {messageId}
                                {metadata.message_id !== messageId && ` (or ${metadata.message_id})`}
                            </div>
                        )}
                    </div>
                )}
                <div className="message-meta">
                    Last updated: {new Date(metadata.last_update).toLocaleString()}
                </div>
            </div>
        );
    };

    // Convert objects to Maps if needed (handles JSON serialization)
    const topicTags: Map<string, TopicTagMetadata> = taskState.memoryData.currentState?.topicTags instanceof Map 
        ? taskState.memoryData.currentState.topicTags 
        : new Map(Object.entries(taskState.memoryData.currentState?.topicTags || {}) as [string, TopicTagMetadata][]);
    
    const taggedMessages: Map<string, MessageMetadata> = taskState.memoryData.currentState?.taggedMessages instanceof Map
        ? taskState.memoryData.currentState.taggedMessages
        : new Map(Object.entries(taskState.memoryData.currentState?.taggedMessages || {}) as [string, MessageMetadata][]);
    
    // Filter messages by selected topic
    const filteredMessages = selectedTopic
        ? Array.from(taggedMessages.entries()).filter(([_, metadata]) =>
            metadata.topic_tags.includes(selectedTopic)
          )
        : Array.from(taggedMessages.entries());

    return (
        <div className={`memory-view ${className}`}>
            <div className="memory-header">
                <h3>Metamemory</h3>
                <div className="stats-summary">
                    <div className="stat-item">
                        <span className="stat-value">{taskState.memoryData.stats.totalTaggingSessions}</span>
                        <span className="stat-label">Sessions</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{taskState.memoryData.stats.totalTopics}</span>
                        <span className="stat-label">Topics</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{taskState.memoryData.stats.totalTaggedMessages}</span>
                        <span className="stat-label">Tagged</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{taskState.memoryData.stats.totalNewTopics}</span>
                        <span className="stat-label">New Topics</span>
                    </div>
                    {taskState.memoryData.stats.averageProcessingTime > 0 && (
                        <div className="stat-item">
                            <span className="stat-value">
                                {formatDuration(taskState.memoryData.stats.averageProcessingTime)}
                            </span>
                            <span className="stat-label">Avg Time</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="memory-tabs">
                <button
                    className={`tab ${activeTab === 'topics' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('topics');
                        setSelectedTopic(null);
                    }}
                >
                    Topics ({topicTags.size})
                </button>
                <button
                    className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
                    onClick={() => setActiveTab('messages')}
                >
                    Messages ({taggedMessages.size})
                </button>
                <button
                    className={`tab ${activeTab === 'events' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('events');
                        setSelectedTopic(null);
                    }}
                >
                    Event Log
                </button>
            </div>

            {selectedTopic && activeTab === 'messages' && (
                <div className="filter-bar">
                    <span>Filtering by topic: <strong>{selectedTopic}</strong></span>
                    <button onClick={() => setSelectedTopic(null)}>Clear filter</button>
                </div>
            )}

            <div className="memory-content">
                {activeTab === 'topics' && (
                    <div className="topics-section">
                        {topicTags.size > 0 ? (
                            <div className="topics-list">
                                {Array.from(topicTags.entries())
                                    .sort((a, b) => b[1].last_update - a[1].last_update)
                                    .map(([topic, metadata]) => renderTopic(topic, metadata))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">🏷️</div>
                                <p>No topics created yet</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'messages' && (
                    <div className="messages-section">
                        {filteredMessages.length > 0 ? (
                            <div className="messages-list">
                                {filteredMessages
                                    .sort((a, b) => b[1].last_update - a[1].last_update)
                                    .map(([messageId, metadata]) => renderMessage(messageId, metadata))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">💬</div>
                                <p>{selectedTopic ? `No messages tagged with "${selectedTopic}"` : 'No messages tagged yet'}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="events-section">
                        {taskState.memoryData.taggingEvents.length > 0 ? (
                            <div className="events-list">
                                {taskState.memoryData.taggingEvents
                                    .sort((a, b) => b.startedAt - a.startedAt)
                                    .map(renderTaggingEvent)}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">📝</div>
                                <p>No tagging events yet</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};