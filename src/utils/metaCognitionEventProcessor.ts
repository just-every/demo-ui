import type { MetaCognitionEvent, SerializedCognitionState } from '@just-every/task';

export interface MetaCognitionEventData {
    events: MetaCognitionEvent[];
    analysisEvents: CognitionAnalysisEvent[];
    currentState?: SerializedCognitionState;
    stats: MetaCognitionStats;
}

export interface CognitionAnalysisEvent {
    eventId: string;
    startedAt: number;
    completedAt?: number;
    requestCount: number;
    processingTime?: number;
    adjustments?: string[];
    injectedThoughts?: string[];
    state?: SerializedCognitionState;
    isRunning: boolean;
}

export interface MetaCognitionStats {
    totalAnalyses: number;
    completedAnalyses: number;
    totalAdjustments: number;
    totalInjectedThoughts: number;
    averageProcessingTime: number;
    lastProcessingTime?: number;
}

export class MetaCognitionEventProcessor {
    private events: MetaCognitionEvent[] = [];
    private analysisEvents: Map<string, CognitionAnalysisEvent> = new Map();
    private currentState?: SerializedCognitionState;
    private processingTimes: number[] = [];
    private stats: MetaCognitionStats = {
        totalAnalyses: 0,
        completedAnalyses: 0,
        totalAdjustments: 0,
        totalInjectedThoughts: 0,
        averageProcessingTime: 0
    };

    /**
     * Process a MetaCognition event and update internal state
     */
    processEvent(event: MetaCognitionEvent): MetaCognitionEventData {
        // Add event to history
        this.events.push(event);

        // Process based on operation type
        switch (event.operation) {
            case 'analysis_start':
                this.handleAnalysisStart(event);
                break;

            case 'analysis_complete':
                this.handleAnalysisComplete(event);
                break;
        }

        return this.getProcessedData();
    }

    private handleAnalysisStart(event: MetaCognitionEvent) {
        const analysisEvent: CognitionAnalysisEvent = {
            eventId: event.eventId,
            startedAt: event.timestamp,
            requestCount: event.data.requestCount || 0,
            state: event.data.state,
            isRunning: true
        };

        this.analysisEvents.set(event.eventId, analysisEvent);
        this.stats.totalAnalyses++;

        // Update current state
        if (event.data.state) {
            this.currentState = event.data.state;
        }
    }

    private handleAnalysisComplete(event: MetaCognitionEvent) {
        const analysisEvent = this.analysisEvents.get(event.eventId);
        if (analysisEvent) {
            analysisEvent.completedAt = event.timestamp;
            analysisEvent.processingTime = event.data.processingTime;
            analysisEvent.adjustments = event.data.adjustments;
            analysisEvent.injectedThoughts = event.data.injectedThoughts;
            analysisEvent.state = event.data.state;
            analysisEvent.isRunning = false;

            // Update processing time stats
            if (event.data.processingTime) {
                this.processingTimes.push(event.data.processingTime);
                this.stats.lastProcessingTime = event.data.processingTime;
                this.stats.averageProcessingTime =
                    this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
            }

            // Update adjustment and thought counts
            if (event.data.adjustments) {
                this.stats.totalAdjustments += event.data.adjustments.length;
            }
            if (event.data.injectedThoughts) {
                this.stats.totalInjectedThoughts += event.data.injectedThoughts.length;
            }

            this.stats.completedAnalyses++;
        }

        // Update current state
        if (event.data.state) {
            this.currentState = event.data.state;
        }
    }

    /**
     * Get all processed data
     */
    getProcessedData(): MetaCognitionEventData {
        return {
            events: [...this.events],
            analysisEvents: Array.from(this.analysisEvents.values()),
            currentState: this.currentState,
            stats: { ...this.stats }
        };
    }

    /**
     * Get events filtered by operation
     */
    getEventsByOperation(operation: MetaCognitionEvent['operation']): MetaCognitionEvent[] {
        return this.events.filter(e => e.operation === operation);
    }

    /**
     * Get all completed analyses
     */
    getCompletedAnalyses(): CognitionAnalysisEvent[] {
        return Array.from(this.analysisEvents.values())
            .filter(analysis => analysis.completedAt !== undefined);
    }

    /**
     * Get running analyses
     */
    getRunningAnalyses(): CognitionAnalysisEvent[] {
        return Array.from(this.analysisEvents.values())
            .filter(analysis => analysis.isRunning);
    }

    /**
     * Get the latest analysis
     */
    getLatestAnalysis(): CognitionAnalysisEvent | undefined {
        const analyses = Array.from(this.analysisEvents.values());
        return analyses.length > 0
            ? analyses.reduce((a, b) => a.startedAt > b.startedAt ? a : b)
            : undefined;
    }

    /**
     * Get current state
     */
    getCurrentState(): SerializedCognitionState | undefined {
        return this.currentState;
    }

    /**
     * Get statistics
     */
    getStats(): MetaCognitionStats {
        return { ...this.stats };
    }

    /**
     * Reset the processor
     */
    reset() {
        this.events = [];
        this.analysisEvents.clear();
        this.currentState = undefined;
        this.processingTimes = [];
        this.stats = {
            totalAnalyses: 0,
            completedAnalyses: 0,
            totalAdjustments: 0,
            totalInjectedThoughts: 0,
            averageProcessingTime: 0
        };
    }
}

/**
 * Create a new MetaCognition event processor instance
 */
export function createMetaCognitionEventProcessor(): MetaCognitionEventProcessor {
    return new MetaCognitionEventProcessor();
}