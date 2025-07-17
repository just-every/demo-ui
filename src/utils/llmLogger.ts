import type { EnsembleLogger } from '@just-every/ensemble';
import type { WebSocket } from 'ws';

// Local implementation of truncateLargeValues to avoid Node.js dependencies
function truncateLargeValues(obj: unknown, maxLength: number = 1000): unknown {
    if (typeof obj === 'string') {
        if (obj.startsWith('data:image/') && obj.length > maxLength) {
            return `${obj.substring(0, 100)}...[truncated ${obj.length} chars]`;
        }
        return obj.length > maxLength ? obj.substring(0, maxLength) + '...' : obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => truncateLargeValues(item, maxLength));
    }
    
    if (obj && typeof obj === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = truncateLargeValues(value, maxLength);
        }
        return result;
    }
    
    return obj;
}

export interface LLMRequestData {
    requestId: string;
    agentId: string;
    providerName: string;
    model: string;
    timestamp: Date;
    requestData: unknown;
    responseData?: unknown;
    errorData?: unknown;
    status: 'running' | 'complete' | 'error';
    duration?: number;
    tags?: string[];
}

export class RequestDemoLogger implements EnsembleLogger {
    private ws: WebSocket | null = null;
    private llmRequests = new Map<string, LLMRequestData>();
    private disconnected = false;

    constructor(ws?: WebSocket) {
        this.ws = ws || null;
    }
    
    setWS(ws: WebSocket | null) {
        this.ws = ws;
    }
    
    disconnect() {
        this.disconnected = true;
        this.ws = null;
        this.clearRequests();
    }
    
    log_llm_request(
        agentId: string,
        providerName: string,
        model: string,
        requestData: unknown,
        timestamp?: Date,
        requestId?: string,
        tags?: string[],
    ): string {
        if (this.disconnected) {
            return ''; // Return empty string for disconnected loggers
        }
        
        const time = timestamp || new Date();
        requestId = requestId || `req-${time.getTime()}-${Math.random().toString(36).substring(2, 9)}`;
        
        const llmRequest: LLMRequestData = {
            requestId,
            agentId,
            providerName,
            model,
            timestamp: time,
            requestData: truncateLargeValues(requestData),
            status: 'running',
            tags,
        };
        
        this.llmRequests.set(requestId, llmRequest);
        
        if (this.ws && this.ws.readyState === this.ws.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'llm_request',
                llmRequest,
            }));
        }
        else {
            console.warn(`Error with log_llm_request ${requestId}: WebSocket not open`);
        }
        
        return requestId;
    }

    log_llm_response(
        requestId: string | undefined,
        responseData: unknown,
        timestamp?: Date
    ): void {
        if (!requestId || this.disconnected) return;
        
        const llmRequest = this.llmRequests.get(requestId);
        if (llmRequest) {
            llmRequest.responseData = truncateLargeValues(responseData);
            llmRequest.status = 'complete';
            llmRequest.duration = (timestamp || new Date()).getTime() - llmRequest.timestamp.getTime();
            
            if (this.ws && this.ws.readyState === this.ws.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'llm_response',
                    llmRequest,
                }));
            }
            else {
                console.warn(`Error with log_llm_response ${requestId}: WebSocket not open`);
            }
        }
    }

    log_llm_error(
        requestId: string | undefined,
        errorData: unknown,
        timestamp?: Date
    ): void {
        if (!requestId || this.disconnected) return;
        
        const llmRequest = this.llmRequests.get(requestId);
        if (llmRequest) {
            llmRequest.errorData = truncateLargeValues(errorData);
            llmRequest.status = 'error';
            llmRequest.duration = (timestamp || new Date()).getTime() - llmRequest.timestamp.getTime();
            
            if (this.ws && this.ws.readyState === this.ws.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'llm_error',
                    llmRequest,
                }));
            }
            else {
                console.warn(`Error with log_llm_error ${requestId}: WebSocket not open`);
            }
        }
    }

    getAllRequests(): LLMRequestData[] {
        return Array.from(this.llmRequests.values());
    }

    getRequest(requestId: string): LLMRequestData | undefined {
        return this.llmRequests.get(requestId);
    }

    clearRequests(): void {
        this.llmRequests.clear();
    }
}

export const enableRequestDemoLogger = (
    ws?: WebSocket,
    setEnsembleLogger?: (logger: EnsembleLogger) => void
): { logger: RequestDemoLogger; disconnect: () => void } => {
    const logger = new RequestDemoLogger(ws);
    if (setEnsembleLogger) {
        setEnsembleLogger(logger);
    }
    
    const disconnect = () => {
        logger.disconnect();
    };
    
    return { logger, disconnect };
};