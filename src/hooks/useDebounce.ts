import { useState, useEffect, useCallback, useRef } from 'react';

interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export const useDebounce = <T>(
  value: T, 
  delay: number, 
  options: DebounceOptions = { leading: false, trailing: true }
): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number | null>(null);
  const lastInvokeTimeRef = useRef<number>(0);


  const { leading = false, trailing = true, maxWait } = options;

  useEffect(() => {
    const now = Date.now();
    const isInvoking = shouldInvoke(now);

    if (isInvoking) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      lastInvokeTimeRef.current = now;
      setDebouncedValue(value);
    } else if (timeoutRef.current === null && trailing) {
      // Schedule trailing edge call
      timeoutRef.current = setTimeout(() => {
        lastInvokeTimeRef.current = Date.now();
        if (trailing) {
          setDebouncedValue(value);
        }
        timeoutRef.current = null;
      }, delay);
    }

    // Handle maxWait
    if (maxWait && maxWait > 0) {
      const timeSinceLastCall = now - (lastCallTimeRef.current || now);
      const timeSinceLastInvoke = now - lastInvokeTimeRef.current;
      
      if (timeSinceLastCall >= maxWait || timeSinceLastInvoke >= maxWait) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        lastInvokeTimeRef.current = now;
        setDebouncedValue(value);
        timeoutRef.current = null;
      }
    }

    lastCallTimeRef.current = now;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, [value, delay, leading, trailing, maxWait]);

  const shouldInvoke = (time: number): boolean => {
    const timeSinceLastCall = time - (lastCallTimeRef.current || time);
    const timeSinceLastInvoke = time - lastInvokeTimeRef.current;

    // First call or maxWait exceeded
    return (
      lastCallTimeRef.current === null ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  return debouncedValue;
};

export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: DebounceOptions = { leading: false, trailing: true }
): [T, () => void, () => void] => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number | null>(null);
  const lastInvokeTimeRef = useRef<number>(0);
  const argsRef = useRef<Parameters<T> | null>(null);
  const callbackRef = useRef<T>(callback);

  const { leading = false, trailing = true, maxWait } = options;

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    argsRef.current = args;
    lastCallTimeRef.current = now;

    const isInvoking = shouldInvoke(now);

    if (isInvoking) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      lastInvokeTimeRef.current = now;
      
      if (leading) {
        callbackRef.current(...args);
      }
    } else if (timeoutRef.current === null) {
      // Schedule trailing edge call
      timeoutRef.current = setTimeout(() => {
        lastInvokeTimeRef.current = Date.now();
        if (trailing && argsRef.current) {
          callbackRef.current(...argsRef.current);
        }
        timeoutRef.current = null;
        argsRef.current = null;
      }, delay);
    }

    // Handle maxWait
    if (maxWait && maxWait > 0) {
      if (!maxTimeoutRef.current) {
        maxTimeoutRef.current = setTimeout(() => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          if (argsRef.current) {
            callbackRef.current(...argsRef.current);
          }
          lastInvokeTimeRef.current = Date.now();
          timeoutRef.current = null;
          maxTimeoutRef.current = null;
          argsRef.current = null;
        }, maxWait);
      }
    }
  }, [delay, leading, trailing, maxWait]) as T;

  const shouldInvoke = (time: number): boolean => {
    const timeSinceLastCall = time - (lastCallTimeRef.current || time);
    const timeSinceLastInvoke = time - lastInvokeTimeRef.current;

    // First call or maxWait exceeded
    return (
      lastCallTimeRef.current === null ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  // Cancel the debounced function
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
    lastInvokeTimeRef.current = 0;
    lastCallTimeRef.current = null;
    argsRef.current = null;
  }, []);

  // Flush the debounced function immediately
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      if (argsRef.current) {
        callbackRef.current(...argsRef.current);
      }
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    lastInvokeTimeRef.current = 0;
    lastCallTimeRef.current = null;
    argsRef.current = null;
  }, []);

  return [debouncedCallback, cancel, flush];
};

export const useThrottle = <T>(
  value: T, 
  limit: number,
  options: { leading?: boolean; trailing?: boolean } = { leading: true, trailing: true }
): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());
  const lastValueRef = useRef<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { leading = true, trailing = true } = options;

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRan = now - lastRan.current;

    // Leading edge execution
    if (timeSinceLastRan >= limit) {
      if (leading) {
        setThrottledValue(value);
      }
      lastRan.current = now;
      lastValueRef.current = value;
    } else if (trailing) {
      // Trailing edge execution
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setThrottledValue(value);
        lastRan.current = Date.now();
        lastValueRef.current = value;
      }, limit - timeSinceLastRan);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, limit, leading, trailing]);

  return throttledValue;
};

// Advanced hook for debouncing multiple values with shared timing
export const useMultiDebounce = <T extends Record<string, any>>(
  values: T,
  delay: number,
  options: DebounceOptions = { leading: false, trailing: true }
): T => {
  const [debouncedValues, setDebouncedValues] = useState<T>(values);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number | null>(null);
  const lastInvokeTimeRef = useRef<number>(0);
  const valuesRef = useRef<T>(values);

  const { leading = false, trailing = true, maxWait } = options;

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  useEffect(() => {
    const now = Date.now();
    const isInvoking = shouldInvoke(now);

    if (isInvoking) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      lastInvokeTimeRef.current = now;
      setDebouncedValues(valuesRef.current);
    } else if (timeoutRef.current === null && trailing) {
      // Schedule trailing edge call
      timeoutRef.current = setTimeout(() => {
        lastInvokeTimeRef.current = Date.now();
        if (trailing) {
          setDebouncedValues(valuesRef.current);
        }
        timeoutRef.current = null;
      }, delay);
    }

    // Handle maxWait
    if (maxWait && maxWait > 0) {
      const timeSinceLastCall = now - (lastCallTimeRef.current || now);
      const timeSinceLastInvoke = now - lastInvokeTimeRef.current;
      
      if (timeSinceLastCall >= maxWait || timeSinceLastInvoke >= maxWait) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        lastInvokeTimeRef.current = now;
        setDebouncedValues(valuesRef.current);
        timeoutRef.current = null;
      }
    }

    lastCallTimeRef.current = now;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, [delay, leading, trailing, maxWait]);

  const shouldInvoke = (time: number): boolean => {
    const timeSinceLastCall = time - (lastCallTimeRef.current || time);
    const timeSinceLastInvoke = time - lastInvokeTimeRef.current;

    // First call or maxWait exceeded
    return (
      lastCallTimeRef.current === null ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  return debouncedValues;
};