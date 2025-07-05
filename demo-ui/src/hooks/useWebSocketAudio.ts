import { useCallback, useRef, useState } from 'react';
import { WebSocketMessage } from './useWebSocketMessage';

export interface AudioChunk {
    data: string; // base64 encoded
    chunkIndex: number;
    isFinalChunk: boolean;
}

export interface WebSocketAudioState {
    isReceivingAudio: boolean;
    audioChunks: Uint8Array[];
    currentAudioBlob: Blob | null;
    progress: number;
    totalChunks: number;
}

export interface WebSocketAudioOptions {
    onAudioChunk?: (chunk: AudioChunk) => void;
    onAudioComplete?: (blob: Blob) => void;
    onAudioProgress?: (progress: number, totalChunks: number) => void;
    autoCreateBlob?: boolean;
}

export const useWebSocketAudio = (options: WebSocketAudioOptions = {}) => {
    const {
        onAudioChunk,
        onAudioComplete,
        onAudioProgress,
        autoCreateBlob = true
    } = options;

    const [state, setState] = useState<WebSocketAudioState>({
        isReceivingAudio: false,
        audioChunks: [],
        currentAudioBlob: null,
        progress: 0,
        totalChunks: 0
    });

    const audioChunksRef = useRef<Uint8Array[]>([]);
    const totalChunksRef = useRef(0);

    const handleWebSocketMessage = useCallback((data: WebSocketMessage) => {
        switch (data.type) {
            case 'audio_start':
                audioChunksRef.current = [];
                totalChunksRef.current = data.totalChunks || 0;
                setState(prev => ({
                    ...prev,
                    isReceivingAudio: true,
                    audioChunks: [],
                    currentAudioBlob: null,
                    progress: 0,
                    totalChunks: totalChunksRef.current
                }));
                break;

            case 'audio_chunk':
                if (data.data) {
                    // Decode base64 audio chunk
                    const binaryString = atob(data.data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    
                    audioChunksRef.current.push(bytes);
                    
                    const chunk: AudioChunk = {
                        data: data.data,
                        chunkIndex: data.chunkIndex || audioChunksRef.current.length - 1,
                        isFinalChunk: data.isFinalChunk || false
                    };
                    
                    const progress = totalChunksRef.current > 0 
                        ? (audioChunksRef.current.length / totalChunksRef.current) * 100
                        : 0;
                    
                    setState(prev => ({
                        ...prev,
                        audioChunks: [...audioChunksRef.current],
                        progress
                    }));
                    
                    onAudioChunk?.(chunk);
                    onAudioProgress?.(progress, totalChunksRef.current);
                    
                    // Handle final chunk
                    if (chunk.isFinalChunk) {
                        const audioBlob = createAudioBlob(audioChunksRef.current);
                        
                        setState(prev => ({
                            ...prev,
                            isReceivingAudio: false,
                            currentAudioBlob: autoCreateBlob ? audioBlob : null,
                            progress: 100
                        }));
                        
                        onAudioComplete?.(audioBlob);
                    }
                }
                break;

            case 'audio_end':
            case 'audio_error':
                setState(prev => ({
                    ...prev,
                    isReceivingAudio: false
                }));
                break;
        }
    }, [onAudioChunk, onAudioComplete, onAudioProgress, autoCreateBlob]);

    const createAudioBlob = useCallback((chunks: Uint8Array[], mimeType = 'audio/wav') => {
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedArray = new Uint8Array(totalLength);
        
        let offset = 0;
        chunks.forEach(chunk => {
            combinedArray.set(chunk, offset);
            offset += chunk.length;
        });
        
        return new Blob([combinedArray], { type: mimeType });
    }, []);

    const downloadAudio = useCallback((filename?: string, mimeType = 'audio/wav') => {
        const blob = state.currentAudioBlob || createAudioBlob(audioChunksRef.current, mimeType);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const extension = mimeType.split('/')[1] || 'wav';
        const finalFilename = filename || `audio-${timestamp}.${extension}`;
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        a.click();
        
        URL.revokeObjectURL(url);
    }, [state.currentAudioBlob, createAudioBlob]);

    const clearAudio = useCallback(() => {
        audioChunksRef.current = [];
        totalChunksRef.current = 0;
        setState({
            isReceivingAudio: false,
            audioChunks: [],
            currentAudioBlob: null,
            progress: 0,
            totalChunks: 0
        });
    }, []);

    return {
        ...state,
        handleWebSocketMessage,
        createAudioBlob,
        downloadAudio,
        clearAudio
    };
};