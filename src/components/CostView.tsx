import React from 'react';
import { GlassCard } from './GlassCard';
import { formatCurrency } from '../utils/formatters';
import type { CostData } from '../utils/costLogger';
import './CostView.scss';

export interface CostViewProps {
    costHistory: CostData[];
    className?: string;
}

interface ModelCostSummary {
    model: string;
    totalCost: number;
    usageCount: number;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
}

export const CostView: React.FC<CostViewProps> = ({ costHistory, className = '' }) => {
    // Calculate cost summaries by model
    const modelSummaries = React.useMemo(() => {
        const summaryMap = new Map<string, ModelCostSummary>();
        
        costHistory.forEach(cost => {
            const existing = summaryMap.get(cost.model) || {
                model: cost.model,
                totalCost: 0,
                usageCount: 0,
                inputTokens: 0,
                outputTokens: 0,
                cachedTokens: 0,
            };
            
            existing.totalCost += cost.cost;
            existing.usageCount += 1;
            existing.inputTokens += cost.inputTokens;
            existing.outputTokens += cost.outputTokens;
            existing.cachedTokens += cost.cachedTokens || 0;
            
            summaryMap.set(cost.model, existing);
        });
        
        return Array.from(summaryMap.values()).sort((a, b) => b.totalCost - a.totalCost);
    }, [costHistory]);
    
    const totalCost = modelSummaries.reduce((sum, model) => sum + model.totalCost, 0);
    const totalUsage = modelSummaries.reduce((sum, model) => sum + model.usageCount, 0);
    
    const formatModelName = (model: string) => {
        // Clean up model names for display
        return model
            .replace(/^(openai\/|anthropic\/|google\/)/, '')
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };
    
    return (
        <GlassCard className={`cost-view ${className}`}>
            <div className="cost-view-header">
                <h3>Cost Breakdown</h3>
                <div className="cost-view-total">
                    <span className="label">Total:</span>
                    <span className="value">{formatCurrency(totalCost)}</span>
                </div>
            </div>
            
            <div className="cost-view-stats">
                <div className="stat">
                    <span className="stat-label">Total Requests</span>
                    <span className="stat-value">{totalUsage}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Models Used</span>
                    <span className="stat-value">{modelSummaries.length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Avg Cost/Request</span>
                    <span className="stat-value">
                        {totalUsage > 0 ? formatCurrency(totalCost / totalUsage) : '$0.00'}
                    </span>
                </div>
            </div>
            
            <div className="cost-view-models">
                {modelSummaries.map((summary) => {
                    const percentage = totalCost > 0 ? (summary.totalCost / totalCost) * 100 : 0;
                    
                    return (
                        <div key={summary.model} className="model-cost">
                            <div className="model-header">
                                <span className="model-name">{formatModelName(summary.model)}</span>
                                <span className="model-total">{formatCurrency(summary.totalCost)}</span>
                            </div>
                            
                            <div className="model-progress">
                                <div 
                                    className="model-progress-bar" 
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            
                            <div className="model-details">
                                <span className="detail">
                                    {summary.usageCount} request{summary.usageCount !== 1 ? 's' : ''}
                                </span>
                                <span className="detail">
                                    {summary.inputTokens.toLocaleString()} in / {summary.outputTokens.toLocaleString()} out
                                </span>
                                {summary.cachedTokens > 0 && (
                                    <span className="detail cached">
                                        {summary.cachedTokens.toLocaleString()} cached
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {modelSummaries.length === 0 && (
                <div className="cost-view-empty">
                    <p>No cost data available yet</p>
                </div>
            )}
        </GlassCard>
    );
};