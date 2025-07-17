import type { 
    AgentEvent,
    ResponseOutputEvent,
    CostUpdateEvent,
    AgentExportDefinition
} from '@just-every/ensemble';
import type { 
    TaskStartEvent,
    TaskCompleteEvent, 
    TaskFatalErrorEvent,
} from '@just-every/task';
import type { LLMRequestData } from './llmLogger';

// Track request metadata for agent_start events
export interface RequestAgent {
    requestId: string;
    startTime: Date;
    agent?: AgentExportDefinition;
    input?: string;
    status?: string;
    request_cost?: number;
    request_duration?: number;
    duration_with_tools?: number;
}

// Track partial messages during streaming
export interface PartialMessage {
    id: string;
    type: 'message' | 'thinking' | 'function_call' | 'function_call_output';
    role: string;
    content: Array<{ order: number; text: string }>;
    thinking_content?: Array<{ order: number; text: string }>;
    tool?: {
        id?: string;
        name: string;
        arguments?: string;
        output?: Array<{ order: number; text: string }>;
    };
    startTime: Date;
    request_id?: string;
}

export interface TaskEventProcessorState {
    llmRequests: LLMRequestData[];
    messages: ResponseOutputEvent[];
    requestAgents: Map<string, RequestAgent>;
    totalCost: number;
    totalTokens: number;
    // Loading state tracking
    runningTasks: Map<string, { taskId: string; startTime: Date }>;
    runningRequests: Map<string, { requestId: string; startTime: Date }>;
    isLoading: boolean;
    // Partial messages during streaming
    partialMessages: Map<string, PartialMessage>;
}

export interface ProcessedEventData {
    llmRequests: LLMRequestData[];
    messages: ResponseOutputEvent[];
    requestAgents: Map<string, RequestAgent>;
    totalCost: number;
    totalTokens: number;
    // Loading state
    isLoading: boolean;
    runningTasks: Map<string, { taskId: string; startTime: Date }>;
    runningRequests: Map<string, { requestId: string; startTime: Date }>;
}

export class TaskEventProcessor {
    private state: TaskEventProcessorState = {
        llmRequests: [],
        messages: [],
        requestAgents: new Map(),
        totalCost: 0,
        totalTokens: 0,
        runningTasks: new Map(),
        runningRequests: new Map(),
        isLoading: false,
        partialMessages: new Map()
    };

    /**
     * Process a WebSocket event from runTask and update the internal state
     * Returns the updated data that can be used to set React state
     */
    processEvent(event: any): ProcessedEventData {
        
        switch (event.type) {
            case 'llm_request':
            case 'llm_response':
            case 'llm_error':
                this.handleLLMRequest(event.llmRequest);
                break;

            case 'task_start':
                this.handleTaskStart(event as TaskStartEvent);
                break;

            case 'task_complete':
                this.handleTaskComplete(event as TaskCompleteEvent);
                break;
                
            case 'task_fatal_error':
                this.handleTaskFatalError(event as TaskFatalErrorEvent);
                break;

            case 'metamemory_event':
            case 'metacognition_event':
                // Skip these events as they are handled by their own processors
                break;

            case 'agent_start':
            case 'agent_status':
            case 'agent_done':
                this.handleAgentEvent(event as AgentEvent);
                break;
                
            case 'response_output':
                // response_output contains the complete assistant message
                if (event.message) {
                    this.handleResponseOutput(event as ResponseOutputEvent);
                }
                break;
                
            case 'cost_update':
                this.handleCostUpdate(event as CostUpdateEvent);
                break;
                
            case 'message_start':
                this.handleMessageStart(event);
                break;
                
            case 'message_delta':
                this.handleMessageDelta(event);
                break;
                
            case 'tool_start':
                this.handleToolStart(event);
                break;
                
            case 'tool_delta':
                this.handleToolDelta(event);
                break;
        }
        
        return this.getProcessedData();
    }

    private handleLLMRequest(llmRequest: LLMRequestData) {
        // Handle different ID formats
        if (!llmRequest.requestId) return;
        
        const existingIndex = this.state.llmRequests.findIndex(r => 
            (r.requestId === llmRequest.requestId)
        );
        
        if (existingIndex >= 0) {
            // Update existing request
            this.state.llmRequests[existingIndex] = {
                ...this.state.llmRequests[existingIndex],
                ...llmRequest,
            };
        } else {
            // Add new request with normalized ID
            const newRequest: LLMRequestData = {
                ...llmRequest,
            };
            this.state.llmRequests.unshift(newRequest);
        }
    }

