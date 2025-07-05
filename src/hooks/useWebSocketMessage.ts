import { useEffect } from 'react';

export interface WebSocketMessage {
    type: string;
    [key: string]: any;
}

export type MessageHandler = (data: WebSocketMessage) => void;

/**
 * Hook for handling WebSocket messages with automatic parsing and error handling
 */
export const useWebSocketMessage = (
    lastMessage: MessageEvent | null,
    messageHandler: MessageHandler,
    dependencies: any[] = []
) => {
    useEffect(() => {
        if (!lastMessage) return;

        try {
            const data = JSON.parse(lastMessage.data) as WebSocketMessage;
            messageHandler(data);
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }, [lastMessage, ...dependencies]);
};

export default useWebSocketMessage;