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
const BRANCH_OFFSET = 60;
const CONNECTOR_OPACITY = 0.2; // Opacity for connector lines

export const MemoryTagGraph: React.FC<MemoryTagGraphProps> = ({
    messages,
    memoryData,
    messagePositions,
    fullHeight,
    className = '',
    onWidthChange,
}) => {

    const memoizedData = useMemo(() => {
        const trunkX = 10;
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

            positions.set(branch.tag, 40 + column * 30); // Start further for curve space
            occupiedColumns.push({ start: branch.startIndex, end: branch.endIndex, column });
        });

let adjustedMinY = minY;
let adjustedMaxY = maxY;
branches.forEach(branch => {
    const positions = branch.introDomIndex !== undefined ? [branch.introDomIndex, ...branch.messageDoms] : branch.messageDoms;
    if (positions.length > 0) {
        const firstY = messagePositions[positions[0]] || (16 + positions[0] * 80 + 18);
        const lastY = messagePositions[positions[positions.length - 1]] || (16 + positions[positions.length - 1] * 80 + 18);
        const Y_start = firstY - BRANCH_OFFSET;
        const Y_end = lastY + BRANCH_OFFSET;
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
                height={Math.max(fullHeight, adjustedMaxY + 20)}
                style={{ minWidth: '80px' }}
            >
                <defs>
                    {tagBranches.map(branch => {
                        const sanitizedTag = branch.tag.replace(/[^a-zA-Z0-9-]/g, '-');
                        const [r, g, b] = branch.color.split(',').map(c => parseInt(c.trim()));
                        return (
                            <>
                                <linearGradient key={`grad-start-${sanitizedTag}`} id={`branch-start-${sanitizedTag}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                                    <stop offset="100%" stopColor={`rgba(${r},${g},${b},0.7)`} />
                                </linearGradient>
                                <linearGradient key={`grad-end-${sanitizedTag}`} id={`branch-end-${sanitizedTag}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={`rgba(${r},${g},${b},0.7)`} />
                                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                </linearGradient>
                            </>
                            
                        );
                    })}
                </defs>
                {/* Trunk line */}
                <g className="trunk">
                    <line
                        x1={trunkX}
                        y1={adjustedMinY}
                        x2={trunkX}
                        y2={adjustedMaxY}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth={LINE_WIDTH}
                        strokeLinecap="round"
                    />
                </g>

                {/* Branches */}
                {tagBranches.map(branch => {
                    const x = branchXPositions.get(branch.tag) || 40;
                    const [r, g, b] = branch.color.split(',').map(c => parseInt(c.trim()));
                    const sanitizedTag = branch.tag.replace(/[^a-zA-Z0-9-]/g, '-');
                    const positions = branch.introDomIndex !== undefined ? [branch.introDomIndex, ...branch.messageDoms] : branch.messageDoms;
                    const firstY = messagePositions[positions[0]] || (16 + positions[0] * 80 + 18);
                    const lastY = messagePositions[positions[positions.length - 1]] || (16 + positions[positions.length - 1] * 80 + 18);
                    const Y_start = firstY - BRANCH_OFFSET;
                    const cp1_start = Y_start + BRANCH_OFFSET / 2;
                    const cp2_start = firstY - BRANCH_OFFSET / 2;
                    const cp1_join = lastY + BRANCH_OFFSET / 2;
                    const cp2_join = lastY + BRANCH_OFFSET - BRANCH_OFFSET / 2;
                    const Y_end = lastY + BRANCH_OFFSET;

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
                                            <line
                                                x1={x + 5}
                                                y1={y}
                                                x2={graphWidth - 5}
                                                y2={y}
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
                                        <line
                                            x1={x}
                                            y1={y1}
                                            x2={x}
                                            y2={y2}
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
                                        <line
                                            x1={x + 5}
                                            y1={y2}
                                            x2={graphWidth - 5}
                                            y2={y2}
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
                                    <line
                                        x1={trunkX + 5}
                                        y1={y}
                                        x2={graphWidth - 5}
                                        y2={y}
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
