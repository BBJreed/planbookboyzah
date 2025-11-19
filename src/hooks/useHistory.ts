import { useState, useCallback, useRef } from 'react';
import { LayerState } from '../types';

interface HistoryOptions {
  maxHistoryLength?: number;
  debounceTime?: number;
  enableDiffing?: boolean;
}

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
  lastSavedIndex: number;
}

export const useHistory = <T extends LayerState>(
  initialState: T, 
  options: HistoryOptions = {}
) => {
  const {
    maxHistoryLength = 50,
    debounceTime = 300,
    enableDiffing = false
  } = options;
  
  const [historyState, setHistoryState] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
    lastSavedIndex: -1
  });
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastStateRef = useRef<T>(initialState);
  
  // Deep equality check for diffing
  const deepEqual = useCallback((obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  }, []);
  
  // Check if state has changed significantly
  const hasStateChanged = useCallback((currentState: T, newState: T): boolean => {
    if (!enableDiffing) return true;
    return !deepEqual(currentState, newState);
  }, [enableDiffing, deepEqual]);
  
  // Save state to history with debouncing
  const saveToHistory = useCallback((newState: T) => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      setHistoryState(prev => {
        // Check if state has actually changed
        if (!hasStateChanged(prev.present, newState)) {
          return prev;
        }
        
        // Limit history length
        const newPast = [...prev.past, prev.present];
        if (newPast.length > maxHistoryLength) {
          newPast.shift();
        }
        
        return {
          past: newPast,
          present: newState,
          future: [], // Clear future when new action is performed
          lastSavedIndex: prev.lastSavedIndex === -1 ? -1 : 
                         prev.lastSavedIndex < prev.past.length ? prev.lastSavedIndex : 
                         prev.past.length
        };
      });
      
      lastStateRef.current = newState;
    }, debounceTime);
  }, [debounceTime, hasStateChanged, maxHistoryLength]);
  
  // Immediate save without debouncing
  const saveToHistoryImmediate = useCallback((newState: T) => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    setHistoryState(prev => {
      // Check if state has actually changed
      if (!hasStateChanged(prev.present, newState)) {
        return prev;
      }
      
      // Limit history length
      const newPast = [...prev.past, prev.present];
      if (newPast.length > maxHistoryLength) {
        newPast.shift();
      }
      
      return {
        past: newPast,
        present: newState,
        future: [], // Clear future when new action is performed
        lastSavedIndex: prev.lastSavedIndex === -1 ? -1 : 
                       prev.lastSavedIndex < prev.past.length ? prev.lastSavedIndex : 
                       prev.past.length
      };
    });
    
    lastStateRef.current = newState;
  }, [hasStateChanged, maxHistoryLength]);
  
  // Undo action
  const undo = useCallback(() => {
    setHistoryState(prev => {
      if (prev.past.length === 0) return prev;
      
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
        lastSavedIndex: prev.lastSavedIndex
      };
    });
  }, []);
  
  // Redo action
  const redo = useCallback(() => {
    setHistoryState(prev => {
      if (prev.future.length === 0) return prev;
      
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
        lastSavedIndex: prev.lastSavedIndex
      };
    });
  }, []);
  
  // Jump to a specific point in history
  const jumpTo = useCallback((index: number) => {
    setHistoryState(prev => {
      if (index < 0 || index >= prev.past.length + 1 + prev.future.length) {
        return prev;
      }
      
      const allStates = [...prev.past, prev.present, ...prev.future];
      const targetState = allStates[index];
      
      const newPast = allStates.slice(0, index);
      const newFuture = allStates.slice(index + 1);
      
      // Limit past history
      if (newPast.length > maxHistoryLength) {
        newPast.splice(0, newPast.length - maxHistoryLength);
      }
      
      return {
        past: newPast,
        present: targetState,
        future: newFuture,
        lastSavedIndex: prev.lastSavedIndex
      };
    });
  }, [maxHistoryLength]);
  
  // Clear history
  const clearHistory = useCallback(() => {
    setHistoryState({
      past: [],
      present: historyState.present,
      future: [],
      lastSavedIndex: -1
    });
  }, [historyState.present]);
  
  // Check if there are undo/redo actions available
  const canUndo = historyState.past.length > 0;
  const canRedo = historyState.future.length > 0;
  
  // Get history info
  const getHistoryInfo = useCallback(() => {
    return {
      pastLength: historyState.past.length,
      futureLength: historyState.future.length,
      currentIndex: historyState.past.length,
      totalLength: historyState.past.length + 1 + historyState.future.length,
      hasUnsavedChanges: historyState.lastSavedIndex !== historyState.past.length
    };
  }, [historyState]);
  
  // Mark current state as saved
  const markAsSaved = useCallback(() => {
    setHistoryState(prev => ({
      ...prev,
      lastSavedIndex: prev.past.length
    }));
  }, []);
  
  // Get state at specific index
  const getStateAtIndex = useCallback((index: number) => {
    const allStates = [...historyState.past, historyState.present, ...historyState.future];
    return allStates[index] || null;
  }, [historyState]);
  
  // Clean up debounce timer on unmount
  
  return {
    // Current state
    state: historyState.present,
    
    // History controls
    saveToHistory,
    saveToHistoryImmediate,
    undo,
    redo,
    jumpTo,
    clearHistory,
    
    // State information
    canUndo,
    canRedo,
    getHistoryInfo,
    getStateAtIndex,
    
    // Save state management
    markAsSaved
  };
};