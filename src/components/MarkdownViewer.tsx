import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import './MarkdownViewer.scss';

interface UrlMapping {
    localPath: string;
    publicUrl: string;
}

interface MarkdownViewerProps {
    filePaths: string[];
    urlMappings?: UrlMapping[];
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ filePaths, urlMappings = [] }) => {
    const [contents, setContents] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [expandedFile, setExpandedFile] = useState<string | null>(null);
    const [ReactMarkdown, setReactMarkdown] = useState<any>(null);
    const [isClient, setIsClient] = useState(false);

    // Check if we're on the client side and load ReactMarkdown
    useEffect(() => {
        setIsClient(true);
        import('react-markdown').then((module) => {
            setReactMarkdown(() => module.default);
        });
    }, []);

    useEffect(() => {
        filePaths.forEach(async (filePath) => {
            if (contents[filePath] || loading[filePath]) return;

            setLoading(prev => ({ ...prev, [filePath]: true }));
            
            try {
                // Apply URL mappings
                let fetchUrl = filePath;
                for (const mapping of urlMappings) {
                    if (filePath.startsWith(mapping.localPath)) {
                        fetchUrl = filePath.replace(mapping.localPath, mapping.publicUrl);
                        break;
                    }
                }
                
                const response = await fetch(fetchUrl, {
                    mode: 'cors',
                    headers: {
                        'Accept': 'text/plain, text/markdown, */*'
                    }
                });
                if (!response.ok) {
                    throw new Error(`Failed to load ${filePath}: ${response.status} ${response.statusText}`);
                }
                const text = await response.text();
                
                // Check if we got HTML instead of markdown (common in dev environments)
                if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
                    throw new Error(`File not accessible: ${filePath} (got HTML response)`);
                }
                
                setContents(prev => ({ ...prev, [filePath]: text }));
            } catch (error) {
                let errorMessage = 'Failed to load file';
                if (error instanceof Error) {
                    errorMessage = error.message;
                    // Add specific message for CORS errors
                    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                        errorMessage = `CORS error: Unable to load ${filePath}. The server needs to allow cross-origin requests.`;
                    }
                }
                setErrors(prev => ({ ...prev, [filePath]: errorMessage }));
            } finally {
                setLoading(prev => ({ ...prev, [filePath]: false }));
            }
        });
    }, [filePaths, urlMappings]);

    if (filePaths.length === 0) return null;

    return (
        <>
            <div className="markdown-viewer-container">
                {filePaths.map((filePath) => {
                    const fileName = filePath.split('/').pop() || filePath;
                    
                    return (
                        <div key={filePath} className="markdown-viewer-box">
                            <div className="markdown-viewer-header">
                                <span className="markdown-viewer-filename">{fileName}</span>
                                <button 
                                    className="markdown-viewer-expand"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setExpandedFile(filePath);
                                    }}
                                    title="Expand"
                                >
                                    <svg viewBox="0 0 512 512" width="16" height="16" fill="currentColor"><path d="M344 0L488 0c13.3 0 24 10.7 24 24l0 144c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87L327 41c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512L24 512c-13.3 0-24-10.7-24-24L0 344c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39 87-87c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8z"/></svg>
                                </button>
                            </div>
                            <div className="markdown-viewer-content">
                                {loading[filePath] && <div className="markdown-viewer-loading">Loading...</div>}
                                {errors[filePath] && <div className="markdown-viewer-error">{errors[filePath]}</div>}
                                {contents[filePath] && ReactMarkdown && isClient && (
                                    <ReactMarkdown>{contents[filePath]}</ReactMarkdown>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {expandedFile && contents[expandedFile] && (
                <Modal
                    isOpen={true}
                    onClose={() => setExpandedFile(null)}
                    contentClassName="markdown-modal"
                >
                    <div className="markdown-viewer-modal-content">
                        <h2 className="markdown-viewer-modal-title">{expandedFile.split('/').pop() || expandedFile}</h2>
                        {ReactMarkdown && isClient && (
                            <ReactMarkdown>{contents[expandedFile]}</ReactMarkdown>
                        )}
                    </div>
                </Modal>
            )}
        </>
    );
};