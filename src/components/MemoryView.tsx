import React, { useState } from 'react';
import { MetaMemoryEventData, MemoryTaggingEvent } from '../utils/metaMemoryEventProcessor';
import type { TopicTagMetadata, MessageMetadata } from '@just-every/task';
import type { TaskState } from '../hooks/useTaskState';
import { formatDuration } from '../utils/formatters';
import './style.scss';
import './MemoryView.scss';
import './MemoryView.compaction.scss';

export interface MemoryViewProps {
    taskState: TaskState;
    className?: string;
}

export const MemoryView: React.FC<MemoryViewProps> = ({
    taskState,
    className = ''
}) => {
    const [activeTab, setActiveTab] = useState<'topics' | 'messages' | 'events' | 'compaction'>('topics');
    const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [expandedCompactions, setExpandedCompactions] = useState<Set<string>>(new Set());

    const toggleMessageExpanded = (messageId: string) => {
        const newExpanded = new Set(expandedMessages);
        if (newExpanded.has(messageId)) {
            newExpanded.delete(messageId);
        } else {
            newExpanded.add(messageId);
        }
        setExpandedMessages(newExpanded);
    };

    const toggleCompactionExpanded = (topicTag: string) => {
        const newExpanded = new Set(expandedCompactions);
        if (newExpanded.has(topicTag)) {
            newExpanded.delete(topicTag);
        } else {
            newExpanded.add(topicTag);
        }
        setExpandedCompactions(newExpanded);
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

    // Render compaction visualization for a topic
    const renderCompactionVisualization = (topic: string, metadata: TopicTagMetadata) => {
        const isExpanded = expandedCompactions.has(topic);
        const targetCompaction = metadata.target_compaction_percent || 0;
        
        // Get messages for this topic to calculate stats
        const topicMessages = Array.from(taggedMessages.entries()).filter(([_, msgMeta]) =>
            msgMeta.topic_tags.includes(topic)
        );
        
        const totalMessages = topicMessages.length;
        const totalChars = topicMessages.reduce((sum, [_, msgMeta]) => sum + (msgMeta.summary?.length || 0), 0);
        const estimatedTokens = Math.ceil(totalChars / 4);
        
        // Calculate visual metrics
        const compactionPercentage = targetCompaction;
        const retainedPercentage = 100 - compactionPercentage;
        
        // Determine compaction status color
        const getCompactionColor = (percent: number) => {
            if (percent === 0) return '#6c757d'; // gray - no compaction
            if (percent <= 20) return '#28a745'; // green - light compaction
            if (percent <= 50) return '#ffc107'; // yellow - moderate compaction
            if (percent <= 80) return '#fd7e14'; // orange - heavy compaction
            return '#dc3545'; // red - maximum compaction
        };
        
        const compactionColor = getCompactionColor(targetCompaction);
        
        return (
            <div key={topic} className={`compaction-item ${metadata.type}`}>
                <div className="compaction-header" onClick={() => toggleCompactionExpanded(topic)}>
                    <div className="compaction-title">
                        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                        <span className="topic-name">{topic}</span>
                        <span className={`topic-type ${metadata.type}`}>{metadata.type}</span>
                    </div>
                    <div className="compaction-stats">
                        <span className="message-count">{totalMessages} messages</span>
                        <span className="token-count">~{estimatedTokens} tokens</span>
                    </div>
                </div>
                
                <div className="compaction-visualization">
                    <div className="compaction-bar-container">
                        <div className="compaction-bar">
                            <div 
                                className="retained-section" 
                                style={{ 
                                    width: `${retainedPercentage}%`,
                                    backgroundColor: '#4CAF50'
                                }}
                                title={`Retained: ${retainedPercentage}%`}
                            />
                            <div 
                                className="compacted-section" 
                                style={{ 
                                    width: `${compactionPercentage}%`,
                                    backgroundColor: compactionColor
                                }}
                                title={`Compacted: ${compactionPercentage}%`}
                            />
                        </div>
                        <div className="compaction-labels">
                            <span className="retained-label">Retained: {retainedPercentage}%</span>
                            <span className="compacted-label">Target: {targetCompaction}%</span>
                        </div>
                    </div>
                    
                    <div className="compaction-visual">
                        <div className="folder-comparison">
                            <div className="folder original">
                                <div className="folder-icon">📁</div>
                                <div className="folder-size">{totalMessages} msgs</div>
                                <div className="folder-label">Original</div>
                            </div>
                            <div className="arrow">→</div>
                            <div className="folder compacted">
                                <div className="folder-icon" style={{ fontSize: `${0.5 + (retainedPercentage / 100) * 0.5}em` }}>📦</div>
                                <div className="folder-size">{Math.ceil(totalMessages * retainedPercentage / 100)} msgs</div>
                                <div className="folder-label">After Compaction</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {isExpanded && (
                    <div className="compaction-details">
                        <div className="compaction-info">
                            <h4>Compaction Strategy</h4>
                            <p className="strategy-description">
                                {metadata.type === 'core' && 'Core topics receive minimal compaction to preserve important context.'}
                                {metadata.type === 'active' && 'Active topics are moderately compacted while maintaining recent context.'}
                                {metadata.type === 'idle' && 'Idle topics are aggressively compacted to save space.'}
                                {metadata.type === 'archived' && 'Archived topics are fully compacted into summaries.'}
                                {metadata.type === 'ephemeral' && 'Ephemeral topics are quickly compacted as they age.'}
                            </p>
                            
                            <div className="compaction-metrics">
                                <div className="metric">
                                    <span className="metric-label">Last Updated:</span>
                                    <span className="metric-value">{new Date(metadata.last_update).toLocaleString()}</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-label">Age:</span>
                                    <span className="metric-value">
                                        {formatDuration(Date.now() - metadata.last_update)}
                                    </span>
                                </div>
                                <div className="metric">
                                    <span className="metric-label">Estimated Savings:</span>
                                    <span className="metric-value">
                                        ~{Math.floor(estimatedTokens * compactionPercentage / 100)} tokens
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="compaction-preview">
                            <h4>Compaction Preview</h4>
                            <div className="preview-note">
                                {targetCompaction === 0 ? (
                                    <p>No compaction scheduled for this topic.</p>
                                ) : targetCompaction === 100 ? (
                                    <p>All messages will be compacted into a single comprehensive summary.</p>
                                ) : (
                                    <p>The oldest {targetCompaction}% of messages will be compacted into a summary, preserving recent context.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
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
                <button
                    className={`tab ${activeTab === 'compaction' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('compaction');
                        setSelectedTopic(null);
                    }}
                >
                    Compaction
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

                {activeTab === 'compaction' && (
                    <div className="compaction-section">
                        {topicTags.size > 0 ? (
                            <div className="compaction-list">
                                {Array.from(topicTags.entries())
                                    .sort((a, b) => {
                                        // Sort by compaction percentage (descending), then by last update
                                        const compA = a[1].target_compaction_percent || 0;
                                        const compB = b[1].target_compaction_percent || 0;
                                        if (compA !== compB) return compB - compA;
                                        return b[1].last_update - a[1].last_update;
                                    })
                                    .map(([topic, metadata]) => renderCompactionVisualization(topic, metadata))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">📦</div>
                                <p>No topics available for compaction</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};