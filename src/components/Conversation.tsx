// Conversation.tsx
import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { Message, convertResponseOutputEventToMessageData, UrlMapping } from './Message';
import { MemoryTagGraph } from './MemoryTagGraph';
import { TagIntroduction } from './TagIntroduction';
import { useAutoScroll } from '../hooks/useAutoScroll';
import type { TaskState } from '../hooks/useTaskState';
import './style.scss';
import { NoContent } from './NoContent';

export interface ConversationProps {
    taskState: TaskState;
    isStreaming?: boolean;
    isCompact?: boolean;
    emptyMessage?: string;
    className?: string;
    containerClassName?: string;
    messageClassName?: string;
    autoScroll?: boolean;
    maxHeight?: string;
    urlMappings?: UrlMapping[];
    isLoading?: boolean;
}

const TAG_COLORS = [
    '165, 180, 252', // softer indigo
    '110, 231, 183', // softer green
    '252, 211, 77', // softer yellow
    '248, 113, 113', // softer red
    '196, 181, 253', // softer purple
    '251, 113, 133', // softer pink
    '103, 232, 249', // softer cyan
    '190, 242, 100' // softer lime
];

// Spacing for branch visual separation
// const BRANCH_SPACING = 20; // Extra space before tag introductions and after branch ends - TODO: implement branch spacing

