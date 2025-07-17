import React, { useState } from 'react';
import { Modal } from './Modal';

interface UrlMapping {
    localPath: string;
    publicUrl: string;
}

interface MessageImagesProps {
    content: string;
    urlMappings?: UrlMapping[];
}

const extractImageUrls = (text: string, urlMappings: UrlMapping[] = []): string[] => {
    const urls: string[] = [];
    
    // Extract URLs from markdown images ![alt](url)
    const markdownImageRegex = /!\[.*?\]\((.*?)\)/g;
    let markdownMatch;
    while ((markdownMatch = markdownImageRegex.exec(text)) !== null) {
        let imagePath = markdownMatch[1];
        
        // Apply URL mappings
        for (const mapping of urlMappings) {
            if (imagePath.startsWith(mapping.localPath)) {
                imagePath = imagePath.replace(mapping.localPath, mapping.publicUrl);
                break;
            }
        }
        
        if (!urls.includes(imagePath)) {
            urls.push(imagePath);
        }
    }
    
    // Extract all URLs (http/https/data URLs)
    // Simple regex: any URL that ends with an image extension (with optional query params)
    const urlRegex = /https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|svg|webp|bmp)(?:\?[^\s]*)*/gi;
    let urlMatch;
    while ((urlMatch = urlRegex.exec(text)) !== null) {
        let url = urlMatch[0];
        // Clean up the URL - remove trailing punctuation or whitespace
        url = url.trim().replace(/[,;)\]}>]$/, '');
        if (!urls.includes(url)) {
            urls.push(url);
        }
    }
    
    // Also handle data URLs
    const dataUrlRegex = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/gi;
    let dataMatch;
    while ((dataMatch = dataUrlRegex.exec(text)) !== null) {
        if (!urls.includes(dataMatch[0])) {
            urls.push(dataMatch[0]);
        }
    }
    
    // Extract file paths that might be images
    // More specific regex to avoid matching entire content blocks
    // This regex looks for paths that start with / and end with image extensions
    // but excludes paths that are preceded by too much text (using negative lookbehind approximation)
    const filePathRegex = /(?:^|\s|[\n\r]|[`"'()[\]{}])(\/[^\s<>"\n\r`"'()[\]{}]+\.(?:png|jpg|jpeg|gif|svg|webp|bmp))(?=\s|$|[\n\r]|[`"'()[\]{}])/gim;
    let fileMatch;
    while ((fileMatch = filePathRegex.exec(text)) !== null) {
        let imagePath = fileMatch[1].trim();
        
        // Apply URL mappings
        for (const mapping of urlMappings) {
            if (imagePath.startsWith(mapping.localPath)) {
                imagePath = imagePath.replace(mapping.localPath, mapping.publicUrl);
                break;
            }
        }
        
        if (!urls.includes(imagePath)) {
            urls.push(imagePath);
        }
    }
    
    return urls;
};

export const MessageImages: React.FC<MessageImagesProps> = ({ content, urlMappings = [] }) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const imageUrls = extractImageUrls(content, urlMappings);
    
    if (imageUrls.length === 0) {
        return null;
    }
    
    return (
        <>
            <div className="message-images">
                {imageUrls.map((url, index) => (
                    <div 
                        key={index} 
                        className="message-image-container transparent-grid-bg"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedImage(url);
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <img 
                            src={url} 
                            alt={`Image ${index + 1}`}
                            className="message-image"
                            onError={(e) => {
                                // Hide images that fail to load
                                const target = e.target as HTMLElement;
                                target.style.display = 'none';
                            }}
                        />
                    </div>
                ))}
            </div>
            
            {selectedImage && (
                <Modal
                    isOpen={true}
                    onClose={() => setSelectedImage(null)}
                    contentClassName="image-modal transparent-grid-bg-large"
                >
                    <img 
                        src={selectedImage} 
                        alt="Preview"
                    />
                </Modal>
            )}
        </>
    );
};