import { LLMRequestData } from '../utils/llmLogger';
import { MetaMemoryEventData } from '../utils/metaMemoryEventProcessor';
import { MetaCognitionEventData } from '../utils/metaCognitionEventProcessor';
import { ResponseOutputEvent } from '@just-every/ensemble';

export interface TaskState {
    // Task data
    messages: ResponseOutputEvent[];
    llmRequests: LLMRequestData[];
    requestAgents: Map<string, any>;
    
    // Metrics
    totalCost: number;
    totalTokens: number;
    
    // Metamemory
    memoryData: MetaMemoryEventData;
    
    // Metacognition  
    cognitionData: MetaCognitionEventData;
}