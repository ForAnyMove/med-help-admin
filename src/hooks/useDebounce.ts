import { useState, useEffect } from 'react';

/**
 * Delays updating the returned value until `delayMs` milliseconds have passed
 * since the last change to `value`. Ideal for syncing search inputs with URL query params
 * and React Query keys without firing a request on every keystroke.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

