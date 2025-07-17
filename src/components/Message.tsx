// Message.tsx
import React from 'react';
import { MessageAvatar } from './MessageAvatar';
import { MessageContent } from './MessageContent';
import { MessageMetadata } from './MessageMetadata';
import { MessageImages } from './MessageImages';
import { MarkdownViewer } from './MarkdownViewer';
import { ToolCallData } from './ToolCall';
import type { ResponseOutputEvent, ResponseInputItem } from '@just-every/ensemble';
import './style.scss';
import type { RequestAgent } from '../utils/taskEventProcessor';

export interface UrlMapping {
    localPath: string;
    publicUrl: string;
}

export interface MessageData {
    id?: string;  // Unique message ID
    role: string;
    color: string;  // Color for the role, used for styling
    message: ResponseInputItem;
    content: string;
    thinking_content?: string;
    model?: string;
    modelClass?: string;
    tools?: ToolCallData[];
    toolResult?: MessageData;  // Result of the tool call
    streaming?: boolean;
    timestamp?: number | Date;
    // RequestAgent fields
    agentTags?: string[];
    requestCost?: number;
    requestDuration?: number;
    durationWithTools?: number;
    // Additional metadata
    metadata?: Record<string, any>;
}

/**
 * Convert ResponseOutputEvent to MessageData format for display
 */
export function convertResponseOutputEventToMessageData(
    event: ResponseOutputEvent, 
    tags?: string[], 
    requestAgent?: RequestAgent,
    summary?: string
): MessageData {
    const message = event.message;
    
    // Determine role - default to assistant if not specified
    let role = 'Assistant';
    if ('role' in message) {
        role = message.role.charAt(0).toUpperCase() + message.role.slice(1);
    }
    switch (message?.type) {
        case 'thinking':
            role = 'Thinking';
            break;
        case 'function_call':
            role = 'Tool';
            break;
        case 'function_call_output':
            role = 'Result';
            break;
    }

    let color = '255, 255, 255';
    switch (role) {
        case 'User':
            color = '96, 165, 250';
            break;
        case 'Assistant':
            color = '52, 211, 153';
            break;
        case 'Model':
        case 'System':
        case 'Developer':
            color = '245, 101, 101';
            break;
        case 'Thinking':
            color = '167, 139, 250';
            break;
        case 'Tool':
        case 'Result':
            color = '251, 191, 36';
            break;
    }
    
    // Handle content based on message type
    let content = '';
    let thinking_content = '';
    let tools: ToolCallData[] = [];
    
    // Handle different message types
    if (message.type === 'message') {
        // Regular message - has content and role
        if (typeof message.content === 'string') {
            content = message.content;
        } else if (Array.isArray(message.content)) {
            content = message.content.map((item: any) => 
                typeof item === 'string' ? item : item.text || ''
            ).join('');
        }
    } else if (message.type === 'thinking') {
        // Thinking message - content goes to thinking_content
        if (typeof message.content === 'string') {
            thinking_content = message.content;
        } else if (Array.isArray(message.content)) {
            thinking_content = message.content.map((item: any) => 
                typeof item === 'string' ? item : item.text || ''
            ).join('');
        }
    } else if (message.type === 'function_call') {
        // Tool call message
        const funcCall = message as any;
        tools = [{
            id: funcCall.call_id || funcCall.id || 'unknown',
            function: {
                name: funcCall.name || 'unknown',
                arguments: funcCall.arguments || ''
            }
        }];
    } else if (message.type === 'function_call_output') {
        // Tool result message
        const funcResult = message as any;
        content = `${funcResult.output || funcResult.content || 'No output'}`;
    }
    
    return {
        id: message.id,
        role,
        color,
        message,
        content,
        thinking_content,
        tools,
        streaming: message.status === 'in_progress',
        timestamp: message.timestamp ? new Date(message.timestamp) : new Date(event.timestamp || Date.now()),
        model: requestAgent?.agent?.model,
        modelClass: requestAgent?.agent?.modelClass,
        agentTags: requestAgent?.agent?.tags,
        requestCost: requestAgent?.request_cost,
        requestDuration: requestAgent?.request_duration,
        durationWithTools: requestAgent?.duration_with_tools,
        metadata: {
            type: message.type,
            status: message.status,
            request_id: event.request_id,
            tags: tags || [],
            summary: summary
        }
    };
}

export interface MessageProps {
    message: MessageData;
    className?: string;
    isCompact?: boolean;
    urlMappings?: UrlMapping[];
}

export const Message: React.FC<MessageProps> = ({
    message,
    className = '',
    isCompact = false,
    urlMappings = []
}) => {
    // Extract .md file paths from the content
    const extractMarkdownPaths = (content: string): string[] => {
        // Don't try to extract paths if the content looks like it contains HTML or markdown content
        if (content.includes('<!DOCTYPE') || content.includes('<html') || content.includes('```')) {
            return [];
        }
        
        const mdFileRegex = /(?:^|\s)([\w\-./@]+\.md)(?:\s|$)/gm;
        const matches = [];
        let match;
        
        while ((match = mdFileRegex.exec(content)) !== null) {
            const path = match[1];
            // Only include paths that look like valid file paths
            if (path.includes('/') || path.match(/^[\w-]+\.md$/)) {
                matches.push(path);
            }
        }
        
        return [...new Set(matches)]; // Remove duplicates
    };
    
    const fullContent = message.content + (message.thinking_content || '') + (message.toolResult?.content || '');
    const markdownPaths = extractMarkdownPaths(fullContent);
    
    return (
        <div className={`message ${message.role} ${isCompact ? 'compact' : ''} ${className}`}>
            <MessageMetadata message={message} />

            <div className="message-row">
                <MessageAvatar
                    role={message.role}
                    color={message.color}
                    size={36}
                />

                <div className="message-content-wrapper">
                    <MessageContent message={message} />
                    <MessageImages 
                        content={fullContent} 
                        urlMappings={urlMappings} 
                    />
                    <MarkdownViewer filePaths={markdownPaths} urlMappings={urlMappings} />
                </div>
            </div>
        </div>
    );
};