    private handleAgentEvent(event: AgentEvent) {
        const requestId = event.request_id;
        if (!requestId) {

            return;
        }
        
        // Handle agent_start - track as running
        if (event.type === 'agent_start') {
            // Only track if there's no active task
            if (this.state.runningTasks.size === 0) {
                this.state.runningRequests.set(requestId, { 
                    requestId, 
                    startTime: new Date() 
                });
                this.updateLoadingState();
            }
        }
        
        // Handle agent_done - remove from running
        if (event.type === 'agent_done') {
            this.state.runningRequests.delete(requestId);
            this.updateLoadingState();
        }
        
        // Create metadata for this request
        const requestAgent: RequestAgent = this.state.requestAgents.get(requestId) || {
            requestId,
            startTime: new Date()
        };

        if (event.agent) {
            requestAgent.agent = event.agent;
        }
        if ('input' in event) {
            requestAgent.input = event.input;
        }
        if ('status' in event) {
            requestAgent.status = event.status;
        }
        if ('request_cost' in event) {
            requestAgent.request_cost = event.request_cost;
        }
        if ('request_duration' in event) {
            requestAgent.request_duration = event.request_duration;
        }
        if ('duration_with_tools' in event) {
            requestAgent.duration_with_tools = event.duration_with_tools;
        }
        
        this.state.requestAgents.set(requestId, requestAgent);

    }

    private handleResponseOutput(event: ResponseOutputEvent) {

        const messageId = event.message.id;
        
        // Check if this is replacing a partial message
        if (messageId && this.state.partialMessages.has(messageId)) {
            // Find and replace the placeholder message
            const messageIndex = this.state.messages.findIndex(m => m.message.id === messageId);
            if (messageIndex !== -1) {
                // Replace the placeholder with the final message
                this.state.messages[messageIndex] = event;

            } else {
                // If not found, add it
                this.state.messages.push(event);
            }
            
            // Clean up the partial message
            this.state.partialMessages.delete(messageId);
            return;
        }
        
        // Check if we already have this message to avoid duplication
        if (messageId) {
            const existingMessage = this.state.messages.find(m => m.message.id === messageId);
            if (existingMessage) {
                // Message already exists, skip to avoid duplication

                return;
            }
        }
        
        // Special handling for tool call results
        if (event.message.type === 'function_call_output') {
            const funcResult = event.message as any;
            const callId = funcResult.call_id || funcResult.id;
            
            // Check if this is replacing a partial tool result
            const partialToolId = `tool_result_${callId}`;
            if (this.state.partialMessages.has(partialToolId)) {
                // Clean up the partial message
                this.state.partialMessages.delete(partialToolId);
            }
            
            // Find the corresponding tool call
            const toolCallIndex = this.state.messages.findIndex(m => {
                if (m.message.type === 'function_call') {
                    const funcCall = m.message as any;
                    return (funcCall.call_id || funcCall.id) === callId;
                }
                return false;
            });
            
            if (toolCallIndex !== -1) {
                // Insert the result right after the tool call

                this.state.messages.splice(toolCallIndex + 1, 0, event);
                return;
            }
        }
        
        // Add the response_output event directly to messages
        this.state.messages.push(event);

    }

    private handleTaskStart(event: TaskStartEvent) {

        const taskId = event.task_id;
        if (!taskId) {

            return;
        }
        
        // Track task as running
        this.state.runningTasks.set(taskId, { 
            taskId, 
            startTime: new Date() 
        });
        
        // Clear any running requests when a task starts
        this.state.runningRequests.clear();
        
        this.updateLoadingState();
    }

    private handleTaskComplete(event: TaskCompleteEvent) {

        // Remove from running tasks
        if (event.task_id) {
            this.state.runningTasks.delete(event.task_id);
            this.updateLoadingState();
        }
        
        // Add the result as a user message if it exists
        if (event.result) {
            const resultEvent: ResponseOutputEvent = {
                type: 'response_output',
                message: {
                    id: `task_complete_${Date.now()}`,
                    type: 'message',
                    content: event.result,
                    role: 'assistant',
                    status: 'completed',
                    timestamp: Date.now()
                },
                timestamp: new Date().toISOString()
            };
            this.state.messages.push(resultEvent);
        }
    }

