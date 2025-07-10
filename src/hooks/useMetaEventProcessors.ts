import { useState, useCallback, useRef, useEffect } from 'react';
import { MetaMemoryEventProcessor, MetaMemoryEventData } from '../utils/metaMemoryEventProcessor';
import { MetaCognitionEventProcessor, MetaCognitionEventData } from '../utils/metaCognitionEventProcessor';
import { useTaskEventProcessor } from './useTaskEventProcessor';
import type { MetaMemoryEvent, MetaCognitionEvent } from '@just-every/task';

export interface UseMetaMemoryProcessorOptions {
    onUpdate?: (data: MetaMemoryEventData) => void;
}

export function useMetaMemoryProcessor(options?: UseMetaMemoryProcessorOptions) {
    const processorRef = useRef<MetaMemoryEventProcessor | null>(null);
    const [data, setData] = useState<MetaMemoryEventData>({
        events: [],
        taggingEvents: [],
        currentState: undefined,
        stats: {
            totalTaggingSessions: 0,
            completedTaggingSessions: 0,
            totalTopics: 0,
            totalTaggedMessages: 0,
            totalNewTopics: 0,
            totalNewMessages: 0,
            averageProcessingTime: 0
        }
    });

    useEffect(() => {
        if (!processorRef.current) {
            processorRef.current = new MetaMemoryEventProcessor();
        }
    }, []);

    const processEvent = useCallback((event: MetaMemoryEvent) => {
        if (!processorRef.current) {
            processorRef.current = new MetaMemoryEventProcessor();
        }

        const newData = processorRef.current.processEvent(event);
        setData(newData);

        if (options?.onUpdate) {
            options.onUpdate(newData);
        }

        return newData;
    }, [options]);

    const reset = useCallback(() => {
        if (processorRef.current) {
            processorRef.current.reset();
        }
        
        const emptyData: MetaMemoryEventData = {
            events: [],
            taggingEvents: [],
            currentState: undefined,
            stats: {
                totalTaggingSessions: 0,
                completedTaggingSessions: 0,
                totalTopics: 0,
                totalTaggedMessages: 0,
                totalNewTopics: 0,
                totalNewMessages: 0,
                averageProcessingTime: 0
            }
        };
        
        setData(emptyData);

        if (options?.onUpdate) {
            options.onUpdate(emptyData);
        }
    }, [options]);

    return {
        processEvent,
        reset,
        data,
        processor: processorRef.current
    };
}

export interface UseMetaCognitionProcessorOptions {
    onUpdate?: (data: MetaCognitionEventData) => void;
}

export function useMetaCognitionProcessor(options?: UseMetaCognitionProcessorOptions) {
    const processorRef = useRef<MetaCognitionEventProcessor | null>(null);
    const [data, setData] = useState<MetaCognitionEventData>({
        events: [],
        analysisEvents: [],
        currentState: undefined,
        stats: {
            totalAnalyses: 0,
            completedAnalyses: 0,
            totalAdjustments: 0,
            totalInjectedThoughts: 0,
            averageProcessingTime: 0
        }
    });

    useEffect(() => {
        if (!processorRef.current) {
            processorRef.current = new MetaCognitionEventProcessor();
        }
    }, []);

    const processEvent = useCallback((event: MetaCognitionEvent) => {
        if (!processorRef.current) {
            processorRef.current = new MetaCognitionEventProcessor();
        }

        const newData = processorRef.current.processEvent(event);
        setData(newData);

        if (options?.onUpdate) {
            options.onUpdate(newData);
        }

        return newData;
    }, [options]);

    const reset = useCallback(() => {
        if (processorRef.current) {
            processorRef.current.reset();
        }
        
        const emptyData: MetaCognitionEventData = {
            events: [],
            analysisEvents: [],
            currentState: undefined,
            stats: {
                totalAnalyses: 0,
                completedAnalyses: 0,
                totalAdjustments: 0,
                totalInjectedThoughts: 0,
                averageProcessingTime: 0
            }
        };
        
        setData(emptyData);

        if (options?.onUpdate) {
            options.onUpdate(emptyData);
        }
    }, [options]);

    return {
        processEvent,
        reset,
        data,
        processor: processorRef.current
    };
}

/**
 * Combined hook to process all task-related events
 */
export function useTaskEventProcessors() {
    const taskProcessor = useTaskEventProcessor();
    const memoryProcessor = useMetaMemoryProcessor();
    const cognitionProcessor = useMetaCognitionProcessor();

    const processEvent = useCallback((event: any) => {
        // Route event to appropriate processor
        switch (event.type) {
            case 'metamemory_event':
                memoryProcessor.processEvent(event as MetaMemoryEvent);
                break;
                
            case 'metacognition_event':
                cognitionProcessor.processEvent(event as MetaCognitionEvent);
                break;
                
            default:
                // All other events go to task processor
                taskProcessor.processEvent(event);
                break;
        }
    }, [taskProcessor, memoryProcessor, cognitionProcessor]);

    const reset = useCallback(() => {
        taskProcessor.reset();
        memoryProcessor.reset();
        cognitionProcessor.reset();
    }, [taskProcessor, memoryProcessor, cognitionProcessor]);

    return {
        processEvent,
        reset,
        taskProcessor,
        memoryProcessor,
        cognitionProcessor,
        // Convenience accessors
        llmRequests: taskProcessor.llmRequests,
        messages: taskProcessor.messages,
        requestAgents: taskProcessor.requestAgents,
        totalCost: taskProcessor.totalCost,
        totalTokens: taskProcessor.totalTokens,
        memoryData: memoryProcessor.data,
        cognitionData: cognitionProcessor.data
    };
}