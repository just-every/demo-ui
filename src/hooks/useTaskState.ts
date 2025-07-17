import { useState, useCallback, useRef, useEffect } from 'react';
import { TaskEventProcessor, type ProcessedEventData } from '../utils/taskEventProcessor';
import { MetaMemoryEventProcessor, type MetaMemoryEventData } from '../utils/metaMemoryEventProcessor';
import { MetaCognitionEventProcessor, type MetaCognitionEventData } from '../utils/metaCognitionEventProcessor';
import type { MetaMemoryEvent, MetaCognitionEvent } from '@just-every/task';
import type { LLMRequestData } from '../utils/llmLogger';
import type { ResponseOutputEvent } from '@just-every/ensemble';

export interface TaskState {
    // Core task data
    llmRequests: LLMRequestData[];
    messages: ResponseOutputEvent[];
    requestAgents: Map<string, any>;
    totalCost: number;
    totalTokens: number;
    
    // Meta-processing data
    memoryData: MetaMemoryEventData;
    cognitionData: MetaCognitionEventData;
    
    // Loading state
    isLoading: boolean;
    runningTasks: Map<string, { taskId: string; startTime: Date }>;
    runningRequests: Map<string, { requestId: string; startTime: Date }>;
    
    // Task processor for direct access when needed
    taskProcessor: TaskEventProcessor;
}

export interface UseTaskStateOptions {
    onUpdate?: (state: TaskState) => void;
}

export function useTaskState(options?: UseTaskStateOptions) {
    const taskProcessorRef = useRef<TaskEventProcessor | null>(null);
    const memoryProcessorRef = useRef<MetaMemoryEventProcessor | null>(null);
    const cognitionProcessorRef = useRef<MetaCognitionEventProcessor | null>(null);
    
    const [state, setState] = useState<TaskState>(() => ({
        llmRequests: [],
        messages: [],
        requestAgents: new Map(),
        totalCost: 0,
        totalTokens: 0,
        memoryData: {
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
        },
        cognitionData: {
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
        },
        isLoading: false,
        runningTasks: new Map(),
        runningRequests: new Map(),
        taskProcessor: null as any // Will be set in useEffect
    }));

    // Initialize processors
    useEffect(() => {
        if (!taskProcessorRef.current) {
            taskProcessorRef.current = new TaskEventProcessor();
        }
        if (!memoryProcessorRef.current) {
            memoryProcessorRef.current = new MetaMemoryEventProcessor();
        }
        if (!cognitionProcessorRef.current) {
            cognitionProcessorRef.current = new MetaCognitionEventProcessor();
        }
        
        // Update state with processor reference
        setState(prev => ({
            ...prev,
            taskProcessor: taskProcessorRef.current!
        }));
    }, []);

    const updateState = useCallback(() => {
        if (!taskProcessorRef.current || !memoryProcessorRef.current || !cognitionProcessorRef.current) {
            return;
        }

        const taskData = taskProcessorRef.current.getProcessedData();
        const memoryData = memoryProcessorRef.current.getProcessedData();
        const cognitionData = cognitionProcessorRef.current.getProcessedData();

        const newState: TaskState = {
            ...taskData,
            memoryData,
            cognitionData,
            taskProcessor: taskProcessorRef.current
        };

        setState(newState);
        
        if (options?.onUpdate) {
            options.onUpdate(newState);
        }
    }, [options]);

    const processEvent = useCallback((event: any) => {
        if (!taskProcessorRef.current || !memoryProcessorRef.current || !cognitionProcessorRef.current) {
            return;
        }

        // Route event to appropriate processor
        switch (event.type) {
            case 'metamemory_event':
                memoryProcessorRef.current.processEvent(event as MetaMemoryEvent);
                break;
                
            case 'metacognition_event':
                cognitionProcessorRef.current.processEvent(event as MetaCognitionEvent);
                break;
                
            default:
                // All other events go to task processor
                taskProcessorRef.current.processEvent(event);
                break;
        }

        updateState();
    }, [updateState]);

    const reset = useCallback(() => {
        if (taskProcessorRef.current) {
            taskProcessorRef.current.reset();
        }
        if (memoryProcessorRef.current) {
            memoryProcessorRef.current.reset();
        }
        if (cognitionProcessorRef.current) {
            cognitionProcessorRef.current.reset();
        }
        
        updateState();
    }, [updateState]);

    const addUserMessage = useCallback((content: string) => {
        if (!taskProcessorRef.current) {
            return;
        }
        
        taskProcessorRef.current.addUserMessage(content);
        updateState();
    }, [updateState]);

    return {
        state,
        processEvent,
        reset,
        addUserMessage
    };
}