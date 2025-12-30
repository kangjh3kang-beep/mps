"use client";

/**
 * ============================================================
 * MANPASIK SYSTEM OPTIMIZATION - REACT HOOKS
 * Performance-Optimized Custom Hooks
 * ============================================================
 */

import { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  useTransition,
  useDeferredValue
} from 'react';
import { RENDER_CONFIG, CACHE_CONFIG, MEMORY_CONFIG } from './performance-config';

// ============================================
// DEBOUNCED STATE HOOK
// ============================================

export function useDebouncedState<T>(
  initialValue: T,
  delay: number = RENDER_CONFIG.DEBOUNCE.input
): [T, T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setValueDebounced = useCallback((newValue: T) => {
    setValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(newValue);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, debouncedValue, setValueDebounced];
}

// ============================================
// THROTTLED CALLBACK HOOK
// ============================================

export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = RENDER_CONFIG.DEBOUNCE.scroll
): T {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastRun.current >= delay) {
      lastRun.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastRun.current = Date.now();
        callback(...args);
      }, delay - (now - lastRun.current));
    }
  }, [callback, delay]) as T;
}

// ============================================
// INTERSECTION OBSERVER HOOK (Lazy Loading)
// ============================================

export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement | null>, boolean] {
  const elementRef = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        rootMargin: RENDER_CONFIG.INTERSECTION.rootMargin,
        threshold: RENDER_CONFIG.INTERSECTION.threshold,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [elementRef, isIntersecting];
}

// ============================================
// CACHED API HOOK
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const apiCache = new Map<string, CacheEntry<unknown>>();

export function useCachedFetch<T>(
  url: string,
  ttl: number = CACHE_CONFIG.API_CACHE_TTL.healthScore * 1000
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (skipCache = false) => {
    // Check cache first
    if (!skipCache) {
      const cached = apiCache.get(url);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        setData(cached.data as T);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Fetch failed');
      
      const result = await response.json();
      
      // Update cache
      apiCache.set(url, {
        data: result,
        timestamp: Date.now(),
        ttl,
      });

      // Enforce cache size limit
      if (apiCache.size > CACHE_CONFIG.MEMORY_LIMITS.maxItems) {
        const oldestKey = apiCache.keys().next().value;
        if (oldestKey) apiCache.delete(oldestKey);
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [url, ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { data, isLoading, error, refetch };
}

// ============================================
// VIRTUAL LIST HOOK
// ============================================

interface VirtualListConfig<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualList<T>({ 
  items, 
  itemHeight, 
  containerHeight, 
  overscan = RENDER_CONFIG.VIRTUALIZATION.overscanCount 
}: VirtualListConfig<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const { startIndex, endIndex, visibleItems, totalHeight, offsetY } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * itemHeight;

    return { startIndex, endIndex, visibleItems, totalHeight, offsetY };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  const handleScroll = useThrottledCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, RENDER_CONFIG.DEBOUNCE.scroll);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex,
  };
}

// ============================================
// MEMORY-EFFICIENT DATA HOOK
// ============================================

export function useDownsampledData<T>(
  data: T[],
  maxPoints: number = MEMORY_CONFIG.CHART.maxDataPoints
): T[] {
  return useMemo(() => {
    if (data.length <= maxPoints) return data;

    const factor = Math.ceil(data.length / maxPoints);
    return data.filter((_, index) => index % factor === 0);
  }, [data, maxPoints]);
}

// ============================================
// TRANSITION HOOK (Non-Blocking Updates)
// ============================================

export function useNonBlockingState<T>(initialValue: T): [T, T, (value: T) => void] {
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();
  const deferredValue = useDeferredValue(value);

  const setNonBlocking = useCallback((newValue: T) => {
    startTransition(() => {
      setValue(newValue);
    });
  }, []);

  return [value, deferredValue, setNonBlocking];
}

// ============================================
// WINDOW SIZE HOOK (Optimized)
// ============================================

export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateSize();

    const debouncedUpdate = debounce(updateSize, RENDER_CONFIG.DEBOUNCE.resize);
    window.addEventListener('resize', debouncedUpdate);

    return () => {
      window.removeEventListener('resize', debouncedUpdate);
    };
  }, []);

  return size;
}

// ============================================
// UTILITY: Debounce Function
// ============================================

function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ============================================
// PREVIOUS VALUE HOOK (Optimization)
// ============================================

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// ============================================
// STABLE CALLBACK HOOK
// ============================================

export function useStableCallback<T extends (...args: unknown[]) => unknown>(callback: T): T {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
}




