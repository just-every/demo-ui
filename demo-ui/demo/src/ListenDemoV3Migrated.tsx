import React, { useState, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import {
    DemoHeader,
    Card,
    ConnectionStatus,
    StatsGrid,
    ModelSelector,
    AudioVisualizer,
    AudioRecorder,
    CodeModal,
    ShowCodeButton,
    ErrorMessage,
    GlassButton,
    StatusIndicator,
    type CodeTab,
    type SelectGroup,
    formatDuration,
    formatBytes,
    formatCost,
    formatNumber
} from '@just-every/demo-ui';
import ConnectionWarning from './components/ConnectionWarning';

const ListenDemoV3Migrated: React.FC = () => {
    // State management
    const [isRecording, setIsRecording] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gemini-live-2.5-flash-preview');
    const [transcript, setTranscript] = useState('');
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>(
        'disconnected'
    );
    const [error, setError] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [totalBytes, setTotalBytes] = useState(0);
    const [totalTokens, setTotalTokens] = useState(0);
    const [cost, setCost] = useState(0);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);
    const [audioData, setAudioData] = useState<number[]>([]);

    // Refs
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const shouldVisualizeRef = useRef<boolean>(false);
    const transcriptContainerRef = useRef<HTMLDivElement>(null);

    // WebSocket configuration
    const socketUrl = 'ws://localhost:3003';
    const { sendMessage, lastMessage, readyState, getWebSocket } = useWebSocket(isRecording ? socketUrl : null, {
        shouldReconnect: () => true,
        reconnectAttempts: 10,
        reconnectInterval: 3000,
    });

    // Model options for ModelSelector
    const modelGroups: SelectGroup[] = [
        {
            label: 'OpenAI Models',
            options: [
                { value: 'gpt-4o-transcribe', label: 'GPT-4o Transcribe (Streaming)' },
                { value: 'gpt-4o-mini-transcribe', label: 'GPT-4o Mini Transcribe (Streaming)' },
                { value: 'whisper-1', label: 'Whisper-1 (Complete at once)' }
            ]
        },
        {
            label: 'Gemini Models',
            options: [
                { value: 'gemini-live-2.5-flash-preview', label: 'Gemini Live 2.5 Flash Preview' },
                { value: 'gemini-2.0-flash-live-001', label: 'Gemini 2.0 Flash Live' }
            ]
        }
    ];

    // Stats for StatsGrid
    const stats = [
        {
            label: 'Duration',
            value: formatDuration(duration),
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z" />
                </svg>
            )
        },
        {
            label: 'Audio Data',
            value: formatBytes(totalBytes),
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
            )
        },
        {
            label: 'Tokens Used',
            value: formatNumber(totalTokens),
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
            )
        },
        {
            label: 'Estimated Cost',
            value: formatCost(cost),
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.93.66 1.64 2.08 1.64 1.71 0 2.05-.74 2.05-1.48 0-1.06-.95-1.37-2.51-1.85-1.86-.52-3.2-1.43-3.2-3.25 0-1.89 1.52-2.98 3.17-3.29V4.5h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39h-1.96c-.05-1.11-.64-1.63-1.77-1.63-1.2 0-1.94.56-1.94 1.47 0 .88.72 1.22 2.34 1.67 1.9.51 3.37 1.35 3.37 3.45 0 1.93-1.37 3.02-3.17 3.29z" />
                </svg>
            )
        }
    ];

    // Handle WebSocket connection status
    useEffect(() => {
        if (!isRecording) {
            setConnectionStatus('disconnected');
            return;
        }

        switch (readyState) {
            case ReadyState.CONNECTING:
                setConnectionStatus('connecting');
                break;
            case ReadyState.OPEN:
                setConnectionStatus('connected');
                sendMessage(
                    JSON.stringify({
                        type: 'start',
                        model: selectedModel,
                    })
                );
                break;
            case ReadyState.CLOSING:
            case ReadyState.CLOSED:
                setConnectionStatus('disconnected');
                break;
        }
    }, [readyState, isRecording, selectedModel, sendMessage]);

    // Handle WebSocket messages
    useEffect(() => {
        if (!lastMessage) return;

        try {
            const data = JSON.parse(lastMessage.data);
            handleServerMessage(data);
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }, [lastMessage]);

    // Update duration timer
    useEffect(() => {
        if (isRecording && startTimeRef.current) {
            durationIntervalRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
                setDuration(elapsed);
            }, 1000);
        } else {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }
        }

        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        };
    }, [isRecording]);

    const handleServerMessage = (data: {
        type: string;
        delta?: string;
        text?: string;
        error?: string;
        message?: string;
        usage?: {
            total_tokens?: number;
            input_tokens?: number;
            output_tokens?: number;
        };
    }) => {
        switch (data.type) {
            case 'transcription_start':
                console.log('Transcription started');
                break;

            case 'transcription_turn_delta':
                appendTranscript(data.delta || '', 'preview');
                break;

            case 'transcription_turn_complete':
                console.log('Turn complete:', data.text);
                appendTranscript(data.text || '');
                appendTranscript('\n--- Turn Complete ---\n');
                break;

            case 'cost_update':
                if (data.usage) {
                    setTotalTokens(data.usage.total_tokens || 0);
                    const inputCost = ((data.usage.input_tokens || 0) * 0.2) / 1_000_000;
                    const outputCost = ((data.usage.output_tokens || 0) * 0.8) / 1_000_000;
                    setCost(inputCost + outputCost);
                }
                break;

            case 'transcription_complete':
                console.log('Transcription complete:', data.text);
                break;

            case 'error':
                showError(data.error || 'Unknown error');
                break;

            case 'status':
                console.log('Server status:', data.message);
                break;
        }
    };

    const appendTranscript = (text: string, type: 'default' | 'preview' = 'default') => {
        const container = transcriptContainerRef.current;
        if (!container) return;

        // Remove empty state message if present
        const emptyMsg = container.querySelector('.transcript-empty');
        if (emptyMsg) {
            emptyMsg.remove();
        }

        // Check if we can append to existing preview line
        if (type === 'preview') {
            const lastLine = container.lastElementChild;
            if (lastLine && lastLine.classList.contains('preview')) {
                // Append to existing preview line
                lastLine.textContent = (lastLine.textContent || '') + text;
                setTranscript(prev => prev + text);
                container.scrollTop = container.scrollHeight;
                return;
            }
        }

        // Add new transcript line
        const line = document.createElement('div');
        line.className = type === 'preview' ? 'transcript-line preview' : 'transcript-line';
        line.textContent = text;
        container.appendChild(line);

        // Update full transcript
        setTranscript(prev => prev + text);

        // Auto-scroll to bottom
        container.scrollTop = container.scrollHeight;
    };

    const startRecording = async () => {
        try {
            setConnectionStatus('connecting');

            // Get microphone access
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            // Only mark connection attempt after mic is granted
            setHasAttemptedConnection(true);
            setIsRecording(true);
            startTimeRef.current = Date.now();
            setError(null);
            shouldVisualizeRef.current = true;

            // Start audio capture
            await startAudioCapture();
        } catch (error) {
            console.error('Failed to start recording:', error);
            showError((error as Error).message || 'Failed to access microphone');
            setConnectionStatus('error');
        }
    };

    const startAudioCapture = async () => {
        if (!mediaStreamRef.current) return;

        audioContextRef.current = new AudioContext({
            sampleRate: 16000,
            latencyHint: 'interactive',
        });

        sourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);

        // Create analyser for visualization
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 512;
        analyserRef.current.smoothingTimeConstant = 0.8;
        analyserRef.current.minDecibels = -70;
        analyserRef.current.maxDecibels = -20;

        // Create script processor
        processorRef.current = audioContextRef.current.createScriptProcessor(1024, 1, 1);

        processorRef.current.onaudioprocess = e => {
            const ws = getWebSocket();
            if (ws && ws.readyState === WebSocket.OPEN) {
                const float32Audio = e.inputBuffer.getChannelData(0);
                const int16Audio = convertFloat32ToInt16(float32Audio);

                // Send audio data as binary
                ws.send(int16Audio.buffer);
                setTotalBytes(prev => prev + int16Audio.buffer.byteLength);
            }
        };

        // Connect audio pipeline: source -> analyser -> processor -> destination
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(processorRef.current);
        processorRef.current.connect(audioContextRef.current.destination);

        // Start visualization
        visualize();
    };

    const convertFloat32ToInt16 = (float32Array: Float32Array): Int16Array => {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return int16Array;
    };

    const visualize = () => {
        if (!analyserRef.current || !shouldVisualizeRef.current) {
            return;
        }

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Process frequency data for visualization
        const barCount = 64; // Fixed count for AudioVisualizer
        const heights: number[] = new Array(barCount);

        // Focus on voice frequency range (roughly 80Hz to 2000Hz)
        const minFreqBin = Math.floor(80 / 31.25);
        const maxFreqBin = Math.floor(2000 / 31.25);
        const usefulBins = maxFreqBin - minFreqBin;

        // Map bars to frequency bins - create symmetric visualization
        const halfBarCount = Math.floor(barCount / 2);

        // Process frequency data for half the bars
        const halfHeights: number[] = new Array(halfBarCount);

        for (let i = 0; i < halfBarCount; i++) {
            const binIndex = minFreqBin + Math.floor((i / halfBarCount) * usefulBins);
            const value = dataArray[binIndex] || 0;

            // Convert byte (0-255) to normalized value (0-1)
            const normalizedValue = value / 255;
            const scaledValue = Math.pow(normalizedValue, 0.7);
            halfHeights[i] = scaledValue;
        }

        // Create symmetric visualization - low frequencies in center
        for (let i = 0; i < barCount; i++) {
            if (i < halfBarCount) {
                // Left side - reversed (high to low frequencies)
                const sourceIndex = halfBarCount - 1 - i;
                heights[i] = halfHeights[sourceIndex];
            } else {
                // Right side - normal (low to high frequencies)
                const sourceIndex = i - halfBarCount;
                heights[i] = halfHeights[sourceIndex];
            }
        }

        setAudioData(heights);
        animationFrameRef.current = requestAnimationFrame(visualize);
    };

    const stopRecording = () => {
        setIsRecording(false);
        setHasAttemptedConnection(false);
        shouldVisualizeRef.current = false;
        cleanup();
    };

    const cleanup = () => {
        // Reset audio data
        setAudioData([]);

        // Stop animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Stop audio
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        setConnectionStatus('disconnected');
    };

    const clearTranscript = () => {
        setTranscript('');
        const container = transcriptContainerRef.current;
        if (container) {
            container.innerHTML = '<div class="transcript-empty">Transcript will appear here...</div>';
        }
    };

    const showError = (message: string) => {
        setError(message);
        setTimeout(() => setError(null), 5000);
    };

    const generateServerCode = (): string => {
        return `#!/usr/bin/env node
// Real-time transcription server using ensembleListen
// Model: ${selectedModel}

import dotenv from 'dotenv';
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { ensembleListen } from '@just-every/ensemble';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3003;

// Serve static files
app.use(express.static('public'));

// WebSocket server for real-time audio streaming
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected for transcription');
    let transcriptionStream = null;

    ws.on('message', async (data) => {
        try {
            // Handle text messages (commands)
            if (data.toString().length < 1000) {
                const message = JSON.parse(data.toString());

                if (message.type === 'start') {
                    console.log('Starting transcription with model:', message.model);

                    // Start the transcription stream
                    transcriptionStream = ensembleListen({
                        model: message.model || '${selectedModel}',
                        language: 'en'
                    });

                    // Forward all transcription events to the client
                    for await (const event of transcriptionStream) {
                        ws.send(JSON.stringify(event));
                    }
                }
            } else {
                // Handle binary audio data
                if (transcriptionStream) {
                    // Send audio data to the transcription stream
                    transcriptionStream.sendAudio(data);
                }
            }
        } catch (error) {
            console.error('Transcription error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: error.message
            }));
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        if (transcriptionStream) {
            transcriptionStream.close();
        }
    });

    // Send connection confirmation
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'Transcription server ready'
    }));
});

server.listen(PORT, () => {
    console.log(\`Transcription server running on port \${PORT}\`);
    console.log(\`WebSocket: ws://localhost:\${PORT}\`);
});`;
    };

    const generateClientCode = (): string => {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Real-time Transcription - ${selectedModel}</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; margin-bottom: 20px; }
        .controls {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        }
        button {
            background: #1a73e8;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
        }
        button:hover { background: #1557b0; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        button.stop { background: #ea4335; }
        button.stop:hover { background: #d33b2c; }
        #transcript {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            min-height: 200px;
            font-family: monospace;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
            overflow-y: auto;
            border: 1px solid #e0e0e0;
        }
        #status {
            margin-top: 15px;
            padding: 10px;
            border-radius: 6px;
            font-weight: 500;
        }
        .status-connected { background: #e6f4ea; color: #1e8e3e; }
        .status-error { background: #fce8e6; color: #d93025; }
        .status-info { background: #e8f0fe; color: #1a73e8; }
        .audio-bar {
            width: 3px;
            background: #1a73e8;
            border-radius: 2px;
            transition: height 0.1s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Real-time Transcription</h1>
        <p>Model: ${selectedModel}</p>

        <div class="controls">
            <button id="startBtn" onclick="startRecording()">Start Recording</button>
            <button id="stopBtn" style="display: none;" onclick="stopRecording()" class="stop">Stop Recording</button>
        </div>

        <div id="status" class="status-info">Ready to record</div>

        <div id="audioVisualizer" style="display: none; height: 120px; background: #f0f0f0; border-radius: 8px; margin: 20px 0; position: relative;">
            <div id="visualizer" style="display: flex; align-items: center; justify-content: center; height: 100%; gap: 2px; padding: 0 20px;"></div>
        </div>

        <h3>Transcript:</h3>
        <div id="transcript">Transcript will appear here...</div>
    </div>

    <script>
        let ws = null;
        let mediaRecorder = null;
        let audioContext = null;
        let processor = null;
        let source = null;
        let analyser = null;
        let visualizerBars = [];
        let isRecording = false;
        let animationId = null;

        // Create visualizer bars
        function createVisualizer() {
            const visualizer = document.getElementById('visualizer');
            const barCount = 64;
            
            for (let i = 0; i < barCount; i++) {
                const bar = document.createElement('div');
                bar.className = 'audio-bar';
                bar.style.height = '4px';
                bar.style.flex = '1';
                visualizer.appendChild(bar);
                visualizerBars.push(bar);
            }
        }

        // Connect to WebSocket server
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:3003');
            ws.binaryType = 'arraybuffer';

            ws.onopen = () => {
                console.log('Connected to server');
                updateStatus('Connected - Speak into your microphone', 'status-connected');
                
                // Send start message
                ws.send(JSON.stringify({
                    type: 'start',
                    model: '${selectedModel}'
                }));
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleServerMessage(data);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                updateStatus('Connection error', 'status-error');
            };

            ws.onclose = () => {
                console.log('Disconnected from server');
                updateStatus('Disconnected', 'status-info');
            };
        }

        // Handle server messages
        function handleServerMessage(data) {
            const transcript = document.getElementById('transcript');
            
            switch (data.type) {
                case 'transcription_turn_delta':
                    // Append preview text
                    transcript.textContent += data.delta;
                    transcript.scrollTop = transcript.scrollHeight;
                    break;
                    
                case 'transcription_turn_complete':
                    // Add completed turn
                    transcript.textContent += '\\n--- Turn Complete ---\\n';
                    transcript.scrollTop = transcript.scrollHeight;
                    break;
                    
                case 'error':
                    updateStatus('Error: ' + data.error, 'status-error');
                    break;
            }
        }

        // Update status display
        function updateStatus(text, className) {
            const status = document.getElementById('status');
            status.textContent = text;
            status.className = className;
        }

        // Convert float32 audio to int16
        function convertFloat32ToInt16(float32Array) {
            const int16Array = new Int16Array(float32Array.length);
            for (let i = 0; i < float32Array.length; i++) {
                const s = Math.max(-1, Math.min(1, float32Array[i]));
                int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            return int16Array;
        }

        // Visualize audio
        function visualize() {
            if (!analyser || !isRecording) return;

            const dataArray = new Uint8Array(analyser.fftSize);
            analyser.getByteTimeDomainData(dataArray);

            // Update bars
            for (let i = 0; i < visualizerBars.length; i++) {
                const index = Math.floor(i * dataArray.length / visualizerBars.length);
                const value = dataArray[index];
                const amplitude = Math.abs(value - 128);
                const height = Math.max(4, amplitude * 0.8);
                visualizerBars[i].style.height = height + 'px';
            }

            animationId = requestAnimationFrame(visualize);
        }

        // Start recording
        async function startRecording() {
            try {
                updateStatus('Requesting microphone access...', 'status-info');
                
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount: 1,
                        sampleRate: 16000,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });

                isRecording = true;
                connectWebSocket();

                // Setup audio processing
                audioContext = new AudioContext({ sampleRate: 16000 });
                source = audioContext.createMediaStreamSource(stream);
                
                // Create analyser for visualization
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);

                // Create processor
                processor = audioContext.createScriptProcessor(1024, 1, 1);
                processor.onaudioprocess = (e) => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        const float32Audio = e.inputBuffer.getChannelData(0);
                        const int16Audio = convertFloat32ToInt16(float32Audio);
                        ws.send(int16Audio.buffer);
                    }
                };

                source.connect(processor);
                processor.connect(audioContext.destination);

                // Show visualizer
                document.getElementById('audioVisualizer').style.display = 'block';
                visualize();

                // Update UI
                document.getElementById('startBtn').style.display = 'none';
                document.getElementById('stopBtn').style.display = 'inline-block';
                document.getElementById('transcript').textContent = '';

            } catch (error) {
                console.error('Error starting recording:', error);
                updateStatus('Failed to access microphone', 'status-error');
            }
        }

        // Stop recording
        function stopRecording() {
            isRecording = false;

            // Stop audio
            if (processor) {
                processor.disconnect();
                processor = null;
            }
            if (source) {
                source.disconnect();
                source = null;
            }
            if (audioContext) {
                audioContext.close();
                audioContext = null;
            }

            // Stop animation
            if (animationId) {
                cancelAnimationFrame(animationId);
            }

            // Close WebSocket
            if (ws) {
                ws.close();
                ws = null;
            }

            // Hide visualizer
            document.getElementById('audioVisualizer').style.display = 'none';

            // Update UI
            document.getElementById('startBtn').style.display = 'inline-block';
            document.getElementById('stopBtn').style.display = 'none';
            updateStatus('Recording stopped', 'status-info');
        }

        // Initialize
        createVisualizer();
    </script>
