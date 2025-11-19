import { useState, useCallback, useMemo, useRef } from 'react';

interface VirtualizationOptions<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualItem<T> {
  index: number;
  item: T;
  style: React.CSSProperties;
}

export const useVirtualization = <T,>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: VirtualizationOptions<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const { startIndex, endIndex } = useMemo(() => {
    const startNode = Math.floor(scrollTop / itemHeight);
    const visibleNodeCount = Math.ceil(containerHeight / itemHeight);
    
    const startIndex = Math.max(0, startNode - overscan);
    const endIndex = Math.min(items.length - 1, startNode + visibleNodeCount + overscan);
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Create virtual items
  const virtualItems = useMemo(() => {
    const virtualItems: VirtualItem<T>[] = [];
    
    for (let i = startIndex; i <= endIndex; i++) {
      virtualItems.push({
        index: i,
        item: items[i],
        style: {
          position: 'absolute',
          top: `${i * itemHeight}px`,
          width: '100%',
          height: `${itemHeight}px`
        }
      });
    }
    
    return virtualItems;
  }, [startIndex, endIndex, items, itemHeight]);

  // Total height for scrollbar
  const totalHeight = useMemo(() => items.length * itemHeight, [items.length, itemHeight]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Scroll to a specific index
  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      const scrollTop = index * itemHeight;
      containerRef.current.scrollTop = scrollTop;
    }
  }, [itemHeight]);

  // Get item at specific index
  const getItemAtIndex = useCallback((index: number) => {
    return items[index];
  }, [items]);

  return {
    containerProps: {
      ref: containerRef,
      onScroll: handleScroll,
      style: {
        height: `${containerHeight}px`,
        overflow: 'auto',
        position: 'relative'
      }
    },
    virtualItems,
    totalHeight,
    scrollToIndex,
    getItemAtIndex,
    startIndex,
    endIndex
  };
};

export default useVirtualization;