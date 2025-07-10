import { useState, useEffect, useCallback } from 'react';

export interface UseLocalStorageOptions<T> {
    /** Custom serializer */
    serializer?: (value: T) => string;
    /** Custom deserializer */
    deserializer?: (value: string) => T;
    /** Error handler */
    onError?: (error: Error) => void;
}

export function useLocalStorage<T>(
    key: string,
    initialValue: T,
    options: UseLocalStorageOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
    const {
        serializer = JSON.stringify,
        deserializer = JSON.parse,
        onError
    } = options;

    // Get initial value from localStorage or use provided initial value
    const initialize = (): T => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? deserializer(item) : initialValue;
        } catch (error) {
            onError?.(error instanceof Error ? error : new Error('Failed to read from localStorage'));
            return initialValue;
        }
    };

    const [storedValue, setStoredValue] = useState<T>(initialize);

    // Return a wrapped version of useState's setter function that persists to localStorage
    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            
            // Save state
            setStoredValue(valueToStore);
            
            // Save to local storage
            window.localStorage.setItem(key, serializer(valueToStore));
        } catch (error) {
            onError?.(error instanceof Error ? error : new Error('Failed to save to localStorage'));
        }
    }, [key, serializer, storedValue, onError]);

    // Remove value from localStorage
    const removeValue = useCallback(() => {
        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            onError?.(error instanceof Error ? error : new Error('Failed to remove from localStorage'));
        }
    }, [key, initialValue, onError]);

    // Listen for changes to this key in other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    setStoredValue(deserializer(e.newValue));
                } catch (error) {
                    onError?.(error instanceof Error ? error : new Error('Failed to sync localStorage'));
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, deserializer, onError]);

    return [storedValue, setValue, removeValue];
}