</body>
</html>`;
    };

    // Code tabs for CodeModal
    const codeTabs: CodeTab[] = [
        {
            id: 'server',
            label: 'Server Code',
            language: 'typescript',
            code: generateServerCode()
        },
        {
            id: 'client',
            label: 'Client Code',
            language: 'html',
            code: generateClientCode()
        }
    ];

    return (
        <div className="container">
            <DemoHeader
                title="Ensemble Listen Demo"
                icon={
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                }
            >
                <ShowCodeButton onClick={() => setShowCodeModal(true)} />
            </DemoHeader>

            {/* Connection warning - only show if connection was attempted */}
            {hasAttemptedConnection && <ConnectionWarning readyState={readyState} port={3003} delay={2000} />}

            {/* Main content */}
            <Card>
                <div className="status-section">
                    <div className="control-header">
                        <ConnectionStatus 
                            status={connectionStatus}
                            message={
                                connectionStatus === 'connected'
                                    ? 'Connected - Speak into your microphone'
                                    : connectionStatus === 'connecting'
                                      ? 'Connecting...'
                                      : connectionStatus === 'error'
                                        ? 'Connection error'
                                        : 'Disconnected'
                            }
                        />

                        <ModelSelector
                            value={selectedModel}
                            onChange={setSelectedModel}
                            groups={modelGroups}
                            disabled={isRecording}
                        />

                        <div className="controls">
                            {!isRecording ? (
                                <button
                                    className="primary-btn"
                                    onClick={startRecording}
                                    disabled={connectionStatus === 'connecting'}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                    <span>{connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}</span>
                                </button>
                            ) : (
                                <button className="danger-btn" onClick={stopRecording}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6 6h12v12H6z" />
                                    </svg>
                                    <span>Stop</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <AudioVisualizer 
                    isActive={isRecording}
                    data={audioData}
                    height={120}
                    barCount={64}
                    minHeight={4}
                    maxHeight={60}
                />

                <div className="transcript-section">
                    <div className="transcript-header">
                        <h2>Live Transcript</h2>
                        <GlassButton onClick={clearTranscript}>
                            <span>Clear</span>
                        </GlassButton>
                    </div>
                    <div 
                        ref={transcriptContainerRef}
                        className="transcript-container"
                        style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '20px',
                            minHeight: '200px',
                            maxHeight: '400px',
                            overflow: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap'
                        }}
                    >
                        <div className="transcript-empty">Transcript will appear here...</div>
                    </div>
                </div>

                <StatsGrid stats={stats} />

                {error && <ErrorMessage message={error} />}
            </Card>

            {/* Code Generation Modal */}
            {showCodeModal && (
                <CodeModal
                    isOpen={showCodeModal}
                    onClose={() => setShowCodeModal(false)}
                    title="Generated Code"
                    tabs={codeTabs}
                />
            )}
        </div>
    );
};

export default ListenDemoV3Migrated;