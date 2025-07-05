import React, { useEffect, useRef, useState } from 'react';
import './style.scss';

export interface AudioVisualizerProps {
    /** Audio context for frequency analysis */
    audioContext?: AudioContext;
    /** Audio analyzer node */
    analyser?: AnalyserNode;
    /** Number of bars to display (will be auto-calculated if not provided) */
    barCount?: number;
    /** Height of the visualizer container */
    height?: number;
    /** Minimum bar height */
    minBarHeight?: number;
    /** Maximum bar height */
    maxBarHeight?: number;
    /** Whether to mirror bars from center (symmetric display) */
    symmetric?: boolean;
    /** Animation speed in milliseconds */
    /** Whether the visualizer is active */
    isActive?: boolean;
    /** Custom bar width */
    barWidth?: number;
    /** Gap between bars */
    barGap?: number;
    /** CSS class name */
    className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
    audioContext,
    analyser,
    barCount,
    height = 120,
    minBarHeight = 4,
    maxBarHeight = 100,
    symmetric = true,
    isActive = false,
    barWidth = 3,
    barGap = 2,
    className = ''
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const [bars, setBars] = useState<number[]>([]);
    const [calculatedBarCount, setCalculatedBarCount] = useState(32);

    // Calculate bar count based on container width
    useEffect(() => {
        if (!containerRef.current) return;
        
        const updateBarCount = () => {
            const containerWidth = containerRef.current?.offsetWidth || 800;
            const pixelsPerBar = barWidth + barGap;
            const calculatedCount = Math.min(64, Math.max(16, Math.floor(containerWidth / pixelsPerBar)));
            setCalculatedBarCount(barCount || calculatedCount);
        };

        updateBarCount();
        window.addEventListener('resize', updateBarCount);
        return () => window.removeEventListener('resize', updateBarCount);
    }, [barCount, barWidth, barGap]);

    // Initialize bars array
    useEffect(() => {
        setBars(new Array(calculatedBarCount).fill(minBarHeight));
    }, [calculatedBarCount, minBarHeight]);

    // Animation loop
    useEffect(() => {
        if (!isActive || !analyser) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            setBars(new Array(calculatedBarCount).fill(minBarHeight));
            return;
        }

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const animate = () => {
            analyser.getByteFrequencyData(dataArray);
            
            // Focus on voice frequency range (80Hz-2000Hz)
            const sampleRate = audioContext?.sampleRate || 44100;
            const freqPerBin = sampleRate / (bufferLength * 2);
            const startBin = Math.floor(80 / freqPerBin);
            const endBin = Math.floor(2000 / freqPerBin);
            
            const voiceFreqData = dataArray.slice(startBin, endBin);
            const newBars = new Array(calculatedBarCount);
            
            for (let i = 0; i < calculatedBarCount; i++) {
                const dataIndex = Math.floor((i / calculatedBarCount) * voiceFreqData.length);
                const value = voiceFreqData[dataIndex] || 0;
                const barHeight = Math.max(minBarHeight, (value / 255) * maxBarHeight);
                newBars[i] = barHeight;
            }
            
            setBars(newBars);
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isActive, analyser, audioContext, calculatedBarCount, minBarHeight, maxBarHeight]);

    const renderBars = () => {
        if (symmetric) {
            // Create symmetric display from center
            const halfCount = Math.floor(calculatedBarCount / 2);
            const leftBars = bars.slice(0, halfCount);
            const rightBars = [...leftBars].reverse();
            const allBars = [...leftBars, ...rightBars];
            
            return allBars.map((height, index) => (
                <div
                    key={index}
                    className="audio-bar"
                    style={{
                        height: `${height}px`,
                        width: `${barWidth}px`,
                        marginRight: index < allBars.length - 1 ? `${barGap}px` : '0'
                    }}
                />
            ));
        } else {
            return bars.map((height, index) => (
                <div
                    key={index}
                    className="audio-bar"
                    style={{
                        height: `${height}px`,
                        width: `${barWidth}px`,
                        marginRight: index < bars.length - 1 ? `${barGap}px` : '0'
                    }}
                />
            ));
        }
    };

    return (
        <div 
            ref={containerRef}
            className={`audio-visualizer ${isActive ? 'active' : ''} ${className}`}
            style={{ height: `${height}px` }}
        >
            {renderBars()}
        </div>
    );
};