    private handleTaskFatalError(event: TaskFatalErrorEvent) {

        // Remove from running tasks
        if (event.task_id) {
            this.state.runningTasks.delete(event.task_id);
            this.updateLoadingState();
        }
        
        // Create a system message for task error
        const resultEvent: ResponseOutputEvent = {
            type: 'response_output',
            message: {
                id: `task_error_${Date.now()}`,
                type: 'message',
                content: `❌ Task failed: ${event.result || 'Unknown error'}`,
                role: 'assistant',
                status: 'completed',
                timestamp: Date.now()
            },
            timestamp: new Date().toISOString()
        };

        this.state.messages.push(resultEvent);
    }

    private handleCostUpdate(event: CostUpdateEvent) {

        // Extract cost and token information from the usage
        const usage = event.usage;
        if (usage) {
            if (usage.cost !== undefined) {
                this.state.totalCost += usage.cost;

            }
            
            if (usage.total_tokens !== undefined) {
                this.state.totalTokens += usage.total_tokens;

            }
        }
    }

    private handleMessageStart(event: any) {

        const messageId = event.message_id || event.message?.id || event.id || `partial_${Date.now()}`;
        const requestId = event.request_id;
        
        // Create a new partial message
        const partialMessage: PartialMessage = {
            id: messageId,
            type: event.message?.type || 'message',
            role: event.message?.role || 'assistant',
            content: [],
            startTime: new Date(),
            request_id: requestId
        };
        
        // If it's a thinking message, initialize thinking_content
        if (partialMessage.type === 'thinking') {
            partialMessage.thinking_content = [];
        }
        
        this.state.partialMessages.set(messageId, partialMessage);

        // Add a placeholder message to the messages array
        const placeholderMessage: any = {
            id: messageId,
            type: partialMessage.type,
            role: partialMessage.role,
            status: 'in_progress',
            timestamp: Date.now()
        };
        
        // Add content based on message type
        if (partialMessage.type === 'thinking' || partialMessage.type === 'message') {
            placeholderMessage.content = '';
        }
        
        const placeholderEvent: ResponseOutputEvent = {
            type: 'response_output',
            message: placeholderMessage,
            request_id: requestId,
            timestamp: new Date().toISOString()
        };
        
        this.state.messages.push(placeholderEvent);

    }

    private handleMessageDelta(event: any) {
                const messageId = event.message_id;
        const content = event.content || '';
        const thinkingContent = event.thinking_content || '';
        const order = event.order || 0;
        
        if (!messageId) {

            return;
        }
        
        let partialMessage = this.state.partialMessages.get(messageId);
        if (!partialMessage) {

            // Create a partial message on the fly
            const requestId = event.request_id;
            const isThinking = !!thinkingContent;
            
            partialMessage = {
                id: messageId,
                type: isThinking ? 'thinking' : 'message',
                role: 'assistant',
                content: [],
                startTime: new Date(),
                request_id: requestId
            };
            
            if (isThinking) {
                partialMessage.thinking_content = [];
            }
            
            this.state.partialMessages.set(messageId, partialMessage);

            // Add placeholder to messages array
            const placeholderMessage: any = {
                id: messageId,
                type: partialMessage.type,
                role: partialMessage.role,
                status: 'in_progress',
                timestamp: Date.now()
            };
            
            if (partialMessage.type === 'thinking' || partialMessage.type === 'message') {
                placeholderMessage.content = '';
            }
            
            const placeholderEvent: ResponseOutputEvent = {
                type: 'response_output',
                message: placeholderMessage,
                request_id: requestId,
                timestamp: new Date().toISOString()
            };
            
            this.state.messages.push(placeholderEvent);

        }
        
        // Add content to the appropriate array
        if (content && partialMessage.type !== 'thinking') {
            partialMessage.content.push({ order, text: content });

        }
        
        if (thinkingContent || (content && partialMessage.type === 'thinking')) {
            if (!partialMessage.thinking_content) {
                partialMessage.thinking_content = [];
            }
            partialMessage.thinking_content.push({ 
                order, 
                text: thinkingContent || content 
            });
        }
        
        // Update the placeholder message in the messages array
        const messageIndex = this.state.messages.findIndex(m => m.message.id === messageId);
        if (messageIndex !== -1) {
            const sortedContent = this.sortAndJoinContent(partialMessage.content);
            const sortedThinkingContent = partialMessage.thinking_content 
                ? this.sortAndJoinContent(partialMessage.thinking_content)
                : '';
            
            const updatedMessage = { ...this.state.messages[messageIndex].message } as any;
            
            if (partialMessage.type === 'thinking') {
                updatedMessage.content = sortedThinkingContent;
            } else if (partialMessage.type === 'message') {
                updatedMessage.content = sortedContent;
            }
            
            updatedMessage.status = 'in_progress';
            
            this.state.messages[messageIndex] = {
                ...this.state.messages[messageIndex],
                message: updatedMessage
            };

        } else {
            // Message not found in array - will be added when response_output arrives
        }
    }

