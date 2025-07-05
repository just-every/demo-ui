import React, { useRef, useState, useEffect } from 'react';
import { GlassButton } from './GlassButton';
import './style.scss';

export interface AudioPlayerProps {
    /** Audio source URL or blob */
    src?: string | Blob;
    /** Whether the player is in streaming mode */
    isStreaming?: boolean;
    /** Whether to show download button */
    showDownload?: boolean;
    /** Download filename */
    downloadFileName?: string;
    /** Whether to autoplay when src changes */
    autoPlay?: boolean;
    /** Whether to show controls */
    controls?: boolean;
    /** Callback when playback starts */
    onPlay?: () => void;
    /** Callback when playback pauses */
    onPause?: () => void;
    /** Callback when playback ends */
    onEnded?: () => void;
    /** Custom className */
    className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
    src,
    isStreaming = false,
    showDownload = true,
    downloadFileName,
    autoPlay = false,
    controls = true,
    onPlay,
    onPause,
    onEnded,
    className = ''
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | undefined>();

    // Handle src changes
    useEffect(() => {
        if (src) {
            if (typeof src === 'string') {
                setAudioUrl(src);
            } else {
                const url = URL.createObjectURL(src);
                setAudioUrl(url);
                return () => URL.revokeObjectURL(url);
            }
        } else {
            setAudioUrl(undefined);
        }
    }, [src]);

    // Audio event handlers
    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handlePlay = () => {
        setIsPlaying(true);
        onPlay?.();
    };

    const handlePause = () => {
        setIsPlaying(false);
        onPause?.();
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        onEnded?.();
    };

    const handleDownload = () => {
        if (!audioUrl) return;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = downloadFileName || `audio-${timestamp}.wav`;
        
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = filename;
        a.click();
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    if (!audioUrl && !isStreaming) {
        return null;
    }

    return (
        <div className={`audio-player-section ${className}`}>
            <div className="audio-player-header">
                <span className="audio-status">
                    {isStreaming ? 'Streaming...' : 'Ready to play'}
                </span>
                {showDownload && audioUrl && (
                    <GlassButton
                        onClick={handleDownload}
                        variant="success"
                        className="download-btn"
                    >
                        📥 Download
                    </GlassButton>
                )}
            </div>
            
            {audioUrl && (
                <>
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        autoPlay={autoPlay}
                        controls={controls}
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onEnded={handleEnded}
                        className="audio-player"
                    />
                    
                    {!controls && (
                        <div className="custom-audio-controls">
                            <div className="time-display">
                                <span>{formatTime(currentTime)}</span>
                                <span>/</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                            
                            <div className="progress-container">
                                <div className="progress-track">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
            
            {isStreaming && !audioUrl && (
                <div className="streaming-placeholder">
                    <div className="streaming-indicator">
                        <span>🎵</span>
                        <span>Generating audio...</span>
                    </div>
                </div>
            )}
        </div>
    );
};