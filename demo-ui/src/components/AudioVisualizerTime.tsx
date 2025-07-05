import React, { useEffect, useRef } from 'react';
import './style.scss';

export interface AudioVisualizerTimeProps {
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
    /** Bar count (not used - always 64) */
    barCount?: number;
}

export const AudioVisualizerTime: React.FC<AudioVisualizerTimeProps> = ({
    analyser,
    isActive = false,
    height = 120,
    className = '',
    style,
    audioContext: _audioContext,
    barCount: _barCount
}) => {
    const visualizerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const visualizerBars = useRef<HTMLDivElement[]>([]);

    // Create visualizer bars - EXACT copy from original
    useEffect(() => {
        if (!visualizerRef.current) return;
        
        const visualizer = visualizerRef.current;
        const barCount = 64;
        
        // Clear existing bars
        visualizer.innerHTML = '';
        visualizerBars.current = [];
        
        for (let i = 0; i < barCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'audio-bar';
            bar.style.height = '4px';
            bar.style.flex = '1';
            visualizer.appendChild(bar);
            visualizerBars.current.push(bar);
        }
    }, []);

    // Visualize audio - EXACT copy from original
    useEffect(() => {
        const visualize = () => {
            if (!analyser || !isActive) return;

            const dataArray = new Uint8Array(analyser.fftSize);
            analyser.getByteTimeDomainData(dataArray);

            // Update bars
            for (let i = 0; i < visualizerBars.current.length; i++) {
                const index = Math.floor(i * dataArray.length / visualizerBars.current.length);
                const value = dataArray[index];
                const amplitude = Math.abs(value - 128);
                const height = Math.max(4, amplitude * 0.8);
                visualizerBars.current[i].style.height = height + 'px';
            }

            animationRef.current = requestAnimationFrame(visualize);
        };

        if (isActive && analyser) {
            visualize();
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            // Reset all bars to 4px when not active
            visualizerBars.current.forEach(bar => {
                bar.style.height = '4px';
            });
        }
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isActive, analyser]);

    return (
        <div 
            className={`audio-visualizer-container ${className}`}
            style={{
                display: isActive ? 'block' : 'none',
                height: `${height}px`,
                background: '#f0f0f0',
                borderRadius: '8px',
                margin: '20px 0',
                position: 'relative',
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