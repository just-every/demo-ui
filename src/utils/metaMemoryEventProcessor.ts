import type { MetaMemoryEvent, SerializedMetamemoryState, TopicTagMetadata, MessageMetadata } from '@just-every/task';

export interface MetaMemoryEventData {
    events: MetaMemoryEvent[];
    taggingEvents: MemoryTaggingEvent[];
    currentState?: SerializedMetamemoryState;
    stats: MetaMemoryStats;
}

export interface MemoryTaggingEvent {
    eventId: string;
    startedAt: number;
    completedAt?: number;
    messageCount: number;
    processingTime?: number;
    newTopicCount?: number;
    updatedTopicCount?: number;
    newMessageCount?: number;
    updatedMessageCount?: number;
    state?: SerializedMetamemoryState;
    isRunning: boolean;
    // Track what changed in this tagging session
    affectedTopics?: string[];
    affectedMessages?: string[];
}

export interface MetaMemoryStats {
    totalTaggingSessions: number;
    completedTaggingSessions: number;
    totalTopics: number;
    totalTaggedMessages: number;
    totalNewTopics: number;
    totalNewMessages: number;
    averageProcessingTime: number;
    lastProcessingTime?: number;
}

export class MetaMemoryEventProcessor {
    private events: MetaMemoryEvent[] = [];
    private taggingEvents: Map<string, MemoryTaggingEvent> = new Map();
    private currentState?: SerializedMetamemoryState;
    private processingTimes: number[] = [];
    private stats: MetaMemoryStats = {
        totalTaggingSessions: 0,
        completedTaggingSessions: 0,
        totalTopics: 0,
        totalTaggedMessages: 0,
        totalNewTopics: 0,
        totalNewMessages: 0,
        averageProcessingTime: 0
    };

    /**
     * Process a MetaMemory event and update internal state
     */
    processEvent(event: MetaMemoryEvent): MetaMemoryEventData {
        // Add event to history
        this.events.push(event);

        // Process based on operation type
        switch (event.operation) {
            case 'tagging_start':
                this.handleTaggingStart(event);
                break;
                
            case 'tagging_complete':
                this.handleTaggingComplete(event);
                break;
        }

        return this.getProcessedData();
    }

    private handleTaggingStart(event: MetaMemoryEvent) {
        const taggingEvent: MemoryTaggingEvent = {
            eventId: event.eventId,
            startedAt: event.timestamp,
            messageCount: event.data.messageCount || 0,
            state: event.data.state,
            isRunning: true
        };

        this.taggingEvents.set(event.eventId, taggingEvent);
        this.stats.totalTaggingSessions++;

        // Update current state
        if (event.data.state) {
            this.currentState = event.data.state;
        }
    }

    private handleTaggingComplete(event: MetaMemoryEvent) {
        const taggingEvent = this.taggingEvents.get(event.eventId);
        if (taggingEvent) {
            taggingEvent.completedAt = event.timestamp;
            taggingEvent.processingTime = event.data.processingTime;
            taggingEvent.newTopicCount = event.data.newTopicCount;
            taggingEvent.updatedTopicCount = event.data.updatedTopicCount;
            taggingEvent.newMessageCount = event.data.newMessageCount;
            taggingEvent.updatedMessageCount = event.data.updatedMessageCount;
            taggingEvent.state = event.data.state;
            taggingEvent.isRunning = false;

            // Update processing time stats
            if (event.data.processingTime) {
                this.processingTimes.push(event.data.processingTime);
                this.stats.lastProcessingTime = event.data.processingTime;
                this.stats.averageProcessingTime =
                    this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
            }

            // Update counts
            if (event.data.newTopicCount) {
                this.stats.totalNewTopics += event.data.newTopicCount;
            }
            if (event.data.newMessageCount) {
                this.stats.totalNewMessages += event.data.newMessageCount;
            }

            this.stats.completedTaggingSessions++;
            
            // Track affected items by comparing states
            if (event.data.state && taggingEvent.state) {
                // Get previous state from the start event
                const prevTopics = new Set(taggingEvent.state.topicTags ? Object.keys(taggingEvent.state.topicTags) : []);
                const prevMessages = new Set(taggingEvent.state.taggedMessages ? Object.keys(taggingEvent.state.taggedMessages) : []);
                
                // Get current state topics and messages
                const currTopics = new Set(Object.keys(event.data.state.topicTags || {}));
                const currMessages = new Set(Object.keys(event.data.state.taggedMessages || {}));
                
                // Find affected topics (new or updated)
                const affectedTopics: string[] = [];
                for (const topic of currTopics) {
                    if (!prevTopics.has(topic) || 
                        (taggingEvent.state.topicTags?.[topic]?.last_update !== event.data.state.topicTags?.[topic]?.last_update)) {
                        affectedTopics.push(topic);
                    }
                }
                
                // Find affected messages (new or updated)
                const affectedMessages: string[] = [];
                for (const msgId of currMessages) {
                    if (!prevMessages.has(msgId) || 
                        (taggingEvent.state.taggedMessages?.[msgId]?.last_update !== event.data.state.taggedMessages?.[msgId]?.last_update)) {
                        affectedMessages.push(msgId);
                    }
                }
                
                taggingEvent.affectedTopics = affectedTopics;
                taggingEvent.affectedMessages = affectedMessages;
            }
        }

        // Update current state and stats
        if (event.data.state) {
            this.currentState = event.data.state;
            
            // Count topics and messages from serialized state
            if (event.data.state.topicTags) {
                this.stats.totalTopics = Object.keys(event.data.state.topicTags).length;
            }
            
            if (event.data.state.taggedMessages) {
                this.stats.totalTaggedMessages = Object.keys(event.data.state.taggedMessages).length;
            }
        }
    }

