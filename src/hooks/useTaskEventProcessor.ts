import { useState, useCallback, useRef, useEffect } from 'react';
import { TaskEventProcessor, ProcessedEventData } from '../utils/taskEventProcessor';
import type { LLMRequestData } from '../utils/llmLogger';

export interface UseTaskEventProcessorOptions {
    onLLMRequestsUpdate?: (requests: LLMRequestData[]) => void;
    onMessagesUpdate?: (messages: ProcessedEventData['messages']) => void;
}

export function useTaskEventProcessor(options?: UseTaskEventProcessorOptions) {
    const processorRef = useRef<TaskEventProcessor | null>(null);
    const [processedData, setProcessedData] = useState<ProcessedEventData>({
        llmRequests: [],
        messages: [],
        requestAgents: new Map(),
        totalCost: 0,
        totalTokens: 0,
        isLoading: false,
        runningTasks: new Map(),
        runningRequests: new Map()
    });

    // Initialize processor
    useEffect(() => {
        if (!processorRef.current) {
            processorRef.current = new TaskEventProcessor();
        }
    }, []);

    // Process an event
    const processEvent = useCallback((
        event: any
    ) => {
        if (!processorRef.current) {
            processorRef.current = new TaskEventProcessor();
        }

        const newData = processorRef.current.processEvent(event);
        setProcessedData(newData);

        // Call optional callbacks
        if (options?.onLLMRequestsUpdate) {
            options.onLLMRequestsUpdate(newData.llmRequests);
        }
        if (options?.onMessagesUpdate) {
            options.onMessagesUpdate(newData.messages);
        }

        return newData;
    }, [options]);

    // Add a user message
    const addUserMessage = useCallback((content: string) => {
        if (!processorRef.current) {
            processorRef.current = new TaskEventProcessor();
        }

        const newData = processorRef.current.addUserMessage(content);
        setProcessedData(newData);

        // Call optional callbacks
        if (options?.onMessagesUpdate) {
            options.onMessagesUpdate(newData.messages);
        }

        return newData;
    }, [options]);

    // Reset the processor
    const reset = useCallback(() => {
        if (processorRef.current) {
            processorRef.current.reset();
        }
        
        const emptyData: ProcessedEventData = {
            llmRequests: [],
            messages: [],
            requestAgents: new Map(),
            totalCost: 0,
            totalTokens: 0,
            isLoading: false,
            runningTasks: new Map(),
            runningRequests: new Map()
        };
        
        setProcessedData(emptyData);

        // Call optional callbacks
        if (options?.onLLMRequestsUpdate) {
            options.onLLMRequestsUpdate([]);
        }
        if (options?.onMessagesUpdate) {
            options.onMessagesUpdate([]);
        }
    }, [options]);

    return {
        processEvent,
        addUserMessage,
        reset,
        llmRequests: processedData.llmRequests,
        messages: processedData.messages,
        requestAgents: processedData.requestAgents,
        totalCost: processedData.totalCost,
        totalTokens: processedData.totalTokens,
        isLoading: processedData.isLoading,
        runningTasks: processedData.runningTasks,
        runningRequests: processedData.runningRequests,
        processedData
    };
}