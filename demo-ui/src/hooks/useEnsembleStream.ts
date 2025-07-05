import { useState, useCallback, useRef } from 'react';
import { MessageData } from '../components/Message';
import { WebSocketMessage } from './useWebSocketMessage';

export interface EnsembleStreamState {
    messages: MessageData[];
    isStreaming: boolean;
    currentMessage: MessageData | null;
    error: string | null;
    cost: number;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}

export interface EnsembleStreamOptions {
    onMessageComplete?: (message: MessageData) => void;
    onError?: (error: string) => void;
    onCostUpdate?: (cost: number, usage: any) => void;
    autoAddMessages?: boolean;
}

export const useEnsembleStream = (options: EnsembleStreamOptions = {}) => {
    const {
        onMessageComplete,
        onError,
        onCostUpdate,
        autoAddMessages = true
    } = options;

    const [state, setState] = useState<EnsembleStreamState>({
        messages: [],
        isStreaming: false,
        currentMessage: null,
        error: null,
        cost: 0,
        usage: {
            input_tokens: 0,
            output_tokens: 0
        }
    });

    const currentMessageRef = useRef<MessageData | null>(null);

    const handleWebSocketMessage = useCallback((data: WebSocketMessage) => {
        setState(prevState => {
            const newState = { ...prevState };
            
            switch (data.type) {
                case 'stream_start': {
                    const newMessage: MessageData = {
                        role: 'assistant',
                        content: '',
                        model: data.model,
                        modelClass: data.modelClass,
                        tools: [],
                        streaming: true,
                        timestamp: Date.now()
                    };
                    currentMessageRef.current = newMessage;
                    newState.currentMessage = newMessage;
                    newState.isStreaming = true;
                    newState.error = null;
                    break;
                }

                case 'message_delta':
                    if (currentMessageRef.current) {
                        if (data.thinking_content) {
                            currentMessageRef.current.thinking_content = data.thinking_content;
                        }
                        if (data.content) {
                            currentMessageRef.current.content += data.content;
                        }
                        newState.currentMessage = { ...currentMessageRef.current };
                    }
                    break;

                case 'tool_start':
                    if (currentMessageRef.current && data.tool) {
                        if (!currentMessageRef.current.tools) {
                            currentMessageRef.current.tools = [];
                        }
                        currentMessageRef.current.tools.push({
                            id: data.tool.id,
                            function: {
                                name: data.tool.function.name,
                                arguments: data.tool.function.arguments
                            }
                        });
                        newState.currentMessage = { ...currentMessageRef.current };
                    }
                    break;

                case 'tool_done':
                    if (currentMessageRef.current && data.tool && currentMessageRef.current.tools) {
                        const toolIndex = currentMessageRef.current.tools.findIndex(
                            t => t.id === data.tool.id
                        );
                        if (toolIndex >= 0) {
                            currentMessageRef.current.tools[toolIndex].result = {
                                output: data.tool.result?.output,
                                error: data.tool.result?.error
                            };
                            newState.currentMessage = { ...currentMessageRef.current };
                        }
                    }
                    break;

                case 'stream_end':
                    if (currentMessageRef.current) {
                        currentMessageRef.current.streaming = false;
                        const completedMessage = { ...currentMessageRef.current };
                        
                        if (autoAddMessages) {
                            newState.messages = [...prevState.messages, completedMessage];
                        }
                        
                        if (onMessageComplete) {
                            onMessageComplete(completedMessage);
                        }
                    }
                    newState.isStreaming = false;
                    newState.currentMessage = null;
                    currentMessageRef.current = null;
                    break;

                case 'cost_update':
                    newState.cost = data.cost || 0;
                    newState.usage = {
                        input_tokens: data.input_tokens || 0,
                        output_tokens: data.output_tokens || 0
                    };
                    if (onCostUpdate) {
                        onCostUpdate(newState.cost, newState.usage);
                    }
                    break;

                case 'error':
                    newState.error = data.error || 'Unknown error occurred';
                    newState.isStreaming = false;
                    newState.currentMessage = null;
                    currentMessageRef.current = null;
                    if (onError && newState.error) {
                        onError(newState.error);
                    }
                    break;
            }
            
            return newState;
        });
    }, [autoAddMessages, onMessageComplete, onError, onCostUpdate]);

    const addUserMessage = useCallback((content: string) => {
        const userMessage: MessageData = {
            role: 'user',
            content,
            timestamp: Date.now()
        };
        
        setState(prevState => ({
            ...prevState,
            messages: [...prevState.messages, userMessage]
        }));
        
        return userMessage;
    }, []);

    const clearMessages = useCallback(() => {
        setState(prevState => ({
            ...prevState,
            messages: [],
            currentMessage: null,
            error: null
        }));
        currentMessageRef.current = null;
    }, []);

    const resetError = useCallback(() => {
        setState(prevState => ({
            ...prevState,
            error: null
        }));
    }, []);

    return {
        ...state,
        handleWebSocketMessage,
        addUserMessage,
        clearMessages,
        resetError
    };
};