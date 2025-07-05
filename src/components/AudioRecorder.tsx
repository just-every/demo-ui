import React, { useState, useRef, useCallback } from 'react';
import { GlassButton } from './GlassButton';
import { AudioVisualizer } from './AudioVisualizer';
import './style.scss';

export interface AudioRecorderConfig {
    channelCount?: number;
    sampleRate?: number;
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
}

export interface AudioRecorderProps {
    /** Recording configuration */
    config?: AudioRecorderConfig;
    /** Whether to show the audio visualizer */
    showVisualizer?: boolean;
    /** Whether to auto-start recording */
    autoStart?: boolean;
    /** Callback when recording starts */
    onRecordingStart?: (stream: MediaStream) => void;
    /** Callback when recording stops */
    onRecordingStop?: () => void;
    /** Callback for audio data chunks */
    onAudioData?: (data: Float32Array) => void;
    /** Maximum recording duration in seconds */
    maxDuration?: number;
    /** Custom className */
    className?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
    config = {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    },
    showVisualizer = true,
    autoStart = false,
    onRecordingStart,
    onRecordingStop,
    onAudioData,
    maxDuration,
    className = ''
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const timerRef = useRef<number | null>(null);

    const startRecording = useCallback(async () => {
        try {
            setIsInitializing(true);
            setError(null);
            
            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: config
            });
            
            streamRef.current = stream;
            
            // Create audio context
            const audioContext = new AudioContext({ sampleRate: config.sampleRate });
            audioContextRef.current = audioContext;
            
            // Create analyser for visualization
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            analyserRef.current = analyser;
            
            // Create source from stream
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            
            // Create processor for audio data extraction
            if (onAudioData) {
                const processor = audioContext.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;
                
                processor.onaudioprocess = (event) => {
                    const inputData = event.inputBuffer.getChannelData(0);
                    onAudioData(inputData);
                };
                
                source.connect(processor);
                processor.connect(audioContext.destination);
            }
            
            setIsRecording(true);
            setIsInitializing(false);
            setRecordingTime(0);
            
            // Start timer
            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => {
                    const newTime = prev + 1;
                    if (maxDuration && newTime >= maxDuration) {
                        stopRecording();
                    }
                    return newTime;
                });
            }, 1000);
            
            onRecordingStart?.(stream);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start recording');
            setIsInitializing(false);
        }
    }, [config, onAudioData, onRecordingStart, maxDuration]);

    const stopRecording = useCallback(() => {
        // Stop timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        
        // Stop media stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        
        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        
        // Clean up processor
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        
        analyserRef.current = null;
        setIsRecording(false);
        setRecordingTime(0);
        
        onRecordingStop?.();
    }, [onRecordingStop]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    // Auto-start if requested
    React.useEffect(() => {
        if (autoStart && !isRecording && !isInitializing) {
            startRecording();
        }
    }, [autoStart, isRecording, isInitializing, startRecording]);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            stopRecording();
        };
    }, [stopRecording]);

    return (
        <div className={`audio-recorder ${className}`}>
            <div className="recorder-header">
                <div className="recorder-status">
                    {isInitializing && (
                        <span className="status initializing">
                            <div className="status-indicator" />
                            Initializing microphone...
                        </span>
                    )}
                    {isRecording && (
                        <span className="status recording">
                            <div className="status-indicator" />
                            Recording - {formatTime(recordingTime)}
                            {maxDuration && ` / ${formatTime(maxDuration)}`}
                        </span>
                    )}
                    {!isRecording && !isInitializing && (
                        <span className="status ready">
                            <div className="status-indicator" />
                            Ready to record
                        </span>
                    )}
                </div>
                
                <div className="recorder-controls">
                    {!isRecording ? (
                        <GlassButton
                            onClick={startRecording}
                            disabled={isInitializing}
                            variant="primary"
                        >
                            🎤 {isInitializing ? 'Initializing...' : 'Start Recording'}
                        </GlassButton>
                    ) : (
                        <GlassButton
                            onClick={stopRecording}
                            variant="danger"
                        >
                            ⏹️ Stop Recording
                        </GlassButton>
                    )}
                </div>
            </div>
            
            {showVisualizer && (
                <AudioVisualizer
                    audioContext={audioContextRef.current || undefined}
                    analyser={analyserRef.current || undefined}
                    isActive={isRecording}
                    height={100}
                    symmetric={true}
                />
            )}
            
            {error && (
                <div className="recorder-error">
                    ⚠️ {error}
                </div>
            )}
        </div>
    );
};