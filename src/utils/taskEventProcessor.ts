import type { 
    AgentEvent,
    ResponseOutputEvent,
    CostUpdateEvent,
    AgentExportDefinition
} from '@just-every/ensemble';
import type { 
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

export interface TaskEventProcessorState {
    llmRequests: LLMRequestData[];
    messages: ResponseOutputEvent[];
    requestAgents: Map<string, RequestAgent>;
    totalCost: number;
    totalTokens: number;
}

export interface ProcessedEventData {
    llmRequests: LLMRequestData[];
    messages: ResponseOutputEvent[];
    requestAgents: Map<string, RequestAgent>;
    totalCost: number;
    totalTokens: number;
}

export class TaskEventProcessor {
    private state: TaskEventProcessorState = {
        llmRequests: [],
        messages: [],
        requestAgents: new Map(),
        totalCost: 0,
        totalTokens: 0
    };

    /**
     * Process a WebSocket event from runTask and update the internal state
     * Returns the updated data that can be used to set React state
     */
    processEvent(event: any): ProcessedEventData {
        if (event.type === 'agent_start' || event.type === 'response_output') {
            console.log(`[TaskEventProcessor] Processing ${event.type} event:`, event);
        }
        
        switch (event.type) {
            case 'llm_request':
            case 'llm_response':
            case 'llm_error':
                this.handleLLMRequest(event.llmRequest);
                break;

            case 'task_complete':
                this.handleTaskComplete(event as TaskCompleteEvent);
                break;
                
            case 'task_fatal_error':
                this.handleTaskEvent(event as TaskFatalErrorEvent);
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
        console.log('[TaskEventProcessor] agent event:', JSON.stringify(event, null, 2));
        
        const requestId = event.request_id;
        if (!requestId) {
            console.log('[TaskEventProcessor] No request_id in agent event');
            return;
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
        console.log('[TaskEventProcessor] Stored requestAgent for requestId:', requestId, requestAgent);
    }

    private handleResponseOutput(event: ResponseOutputEvent) {
        console.log('[TaskEventProcessor] response_output event with request_id:', event.request_id);
        
        // Check if we already have this message to avoid duplication
        const messageId = event.message.id;
        if (messageId) {
            const existingMessage = this.state.messages.find(m => m.message.id === messageId);
            if (existingMessage) {
                // Message already exists, skip to avoid duplication
                console.log('[TaskEventProcessor] Message already exists, skipping:', messageId);
                return;
            }
        }
        
        // Add the response_output event directly to messages
        this.state.messages.push(event);
        console.log('[TaskEventProcessor] Added response_output message with request_id:', event.request_id);
    }

    private handleTaskComplete(event: TaskCompleteEvent) {
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

    private handleTaskEvent(event: TaskFatalErrorEvent) {
        // Create a system message for task completion
        const isError = event.type === 'task_fatal_error';
        const resultEvent: ResponseOutputEvent = {
            type: 'response_output',
            message: {
                id: `task_error_${Date.now()}`,
                type: 'message',
                content: isError 
                    ? `❌ Task failed: ${event.result || 'Unknown error'}`
                    : '✅ Task completed successfully',
                role: 'assistant',
                status: 'completed',
                timestamp: Date.now()
            },
            timestamp: new Date().toISOString()
        };

        this.state.messages.push(resultEvent);
    }

    private handleCostUpdate(event: CostUpdateEvent) {
        console.log('[TaskEventProcessor] cost_update event:', event);
        
        // Extract cost and token information from the usage
        const usage = event.usage;
        if (usage) {
            if (usage.cost !== undefined) {
                this.state.totalCost += usage.cost;
                console.log('[TaskEventProcessor] Added cost:', usage.cost, 'Total:', this.state.totalCost);
            }
            
            if (usage.total_tokens !== undefined) {
                this.state.totalTokens += usage.total_tokens;
                console.log('[TaskEventProcessor] Added tokens:', usage.total_tokens, 'Total:', this.state.totalTokens);
            }
        }
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

    /**
     * Get the current processed data
     */
    getProcessedData(): ProcessedEventData {
        return {
            llmRequests: [...this.state.llmRequests],
            messages: [...this.state.messages],
            requestAgents: new Map(this.state.requestAgents),
            totalCost: this.state.totalCost,
            totalTokens: this.state.totalTokens
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
            totalTokens: 0
        };
    }
}

/**
 * Create a new task event processor instance
 */
export function createTaskEventProcessor(): TaskEventProcessor {
    return new TaskEventProcessor();
}