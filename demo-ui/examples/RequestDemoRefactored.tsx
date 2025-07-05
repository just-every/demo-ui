import React, { useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Conversation, useConversation, useEnsembleStream, ConversationTheme } from '@just-every/demo-ui';
import '@just-every/demo-ui/styles';

// Import your existing components
import ConnectionWarning from '../src/components/ConnectionWarning';
import DemoHeader from '../src/components/DemoHeader';
import CodeModal from '../src/components/CodeModal';
import StatsGrid from '../src/components/StatsGrid';
import SettingsPanel, { SliderSetting, ToggleSetting } from '../src/components/SettingsPanel';
import ModelSelector from '../src/components/ModelSelector';
import { formatCost, formatNumber } from '../src/utils/format';

const glassmorphismTheme: ConversationTheme = {
    glassmorphism: true,
    primaryColor: '#4a9eff',
    backgroundColor: 'rgba(15, 15, 15, 0.95)',
};

export default function RequestDemoRefactored() {
    // Conversation state using the hook
    const conversation = useConversation();

    // Settings state
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedModelClass, setSelectedModelClass] = useState('standard');
    const [enableTools, setEnableTools] = useState(true);
    const [maxTokens, setMaxTokens] = useState(1000);
    const [temperature, setTemperature] = useState(1.0);
    const [showCodeModal, setShowCodeModal] = useState(false);

    // Stats
    const [totalTokens, setTotalTokens] = useState(0);
    const [totalCost, setTotalCost] = useState(0);

    // Follow-up suggestion
    const [followUpSuggestion, setFollowUpSuggestion] = useState('');

    // WebSocket connection
    const {
        sendMessage: wsSend,
        lastMessage,
        readyState,
    } = useWebSocket('ws://localhost:3005', {
        shouldReconnect: () => true,
        reconnectAttempts: 10,
        reconnectInterval: 3000,
    });

    // Handle Ensemble WebSocket events
    useEnsembleStream(lastMessage, {
        onMessageCreate: message => {
            conversation.messages.push(message);
        },
        onMessageUpdate: conversation.updateMessage,
        onStreamStart: () => {
            // Stream started
        },
        onStreamEnd: () => {
            // Generate follow-up suggestion after stream ends
            if (conversation.messages.length > 0) {
                generateFollowUpSuggestion();
            }
        },
        onCostUpdate: cost => {
            setTotalCost(prev => prev + cost.total);
            setTotalTokens(prev => prev + (cost.inputTokens || 0) + (cost.outputTokens || 0));
        },
        onFollowUpSuggestion: suggestion => {
            setFollowUpSuggestion(suggestion);
        },
        onError: error => {
            console.error('Stream error:', error);
        },
    });

    // Handle sending messages
    const handleSendMessage = (content: string) => {
        if (readyState !== ReadyState.OPEN) return;

        // Add user message
        conversation.sendMessage(content);

        // Send to WebSocket
        const requestData = {
            type: 'chat',
            messages: [...conversation.messages, { role: 'user', content }],
            model: selectedModel || undefined,
            modelClass: selectedModelClass || undefined,
            toolsEnabled: enableTools,
            maxTokens,
            temperature,
        };

        wsSend(JSON.stringify(requestData));
    };

    // Generate follow-up suggestion
    const generateFollowUpSuggestion = () => {
        if (readyState !== ReadyState.OPEN) return;

        const lastAssistantMessage = conversation.messages
            .slice()
            .reverse()
            .find(m => m.role === 'assistant');

        if (!lastAssistantMessage?.content) return;

        const followUpPrompt = `Based on the assistant's recent response, generate ONE short follow-up question. Respond with ONLY the question.

Recent assistant response: "${lastAssistantMessage.content.slice(0, 500)}..."

Follow-up question:`;

        const followUpRequest = {
            type: 'chat',
            messages: [{ role: 'user', content: followUpPrompt }],
            modelClass: 'mini',
            toolsEnabled: false,
            maxTokens: 100,
            temperature: 0.8,
            isFollowUp: true,
        };

        wsSend(JSON.stringify(followUpRequest));
    };

    // Settings sidebar content
    const sidebarContent = (
        <div style={{ padding: '20px', width: '300px' }}>
            <SettingsPanel title="Model Settings">
                <ModelSelector
                    label="Model"
                    value={selectedModel}
                    options={['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet']}
                    onChange={setSelectedModel}
                    disabled={conversation.isStreaming}
                />

                <ModelSelector
                    label="Model Class"
                    value={selectedModelClass}
                    options={['mini', 'standard', 'large']}
                    onChange={setSelectedModelClass}
                    disabled={conversation.isStreaming}
                />

                <ToggleSetting
                    label="Enable Tools"
                    value={enableTools}
                    onChange={setEnableTools}
                    disabled={conversation.isStreaming}
                />

                <SliderSetting
                    label="Max Tokens"
                    value={maxTokens}
                    min={100}
                    max={4000}
                    step={100}
                    onChange={setMaxTokens}
                    disabled={conversation.isStreaming}
                />

                <SliderSetting
                    label="Temperature"
                    value={temperature}
                    min={0}
                    max={2}
                    step={0.1}
                    onChange={setTemperature}
                    disabled={conversation.isStreaming}
                />
            </SettingsPanel>

            <StatsGrid
                stats={[
                    { label: 'Total Tokens', value: formatNumber(totalTokens), icon: '📊' },
                    { label: 'Total Cost', value: formatCost(totalCost), icon: '💰' },
                ]}
                columns={1}
            />
        </div>
    );

    return (
        <div className="demo-container">
            <DemoHeader
                icon="🎯"
                title="Request Demo"
                subtitle="Interactive chat with Ensemble AI models"
                onShowCode={() => setShowCodeModal(true)}
            />

            <ConnectionWarning readyState={readyState} port={3005} />

            <div style={{ height: 'calc(100vh - 200px)' }}>
                <Conversation
                    messages={conversation.messages}
                    onSendMessage={handleSendMessage}
                    onStopStreaming={conversation.stopStreaming}
                    isStreaming={conversation.isStreaming}
                    showTimestamps
                    showModelInfo
                    theme={glassmorphismTheme}
                    sidebarContent={sidebarContent}
                    enableFollowUpSuggestions
                    followUpSuggestion={followUpSuggestion}
                    onFollowUpClick={suggestion => {
                        handleSendMessage(suggestion);
                        setFollowUpSuggestion('');
                    }}
                />
            </div>

            <CodeModal
                isOpen={showCodeModal}
                onClose={() => setShowCodeModal(false)}
                serverCode={generateServerCode()}
                clientCode={generateClientCode()}
            />
        </div>
    );
}

// Code generation functions (same as original)
function generateServerCode() {
    return `// Server code example...`;
}

function generateClientCode() {
    return `// Client code example...`;
}
