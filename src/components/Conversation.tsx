// Conversation.tsx
import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { Message, convertResponseOutputEventToMessageData } from './Message';
import { MemoryTagGraph } from './MemoryTagGraph';
import { useAutoScroll } from '../hooks/useAutoScroll';
import type { TaskState } from '../hooks/useTaskState';
import './style.scss';

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
}) => {
    const { containerRef, scrollToBottom, handleScroll } = useAutoScroll<HTMLDivElement>();
    const previousMessageCount = useRef(taskState.messages.length);
    const messagesRef = useRef<HTMLDivElement>(null);
    const [messagePositions, setMessagePositions] = useState<number[]>([]);
    const [fullHeight, setFullHeight] = useState(500);
    const [filteredTag, setFilteredTag] = useState<string | null>(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
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
        let messageIndex = 0;

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
                messageIndex++;
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


    const handleGraphNodeClick = (positionIndex: number) => {
        const y = messagePositions[positionIndex] - 100; // Offset for header
        containerRef.current?.scrollTo({ top: y, behavior: 'smooth' });
    };

    const handleGraphNodeHover = (messageId: string | null) => {
        setHighlightedMessageId(messageId);
    };

    const seenTags = new Set<string>();
    const messageElements = taskState.messages
        .filter(event => {
            if (!filteredTag) return true;
            const tags = getMessageTags(event.message.id);
            return tags.includes(filteredTag);
        })
        .map((event, index) => {
            const messageId = event.message.id;
            const tags = getMessageTags(messageId);
            const newTags = tags.filter(tag => !seenTags.has(tag));
            newTags.forEach(tag => seenTags.add(tag));
            const summary = getMessageSummary(messageId);
            const requestId = event.request_id;
            const messageData = convertResponseOutputEventToMessageData(event, tags, requestId ? taskState.requestAgents?.get(requestId) : undefined, summary);

            const intros = newTags.map(tag => {
                const topicData = taskState.memoryData?.currentState?.topicTags?.[tag];
                const description = topicData?.description || '';
                const color = TAG_COLORS[Array.from(seenTags).indexOf(tag) % TAG_COLORS.length];

                return (
                    <div key={`tag-intro-${tag}-${index}`} 
                         className="tag-introduction" 
                         style={{
                             background: 'none',
                             border: 'none',
                             padding: '4px 0 4px 0px',
                             margin: '8px 0',
                             cursor: 'default',
                         }}>
                        <div className="tag-header" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            {/* Removed the dot circle */}
                            <h4 className="tag-name" style={{ 
                                color: `rgb(${color})`,
                                margin: 0,
                                fontSize: '13px',
                                fontWeight: 500 
                            }}>{tag.replace(/_/g, ' ')}</h4>
                        </div>
                        {description && <p className="tag-description" style={{ 
                            color: '#d1d5db',
                            fontSize: '12px',
                            margin: '4px 0 0',
                            lineHeight: '1.3' 
                        }}>{description}</p>}
                    </div>
                );
            });

            return [
                ...intros,
                <Message
                    key={messageData.id || `msg-${index}`}
                    message={messageData}
                    className={`${messageClassName} ${highlightedMessageId === messageData.id ? 'highlighted' : ''} ${tags.length > 0 ? 'tagged-message' : ''}`}
                    isCompact={isCompact}
                />
            ];
        }).flat();

    return (
        <div className={`conversation ${className}`}>
            <div 
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
                            />
                        </div>
                    )}
                    <div className="messages" ref={messagesRef}>
                        {taskState.messages.length === 0 ? (
                            <div className="empty-state">
                                {emptyMessage}
                            </div>
                        ) : messageElements}
                    </div>
                </div>
            </div>
        </div>
    );
};