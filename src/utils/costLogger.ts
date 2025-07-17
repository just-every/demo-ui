import type { ModelUsage } from '@just-every/ensemble';
import { costTracker } from '@just-every/ensemble';
import type { WebSocket } from 'ws';

export interface CostData {
    model: string;
    cost: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cachedTokens?: number;
    imageCount?: number;
    timestamp: Date;
}

export class CostDemoLogger {
    private ws: WebSocket | null = null;
    private costHistory: CostData[] = [];
    private costByModel = new Map<string, { totalCost: number; usageCount: number }>();
    private costCallback: ((usage: ModelUsage) => void) | null = null;
    private disconnected = false;

    constructor(ws?: WebSocket) {
        this.ws = ws || null;
        this.setupCostTracking();
    }

    setWS(ws: WebSocket | null) {
        this.ws = ws;
    }

    disconnect() {
        this.disconnected = true;
        this.ws = null;
        // Note: costTracker doesn't provide a way to unsubscribe callbacks
        // so we just use the disconnected flag to prevent processing
        this.clearHistory();
    }

    private setupCostTracking() {
        // Subscribe to cost tracker's usage updates
        this.costCallback = (usage: ModelUsage) => {
            if (this.disconnected) return;

            const costData: CostData = {
                model: usage.model || 'unknown',
                cost: usage.cost || 0,
                inputTokens: usage.input_tokens || 0,
                outputTokens: usage.output_tokens || 0,
                totalTokens: usage.total_tokens || 0,
                cachedTokens: usage.cached_tokens,
                imageCount: usage.image_count,
                timestamp: usage.timestamp || new Date(),
            };

            // Update local tracking
            this.costHistory.push(costData);
            this.updateModelCosts(costData);

            // Send to WebSocket if connected
            if (this.ws && this.ws.readyState === this.ws.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'cost_update',
                    usage: costData,
                }));
            }
        };
        
        // Register the callback with costTracker
        costTracker.onAddUsage(this.costCallback);
    }

    private updateModelCosts(costData: CostData) {
        const modelStats = this.costByModel.get(costData.model) || { totalCost: 0, usageCount: 0 };
        modelStats.totalCost += costData.cost;
        modelStats.usageCount += 1;
        this.costByModel.set(costData.model, modelStats);
    }

    getCostHistory(): CostData[] {
        return [...this.costHistory];
    }

    getCostByModel(): Map<string, { totalCost: number; usageCount: number }> {
        return new Map(this.costByModel);
    }

    getTotalCost(): number {
        return Array.from(this.costByModel.values()).reduce(
            (total, stats) => total + stats.totalCost,
            0
        );
    }

    clearHistory(): void {
        this.costHistory = [];
        this.costByModel.clear();
    }
}

export const enableCostDemoLogger = (
    ws?: WebSocket
): { logger: CostDemoLogger; disconnect: () => void } => {
    const logger = new CostDemoLogger(ws);

    const disconnect = () => {
        logger.disconnect();
    };

    return { logger, disconnect };
};