    private handleToolStart(event: any) {

        const toolId = event.tool_call?.id || `tool_${Date.now()}`;
        const requestId = event.request_id;
        
        // Create a new partial message for the tool
        const partialMessage: PartialMessage = {
            id: toolId,
            type: 'function_call',
            role: 'assistant',
            content: [],
            tool: {
                id: toolId,
                name: event.tool_call?.function?.name || 'unknown',
                arguments: event.tool_call?.function?.arguments || '',
                output: []
            },
            startTime: new Date(),
            request_id: requestId
        };
        
        this.state.partialMessages.set(toolId, partialMessage);
        
        // Add a placeholder tool call message
        const placeholderEvent: ResponseOutputEvent = {
            type: 'response_output',
            message: {
                id: toolId,
                type: 'function_call',
                name: partialMessage.tool?.name || 'unknown',
                arguments: partialMessage.tool?.arguments || '',
                call_id: toolId,
                status: 'in_progress',
                timestamp: Date.now()
            } as any,
            request_id: requestId,
            timestamp: new Date().toISOString()
        };
        
        this.state.messages.push(placeholderEvent);

    }

    private handleToolDelta(event: any) {
                const toolId = event.tool_call?.id;
        const partialArguments = event.tool_call?.function?._partialArguments || '';
        
        if (!toolId) {

            return;
        }
        
        const partialMessage = this.state.partialMessages.get(toolId);
        if (!partialMessage || !partialMessage.tool) {

            return;
        }
        
        // Update partial arguments for the tool
        if (partialMessage.tool) {
            // For tool_delta, we're getting partial arguments being built up
            partialMessage.tool.arguments = partialArguments;

        }
        
        // For now, we'll update the tool result when we get the final output
        // The UI will show the tool is running via the in_progress status
    }

    private sortAndJoinContent(content: Array<{ order: number; text: string }>): string {
        return content
            .sort((a, b) => a.order - b.order)
            .map(c => c.text)
            .join('');
    }

    /**
     * Add a user message to the conversation
     */
    addUserMessage(content: string) {
        const userEvent: ResponseOutputEvent = {
            type: 'response_output',
            message: {
                id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'message',
                content,
                role: 'user',
                status: 'completed',
                timestamp: Date.now()
            },
            timestamp: new Date().toISOString()
        };
        
        this.state.messages.push(userEvent);
        return this.getProcessedData();
    }

    private updateLoadingState() {
        // Loading is true if there are any running tasks or requests
        this.state.isLoading = this.state.runningTasks.size > 0 || this.state.runningRequests.size > 0;

    }

    /**
     * Get the current processed data
     */
    getProcessedData(): ProcessedEventData {
        return {
            llmRequests: [...this.state.llmRequests],
            messages: [...this.state.messages],
            requestAgents: new Map(this.state.requestAgents),
            totalCost: this.state.totalCost,
            totalTokens: this.state.totalTokens,
            isLoading: this.state.isLoading,
            runningTasks: new Map(this.state.runningTasks),
            runningRequests: new Map(this.state.runningRequests)
        };
    }

    /**
     * Reset the processor state
     */
    reset() {
        this.state = {
            llmRequests: [],
            messages: [],
            requestAgents: new Map(),
            totalCost: 0,
            totalTokens: 0,
            runningTasks: new Map(),
            runningRequests: new Map(),
            isLoading: false,
            partialMessages: new Map()
        };
    }
}

/**
 * Create a new task event processor instance
 */
export function createTaskEventProcessor(): TaskEventProcessor {
    return new TaskEventProcessor();
}