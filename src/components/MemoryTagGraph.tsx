// MemoryTagGraph.tsx
import React, { useMemo, useEffect } from 'react';
import type { ResponseOutputEvent } from '@just-every/ensemble';
import type { MetaMemoryEventData } from '../utils/metaMemoryEventProcessor';
import './style.scss';

export interface MemoryTagGraphProps {
    messages: ResponseOutputEvent[];
    memoryData: MetaMemoryEventData;
    messagePositions: number[];
    fullHeight: number;
    className?: string;
    onWidthChange?: (width: number) => void;
    isStreaming?: boolean;
    isLoading?: boolean;
}

interface TagBranch {
    tag: string;
    color: string;
    introDomIndex?: number;
    messageDoms: number[]; // DOM indices for messages
    messageIds: string[]; // Message IDs for highlighting
    startIndex: number;
    endIndex: number;
    description?: string;
}

const TAG_COLORS = [
    '165, 180, 252',
    '110, 231, 183',
    '252, 211, 77',
    '248, 113, 113',
    '196, 181, 253',
    '251, 113, 133',
    '103, 232, 249',
    '190, 242, 100'
];

const NODE_RADIUS = 3; // Radius for message nodes
const LINE_WIDTH = 4; // Width for message lines
const BRANCH_Y_OFFSET = 70;
const BRANCH_X_OFFSET = 25;
const CONNECTOR_OPACITY = 0.2; // Opacity for connector lines

