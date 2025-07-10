import React, { useState } from 'react';
import { CognitionAnalysisEvent } from '../utils/metaCognitionEventProcessor';
import type { SerializedCognitionState } from '@just-every/task';
import type { TaskState } from '../hooks/useTaskState';
import { formatDuration } from '../utils/formatters';
import './style.scss';
import './CognitionView.scss';

export interface CognitionViewProps {
    taskState: TaskState;
    className?: string;
}

export const CognitionView: React.FC<CognitionViewProps> = ({
    taskState,
    className = ''
}) => {
    const [activeTab, setActiveTab] = useState<'events' | 'state'>('events');

    const renderAnalysisEvent = (event: CognitionAnalysisEvent) => (
        <div key={event.eventId} className={`analysis-event ${event.isRunning ? 'running' : 'completed'}`}>
            <div className="event-header">
                <div className="event-meta">
                    <span className="event-status">
                        {event.isRunning ? (
                            <>⟳ Running</>
                        ) : (
                            <>✓ Completed</>
                        )}
                    </span>
                    <span className="event-time">
                        {new Date(event.startedAt).toLocaleTimeString()}
                    </span>
                    {event.processingTime && (
                        <span className="event-duration">
                            {formatDuration(event.processingTime)}
                        </span>
                    )}
                </div>
                <span className="request-count">Request #{event.requestCount}</span>
            </div>

            {event.adjustments && event.adjustments.length > 0 && (
                <div className="event-adjustments">
                    <h5>Adjustments ({event.adjustments.length})</h5>
                    <ul>
                        {event.adjustments.map((adj, i) => (
                            <li key={i}>{adj}</li>
                        ))}
                    </ul>
                </div>
            )}

            {event.injectedThoughts && event.injectedThoughts.length > 0 && (
                <div className="event-thoughts">
                    <h5>Injected Thoughts ({event.injectedThoughts.length})</h5>
                    {event.injectedThoughts.map((thought, i) => (
                        <div key={i} className="thought-item">
                            <span className="thought-icon">💭</span>
                            <div className="thought-content">{thought}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderState = (state: SerializedCognitionState) => (
        <div className="cognition-state">
            <div className="state-grid">
                <div className="state-item">
                    <div className="state-label">Frequency</div>
                    <div className="state-value">{state.frequency || 'Default'}</div>
                </div>
                <div className="state-item">
                    <div className="state-label">Thought Delay</div>
                    <div className="state-value">{state.thoughtDelay || 0}s</div>
                </div>
                <div className="state-item">
                    <div className="state-label">Processing</div>
                    <div className="state-value">{state.processing ? 'Yes' : 'No'}</div>
                </div>
            </div>

            {state.disabledModels && state.disabledModels.length > 0 && (
                <div className="state-section">
                    <h5>Disabled Models</h5>
                    <ul className="model-list">
                        {state.disabledModels.map((model: string) => (
                            <li key={model}>{model}</li>
                        ))}
                    </ul>
                </div>
            )}

            {state.modelScores && Object.keys(state.modelScores).length > 0 && (
                <div className="state-section">
                    <h5>Model Scores</h5>
                    <div className="model-scores">
                        {Object.entries(state.modelScores).map(([model, score]) => (
                            <div key={model} className="model-score">
                                <span className="model-name">{model}</span>
                                <span className="model-score-value">{score as number}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className={`cognition-view ${className}`}>
            <div className="cognition-header">
                <h3>Metacognition Analysis</h3>
                <div className="stats-summary">
                    <div className="stat-item">
                        <span className="stat-value">{taskState.cognitionData.stats.totalAnalyses}</span>
                        <span className="stat-label">Total</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{taskState.cognitionData.stats.completedAnalyses}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{taskState.cognitionData.stats.totalAdjustments}</span>
                        <span className="stat-label">Adjustments</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{taskState.cognitionData.stats.totalInjectedThoughts}</span>
                        <span className="stat-label">Thoughts</span>
                    </div>
                    {taskState.cognitionData.stats.averageProcessingTime > 0 && (
                        <div className="stat-item">
                            <span className="stat-value">
                                {formatDuration(taskState.cognitionData.stats.averageProcessingTime)}
                            </span>
                            <span className="stat-label">Avg Time</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="cognition-tabs">
                <button
                    className={`tab ${activeTab === 'events' ? 'active' : ''}`}
                    onClick={() => setActiveTab('events')}
                >
                    Analysis History
                </button>
                <button
                    className={`tab ${activeTab === 'state' ? 'active' : ''}`}
                    onClick={() => setActiveTab('state')}
                >
                    Current State
                </button>
            </div>

            <div className="cognition-content">
                {activeTab === 'events' && (
                    <div className="analysis-events-section">
                        {taskState.cognitionData.analysisEvents.length > 0 ? (
                            <div className="events-list">
                                {taskState.cognitionData.analysisEvents
                                    .sort((a, b) => b.startedAt - a.startedAt)
                                    .map(renderAnalysisEvent)}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">🔮</div>
                                <p>No metacognition activity yet</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'state' && (
                    <div className="state-section">
                        {taskState.cognitionData.currentState ? (
                            renderState(taskState.cognitionData.currentState)
                        ) : (
                            <div className="empty-state">
                                <p>No state data available</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};