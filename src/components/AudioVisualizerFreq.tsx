import React, { useEffect, useRef } from 'react';
import './style.scss';

export interface AudioVisualizerFreqProps {
    /** Audio analyzer node */
    analyser?: AnalyserNode;
    /** Whether the visualizer is active */
    isActive?: boolean;
    /** Height of the visualizer container */
    height?: number;
    /** CSS class name */
    className?: string;
    /** Style prop */
    style?: React.CSSProperties;
    /** Audio context (not used but kept for compatibility) */
    audioContext?: AudioContext;
}

export const AudioVisualizerFreq: React.FC<AudioVisualizerFreqProps> = ({
    analyser,
    isActive = false,
    height = 120,
    className = '',
    style,
    audioContext: _audioContext
}) => {
    const visualizerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const visualizerBarsRef = useRef<HTMLDivElement[]>([]);
    const shouldVisualizeRef = useRef(false);

    // Calculate bar count based on container width
    useEffect(() => {
        if (!visualizerRef.current) return;
        
        const visualizer = visualizerRef.current;
        const containerWidth = visualizer.offsetWidth - 40; // Account for padding
        const pixelsPerBar = 10; // 3px bar + 2px gap + padding
        const optimalBarCount = Math.floor(containerWidth / pixelsPerBar);
        const barCount = Math.min(64, Math.max(32, optimalBarCount));
        
        // Clear existing bars
        visualizer.innerHTML = '';
        visualizerBarsRef.current = [];
        
        for (let i = 0; i < barCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'audio-bar';
            bar.style.height = '4px';
            bar.style.flex = '1';
            visualizer.appendChild(bar);
            visualizerBarsRef.current.push(bar);
        }
    }, []);

    // Visualize audio - EXACT copy from original
    const visualize = () => {
        if (!analyser || !shouldVisualizeRef.current) {
            return;
        }

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barCount = visualizerBarsRef.current.length;
        if (barCount === 0) return;

        // Focus on voice frequency range (roughly 80Hz to 2000Hz)
        // At 16kHz sample rate, each bin represents ~31.25Hz
        const minFreqBin = Math.floor(80 / 31.25); // ~2-3
        const maxFreqBin = Math.floor(2000 / 31.25); // ~64
        const usefulBins = maxFreqBin - minFreqBin;

        // Map bars to frequency bins - create symmetric visualization
        const heights: string[] = new Array(barCount);
        const halfBarCount = Math.floor(barCount / 2);

        // Process frequency data for half the bars
        const halfHeights: number[] = new Array(halfBarCount);

        for (let i = 0; i < halfBarCount; i++) {
            // Map to frequency bins, starting from low frequencies
            const binIndex = minFreqBin + Math.floor((i / halfBarCount) * usefulBins);
            const value = dataArray[binIndex] || 0;

            // Convert byte (0-255) to height with logarithmic scaling
            const normalizedValue = value / 255;
            const scaledValue = Math.pow(normalizedValue, 0.7);
            const height = Math.max(4, scaledValue * 60);
            halfHeights[i] = height;
        }

        // Create symmetric visualization - low frequencies in center
        for (let i = 0; i < barCount; i++) {
            if (i < halfBarCount) {
                // Left side - reversed (high to low frequencies)
                const sourceIndex = halfBarCount - 1 - i;
                heights[i] = `${halfHeights[sourceIndex]}px`;
            } else {
                // Right side - normal (low to high frequencies)
                const sourceIndex = i - halfBarCount;
                heights[i] = `${halfHeights[sourceIndex]}px`;
            }
        }

        // Apply all height changes at once
        requestAnimationFrame(() => {
            for (let i = 0; i < barCount; i++) {
                if (visualizerBarsRef.current[i]) {
                    visualizerBarsRef.current[i].style.height = heights[i];
                }
            }
        });

        animationRef.current = requestAnimationFrame(visualize);
    };

    // Control visualization
    useEffect(() => {
        if (isActive && analyser) {
            shouldVisualizeRef.current = true;
            visualize();
        } else {
            shouldVisualizeRef.current = false;
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            // Reset all bars to 4px when not active
            visualizerBarsRef.current.forEach(bar => {
                bar.style.height = '4px';
            });
        }
        
        return () => {
            shouldVisualizeRef.current = false;
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isActive, analyser]);

    return (
        <div 
            className={`audio-visualizer ${isActive ? 'active' : ''} ${className}`}
            style={{
                height: `${height}px`,
                ...style
            }}
        >
            <div 
                ref={visualizerRef}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: '2px',
                    padding: '0 20px'
                }}
            />
        </div>
    );
};