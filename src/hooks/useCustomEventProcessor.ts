import { useState, useCallback, useRef, useEffect } from 'react';
import { 
    CustomEventProcessor, 
    CustomEvent, 
    CustomEventProcessorOptions,
    createCustomEventProcessor 
} from '../utils/customEventProcessor';

export interface UseCustomEventProcessorReturn<T> {
    processEvent: (event: CustomEvent) => void;
    state: T;
    events: CustomEvent[];
    latest: CustomEvent | null;
    latestBySubtype: Map<string, CustomEvent>;
    reset: () => void;
}

/**
 * React hook for custom event processing
 * @template T The type of the state managed by the processor
 */
export function useCustomEventProcessor<T = any>(
    options: CustomEventProcessorOptions<T>
): UseCustomEventProcessorReturn<T> {
    const processorRef = useRef<CustomEventProcessor<T> | null>(null);
    const [data, setData] = useState(() => {
        const processor = createCustomEventProcessor<T>(options);
        processorRef.current = processor;
        return processor.getProcessedData();
    });

    // Update processor if options change
    useEffect(() => {
        if (!processorRef.current) {
            processorRef.current = createCustomEventProcessor<T>(options);
            setData(processorRef.current.getProcessedData());
        }
    }, [options]);

    const processEvent = useCallback((event: CustomEvent) => {
        if (!processorRef.current) {
            processorRef.current = createCustomEventProcessor<T>(options);
        }

        const newData = processorRef.current.processEvent(event);
        setData(newData);
    }, [options]);

    const reset = useCallback(() => {
        if (processorRef.current) {
            processorRef.current.reset();
            setData(processorRef.current.getProcessedData());
        }
    }, []);

    return {
        processEvent,
        state: data.state,
        events: data.events,
        latest: data.latest,
        latestBySubtype: data.latestBySubtype,
        reset
    };
}

/**
 * Hook for multiple custom event processors
 */
export function useMultipleCustomEventProcessors(
    configs: Record<string, CustomEventProcessorOptions>
): {
    processEvent: (event: CustomEvent) => void;
    processors: Record<string, UseCustomEventProcessorReturn<any>>;
    reset: () => void;
    resetProcessor: (key: string) => void;
} {
    const [processorKeys] = useState(() => Object.keys(configs));
    const processors: Record<string, UseCustomEventProcessorReturn<any>> = {};

    // Create a processor for each config
    processorKeys.forEach(key => {
        // eslint-disable-next-line
        processors[key] = useCustomEventProcessor(configs[key]);
    });

    const processEvent = useCallback((event: CustomEvent) => {
        // Route event to all processors (they'll filter internally)
        Object.values(processors).forEach(processor => {
            processor.processEvent(event);
        });
    }, [processors]);

    const reset = useCallback(() => {
        Object.values(processors).forEach(processor => {
            processor.reset();
        });
    }, [processors]);

    const resetProcessor = useCallback((key: string) => {
        if (processors[key]) {
            processors[key].reset();
        }
    }, [processors]);

    return {
        processEvent,
        processors,
        reset,
        resetProcessor
    };
}

/**
 * Example: Image gallery hook
 */
export function useImageGallery() {
    return useCustomEventProcessor<{
        images: Array<{ url: string; prompt: string; timestamp: number }>;
        latestImage: { url: string; prompt: string } | null;
    }>({
        eventType: 'image_generated',
        maxHistory: 50,
        initialState: {
            images: [],
            latestImage: null
        },
        reducer: (state, event) => ({
            images: [...state.images, { ...event.data, timestamp: event.timestamp }],
            latestImage: event.data
        })
    });
}

/**
 * Example: Design iterations hook
 */
export function useDesignIterations() {
    return useCustomEventProcessor<{
        iterations: Array<{
            version: number;
            description: string;
            imageUrl?: string;
            feedback?: string;
            timestamp: number;
        }>;
        currentVersion: number;
        latestFeedback?: string;
    }>({
        eventType: 'design_iteration',
        subtypes: ['new_version', 'feedback', 'approval'],
        initialState: {
            iterations: [],
            currentVersion: 0
        },
        reducer: (state, event) => {
            switch (event.subtype) {
                case 'new_version':
                    return {
                        ...state,
                        iterations: [...state.iterations, { 
                            ...event.data, 
                            timestamp: event.timestamp 
                        }],
                        currentVersion: event.data.version
                    };
                case 'feedback':
                    return {
                        ...state,
                        latestFeedback: event.data.feedback
                    };
                default:
                    return state;
            }
        }
    });
}