    /**
     * Get all processed data
     */
    getProcessedData(): MetaMemoryEventData {
        return {
            events: [...this.events],
            taggingEvents: Array.from(this.taggingEvents.values()),
            currentState: this.currentState,
            stats: { ...this.stats }
        };
    }

    /**
     * Get events filtered by operation
     */
    getEventsByOperation(operation: MetaMemoryEvent['operation']): MetaMemoryEvent[] {
        return this.events.filter(e => e.operation === operation);
    }

    /**
     * Get all completed tagging sessions
     */
    getCompletedTaggingSessions(): MemoryTaggingEvent[] {
        return Array.from(this.taggingEvents.values())
            .filter(session => session.completedAt !== undefined);
    }

    /**
     * Get running tagging sessions
     */
    getRunningTaggingSessions(): MemoryTaggingEvent[] {
        return Array.from(this.taggingEvents.values())
            .filter(session => session.isRunning);
    }

    /**
     * Get the latest tagging session
     */
    getLatestTaggingSession(): MemoryTaggingEvent | undefined {
        const sessions = Array.from(this.taggingEvents.values());
        return sessions.length > 0
            ? sessions.reduce((a, b) => a.startedAt > b.startedAt ? a : b)
            : undefined;
    }

    /**
     * Get current state
     */
    getCurrentState(): SerializedMetamemoryState | undefined {
        return this.currentState;
    }

    /**
     * Get all topic tags
     */
    getTopicTags(): Map<string, TopicTagMetadata> | undefined {
        if (!this.currentState?.topicTags) return undefined;
        return new Map(Object.entries(this.currentState.topicTags));
    }

    /**
     * Get all tagged messages
     */
    getTaggedMessages(): Map<string, MessageMetadata> | undefined {
        if (!this.currentState?.taggedMessages) return undefined;
        return new Map(Object.entries(this.currentState.taggedMessages));
    }

    /**
     * Get messages by topic
     */
    getMessagesByTopic(topic: string): MessageMetadata[] {
        if (!this.currentState?.taggedMessages) return [];
        
        const messages: MessageMetadata[] = [];
        for (const metadata of Object.values(this.currentState.taggedMessages)) {
            if (metadata.topic_tags.includes(topic)) {
                messages.push(metadata);
            }
        }
        return messages;
    }

    /**
     * Get statistics
     */
    getStats(): MetaMemoryStats {
        return { ...this.stats };
    }

    /**
     * Reset the processor
     */
    reset() {
        this.events = [];
        this.taggingEvents.clear();
        this.currentState = undefined;
        this.processingTimes = [];
        this.stats = {
            totalTaggingSessions: 0,
            completedTaggingSessions: 0,
            totalTopics: 0,
            totalTaggedMessages: 0,
            totalNewTopics: 0,
            totalNewMessages: 0,
            averageProcessingTime: 0
        };
    }
}

/**
 * Create a new MetaMemory event processor instance
 */
export function createMetaMemoryEventProcessor(): MetaMemoryEventProcessor {
    return new MetaMemoryEventProcessor();
}