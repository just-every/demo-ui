import { useState, useCallback } from 'react';

export interface UseCopyToClipboardOptions {
    /** Success message duration in ms */
    successDuration?: number;
    /** Custom success handler */
    onSuccess?: (text: string) => void;
    /** Custom error handler */
    onError?: (error: Error) => void;
}

export const useCopyToClipboard = (options: UseCopyToClipboardOptions = {}) => {
    const { successDuration = 2000, onSuccess, onError } = options;
    const [isCopied, setIsCopied] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const copy = useCallback(async (text: string) => {
        if (!navigator?.clipboard) {
            const error = new Error('Clipboard API not supported');
            setError(error);
            onError?.(error);
            return false;
        }

        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            setError(null);
            onSuccess?.(text);

            setTimeout(() => {
                setIsCopied(false);
            }, successDuration);

            return true;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to copy');
            setError(error);
            setIsCopied(false);
            onError?.(error);
            return false;
        }
    }, [successDuration, onSuccess, onError]);

    const reset = useCallback(() => {
        setIsCopied(false);
        setError(null);
    }, []);

    return {
        copy,
        isCopied,
        error,
        reset
    };
};