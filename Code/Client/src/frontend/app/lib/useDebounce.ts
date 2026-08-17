import { useEffect, useState } from 'react';

/**
 * useDebounce hook
 * Debounces any fast-changing value (such as search keyword input)
 * @param value The value to debounce
 * @param delay Milliseconds to wait before updating debounced value (default: 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