export const MemoryTagGraph: React.FC<MemoryTagGraphProps> = ({
    messages,
    memoryData,
    messagePositions,
    fullHeight,
    className = '',
    onWidthChange,
    isStreaming = false,
    isLoading = false,
}) => {

    const memoizedData = useMemo(() => {
        const tagMap = new Map<string, TagBranch>();
        const taggedMessages = memoryData?.currentState?.taggedMessages instanceof Map
            ? memoryData.currentState.taggedMessages
            : new Map(Object.entries(memoryData?.currentState?.taggedMessages || {}));
        const topicTags = memoryData?.currentState?.topicTags || {};

        // Compute DOM indices and branch data
        const domIndexForMessage: number[] = new Array(messages.length);
        let currentDomIndex = 0;
        const seenCalc = new Set<string>();
        let minY = Infinity;
        let maxY = -Infinity;

        messages.forEach((message, logicalIndex) => {
            const messageId = message.message.id;
            if (!messageId) return;

            // Only filter out thinking messages that have empty thinking_content
            if (message.message.type === 'thinking') {
                // Check if thinking message has actual content
                const content = (message.message as any).content;
                if (!content) {
                    domIndexForMessage[logicalIndex] = -1; // Mark as skipped
                    return;
                }
                
                // Handle string content
                if (typeof content === 'string' && content.trim() === '') {
                    domIndexForMessage[logicalIndex] = -1; // Mark as skipped
                    return;
                }
                
                // Handle array content
                if (Array.isArray(content)) {
                    const hasContent = content.some((item: any) => {
                        if (typeof item === 'string') return item.trim() !== '';
                        if (item && typeof item === 'object' && 'text' in item) {
                            return item.text.trim() !== '';
                        }
                        return false;
                    });
                    if (!hasContent) {
                        domIndexForMessage[logicalIndex] = -1; // Mark as skipped
                        return;
                    }
                }
            }

            // Skip tool call results that are merged with their tool calls
            if (message.message.type === 'function_call_output') {
                const funcResult = message.message as any;
                const callId = funcResult.call_id || funcResult.id;

                // Check if there's a corresponding tool call
                const hasToolCall = messages.some(m => {
                    if (m.message.type === 'function_call') {
                        const funcCall = m.message as any;
                        return (funcCall.call_id || funcCall.id) === callId;
                    }
                    return false;
                });

                if (hasToolCall) {
                    // This result is merged with its call, skip it
                    domIndexForMessage[logicalIndex] = -1; // Mark as skipped
                    return;
                }
            }

            const messageMetadata = taggedMessages.get(messageId);
            const tags = messageMetadata?.topic_tags || [];

            const newTags = tags.filter((tag: string) => !seenCalc.has(tag));

            newTags.forEach((tag: string, newTagIndex: number) => {
                if (!tagMap.has(tag)) {
                    tagMap.set(tag, {
                        tag,
                        color: TAG_COLORS[tagMap.size % TAG_COLORS.length],
                        introDomIndex: currentDomIndex + newTagIndex,
                        messageDoms: [],
                        messageIds: [],
                        startIndex: logicalIndex,
                        endIndex: logicalIndex,
                        description: topicTags[tag]?.description
                    });
                }
            });

            currentDomIndex += newTags.length;

            const domMessage = currentDomIndex;
            domIndexForMessage[logicalIndex] = domMessage;
            currentDomIndex++;

            // Update min/max y for trunk
            const y = messagePositions[domMessage] || (16 + domMessage * 80 + 18);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);

            tags.forEach((tag: string) => {
                seenCalc.add(tag);
                const branch = tagMap.get(tag)!;
                branch.messageDoms.push(domMessage);
                branch.messageIds.push(messageId);
                branch.startIndex = Math.min(branch.startIndex, logicalIndex);
                branch.endIndex = Math.max(branch.endIndex, logicalIndex);
            });
        });

        // Sort branches by startIndex
        const branches = Array.from(tagMap.values()).sort((a, b) => a.startIndex - b.startIndex);

        // Calculate x positions
        const positions = new Map<string, number>();
        const occupiedColumns: Array<{ start: number; end: number; column: number }> = [];

        branches.forEach(branch => {
            let column = 0;
            let found = false;

            while (!found) {
                found = true;
                for (const occupied of occupiedColumns) {
                    if (!(branch.endIndex < occupied.start || branch.startIndex > occupied.end)) {
                        if (column === occupied.column) {
                            found = false;
                            column++;
                            break;
                        }
                    }
                }
            }

            positions.set(branch.tag, 10 + BRANCH_X_OFFSET + column * BRANCH_X_OFFSET); // Start further for curve space
            occupiedColumns.push({ start: branch.startIndex, end: branch.endIndex, column });
        });

        let adjustedMinY = minY;
        let adjustedMaxY = maxY;
        branches.forEach(branch => {
            const positions = branch.introDomIndex !== undefined ? [branch.introDomIndex, ...branch.messageDoms] : branch.messageDoms;
            if (positions.length > 0) {
                const firstY = messagePositions[positions[0]] || (16 + positions[0] * 80 + 18);
                const lastY = messagePositions[positions[positions.length - 1]] || (16 + positions[positions.length - 1] * 80 + 18);
                const Y_start = firstY - BRANCH_Y_OFFSET;
                const Y_end = lastY + BRANCH_Y_OFFSET;
                adjustedMinY = Math.min(adjustedMinY, Y_start);
                adjustedMaxY = Math.max(adjustedMaxY, Y_end);
            }
        });

        return { tagBranches: branches, branchXPositions: positions, domIndexForMessage, minY, maxY, adjustedMinY, adjustedMaxY };
    }, [messages, memoryData, messagePositions]);

    const { tagBranches, branchXPositions, domIndexForMessage, minY, maxY, adjustedMinY, adjustedMaxY } = memoizedData;

    const trunkX = 10;
    const maxX = branchXPositions.size > 0 ? Math.max(...branchXPositions.values()) : 0;
    const graphWidth = Math.max(40, maxX + 20); // Adjusted for curves

    // Notify parent of width changes
    useEffect(() => {
        if (onWidthChange) {
            onWidthChange(graphWidth);
        }
    }, [graphWidth, onWidthChange]);

    return (
        <div className={`memory-tag-graph ${className}`}>
            <svg
                width={graphWidth}
                height={Math.max(fullHeight, adjustedMaxY + (isLoading ? 50 : 20))}
                style={{ minWidth: '80px' }}
            >
                <defs>
                    {tagBranches.map(branch => {
                        const sanitizedTag = branch.tag.replace(/[^a-zA-Z0-9-]/g, '-');
                        const [r, g, b] = branch.color.split(',').map(c => parseInt(c.trim()));
                        return (
                            <React.Fragment key={`gradient-${sanitizedTag}`}>
                                <linearGradient id={`branch-start-${sanitizedTag}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                                    <stop offset="100%" stopColor={`rgba(${r},${g},${b},0.7)`} />
                                </linearGradient>
                                <linearGradient id={`branch-end-${sanitizedTag}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={`rgba(${r},${g},${b},0.7)`} />
                                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                </linearGradient>
                            </React.Fragment>

                        );
                    })}
                    <linearGradient id="fadeGradient" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                </defs>
                {/* Trunk line */}
                <g className="trunk">
                    {/* A gradient definition that fades from the line color to transparent. */}
                    {/* Using gradientUnits="userSpaceOnUse" to fix rendering bug with vertical paths */}

                    {/* The main solid line */}
                    <path
                        d={`M ${trunkX} ${adjustedMinY} L ${trunkX} ${adjustedMaxY}`}
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth={LINE_WIDTH}
                        strokeLinecap="round"
                    />

                    {/* Static loading indicator with a fading dashed effect */}
                    {isLoading && (
                        <>
                            <defs>
                                <linearGradient 
                                    id="fade-off-gradient" 
                                    gradientUnits="userSpaceOnUse" 
                                    x1={trunkX} 
                                    y1={adjustedMaxY} 
                                    x2={trunkX} 
                                    y2={adjustedMaxY + 80}
                                >
                                    <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                </linearGradient>
                            </defs>
                            <path
                                d={`M ${trunkX} ${adjustedMaxY} L ${trunkX} ${adjustedMaxY + 80}`}
                                fill="none"
                                stroke="url(#fade-off-gradient)" // Applying the gradient here
                                strokeWidth={LINE_WIDTH}
                                strokeLinecap="round"
                                strokeDasharray="7 10"
                                strokeDashoffset="6"
                            />
                        </>
                    )}
                </g>
                {/* Branches */}
                {tagBranches.map(branch => {
                    const x = branchXPositions.get(branch.tag) || 40;
                    const [r, g, b] = branch.color.split(',').map(c => parseInt(c.trim()));
                    const sanitizedTag = branch.tag.replace(/[^a-zA-Z0-9-]/g, '-');
                    const positions = branch.introDomIndex !== undefined ? [branch.introDomIndex, ...branch.messageDoms] : branch.messageDoms;
                    const firstY = messagePositions[positions[0]] || (16 + positions[0] * 80 + 18);
                    const lastY = messagePositions[positions[positions.length - 1]] || (16 + positions[positions.length - 1] * 80 + 18);
                    const Y_start = firstY - BRANCH_Y_OFFSET;
                    const cp1_start = Y_start + BRANCH_Y_OFFSET / 2;
                    const cp2_start = firstY - BRANCH_Y_OFFSET / 2;
                    const cp1_join = lastY + BRANCH_Y_OFFSET / 2;
                    const cp2_join = lastY + BRANCH_Y_OFFSET - BRANCH_Y_OFFSET / 2;
                    const Y_end = lastY + BRANCH_Y_OFFSET;

                    return (
                        <g key={branch.tag}>
                            {/* Split curve */}
                            {positions.length > 0 && (
                                <path
                                    d={`M ${trunkX} ${Y_start} C ${trunkX} ${cp1_start} ${x} ${cp2_start} ${x} ${firstY}`}
                                    fill="none"
                                    stroke={`url(#branch-start-${sanitizedTag})`}
                                    strokeWidth={LINE_WIDTH}
                                    strokeLinecap="round"
                                    className="branch-path"
                                />
                            )}

                            {/* Branch segments and nodes */}
                            {positions.map((pos, idx) => {
                                const y = messagePositions[pos] || (16 + pos * 80 + 18);

                                if (idx === 0) {
                                    return (
                                        <g key={`${branch.tag}-start`}>
                                            <circle
                                                cx={x}
                                                cy={y}
                                                r={NODE_RADIUS}
                                                fill={`rgb(${r},${g},${b})`}
                                                stroke="white"
                                                strokeWidth="0.5"
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <path
                                                d={`M ${x + 5} ${y} L ${graphWidth - 5} ${y}`}
                                                fill="none"
                                                stroke={`rgba(${r},${g},${b},${CONNECTOR_OPACITY})`}
                                                strokeWidth={1}
                                                strokeDasharray="2 2"
                                            />
                                        </g>
                                    );
                                }

                                const prevPos = positions[idx - 1];
                                const y1 = messagePositions[prevPos] || (16 + prevPos * 80 + 18);
                                const y2 = y;

                                return (
                                    <g key={`${branch.tag}-${idx}`}>
                                        <path
                                            d={`M ${x} ${y1} L ${x} ${y2}`}
                                            fill="none"
                                            stroke={`rgba(${r},${g},${b},0.6)`}
                                            strokeWidth={LINE_WIDTH}
                                            strokeLinecap="round"
                                        />
                                        <circle
                                            cx={x}
                                            cy={y2}
                                            r={NODE_RADIUS}
                                            fill={`rgb(${r},${g},${b})`}
                                            stroke="white"
                                            strokeWidth="0.5"
                                            style={{ cursor: 'pointer' }}
                                        />
                                        {/* Horizontal connector */}
                                        <path
                                            d={`M ${x + 5} ${y2} L ${graphWidth - 5} ${y2}`}
                                            fill="none"
                                            stroke={`rgba(${r},${g},${b},${CONNECTOR_OPACITY})`}
                                            strokeWidth={1}
                                            strokeDasharray="2 2"
                                        />
                                    </g>
                                );
                            })}

                            {/* Join curve */}
                            {positions.length > 0 && (
                                <path
                                    d={`M ${x} ${lastY} C ${x} ${cp1_join} ${trunkX} ${cp2_join} ${trunkX} ${Y_end}`}
                                    fill="none"
                                    stroke={`url(#branch-end-${sanitizedTag})`}
                                    strokeWidth={LINE_WIDTH}
                                    strokeLinecap="round"
                                    className="branch-path"
                                />
                            )}
                        </g>
                    );
                })}

                {/* Untagged messages nodes and connectors */}
                <g className="untagged">
                    {messages.map((message, logicalIndex) => {
                        const messageId = message.message.id;
                        if (!messageId) return null;

                        // Skip if this was a merged tool result
                        if (domIndexForMessage[logicalIndex] === -1) return null;

                        const taggedMessages = memoryData?.currentState?.taggedMessages instanceof Map
                            ? memoryData.currentState.taggedMessages
                            : new Map(Object.entries(memoryData?.currentState?.taggedMessages || {}));

                        const messageMetadata = taggedMessages.get(messageId);
                        const tags = messageMetadata?.topic_tags || [];

                        if (tags.length === 0) {
                            const y = messagePositions[domIndexForMessage[logicalIndex]] || (16 + logicalIndex * 80 + 18);

                            return (
                                <g key={`untagged-${logicalIndex}`}>
                                    <circle
                                        cx={trunkX}
                                        cy={y}
                                        r={NODE_RADIUS}
                                        fill="rgba(255,255,255,0.3)"
                                        stroke="none"
                                    />
                                    <path
                                        d={`M ${trunkX + 5} ${y} L ${graphWidth - 5} ${y}`}
                                        fill="none"
                                        stroke={`rgba(255,255,255,${CONNECTOR_OPACITY})`}
                                        strokeWidth={1}
                                        strokeDasharray="2 2"
                                    />
                                </g>
                            );
                        }
                        return null;
                    })}
                </g>
            </svg>
        </div>
    );
};