// Function to convert tag names to title case with intelligent capitalization
const formatTagName = (tag: string): string => {
    // Common abbreviations that should be fully capitalized
    const abbreviations = new Set([
        'ai', 'api', 'id', 'ui', 'ux', 'url', 'uri', 'http', 'https',
        'sql', 'css', 'html', 'xml', 'json', 'yaml', 'yml', 'csv',
        'pdf', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'mp3', 'mp4',
        'cpu', 'gpu', 'ram', 'ssd', 'hdd', 'os', 'io', 'ip',
        'dns', 'vpn', 'ssl', 'tls', 'ssh', 'ftp', 'sftp',
        'aws', 'gcp', 'azure', 'sdk', 'cli', 'gui', 'ide',
        'llm', 'nlp', 'ml', 'dl', 'rl', 'cv', 'ocr',
        'jwt', 'oauth', 'saml', 'ldap', 'sso', 'mfa', '2fa',
        'ci', 'cd', 'devops', 'qa', 'qr', 'ar', 'vr', 'xr',
        'db', 'dbms', 'orm', 'odm', 'crud', 'rest', 'graphql',
        'tcp', 'udp', 'ws', 'wss', 'rpc', 'grpc', 'mqtt'
    ]);
    
    // Words that should not be capitalized in title case (unless at start)
    const minorWords = new Set([
        'a', 'an', 'the', 'and', 'or', 'but', 'for', 'nor', 'so', 'yet',
        'as', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'to',
        'with', 'within', 'without', 'via', 'vs', 'versus'
    ]);
    
    return tag
        .replace(/_/g, ' ')
        .split(' ')
        .map((word, index) => {
            const lowerWord = word.toLowerCase();
            
            // Always capitalize first word
            if (index === 0) {
                return abbreviations.has(lowerWord) 
                    ? word.toUpperCase() 
                    : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }
            
            // Check if it's an abbreviation
            if (abbreviations.has(lowerWord)) {
                return word.toUpperCase();
            }
            
            // Check if it's a minor word
            if (minorWords.has(lowerWord)) {
                return lowerWord;
            }
            
            // Otherwise, capitalize first letter
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
};

export const Conversation: React.FC<ConversationProps> = ({
    taskState,
    isStreaming = false,
    isCompact = false,
    emptyMessage = 'No messages yet.',
    className = '',
    containerClassName = '',
    messageClassName = '',
    autoScroll = true,
    maxHeight = '100%',
    urlMappings = [],
    isLoading = false,
}) => {
    const { containerRef, scrollToBottom, handleScroll } = useAutoScroll<HTMLDivElement>();
    const previousMessageCount = useRef(taskState.messages.length);
    const messagesRef = useRef<HTMLDivElement>(null);
    const [messagePositions, setMessagePositions] = useState<number[]>([]);
    const [fullHeight, setFullHeight] = useState(500);
    // const [filteredTag, setFilteredTag] = useState<string | null>(null); // TODO: implement tag filtering
    const [highlightedMessageId] = useState<string | null>(null); // setHighlightedMessageId - TODO: implement message highlighting
    const [graphWidth, setGraphWidth] = useState(40);

    const showGraph = true; // Always show graph for now

    // Custom debounce function (no external deps)
    const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        return (...args: Parameters<T>): void => {
            if (timeout !== null) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    // Debounced measure
    const measurePositions = useCallback(debounce(() => {
        if (!messagesRef.current) return;

        const messagesContainer = messagesRef.current;
        const positionElements = messagesContainer.querySelectorAll('.message .message-avatar, .tag-introduction');
        const newPositions: number[] = [];
        // let messageIndex = 0;

        positionElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const containerRect = messagesContainer.getBoundingClientRect();
            if (el.classList.contains('tag-introduction')) {
                // Find the tag-header h4 element within the tag-introduction
                const tagHeader = el.querySelector('.tag-header h4');
                if (tagHeader) {
                    const headerRect = tagHeader.getBoundingClientRect();
                    const relativeCenter = (headerRect.top + headerRect.height / 2) - containerRect.top + messagesContainer.scrollTop;
                    newPositions.push(relativeCenter);
                } else {
                    // Fallback to original behavior
                    const relativeCenter = (rect.top + rect.height / 2) - containerRect.top + messagesContainer.scrollTop;
                    newPositions.push(relativeCenter);
                }
            } else {
                const relativeTop = rect.top - containerRect.top + messagesContainer.scrollTop;
                const centerY = relativeTop + (rect.height / 2);
                newPositions.push(centerY);
                // messageIndex++;
            }
        });

        // Only set positions if we have meaningful values
        if (newPositions.length > 0 && newPositions.some(p => p > 0)) {
            const positionsChanged = newPositions.length !== messagePositions.length ||
                newPositions.some((p, i) => Math.abs(p - (messagePositions[i] ?? 0)) > 1);

            if (positionsChanged) {
                setMessagePositions(newPositions);
            }
        }

        const calculatedHeight = Math.max(messagesContainer.scrollHeight, 500);
        if (Math.abs(calculatedHeight - fullHeight) > 1) {
            setFullHeight(calculatedHeight);
        }
    }, 100), [messagePositions, fullHeight]);

    useLayoutEffect(measurePositions);

    useEffect(() => {
        if (!messagesRef.current) return;

        const messagesContainer = messagesRef.current;
        const observer = new ResizeObserver(measurePositions);
        observer.observe(messagesContainer);

        const elements = messagesContainer.querySelectorAll('.message .message-avatar, .tag-introduction');
        elements.forEach((el) => {
            observer.observe(el as Element);
            // Also observe the h4 tag header if it's a tag-introduction
            if (el.classList.contains('tag-introduction')) {
                const tagHeader = el.querySelector('.tag-header h4');
                if (tagHeader) {
                    observer.observe(tagHeader as Element);
                }
            }
        });

        return () => observer.disconnect();
    }, [taskState.messages.length, measurePositions]);

    const getMessageTags = (messageId?: string): string[] => {
        if (!messageId || !taskState.memoryData?.currentState?.taggedMessages) return [];
        
        const taggedMessages = taskState.memoryData.currentState.taggedMessages instanceof Map 
            ? taskState.memoryData.currentState.taggedMessages 
            : new Map(Object.entries(taskState.memoryData.currentState.taggedMessages || {}));
        
        const messageMetadata = taggedMessages.get(messageId);
        return messageMetadata?.topic_tags || [];
    };

    const getMessageSummary = (messageId?: string): string | undefined => {
        if (!messageId || !taskState.memoryData?.currentState?.taggedMessages) return undefined;
        
        const taggedMessages = taskState.memoryData.currentState.taggedMessages instanceof Map 
            ? taskState.memoryData.currentState.taggedMessages 
            : new Map(Object.entries(taskState.memoryData.currentState.taggedMessages || {}));
        
        const messageMetadata = taggedMessages.get(messageId);
        return messageMetadata?.thread_summary || messageMetadata?.summary;
    };

    useEffect(() => {
        if (autoScroll && (
            taskState.messages.length > previousMessageCount.current || 
            isStreaming
        )) {
            scrollToBottom();
        }
        previousMessageCount.current = taskState.messages.length;
    }, [taskState.messages, isStreaming, autoScroll, scrollToBottom]);


    // const handleGraphNodeClick = (positionIndex: number) => {
    //     const y = messagePositions[positionIndex] - 100; // Offset for header
    //     containerRef.current?.scrollTo({ top: y, behavior: 'smooth' });
    // };

    // const handleGraphNodeHover = (messageId: string | null) => {
    //     setHighlightedMessageId(messageId);
    // };

    const seenTags = new Set<string>();
    const processedMessages = new Set<string>(); // Track processed messages to avoid duplicates
    
    const messageElements = taskState.messages
        .filter(event => {
            // Only filter out thinking messages that have empty thinking_content
            if (event.message.type === 'thinking') {
                // Check if thinking message has actual content
                const content = (event.message as any).content;
                if (!content) return false;
                
                // Handle string content
                if (typeof content === 'string' && content.trim() === '') return false;
                
                // Handle array content
                if (Array.isArray(content)) {
                    const hasContent = content.some((item: any) => {
                        if (typeof item === 'string') return item.trim() !== '';
                        if (item && typeof item === 'object' && 'text' in item) {
                            return item.text.trim() !== '';
                        }
                        return false;
                    });
                    if (!hasContent) return false;
                }
            }
            
            // if (!filteredTag) return true;
            // const tags = getMessageTags(event.message.id);
            // return tags.includes(filteredTag);
            return true; // TODO: implement tag filtering
        })
        .map((event, index) => {
            const messageId = event.message.id;
            
            // Skip if this is a tool result that will be grouped with its call
            if (event.message.type === 'function_call_output') {
                const funcResult = event.message as any;
                const callId = funcResult.call_id || funcResult.id;
                
                // Check if there's a corresponding tool call
                const hasToolCall = taskState.messages.some(m => {
                    if (m.message.type === 'function_call') {
                        const funcCall = m.message as any;
                        return (funcCall.call_id || funcCall.id) === callId;
                    }
                    return false;
                });
                
                if (hasToolCall) {
                    // This result will be grouped with its call, skip rendering it separately
                    return null;
                }
            }
            
            // Skip if already processed
            if (messageId && processedMessages.has(messageId)) {
                return null;
            }
            if (messageId) {
                processedMessages.add(messageId);
            }
            
            const tags = getMessageTags(messageId);
            const newTags = tags.filter(tag => !seenTags.has(tag));
            newTags.forEach(tag => seenTags.add(tag));
            const summary = getMessageSummary(messageId);
            const requestId = event.request_id;
            let messageData = convertResponseOutputEventToMessageData(event, tags, requestId ? taskState.requestAgents?.get(requestId) : undefined, summary);
            
            // If this is a tool call, look for its result
            if (event.message.type === 'function_call') {
                const funcCall = event.message as any;
                const callId = funcCall.call_id || funcCall.id;
                
                // Find the corresponding result
                const resultEvent = taskState.messages.find((m, idx) => {
                    if (idx > index && m.message.type === 'function_call_output') {
                        const funcResult = m.message as any;
                        return (funcResult.call_id || funcResult.id) === callId;
                    }
                    return false;
                });
                
                if (resultEvent) {
                    // Add the result to the messageData
                    const resultData = convertResponseOutputEventToMessageData(
                        resultEvent, 
                        getMessageTags(resultEvent.message.id), 
                        resultEvent.request_id ? taskState.requestAgents?.get(resultEvent.request_id) : undefined,
                        getMessageSummary(resultEvent.message.id)
                    );
                    
                    // Combine the tool call and result
                    messageData = {
                        ...messageData,
                        toolResult: resultData
                    };
                    
                    // Mark the result as processed
                    if (resultEvent.message.id) {
                        processedMessages.add(resultEvent.message.id);
                    }
                }
            }

            const intros = newTags.map(tag => {
                const topicData = taskState.memoryData?.currentState?.topicTags?.[tag];
                const description = topicData?.description || '';
                const color = TAG_COLORS[Array.from(seenTags).indexOf(tag) % TAG_COLORS.length];

                return (
                    <TagIntroduction
                        key={`tag-intro-${tag}-${index}`}
                        tag={tag}
                        description={description}
                        color={color}
                        formatTagName={formatTagName}
                    />
                );
            });

            // Check if this is the last message in a branch
            let isBranchEnd = false;
            if (tags.length > 0) {
                // Collect union of all tags from future non-skipped messages
                const futureUnion = new Set<string>();
                let nextIndex = index + 1;
                while (nextIndex < taskState.messages.length) {
                    const nextEvent = taskState.messages[nextIndex];
                    // Skip tool results that will be grouped
                    if (nextEvent.message.type === 'function_call_output') {
                        const funcResult = nextEvent.message as any;
                        const callId = funcResult.call_id || funcResult.id;
                        const hasToolCall = taskState.messages.some(m => {
                            if (m.message.type === 'function_call') {
                                const funcCall = m.message as any;
                                return (funcCall.call_id || funcCall.id) === callId;
                            }
                            return false;
                        });
                        if (hasToolCall) {
                            nextIndex++;
                            continue;
                        }
                    }
                    
                    const nextTags = getMessageTags(nextEvent.message.id);
                    nextTags.forEach(tag => futureUnion.add(tag));
                    nextIndex++;
                }
                
                // Branch ends if ANY current tag is not in the future union
                isBranchEnd = !tags.every(tag => futureUnion.has(tag));
            }

            return [
                ...intros,
                <Message
                    key={messageData.id || `msg-${index}`}
                    message={messageData}
                    className={`${messageClassName} ${highlightedMessageId === messageData.id ? 'highlighted' : ''} ${tags.length > 0 ? 'tagged-message' : ''} ${isBranchEnd ? 'branch-end' : ''}`}
                    isCompact={isCompact}
                    urlMappings={urlMappings}
                />
            ];
        })
        .filter(Boolean) // Remove null entries
        .flat();

    return (
        <div className={`conversation ${className}`}>
            {taskState.messages.length === 0 ? (
                <NoContent message={emptyMessage} />
            ) : <div 
                ref={containerRef}
                className={`conversation-container ${showGraph ? 'with-graph' : ''} ${containerClassName}`}
                onScroll={handleScroll}
                style={{ 
                    maxHeight,
                    overflowY: 'auto',
                    scrollBehavior: 'smooth'
                }}
            >
                <div className="conversation-wrapper">
                    {showGraph && messagePositions.length > 0 && (
                        <div className="memory-tag-graph-wrapper" style={{ width: graphWidth }}>
                            <MemoryTagGraph 
                                messages={taskState.messages}
                                memoryData={taskState.memoryData}
                                messagePositions={messagePositions}
                                fullHeight={fullHeight}
                                onWidthChange={setGraphWidth}
                                isStreaming={isStreaming}
                                isLoading={isLoading || taskState.isLoading}
                            />
                        </div>
                    )}
                    <div className="messages" ref={messagesRef}>
                        {messageElements}
                        {(isLoading || taskState.isLoading) && (
                            <div className="loading-indicator">
                                <div className="loading-dots">
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>}
        </div>
    );
};