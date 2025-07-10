import { useCallback, useRef } from 'react';

/**
 * Hook for managing auto-scroll behavior with user scroll detection
 */
export const useAutoScroll = <T extends HTMLElement>() => {
    const containerRef = useRef<T>(null);
    const userHasScrolledRef = useRef(false);

    const scrollToBottom = useCallback(() => {
        if (!userHasScrolledRef.current && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, []);

    const handleScroll = useCallback(() => {
        if (containerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
            userHasScrolledRef.current = !isAtBottom;
        }
    }, []);

    const resetScroll = useCallback(() => {
        userHasScrolledRef.current = false;
        scrollToBottom();
    }, [scrollToBottom]);

    return {
        containerRef,
        scrollToBottom,
        handleScroll,
        resetScroll,
        userHasScrolled: userHasScrolledRef.current
    };
};

export default useAutoScroll;